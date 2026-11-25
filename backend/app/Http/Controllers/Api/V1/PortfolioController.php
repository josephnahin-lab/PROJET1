<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Responses\ProblemResponse;
use App\Jobs\PurgePortfolioAttachment;
use App\Models\Domain;
use App\Models\PortfolioAttachment;
use App\Models\PortfolioAttachmentPurge;
use App\Models\PortfolioItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Pagination\Cursor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class PortfolioController extends Controller
{
    private const array FIELD_MAP = [
        'domainId' => 'domain_id',
        'projectDate' => 'project_date',
        'title' => 'title',
        'description' => 'description',
        'skills' => 'skills',
        'difficulties' => 'difficulties',
        'learnings' => 'learnings',
        'url' => 'url',
    ];

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        [$limit, $cursor] = $this->paginationParameters($request);
        $paginator = $user->portfolioItems()
            ->with('attachments')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->cursorPaginate($limit, ['*'], 'cursor', $cursor);

        return response()->json([
            'data' => $paginator->getCollection()
                ->map(fn (PortfolioItem $item): array => $this->itemPayload($item))
                ->values(),
            'meta' => [
                'limit' => $limit,
                'hasMore' => $paginator->hasMorePages(),
                'nextCursor' => $paginator->hasMorePages() ? $paginator->nextCursor()?->encode() : null,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($unsupportedMediaType = $this->requireJson($request)) {
            return $unsupportedMediaType;
        }

        $this->validateIdempotencyKey($request);

        /** @var User $user */
        $user = $request->user();
        $payload = $request->json()->all();
        $this->rejectUnexpectedKeys($payload, array_keys(self::FIELD_MAP));

        $data = Validator::make($payload, [
            'title' => ['required', 'string', 'min:1', 'max:100'],
            'description' => ['required', 'string', 'min:1', 'max:3000'],
            'domainId' => ['sometimes', 'nullable', 'string', 'max:100'],
            'projectDate' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'skills' => ['sometimes', 'string', 'max:500'],
            'difficulties' => ['sometimes', 'string', 'max:1500'],
            'learnings' => ['sometimes', 'string', 'max:1500'],
            'url' => ['sometimes', 'string', 'url', 'max:500'],
        ])->validate();

        $this->validateReferences($data);
        $attributes = $this->databaseAttributes($data);
        $attributes['visibility'] = 'private';
        $item = $user->portfolioItems()->create($attributes);

        return response()->json(['data' => $this->itemPayload($item)], 201);
    }

    public function update(Request $request, string $itemId): JsonResponse
    {
        if ($unsupportedMediaType = $this->requireJson($request)) {
            return $unsupportedMediaType;
        }

        /** @var User $user */
        $user = $request->user();
        $payload = $request->json()->all();
        $this->rejectUnexpectedKeys($payload, array_keys(self::FIELD_MAP));
        $this->rejectEmptyPayload($payload);

        $data = Validator::make($payload, [
            'title' => ['sometimes', 'string', 'min:1', 'max:100'],
            'description' => ['sometimes', 'string', 'min:1', 'max:3000'],
            'domainId' => ['sometimes', 'nullable', 'string', 'max:100'],
            'projectDate' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'skills' => ['sometimes', 'string', 'max:500'],
            'difficulties' => ['sometimes', 'string', 'max:1500'],
            'learnings' => ['sometimes', 'string', 'max:1500'],
            'url' => ['sometimes', 'nullable', 'string', 'url', 'max:500'],
        ])->validate();

        $this->validateReferences($data);
        $item = $user->portfolioItems()->whereKey($itemId)->firstOrFail();
        $item->fill($this->databaseAttributes($data));
        $item->save();
        $item->load('attachments');

        return response()->json(['data' => $this->itemPayload($item)]);
    }

    public function destroy(Request $request, string $itemId): Response
    {
        /** @var User $user */
        $user = $request->user();

        DB::transaction(function () use ($user, $itemId): void {
            $item = $user->portfolioItems()
                ->whereKey($itemId)
                ->lockForUpdate()
                ->firstOrFail();
            $attachments = $item->attachments()->lockForUpdate()->get();

            foreach ($attachments as $attachment) {
                $attachment->delete();
            }

            $item->delete();
            $purges = $attachments->map(fn (PortfolioAttachment $attachment): PortfolioAttachmentPurge => $this->createPurgeRecord($attachment));

            if ($purges->isEmpty()) {
                $item->forceDelete();
            }

            foreach ($purges as $purge) {
                $this->dispatchPurge($purge);
            }
        });

        return response()->noContent();
    }

    public function upload(Request $request, string $itemId): JsonResponse
    {
        if (! $this->isMultipartRequest($request)) {
            return $this->unsupportedMediaTypeResponse('Cette opération accepte uniquement le type de média multipart/form-data.');
        }

        $uploadPayload = $request->all();
        $this->rejectUnexpectedKeys($uploadPayload, ['file', 'sha256']);
        $data = Validator::make($uploadPayload, [
            'file' => ['required', 'file'],
            'sha256' => ['sometimes', 'string', 'regex:/^[a-fA-F0-9]{64}$/'],
        ])->validate();

        $file = $request->file('file');
        $size = $file->getSize();

        if ($size === false || $size < 1 || $size > 5_242_880) {
            return $this->payloadTooLargeResponse();
        }

        Validator::make(['file' => $file], [
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'extensions:pdf,jpg,jpeg,png,webp'],
        ])->validate();

        $temporaryPath = $file->getRealPath();
        $mediaType = is_string($temporaryPath)
            ? (new \finfo(FILEINFO_MIME_TYPE))->file($temporaryPath)
            : false;
        $extensionsByMediaType = [
            'application/pdf' => ['pdf'],
            'image/jpeg' => ['jpg', 'jpeg'],
            'image/png' => ['png'],
            'image/webp' => ['webp'],
        ];
        $extension = Str::lower($file->getClientOriginalExtension());

        if (! isset($extensionsByMediaType[$mediaType]) || ! in_array($extension, $extensionsByMediaType[$mediaType], true)) {
            throw ValidationException::withMessages([
                'file' => 'Le contenu du fichier et son extension doivent correspondre à un format autorisé.',
            ]);
        }

        if ($mediaType !== 'application/pdf' && $size > 2_097_152) {
            return $this->payloadTooLargeResponse();
        }

        $sha256 = is_string($temporaryPath) ? hash_file('sha256', $temporaryPath) : false;

        if (! is_string($sha256)) {
            throw ValidationException::withMessages([
                'file' => 'Le fichier ne peut pas être vérifié.',
            ]);
        }

        if (isset($data['sha256']) && ! hash_equals(Str::lower($data['sha256']), $sha256)) {
            throw ValidationException::withMessages([
                'sha256' => 'La somme de contrôle ne correspond pas au fichier.',
            ]);
        }

        /** @var User $user */
        $user = $request->user();
        $attachmentId = (string) Str::uuid();
        $storageKey = null;
        $originalName = Str::substr($file->getClientOriginalName(), 0, 160);
        $displayName = $this->displayName($originalName, $mediaType);

        try {
            $attachment = DB::transaction(function () use (
                $user,
                $itemId,
                $file,
                $size,
                $mediaType,
                $sha256,
                $attachmentId,
                $originalName,
                &$storageKey,
            ): PortfolioAttachment {
                $item = $user->portfolioItems()
                    ->whereKey($itemId)
                    ->lockForUpdate()
                    ->firstOrFail();
                $isPdf = $mediaType === 'application/pdf';
                $existing = $item->attachments()
                    ->where(function (Builder $query) use ($isPdf): void {
                        if ($isPdf) {
                            $query->where('media_type', 'application/pdf');
                        } else {
                            $query->whereIn('media_type', ['image/jpeg', 'image/png', 'image/webp']);
                        }
                    })
                    ->exists();

                if ($existing) {
                    throw ValidationException::withMessages([
                        'file' => $isPdf
                            ? 'Cette fiche contient déjà un fichier PDF.'
                            : 'Cette fiche contient déjà une image.',
                    ]);
                }

                $storageKey = 'portfolio/'.$item->id.'/'.$attachmentId;
                $storedPath = Storage::disk('portfolio-private')->putFileAs(
                    'portfolio/'.$item->id,
                    $file,
                    $attachmentId,
                );

                if ($storedPath === false) {
                    throw new \RuntimeException('Le stockage privé du fichier a échoué.');
                }

                return $item->attachments()->create([
                    'storage_key' => $storageKey,
                    'original_name' => $originalName,
                    'media_type' => $mediaType,
                    'size_bytes' => $size,
                    'sha256' => $sha256,
                    'created_at' => now(),
                ]);
            });
        } catch (Throwable $exception) {
            if ($storageKey !== null) {
                $this->queueFailedUploadCleanup($storageKey, $attachmentId);

                if (! $exception instanceof ValidationException) {
                    throw new \RuntimeException('Le fichier privé ne peut pas être enregistré.');
                }
            }

            throw $exception;
        }

        return response()->json(['data' => $this->attachmentPayload($attachment, $displayName)], 201);
    }

    public function deleteAttachment(Request $request, string $itemId, string $attachmentId): Response
    {
        /** @var User $user */
        $user = $request->user();

        DB::transaction(function () use ($user, $itemId, $attachmentId): void {
            $item = $user->portfolioItems()
                ->whereKey($itemId)
                ->lockForUpdate()
                ->firstOrFail();
            $attachment = $item->attachments()
                ->whereKey($attachmentId)
                ->lockForUpdate()
                ->firstOrFail();
            $attachment->delete();
            $purge = $this->createPurgeRecord($attachment);

            $this->dispatchPurge($purge);
        });

        return response()->noContent();
    }

    public function content(Request $request, string $itemId, string $attachmentId): StreamedResponse|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $item = $user->portfolioItems()->whereKey($itemId)->firstOrFail();
        $attachment = $item->attachments()->whereKey($attachmentId)->firstOrFail();
        $disk = Storage::disk('portfolio-private');
        $path = $disk->path($attachment->storage_key);

        if (! is_file($path)) {
            return $this->notFoundResponse();
        }

        $verifiedMediaType = (new \finfo(FILEINFO_MIME_TYPE))->file($path);
        $verifiedSha256 = hash_file('sha256', $path);

        if (
            $verifiedMediaType !== $attachment->media_type
            || ! is_string($verifiedSha256)
            || ! hash_equals($attachment->sha256, $verifiedSha256)
        ) {
            return $this->notFoundResponse();
        }

        $stream = $disk->readStream($attachment->storage_key);

        if (! is_resource($stream)) {
            return $this->notFoundResponse();
        }

        $displayName = $this->displayName($attachment->original_name, $verifiedMediaType);
        $disposition = HeaderUtils::makeDisposition('attachment', $displayName, 'attachment.'.$this->extensionForMimeType($verifiedMediaType));

        return response()->stream(
            static function () use ($stream): void {
                try {
                    fpassthru($stream);
                } finally {
                    fclose($stream);
                }
            },
            200,
            [
                'Content-Type' => $verifiedMediaType,
                'Content-Disposition' => $disposition,
                'Cache-Control' => 'private, no-store',
                'X-Content-Type-Options' => 'nosniff',
            ],
        );
    }

    /**
     * @return array{0: int, 1: string|null}
     */
    private function paginationParameters(Request $request): array
    {
        $data = Validator::make($request->query(), [
            'cursor' => ['sometimes', 'nullable', 'string', 'max:512'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ])->validate();
        $cursor = $data['cursor'] ?? null;

        if ($cursor !== null && Cursor::fromEncoded($cursor) === null) {
            throw ValidationException::withMessages([
                'cursor' => 'Le curseur fourni est invalide.',
            ]);
        }

        return [(int) ($data['limit'] ?? 20), $cursor];
    }

    private function requireJson(Request $request): ?JsonResponse
    {
        $mediaType = Str::lower(trim(explode(';', $request->header('Content-Type', ''), 2)[0]));

        return $mediaType === 'application/json'
            ? null
            : $this->unsupportedMediaTypeResponse('Cette opération accepte uniquement le type de média application/json.');
    }

    private function validateIdempotencyKey(Request $request): void
    {
        Validator::make(
            ['Idempotency-Key' => $request->header('Idempotency-Key')],
            ['Idempotency-Key' => ['required', 'string', 'min:16', 'max:128', 'regex:/^[A-Za-z0-9._:-]+$/']],
        )->validate();
    }

    private function isMultipartRequest(Request $request): bool
    {
        $mediaType = Str::lower(trim(explode(';', $request->header('Content-Type', ''), 2)[0]));

        return $mediaType === 'multipart/form-data';
    }

    private function unsupportedMediaTypeResponse(string $detail): JsonResponse
    {
        return ProblemResponse::make(415, 'Unsupported Media Type', $detail, [
            'code' => 'UNSUPPORTED_MEDIA_TYPE',
        ]);
    }

    private function payloadTooLargeResponse(): JsonResponse
    {
        return ProblemResponse::make(413, 'Payload Too Large', 'La taille du fichier dépasse la limite autorisée.', [
            'code' => 'PAYLOAD_TOO_LARGE',
        ]);
    }

    private function notFoundResponse(): JsonResponse
    {
        return ProblemResponse::make(404, 'Not Found', 'La ressource demandée est introuvable.');
    }

    /**
     * @param  list<string>  $allowedKeys
     */
    private function rejectUnexpectedKeys(array $payload, array $allowedKeys): void
    {
        $unexpectedKeys = array_diff(array_map('strval', array_keys($payload)), $allowedKeys);

        if ($unexpectedKeys !== []) {
            throw ValidationException::withMessages([
                (string) reset($unexpectedKeys) => 'Cette propriété n’est pas autorisée.',
            ]);
        }
    }

    private function rejectEmptyPayload(array $payload): void
    {
        if ($payload === []) {
            throw ValidationException::withMessages([
                'request' => 'La requête doit contenir au moins une propriété modifiable.',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function validateReferences(array $data): void
    {
        $validator = Validator::make([], []);
        $validator->after(function ($validator) use ($data): void {
            if (isset($data['domainId'])) {
                $publishedDomainExists = Domain::query()
                    ->whereKey($data['domainId'])
                    ->where('availability', 'published')
                    ->whereHas('family', static fn (Builder $query): Builder => $query->where('status', 'published'))
                    ->exists();

                if (! $publishedDomainExists) {
                    $validator->errors()->add('domainId', 'Le domaine publié est introuvable.');
                }
            }

            if (isset($data['url']) && ! $this->isHttpsUrl($data['url'])) {
                $validator->errors()->add('url', 'Le lien doit utiliser HTTPS.');
            }
        });
        $validator->validate();
    }

    private function isHttpsUrl(string $url): bool
    {
        $parts = parse_url($url);

        return $parts !== false
            && Str::lower($parts['scheme'] ?? '') === 'https'
            && isset($parts['host'])
            && ! isset($parts['user'])
            && ! isset($parts['pass']);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function databaseAttributes(array $data): array
    {
        $attributes = [];

        foreach (self::FIELD_MAP as $requestField => $databaseField) {
            if (array_key_exists($requestField, $data)) {
                $attributes[$databaseField] = $data[$requestField];
            }
        }

        return $attributes;
    }

    /**
     * @return array<string, mixed>
     */
    private function itemPayload(PortfolioItem $item): array
    {
        return [
            'id' => $item->id,
            'title' => $item->title,
            'description' => $item->description,
            'domainId' => $item->domain_id,
            'projectDate' => $item->project_date,
            'skills' => $item->skills,
            'difficulties' => $item->difficulties,
            'learnings' => $item->learnings,
            'url' => $item->url,
            'visibility' => 'private',
            'createdAt' => $item->created_at->toISOString(),
            'updatedAt' => $item->updated_at->toISOString(),
            'attachments' => $item->attachments
                ->map(fn (PortfolioAttachment $attachment): array => $this->attachmentPayload(
                    $attachment,
                    $this->displayName($attachment->original_name, $attachment->media_type),
                ))
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function attachmentPayload(PortfolioAttachment $attachment, string $displayName): array
    {
        return [
            'id' => $attachment->id,
            'name' => $displayName,
            'mediaType' => $attachment->media_type,
            'sizeBytes' => (int) $attachment->size_bytes,
            'createdAt' => $attachment->created_at->toISOString(),
        ];
    }

    private function displayName(string $originalName, string $mediaType): string
    {
        $filename = basename(str_replace('\\', '/', $originalName));
        $stem = pathinfo($filename, PATHINFO_FILENAME);
        $stem = preg_replace('/[\p{C}\/\\\\]/u', '', $stem) ?? '';
        $stem = trim($stem, " \t\n\r\0\x0B.");
        $stem = Str::substr($stem === '' ? 'attachment' : $stem, 0, 160 - strlen($this->extensionForMimeType($mediaType)) - 1);

        return trim($stem, " \t\n\r\0\x0B.").'.'.$this->extensionForMimeType($mediaType);
    }

    private function extensionForMimeType(string $mediaType): string
    {
        return match ($mediaType) {
            'application/pdf' => 'pdf',
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => 'bin',
        };
    }

    private function createPurgeRecord(PortfolioAttachment $attachment): PortfolioAttachmentPurge
    {
        return PortfolioAttachmentPurge::query()->create([
            'attachment_id' => $attachment->id,
            'storage_key' => $attachment->storage_key,
            'created_at' => now(),
        ]);
    }

    private function dispatchPurge(PortfolioAttachmentPurge $purge): void
    {
        $purgeId = $purge->id;

        DB::afterCommit(static function () use ($purgeId): void {
            PurgePortfolioAttachment::dispatch($purgeId)
                ->onConnection('database');
        });
    }

    private function queueFailedUploadCleanup(string $storageKey, string $attachmentId): void
    {
        try {
            $disk = Storage::disk('portfolio-private');

            if (! $disk->exists($storageKey) || $disk->delete($storageKey)) {
                return;
            }
        } catch (Throwable) {
            // A durable purge record below is the recovery path.
        }

        try {
            DB::transaction(function () use ($storageKey, $attachmentId): void {
                $purge = PortfolioAttachmentPurge::query()->create([
                    'attachment_id' => $attachmentId,
                    'storage_key' => $storageKey,
                    'created_at' => now(),
                ]);

                $this->dispatchPurge($purge);
            });
        } catch (Throwable) {
            // Preserve the original upload failure and never log private storage metadata.
        }
    }
}
