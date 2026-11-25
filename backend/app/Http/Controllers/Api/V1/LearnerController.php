<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\HostAddressResolver;
use App\Http\Controllers\Controller;
use App\Http\Responses\ProblemResponse;
use App\Models\LearnerNote;
use App\Models\LearnerProfile;
use App\Models\LearnerProgress;
use App\Models\LearnerProjectProgress;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Pathway;
use App\Models\Project;
use App\Models\ProjectChecklistItem;
use App\Models\Resource;
use App\Models\SavedResource;
use App\Models\User;
use App\Models\WeeklyGoal;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\Cursor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LearnerController extends Controller
{
    public function __construct(private HostAddressResolver $hostAddressResolver) {}

    /**
     * Read only the account's non-email learner preferences.
     */
    public function showProfile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $profile = $user->profile;

        return response()->json(['data' => [
            'displayName' => $profile?->display_name,
            'avatar' => (object) ($profile?->avatar ?? []),
            'interests' => $profile?->interests ?? [],
            'theme' => $profile?->theme ?? 'light',
            'resourceLanguage' => $profile?->resource_language ?? 'fr',
            'learningMode' => $profile?->learning_mode ?? 'guided',
            'locale' => $profile?->locale ?? 'fr',
        ]]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        if ($unsupportedMediaType = $this->unsupportedMediaTypeResponse($request)) {
            return $unsupportedMediaType;
        }

        /** @var User $user */
        $user = $request->user();
        $payload = $request->json()->all();
        $this->rejectUnexpectedKeys($payload, [
            'displayName',
            'avatar',
            'interests',
            'theme',
            'resourceLanguage',
            'learningMode',
            'locale',
        ]);
        $this->rejectEmptyPayload($payload);

        $data = Validator::make($payload, [
            'displayName' => ['sometimes', 'nullable', 'string', 'max:60'],
            'avatar' => ['sometimes', 'array', 'max:8'],
            'interests' => ['sometimes', 'array', 'max:8'],
            'interests.*' => ['required', 'string', 'max:80', 'distinct:strict'],
            'theme' => ['sometimes', Rule::in(['light', 'dark'])],
            'resourceLanguage' => ['sometimes', Rule::in(['fr', 'en', 'es'])],
            'learningMode' => ['sometimes', Rule::in(['guided', 'free'])],
            'locale' => ['sometimes', 'string', 'max:16'],
        ])->validate();

        $columnNames = [
            'displayName' => 'display_name',
            'resourceLanguage' => 'resource_language',
            'learningMode' => 'learning_mode',
        ];
        $profile = LearnerProfile::query()->firstOrNew(['user_id' => $user->id]);

        foreach ($data as $key => $value) {
            $profile->{$columnNames[$key] ?? Str::snake($key)} = $value;
        }

        $profile->save();

        return response()->json(['data' => $this->profilePayload($profile)]);
    }

    public function showProgress(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $payload = $this->progressPayload($user);

        return response()->json(['data' => $payload])
            ->header('ETag', $this->progressEtag($payload));
    }

    public function replaceProgress(Request $request): JsonResponse
    {
        if ($unsupportedMediaType = $this->unsupportedMediaTypeResponse($request)) {
            return $unsupportedMediaType;
        }

        /** @var User $user */
        $user = $request->user();
        $payload = $request->json()->all();
        $this->rejectUnexpectedKeys($payload, ['pathways', 'projectProgress', 'weeklyGoal']);
        $this->rejectNestedUnexpectedKeys($payload, 'pathways', [
            'pathwayId',
            'status',
            'plan',
            'completedLessonIds',
            'startedAt',
            'completedAt',
        ]);
        $this->rejectNestedUnexpectedKeys($payload, 'projectProgress', [
            'projectId',
            'status',
            'checkedItemIds',
            'url',
            'completedAt',
            'updatedAt',
        ]);
        $this->validateIfMatchHeader($request);

        $data = Validator::make($payload, [
            'pathways' => ['present', 'array', 'max:100'],
            'pathways.*' => ['required', 'array'],
            'pathways.*.pathwayId' => ['required', 'uuid', 'distinct:strict'],
            'pathways.*.status' => ['required', Rule::in(['not_started', 'in_progress', 'completed', 'archived'])],
            'pathways.*.plan' => ['required', Rule::in(['two_weeks', 'four_weeks', 'eight_weeks', 'flex'])],
            'pathways.*.completedLessonIds' => ['present', 'array'],
            'pathways.*.completedLessonIds.*' => ['required', 'uuid', 'distinct:strict'],
            'pathways.*.startedAt' => ['sometimes', 'nullable', 'date'],
            'pathways.*.completedAt' => ['sometimes', 'nullable', 'date'],
            'projectProgress' => ['sometimes', 'array', 'max:100'],
            'projectProgress.*' => ['required', 'array'],
            'projectProgress.*.projectId' => ['required', 'uuid', 'distinct:strict'],
            'projectProgress.*.status' => ['required', Rule::in(['not_started', 'in_progress', 'completed'])],
            'projectProgress.*.checkedItemIds' => ['present', 'array', 'max:50'],
            'projectProgress.*.checkedItemIds.*' => ['required', 'string', 'max:120', 'distinct:strict'],
            'projectProgress.*.url' => ['sometimes', 'nullable', 'string', 'max:500', 'url'],
            'projectProgress.*.completedAt' => ['sometimes', 'nullable', 'date'],
            'projectProgress.*.updatedAt' => ['required', 'date'],
            'weeklyGoal' => ['sometimes', 'integer', Rule::in([2, 3, 5, 7])],
        ])->validate();

        $this->validatePublishedProgressReferences($data);
        $data['projectProgress'] = $this->normalizeProjectProgressUrls($data['projectProgress'] ?? []);

        return DB::transaction(function () use ($data, $request, $user): JsonResponse {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
            $currentPayload = $this->progressPayload($lockedUser);

            if ($request->header('If-Match') !== $this->progressEtag($currentPayload)) {
                return ProblemResponse::make(412, 'Precondition Failed', 'La progression a changé depuis sa dernière lecture.');
            }

            foreach ($data['pathways'] as $entry) {
                $progress = LearnerProgress::query()->firstOrNew([
                    'user_id' => $lockedUser->id,
                    'pathway_id' => $entry['pathwayId'],
                ]);
                $progress->status = $entry['status'];
                $progress->plan = $entry['plan'];

                foreach (['startedAt' => 'started_at', 'completedAt' => 'completed_at'] as $apiKey => $column) {
                    if (array_key_exists($apiKey, $entry)) {
                        $progress->{$column} = $entry[$apiKey];
                    }
                }

                $progress->save();

                foreach ($entry['completedLessonIds'] as $lessonId) {
                    $this->markLessonCompleted($lockedUser, $lessonId);
                }
            }

            foreach ($data['projectProgress'] ?? [] as $entry) {
                $this->saveProjectProgress($lockedUser, $entry);
            }

            if (array_key_exists('weeklyGoal', $data)) {
                $this->saveWeeklyGoal($lockedUser, $data['weeklyGoal']);
            }

            $updatedPayload = $this->progressPayload($lockedUser);

            return response()->json(['data' => $updatedPayload])
                ->header('ETag', $this->progressEtag($updatedPayload));
        });
    }

    public function markLessonProgress(Request $request): JsonResponse
    {
        if ($unsupportedMediaType = $this->unsupportedMediaTypeResponse($request)) {
            return $unsupportedMediaType;
        }

        /** @var User $user */
        $user = $request->user();
        $payload = $request->json()->all();
        $this->rejectUnexpectedKeys($payload, ['lessonId', 'status']);

        $data = Validator::make($payload, [
            'lessonId' => ['required', 'uuid'],
            'status' => ['required', Rule::in(['in_progress', 'completed'])],
        ])->validate();

        if (! $this->publishedLessonsQuery()->whereKey($data['lessonId'])->exists()) {
            return ProblemResponse::make(404, 'Not Found', 'La leçon publiée est introuvable.');
        }

        $lessonProgress = DB::transaction(function () use ($data, $user): LessonProgress {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
            $lessonProgress = LessonProgress::query()->firstOrNew([
                'user_id' => $lockedUser->id,
                'lesson_id' => $data['lessonId'],
            ]);
            $lessonProgress->status = $data['status'];
            $lessonProgress->completed_at = $data['status'] === 'completed' ? now() : null;
            $lessonProgress->updated_at = now();
            $lessonProgress->save();

            if ($data['status'] === 'completed') {
                $this->recordLessonActivity($lockedUser);
            }

            return $lessonProgress;
        });

        return response()->json(['data' => $this->lessonProgressPayload($lessonProgress)]);
    }

    public function updateProjectProgress(Request $request, string $projectId): JsonResponse
    {
        if ($unsupportedMediaType = $this->unsupportedMediaTypeResponse($request)) {
            return $unsupportedMediaType;
        }

        /** @var User $user */
        $user = $request->user();
        $payload = $request->json()->all();
        $this->rejectUnexpectedKeys($payload, ['status', 'checkedItemIds', 'url']);

        $data = Validator::make($payload, [
            'status' => ['required', Rule::in(['not_started', 'in_progress', 'completed'])],
            'checkedItemIds' => ['present', 'array', 'max:50'],
            'checkedItemIds.*' => ['required', 'string', 'max:120', 'distinct:strict'],
            'url' => ['sometimes', 'nullable', 'string', 'max:500', 'url'],
        ])->validate();

        $project = $this->publishedProjectsQuery()->whereKey($projectId)->first();

        if ($project === null) {
            return ProblemResponse::make(404, 'Not Found', 'Le projet publié est introuvable.');
        }

        $this->validateChecklistItems($project, $data['checkedItemIds']);

        if (isset($data['url']) && ! $this->isPublicHttpsUrl($data['url'])) {
            throw ValidationException::withMessages([
                'url' => 'Le lien doit utiliser HTTPS et cibler un hôte public.',
            ]);
        }

        if (isset($data['url'])) {
            $data['url'] = $this->normalizeHttpsUrl($data['url']);
        }

        $entry = [
            'projectId' => $project->id,
            'status' => $data['status'],
            'checkedItemIds' => $data['checkedItemIds'],
        ];

        if (array_key_exists('url', $data)) {
            $entry['url'] = $data['url'];
        }

        $progress = DB::transaction(function () use ($entry, $user): LearnerProjectProgress {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);

            return $this->saveProjectProgress($lockedUser, $entry);
        });

        return response()->json(['data' => $this->projectProgressPayload($progress)]);
    }

    public function listNotes(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        [$limit, $cursor] = $this->paginationParameters($request);
        $paginator = LearnerNote::query()
            ->where('user_id', $user->id)
            ->whereHas('lesson', function (Builder $lesson): void {
                $this->constrainPublishedLessons($lesson);
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->cursorPaginate($limit, ['*'], 'cursor', $cursor);

        return response()->json([
            'data' => $paginator->getCollection()
                ->map(fn (LearnerNote $note): array => $this->notePayload($note))
                ->values(),
            'meta' => $this->pageMeta($paginator, $limit),
        ]);
    }

    public function storeNote(Request $request): JsonResponse
    {
        if ($unsupportedMediaType = $this->unsupportedMediaTypeResponse($request)) {
            return $unsupportedMediaType;
        }

        /** @var User $user */
        $user = $request->user();
        $payload = $request->json()->all();
        $this->rejectUnexpectedKeys($payload, ['lessonId', 'body']);

        $data = Validator::make($payload, [
            'lessonId' => ['required', 'uuid'],
            'body' => ['required', 'string', 'max:10000'],
        ])->validate();

        if (! $this->publishedLessonsQuery()->whereKey($data['lessonId'])->exists()) {
            return ProblemResponse::make(404, 'Not Found', 'La leçon publiée est introuvable.');
        }

        $sanitizedBody = strip_tags($data['body']);
        [$note, $created] = DB::transaction(function () use ($data, $sanitizedBody, $user): array {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
            $note = LearnerNote::query()->firstOrNew([
                'user_id' => $lockedUser->id,
                'lesson_id' => $data['lessonId'],
            ]);
            $created = ! $note->exists;
            $note->body = $sanitizedBody;
            $note->save();

            return [$note, $created];
        });

        return response()->json(
            ['data' => $this->notePayload($note)],
            $created ? 201 : 200,
        );
    }

    public function deleteNote(Request $request, string $noteId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $note = LearnerNote::query()
            ->where('user_id', $user->id)
            ->whereKey($noteId)
            ->first();

        if ($note === null) {
            return ProblemResponse::make(404, 'Not Found', 'La note est introuvable.');
        }

        $note->delete();

        return response()->json(status: 204);
    }

    public function listSavedResources(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        [$limit, $cursor] = $this->paginationParameters($request);
        $paginator = SavedResource::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->cursorPaginate($limit, ['*'], 'cursor', $cursor);

        return response()->json([
            'data' => $paginator->getCollection()
                ->map(fn (SavedResource $savedResource): array => $this->savedResourcePayload($savedResource))
                ->values(),
            'meta' => $this->pageMeta($paginator, $limit),
        ]);
    }

    public function storeSavedResource(Request $request): JsonResponse
    {
        if ($unsupportedMediaType = $this->unsupportedMediaTypeResponse($request)) {
            return $unsupportedMediaType;
        }

        /** @var User $user */
        $user = $request->user();
        $payload = $request->json()->all();
        $this->rejectUnexpectedKeys($payload, ['url', 'title', 'source', 'resourceId']);

        $data = Validator::make($payload, [
            'url' => ['required', 'string', 'max:1000', 'url'],
            'title' => ['required', 'string', 'min:1', 'max:180'],
            'source' => ['sometimes', 'string', 'max:100'],
            'resourceId' => ['sometimes', 'nullable', 'uuid'],
        ])->validate();

        if (! $this->isPublicHttpsUrl($data['url'])) {
            throw ValidationException::withMessages([
                'url' => 'Le lien doit utiliser HTTPS et cibler un hôte public.',
            ]);
        }
        $data['url'] = $this->normalizeHttpsUrl($data['url']);

        $resource = null;

        if (! empty($data['resourceId'])) {
            $resource = Resource::query()
                ->whereKey($data['resourceId'])
                ->where('status', 'published')
                ->where('verification_status', 'verified')
                ->where(function (Builder $query): void {
                    $query->whereHas('pathway', function (Builder $pathway): void {
                        $this->constrainPublishedPathways($pathway);
                    })->orWhereHas('lesson', function (Builder $lesson): void {
                        $this->constrainPublishedLessons($lesson);
                    })->orWhereHas('domain', function (Builder $domain): void {
                        $this->constrainPublishedDomain($domain);
                    });
                })
                ->first();

            if (
                $resource === null
                || ! $this->isPublicHttpsUrl($resource->url)
                || $this->normalizeHttpsUrl($resource->url) !== $data['url']
            ) {
                return ProblemResponse::make(404, 'Not Found', 'La ressource publiée correspondante est introuvable.');
            }
        }

        if (SavedResource::query()->where('user_id', $user->id)->where('url', $data['url'])->exists()) {
            throw ValidationException::withMessages([
                'url' => 'Cette URL est déjà enregistrée dans votre bibliothèque.',
            ]);
        }

        $savedResource = DB::transaction(function () use ($data, $resource, $user): SavedResource {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);

            if (SavedResource::query()->where('user_id', $lockedUser->id)->count() >= 100) {
                throw ValidationException::withMessages([
                    'savedResources' => 'La bibliothèque ne peut pas contenir plus de 100 ressources.',
                ]);
            }

            if (SavedResource::query()
                ->where('user_id', $lockedUser->id)
                ->where('url', $data['url'])
                ->exists()) {
                throw ValidationException::withMessages([
                    'url' => 'Cette URL est déjà enregistrée dans votre bibliothèque.',
                ]);
            }

            $savedResource = new SavedResource;
            $savedResource->user_id = $lockedUser->id;
            $savedResource->resource_id = $resource?->id;
            $savedResource->url = $data['url'];
            $savedResource->title = $data['title'];
            $savedResource->source = $data['source'] ?? null;
            $savedResource->created_at = now();
            $savedResource->save();

            return $savedResource;
        });

        return response()->json(['data' => $this->savedResourcePayload($savedResource)], 201);
    }

    public function deleteSavedResource(Request $request, string $resourceId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $savedResource = SavedResource::query()
            ->where('user_id', $user->id)
            ->whereKey($resourceId)
            ->first();

        if ($savedResource === null) {
            return ProblemResponse::make(404, 'Not Found', 'La ressource enregistrée est introuvable.');
        }

        $savedResource->delete();

        return response()->json(status: 204);
    }

    public function showWeeklyGoal(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $goal = WeeklyGoal::query()->where('user_id', $user->id)->first();

        return response()->json(['data' => $this->weeklyGoalPayload($user, $goal)]);
    }

    public function updateWeeklyGoal(Request $request): JsonResponse
    {
        if ($unsupportedMediaType = $this->unsupportedMediaTypeResponse($request)) {
            return $unsupportedMediaType;
        }

        /** @var User $user */
        $user = $request->user();
        $payload = $request->json()->all();
        $this->rejectUnexpectedKeys($payload, ['targetDays']);
        $data = Validator::make($payload, [
            'targetDays' => ['required', 'integer', Rule::in([2, 3, 5, 7])],
        ])->validate();
        $goal = DB::transaction(function () use ($data, $user): WeeklyGoal {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);

            return $this->saveWeeklyGoal($lockedUser, (int) $data['targetDays']);
        });

        return response()->json(['data' => $this->weeklyGoalPayload($user, $goal)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function profilePayload(LearnerProfile $profile): array
    {
        return [
            'displayName' => $profile->display_name,
            'avatar' => (object) ($profile->avatar ?? []),
            'interests' => $profile->interests ?? [],
            'theme' => $profile->theme,
            'resourceLanguage' => $profile->resource_language,
            'learningMode' => $profile->learning_mode,
            'locale' => $profile->locale,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function progressPayload(User $user): array
    {
        $pathwayProgress = LearnerProgress::query()
            ->where('user_id', $user->id)
            ->whereHas('pathway', function (Builder $pathway): void {
                $this->constrainPublishedPathways($pathway);
            })
            ->with('pathway')
            ->orderBy('pathway_id')
            ->get();
        $completedLessonIdsByPathway = LessonProgress::query()
            ->where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereHas('lesson.week.pathway', function (Builder $pathway): void {
                $this->constrainPublishedPathways($pathway);
            })
            ->with('lesson.week')
            ->get()
            ->groupBy(fn (LessonProgress $progress): string => $progress->lesson->week->pathway_id);
        $projectProgress = LearnerProjectProgress::query()
            ->where('user_id', $user->id)
            ->whereHas('project', function (Builder $project): void {
                $this->constrainPublishedProjects($project);
            })
            ->orderBy('project_id')
            ->get();
        $goal = WeeklyGoal::query()->where('user_id', $user->id)->first();
        $activeDays = DB::table('active_days')
            ->where('user_id', $user->id)
            ->orderByDesc('activity_date')
            ->limit(400)
            ->pluck('activity_date')
            ->map(static fn (string $date): string => substr($date, 0, 10))
            ->all();

        return [
            'pathways' => $pathwayProgress->map(function (LearnerProgress $progress) use ($completedLessonIdsByPathway): array {
                return [
                    'pathwayId' => $progress->pathway_id,
                    'status' => $progress->status,
                    'plan' => $progress->plan,
                    'completedLessonIds' => $completedLessonIdsByPathway
                        ->get($progress->pathway_id, collect())
                        ->pluck('lesson_id')
                        ->unique()
                        ->values()
                        ->all(),
                    'startedAt' => $this->dateTime($progress->started_at),
                    'completedAt' => $this->dateTime($progress->completed_at),
                ];
            })->values()->all(),
            'lessonProgress' => LessonProgress::query()
                ->where('user_id', $user->id)
                ->whereHas('lesson.week.pathway', function (Builder $pathway): void {
                    $this->constrainPublishedPathways($pathway);
                })
                ->orderBy('lesson_id')
                ->get()
                ->map(fn (LessonProgress $progress): array => $this->lessonProgressPayload($progress))
                ->values()
                ->all(),
            'projectProgress' => $projectProgress
                ->map(fn (LearnerProjectProgress $progress): array => $this->projectProgressPayload($progress))
                ->values()
                ->all(),
            'weeklyGoal' => $this->weeklyGoalPayload($user, $goal),
            'activeDays' => $activeDays,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function lessonProgressPayload(LessonProgress $progress): array
    {
        return [
            'lessonId' => $progress->lesson_id,
            'status' => $progress->status,
            'completedAt' => $this->dateTime($progress->completed_at),
            'updatedAt' => $this->dateTime($progress->updated_at),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function projectProgressPayload(LearnerProjectProgress $progress): array
    {
        return [
            'projectId' => $progress->project_id,
            'status' => $progress->status,
            'checkedItemIds' => $progress->checked_item_ids ?? [],
            'url' => $progress->url,
            'completedAt' => $this->dateTime($progress->completed_at),
            'updatedAt' => $this->dateTime($progress->updated_at),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function notePayload(LearnerNote $note): array
    {
        return [
            'id' => $note->id,
            'lessonId' => $note->lesson_id,
            'body' => $note->body,
            'updatedAt' => $this->dateTime($note->updated_at),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function savedResourcePayload(SavedResource $savedResource): array
    {
        return [
            'id' => $savedResource->id,
            'url' => $savedResource->url,
            'title' => $savedResource->title,
            'source' => $savedResource->source,
            'resourceId' => $savedResource->resource_id,
            'createdAt' => $this->dateTime($savedResource->created_at),
        ];
    }

    /**
     * @return array{targetDays: int, updatedAt: string}
     */
    private function weeklyGoalPayload(User $user, ?WeeklyGoal $goal): array
    {
        return [
            'targetDays' => $goal?->target_days ?? 3,
            'updatedAt' => $this->dateTime($goal?->updated_at ?? $user->created_at),
        ];
    }

    private function dateTime(mixed $value): ?string
    {
        return $value?->toISOString();
    }

    private function progressEtag(array $payload): string
    {
        return '"'.hash(
            'sha256',
            json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        ).'"';
    }

    private function unsupportedMediaTypeResponse(Request $request): ?JsonResponse
    {
        $mediaType = strtolower(trim(explode(';', $request->header('Content-Type', ''), 2)[0]));

        if ($mediaType === 'application/json') {
            return null;
        }

        return ProblemResponse::make(
            415,
            'Unsupported Media Type',
            'Cette opération accepte uniquement le type de média application/json.',
            ['code' => 'UNSUPPORTED_MEDIA_TYPE'],
        );
    }

    private function validateIfMatchHeader(Request $request): void
    {
        Validator::make(['ifMatch' => $request->header('If-Match')], [
            'ifMatch' => ['required', 'string', 'max:128'],
        ])->validate();
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

    /**
     * @return array{limit: int, hasMore: bool, nextCursor: string|null}
     */
    private function pageMeta(CursorPaginator $paginator, int $limit): array
    {
        $hasMore = $paginator->hasMorePages();

        return [
            'limit' => $limit,
            'hasMore' => $hasMore,
            'nextCursor' => $hasMore ? $paginator->nextCursor()?->encode() : null,
        ];
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
     * @param  list<string>  $allowed
     */
    private function rejectUnexpectedKeys(array $payload, array $allowed): void
    {
        if (array_diff(array_keys($payload), $allowed) !== []) {
            throw ValidationException::withMessages([
                'request' => 'La requête contient des propriétés non autorisées.',
            ]);
        }
    }

    /**
     * @param  list<string>  $allowed
     */
    private function rejectNestedUnexpectedKeys(array $payload, string $collection, array $allowed): void
    {
        $entries = $payload[$collection] ?? [];

        if (! is_array($entries)) {
            return;
        }

        foreach ($entries as $index => $entry) {
            if (! is_array($entry) || array_diff(array_keys($entry), $allowed) !== []) {
                throw ValidationException::withMessages([
                    "{$collection}.{$index}" => 'La requête contient des propriétés non autorisées.',
                ]);
            }
        }
    }

    private function validatePublishedProgressReferences(array $data): void
    {
        foreach ($data['pathways'] as $index => $entry) {
            $pathway = $this->publishedPathwaysQuery()
                ->whereKey($entry['pathwayId'])
                ->first();

            if ($pathway === null) {
                throw ValidationException::withMessages([
                    "pathways.{$index}.pathwayId" => 'Le parcours publié est introuvable.',
                ]);
            }

            if ($entry['completedLessonIds'] !== []) {
                $validLessonIds = $this->publishedLessonsQuery()
                    ->whereHas('week', fn (Builder $week): Builder => $week->where('pathway_id', $pathway->id))
                    ->whereIn('id', $entry['completedLessonIds'])
                    ->pluck('id')
                    ->all();

                if (count($validLessonIds) !== count($entry['completedLessonIds'])) {
                    throw ValidationException::withMessages([
                        "pathways.{$index}.completedLessonIds" => 'Une ou plusieurs leçons ne font pas partie de ce parcours publié.',
                    ]);
                }
            }
        }

        foreach ($data['projectProgress'] ?? [] as $index => $entry) {
            $project = $this->publishedProjectsQuery()->whereKey($entry['projectId'])->first();

            if ($project === null) {
                throw ValidationException::withMessages([
                    "projectProgress.{$index}.projectId" => 'Le projet publié est introuvable.',
                ]);
            }

            $this->validateChecklistItems($project, $entry['checkedItemIds']);
        }
    }

    private function normalizeProjectProgressUrls(array $entries): array
    {
        foreach ($entries as $index => $entry) {
            if (! isset($entry['url'])) {
                continue;
            }

            if (! $this->isPublicHttpsUrl($entry['url'])) {
                throw ValidationException::withMessages([
                    "projectProgress.{$index}.url" => 'Le lien doit utiliser HTTPS et cibler un hôte public.',
                ]);
            }

            $entries[$index]['url'] = $this->normalizeHttpsUrl($entry['url']);
        }

        return $entries;
    }

    private function validateChecklistItems(Project $project, array $checkedItemIds): void
    {
        $validIds = ProjectChecklistItem::query()
            ->where('project_id', $project->id)
            ->whereIn('stable_key', $checkedItemIds)
            ->pluck('stable_key')
            ->all();

        if (count($validIds) !== count($checkedItemIds)) {
            throw ValidationException::withMessages([
                'checkedItemIds' => 'Une ou plusieurs cases ne font pas partie de ce projet.',
            ]);
        }
    }

    private function markLessonCompleted(User $user, string $lessonId): void
    {
        $progress = LessonProgress::query()->firstOrNew([
            'user_id' => $user->id,
            'lesson_id' => $lessonId,
        ]);
        $progress->status = 'completed';
        $progress->completed_at ??= now();
        $progress->updated_at = now();
        $progress->save();

        $this->recordLessonActivity($user);
    }

    private function recordLessonActivity(User $user): void
    {
        DB::table('active_days')->upsert([[
            'user_id' => $user->id,
            'activity_date' => today()->toDateString(),
            'activity_source' => 'lesson_completed',
            'created_at' => now(),
        ]], ['user_id', 'activity_date'], ['activity_source']);
    }

    private function saveWeeklyGoal(User $user, int $targetDays): WeeklyGoal
    {
        $goal = WeeklyGoal::query()->firstOrNew(['user_id' => $user->id]);
        $goal->target_days = $targetDays;
        $goal->updated_at = now();
        $goal->save();

        return $goal;
    }

    private function saveProjectProgress(User $user, array $entry): LearnerProjectProgress
    {
        $progress = LearnerProjectProgress::query()->firstOrNew([
            'user_id' => $user->id,
            'project_id' => $entry['projectId'],
        ]);
        $progress->status = $entry['status'];
        $progress->checked_item_ids = $entry['checkedItemIds'];

        if (array_key_exists('url', $entry)) {
            $progress->url = $entry['url'];
        }

        if (array_key_exists('completedAt', $entry)) {
            $progress->completed_at = $entry['completedAt'];
        }

        $progress->updated_at = now();
        $progress->save();

        return $progress;
    }

    private function publishedPathwaysQuery(): Builder
    {
        return $this->constrainPublishedPathways(Pathway::query());
    }

    private function constrainPublishedPathways(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->whereHas('domain', fn (Builder $domain): Builder => $this->constrainPublishedDomain($domain));
    }

    private function constrainPublishedDomain(Builder $query): Builder
    {
        return $query->where('availability', 'published')
            ->whereHas('family', static fn (Builder $family): Builder => $family->where('status', 'published'));
    }

    private function publishedLessonsQuery(): Builder
    {
        return $this->constrainPublishedLessons(Lesson::query());
    }

    private function constrainPublishedLessons(Builder $query): Builder
    {
        return $query->whereHas('week.pathway', function (Builder $pathway): void {
            $this->constrainPublishedPathways($pathway);
        });
    }

    private function publishedProjectsQuery(): Builder
    {
        return $this->constrainPublishedProjects(Project::query());
    }

    private function constrainPublishedProjects(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->whereHas('pathway', function (Builder $pathway): void {
                $this->constrainPublishedPathways($pathway);
            });
    }

    private function isPublicHttpsUrl(string $url): bool
    {
        $parts = parse_url($url);

        if (
            $parts === false
            || strtolower($parts['scheme'] ?? '') !== 'https'
            || ! isset($parts['host'])
            || isset($parts['user'])
            || isset($parts['pass'])
        ) {
            return false;
        }

        $host = rtrim(Str::lower($parts['host']), '.');

        if ($host === '' || str_contains($host, '%')) {
            return false;
        }

        $ipHost = trim($host, '[]');

        if (filter_var($ipHost, FILTER_VALIDATE_IP) !== false) {
            return $this->isPublicIpAddress($ipHost);
        }

        if (
            preg_match('/^(?:0x[0-9a-f]+|[0-9]+)(?:\.(?:0x[0-9a-f]+|[0-9]+))*$/i', $host) === 1
            || str_contains($host, ':')
        ) {
            return false;
        }

        if (! str_contains($host, '.')) {
            return false;
        }

        foreach (['localhost', 'local', 'internal', 'test', 'example', 'invalid', 'home.arpa', 'arpa', 'onion'] as $suffix) {
            if ($host === $suffix || str_ends_with($host, '.'.$suffix)) {
                return false;
            }
        }

        $addresses = $this->hostAddressResolver->resolve($host);

        if ($addresses === null || $addresses === []) {
            return false;
        }

        foreach ($addresses as $address) {
            if (! is_string($address) || ! $this->isPublicIpAddress($address)) {
                return false;
            }
        }

        return true;
    }

    private function isPublicIpAddress(string $address): bool
    {
        if (filter_var(
            $address,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
        ) === false) {
            return false;
        }

        $packedAddress = inet_pton($address);

        if ($packedAddress === false) {
            return false;
        }

        if (str_contains($address, ':')) {
            if (! $this->isIpInRange($packedAddress, '2000::', 3)) {
                return false;
            }

            foreach ([
                ['2001::', 23],
                ['2001:db8::', 32],
                ['2002::', 16],
                ['3fff::', 20],
            ] as [$network, $prefix]) {
                if ($this->isIpInRange($packedAddress, $network, $prefix)) {
                    return false;
                }
            }

            return true;
        }

        foreach ([
            ['0.0.0.0', 8],
            ['100.64.0.0', 10],
            ['192.0.0.0', 24],
            ['192.0.2.0', 24],
            ['192.88.99.0', 24],
            ['198.18.0.0', 15],
            ['198.51.100.0', 24],
            ['203.0.113.0', 24],
            ['224.0.0.0', 4],
            ['240.0.0.0', 4],
        ] as [$network, $prefix]) {
            if ($this->isIpInRange($packedAddress, $network, $prefix)) {
                return false;
            }
        }

        return true;
    }

    private function isIpInRange(string $packedAddress, string $network, int $prefix): bool
    {
        $packedNetwork = inet_pton($network);

        if ($packedNetwork === false || strlen($packedAddress) !== strlen($packedNetwork)) {
            return false;
        }

        $wholeBytes = intdiv($prefix, 8);
        $remainingBits = $prefix % 8;

        if (substr($packedAddress, 0, $wholeBytes) !== substr($packedNetwork, 0, $wholeBytes)) {
            return false;
        }

        if ($remainingBits === 0) {
            return true;
        }

        $mask = (0xFF << (8 - $remainingBits)) & 0xFF;

        return (ord($packedAddress[$wholeBytes]) & $mask) === (ord($packedNetwork[$wholeBytes]) & $mask);
    }

    private function normalizeHttpsUrl(string $url): string
    {
        $parts = parse_url($url);
        $host = rtrim(Str::lower(trim($parts['host'], '[]')), '.');
        $displayHost = str_contains($host, ':') ? '['.$host.']' : $host;
        $port = isset($parts['port']) && $parts['port'] !== 443 ? ':'.$parts['port'] : '';
        $path = $parts['path'] ?? '/';
        $query = isset($parts['query']) ? '?'.$parts['query'] : '';
        $fragment = isset($parts['fragment']) ? '#'.$parts['fragment'] : '';

        return 'https://'.$displayHost.$port.$path.$query.$fragment;
    }
}
