<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\Cursor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SearchController extends Controller
{
    /**
     * Search published catalogue content using the contract's stable cursor page.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:120'],
            'family' => ['sometimes', 'string', 'max:80'],
            'cursor' => [
                'sometimes',
                'string',
                'max:512',
                static function (string $attribute, mixed $value, \Closure $fail): void {
                    $cursor = Cursor::fromEncoded($value);

                    if ($cursor === null) {
                        $fail('Le curseur fourni est invalide.');

                        return;
                    }

                    try {
                        [$type, $id] = $cursor->parameters(['type', 'id']);
                    } catch (\UnexpectedValueException) {
                        $fail('Le curseur fourni est invalide.');

                        return;
                    }

                    if (! in_array($type, ['domain', 'lesson', 'pathway', 'resource'], true)
                        || ! is_string($id)
                        || Str::length($id) > 120) {
                        $fail('Le curseur fourni est invalide.');
                    }
                },
            ],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = mb_strtolower($filters['q']);
        $familyId = $filters['family'] ?? null;

        $domainResults = DB::table('domains')
            ->join('domain_families', 'domain_families.id', '=', 'domains.family_id')
            ->where('domains.availability', 'published')
            ->where('domain_families.status', 'published')
            ->when($familyId !== null, static fn (Builder $builder): Builder => $builder->where('domains.family_id', $familyId))
            ->where(static function (Builder $builder) use ($query): void {
                self::whereMatches($builder, $query, ['domains.name', 'domains.summary']);
            })
            ->selectRaw("'domain' AS type")
            ->selectRaw('CAST(domains.id AS varchar(120)) AS id')
            ->addSelect('domains.name AS title')
            ->selectRaw("substr(coalesce(domains.summary, ''), 1, 1000) AS summary")
            ->addSelect('domains.id AS domain_id');

        $pathwayResults = DB::table('pathways')
            ->join('domains', 'domains.id', '=', 'pathways.domain_id')
            ->join('domain_families', 'domain_families.id', '=', 'domains.family_id')
            ->where('pathways.status', 'published')
            ->where('domains.availability', 'published')
            ->where('domain_families.status', 'published')
            ->when($familyId !== null, static fn (Builder $builder): Builder => $builder->where('domains.family_id', $familyId))
            ->where(static function (Builder $builder) use ($query): void {
                self::whereMatches($builder, $query, ['pathways.title', 'pathways.description', 'pathways.overview']);
            })
            ->selectRaw("'pathway' AS type")
            ->selectRaw('CAST(pathways.id AS varchar(120)) AS id')
            ->addSelect('pathways.title')
            ->selectRaw("substr(coalesce(nullif(pathways.description, ''), pathways.overview, ''), 1, 1000) AS summary")
            ->addSelect('domains.id AS domain_id');

        $lessonResults = DB::table('lessons')
            ->join('pathway_weeks', 'pathway_weeks.id', '=', 'lessons.week_id')
            ->join('pathways', 'pathways.id', '=', 'pathway_weeks.pathway_id')
            ->join('domains', 'domains.id', '=', 'pathways.domain_id')
            ->join('domain_families', 'domain_families.id', '=', 'domains.family_id')
            ->where('pathways.status', 'published')
            ->where('domains.availability', 'published')
            ->where('domain_families.status', 'published')
            ->when($familyId !== null, static fn (Builder $builder): Builder => $builder->where('domains.family_id', $familyId))
            ->where(static function (Builder $builder) use ($query): void {
                self::whereMatches($builder, $query, [
                    'lessons.title',
                    'lessons.objective',
                    'lessons.explanation',
                    'lessons.activity',
                ]);
            })
            ->selectRaw("'lesson' AS type")
            ->selectRaw('CAST(lessons.id AS varchar(120)) AS id')
            ->addSelect('lessons.title')
            ->selectRaw("substr(coalesce(nullif(lessons.objective, ''), lessons.explanation, lessons.activity, ''), 1, 1000) AS summary")
            ->addSelect('domains.id AS domain_id');

        $resourceResults = $this->resourceResults($query, $familyId);
        $results = $domainResults
            ->unionAll($pathwayResults)
            ->unionAll($lessonResults)
            ->unionAll($resourceResults);

        $page = DB::query()
            ->fromSub($results, 'search_results')
            ->orderBy('type')
            ->orderBy('id')
            ->cursorPaginate((int) ($filters['limit'] ?? 20));

        return response()->json([
            'data' => $page->getCollection()->map(static function (object $result): array {
                $payload = [
                    'type' => $result->type,
                    'id' => $result->id,
                    'title' => $result->title,
                    'summary' => $result->summary,
                ];

                if ($result->domain_id !== null) {
                    $payload['domainId'] = $result->domain_id;
                }

                $payload['availability'] = 'published';

                return $payload;
            })->all(),
            'meta' => [
                'limit' => $page->perPage(),
                'hasMore' => $page->hasMorePages(),
                'nextCursor' => $page->nextCursor()?->encode(),
            ],
        ]);
    }

    /**
     * @param  list<string>  $columns
     */
    private static function whereMatches(Builder $builder, string $query, array $columns): void
    {
        $pattern = '%'.$query.'%';

        $builder->where(static function (Builder $matches) use ($columns, $pattern): void {
            foreach ($columns as $index => $column) {
                if ($index === 0) {
                    $matches->whereRaw("LOWER({$column}) LIKE ?", [$pattern]);

                    continue;
                }

                $matches->orWhereRaw("LOWER({$column}) LIKE ?", [$pattern]);
            }
        });
    }

    private function resourceResults(string $query, ?string $familyId): Builder
    {
        $resources = DB::table('resources')
            ->where('resources.status', 'published')
            ->where('resources.verification_status', 'verified')
            ->where('resources.url', 'like', 'https://%')
            ->where('resources.url', 'not like', 'https://%@%')
            ->whereRaw('length(resources.url) > 8')
            ->whereRaw("substr(resources.url, 9, 1) NOT IN ('/', '?', '#')")
            ->where(static function (Builder $parent) use ($familyId): void {
                $parent->whereExists(static function (Builder $publishedDomain) use ($familyId): void {
                    $publishedDomain->selectRaw('1')
                        ->from('domains')
                        ->join('domain_families', 'domain_families.id', '=', 'domains.family_id')
                        ->whereColumn('domains.id', 'resources.domain_id');

                    self::constrainSearchableDomain($publishedDomain, 'domains', 'domain_families', $familyId);
                })->orWhereExists(static function (Builder $publishedPathway) use ($familyId): void {
                    $publishedPathway->selectRaw('1')
                        ->from('pathways')
                        ->join('domains', 'domains.id', '=', 'pathways.domain_id')
                        ->join('domain_families', 'domain_families.id', '=', 'domains.family_id')
                        ->whereColumn('pathways.id', 'resources.pathway_id')
                        ->where('pathways.status', 'published');

                    self::constrainSearchableDomain($publishedPathway, 'domains', 'domain_families', $familyId);
                })->orWhereExists(static function (Builder $publishedLesson) use ($familyId): void {
                    $publishedLesson->selectRaw('1')
                        ->from('lessons')
                        ->join('pathway_weeks', 'pathway_weeks.id', '=', 'lessons.week_id')
                        ->join('pathways', 'pathways.id', '=', 'pathway_weeks.pathway_id')
                        ->join('domains', 'domains.id', '=', 'pathways.domain_id')
                        ->join('domain_families', 'domain_families.id', '=', 'domains.family_id')
                        ->whereColumn('lessons.id', 'resources.lesson_id')
                        ->where('pathways.status', 'published');

                    self::constrainSearchableDomain($publishedLesson, 'domains', 'domain_families', $familyId);
                });
            })
            ->where(static function (Builder $builder) use ($query): void {
                self::whereMatches($builder, $query, ['resources.title', 'resources.provider', 'resources.access_note']);
            });

        return $resources
            ->selectRaw("'resource' AS type")
            ->selectRaw('CAST(resources.id AS varchar(120)) AS id')
            ->addSelect('resources.title')
            ->selectRaw("substr(coalesce(nullif(resources.access_note, ''), resources.provider, ''), 1, 1000) AS summary")
            ->selectRaw('NULL AS domain_id');
    }

    private static function constrainSearchableDomain(
        Builder $builder,
        string $domainTable,
        string $familyTable,
        ?string $familyId,
    ): void {
        $builder->where("{$domainTable}.availability", 'published')
            ->where("{$familyTable}.status", 'published')
            ->when($familyId !== null, static fn (Builder $query): Builder => $query->where("{$domainTable}.family_id", $familyId));
    }
}
