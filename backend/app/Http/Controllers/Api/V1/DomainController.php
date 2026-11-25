<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Domain;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\Cursor;
use Illuminate\Pagination\CursorPaginator;
use Illuminate\Support\Str;

class DomainController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'cursor' => ['sometimes', 'string', 'max:512', static function (string $attribute, mixed $value, \Closure $fail): void {
                $cursor = Cursor::fromEncoded($value);

                if ($cursor === null) {
                    $fail('Le curseur fourni est invalide.');

                    return;
                }

                try {
                    $identifier = $cursor->parameter('id');
                } catch (\UnexpectedValueException) {
                    $fail('Le curseur fourni est invalide.');

                    return;
                }

                if (! is_string($identifier) || Str::length($identifier) > 100) {
                    $fail('Le curseur fourni est invalide.');
                }
            }],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'family' => ['sometimes', 'string', 'max:80'],
            'q' => ['sometimes', 'string', 'max:120'],
        ]);

        $limit = (int) ($filters['limit'] ?? 20);
        $domains = Domain::query()
            ->where('availability', 'published')
            ->whereHas('family', static fn (Builder $query): Builder => $query->where('status', 'published'));

        if (isset($filters['family'])) {
            $domains->where('family_id', $filters['family']);
        }

        if (isset($filters['q'])) {
            $search = '%'.mb_strtolower($filters['q']).'%';
            $domains->where(static function (Builder $query) use ($search): void {
                $query->whereRaw('LOWER(name) LIKE ?', [$search])
                    ->orWhereRaw('LOWER(summary) LIKE ?', [$search]);
            });
        }

        /** @var CursorPaginator $page */
        $page = $domains->orderBy('id')->cursorPaginate($limit);

        return response()->json([
            'data' => $page->getCollection()->map(fn (Domain $domain): array => $this->summary($domain))->all(),
            'meta' => [
                'limit' => $limit,
                'hasMore' => $page->hasMorePages(),
                'nextCursor' => $page->nextCursor()?->encode(),
            ],
        ]);
    }

    public function show(string $domainId): JsonResponse
    {
        $domain = Domain::query()
            ->whereKey($domainId)
            ->where('availability', 'published')
            ->whereHas('family', static fn (Builder $query): Builder => $query->where('status', 'published'))
            ->with(['pathways' => static function (Relation $relation): void {
                $relation->where('status', 'published')->orderBy('title');
            }])
            ->firstOrFail();

        return response()->json([
            'data' => [
                ...$this->summary($domain),
                'pathways' => $domain->pathways->map(static fn ($pathway): array => [
                    'id' => $pathway->id,
                    'title' => $pathway->title,
                    'version' => $pathway->version,
                    'status' => 'published',
                ])->all(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(Domain $domain): array
    {
        return array_filter([
            'id' => $domain->id,
            'familyId' => $domain->family_id,
            'name' => $domain->name,
            'summary' => $domain->summary,
            'availability' => 'published',
            'publishedAt' => $domain->published_at?->toISOString(),
        ], static fn (mixed $value): bool => $value !== null);
    }
}
