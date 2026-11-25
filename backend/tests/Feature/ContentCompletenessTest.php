<?php

namespace Tests\Feature;

use App\Models\FamilyPathwayTemplate;
use App\Models\User;
use Database\Seeders\ContentCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Ramsey\Uuid\Uuid;
use RuntimeException;
use Tests\TestCase;

class ContentCompletenessTest extends TestCase
{
    use RefreshDatabase;

    private string|false $previousRevisionAuthorId;

    private ?string $fixtureRevisionAuthorId = null;

    /**
     * @var list<string>
     */
    private const SPECIALTY_DOMAIN_IDS = [
        'networks',
        'cyber',
        'linux',
        'support',
        'python',
        'mobile',
        'databases',
        'data',
        'cloud',
        'devops',
    ];

    private const QUARANTINED_FAMILY_COUNTS = [
        'hospitality' => 12,
        'technical' => 11,
        'agriculture' => 11,
        'education' => 11,
        'civic' => 11,
        'science' => 10,
        'health' => 10,
    ];

    protected function setUp(): void
    {
        parent::setUp();

        $this->previousRevisionAuthorId = getenv('CONTENT_REVISION_AUTHOR_ID');
    }

    protected function tearDown(): void
    {
        if ($this->previousRevisionAuthorId === false) {
            putenv('CONTENT_REVISION_AUTHOR_ID');
        } else {
            putenv('CONTENT_REVISION_AUTHOR_ID='.$this->previousRevisionAuthorId);
        }

        parent::tearDown();
    }

    public function test_source_fixture_preserves_occurrences_aliases_and_runtime_resolution(): void
    {
        $fixture = $this->sourceFixture();
        $activeFamilyIds = array_fill_keys(array_column($fixture['families'], 'id'), true);
        $rawRecords = $fixture['domains'];
        $sourceDomainIds = array_values(array_unique(array_column($rawRecords, 'id')));
        $quarantinedCounts = [];
        $runtimeDomainIds = [];

        foreach ($rawRecords as $record) {
            if (isset($activeFamilyIds[$record['family']])) {
                $runtimeDomainIds[] = $fixture['domainAliases'][$record['id']] ?? $record['id'];

                continue;
            }

            $quarantinedCounts[$record['family']] = ($quarantinedCounts[$record['family']] ?? 0) + 1;
        }

        $runtimeDomainIds = array_values(array_unique($runtimeDomainIds));
        $expectedRuntimeDomainIds = [
            ...$fixture['guidedProfileIds'],
            ...array_keys($fixture['specialties']),
            'web',
        ];
        sort($sourceDomainIds);
        sort($runtimeDomainIds);
        sort($expectedRuntimeDomainIds);
        ksort($quarantinedCounts);
        $expectedQuarantinedCounts = self::QUARANTINED_FAMILY_COUNTS;
        ksort($expectedQuarantinedCounts);

        $this->assertSame(250, count($rawRecords));
        $this->assertSame(192, count($sourceDomainIds));
        $this->assertSame($expectedQuarantinedCounts, $quarantinedCounts);
        $this->assertSame(76, array_sum($quarantinedCounts));
        $this->assertSame(101, count($runtimeDomainIds));
        $this->assertSame($expectedRuntimeDomainIds, $runtimeDomainIds);
        $this->assertCount(72, $fixture['domainAliases']);
        $this->assertArrayHasKey('familyTemplates', $fixture);
        $this->assertCount(11, $fixture['familyTemplates']);
        $this->assertCount(3, $fixture['generatedStageTemplates']);
        $this->assertCount(90, $fixture['domainTopics']['canonical']);
        $this->assertCount(8, $fixture['domainTopics']['aliases']);
        $expectedTopicAliasTargets = [
            'social-entrepreneurship' => 'entrepreneuriat-social',
            'team-management' => 'gestion-equipe',
            'project-management' => 'gestion-projet',
            'content-creation' => 'creation-contenu',
            'content' => 'creation-contenu',
            'photography' => 'photo',
            'media-education' => 'education-medias',
            'professional-communication' => 'communication-professionnelle',
        ];
        $actualTopicAliasTargets = array_map(
            static fn (array $aliasTopic): string => $aliasTopic['canonicalDomainId'],
            $fixture['domainTopics']['aliases'],
        );
        ksort($expectedTopicAliasTargets);
        ksort($actualTopicAliasTargets);
        $this->assertSame($expectedTopicAliasTargets, $actualTopicAliasTargets);

        foreach ($fixture['domainTopics']['aliases'] as $aliasTopic) {
            $this->assertSame(
                $fixture['domainTopics']['canonical'][$aliasTopic['canonicalDomainId']],
                $aliasTopic['topics'],
            );
        }
        $this->assertSame(
            [
                'gestion-equipe' => 'gestion-equipe',
                'gestion-projet' => 'gestion-projet',
            ],
            array_intersect_key($fixture['domainAliases'], [
                'gestion-equipe' => true,
                'gestion-projet' => true,
            ]),
        );
        $this->assertCount(7, $fixture['familyAliases']);
        $this->assertSame($fixture['source']['scriptSha256'], hash_file('sha256', base_path('../script.js')));
        $this->assertSame(
            $fixture['source']['guidedPathwaysSha256'],
            hash_file('sha256', base_path('../guided-pathways.js')),
        );
    }

    public function test_seeded_catalog_matches_the_verified_source_inventory(): void
    {
        $this->seedCatalog();
        $fixture = $this->sourceFixture();
        $sourceFamilyIds = array_column($fixture['families'], 'id');
        $runtimeDomainIds = [
            ...$fixture['guidedProfileIds'],
            ...array_keys($fixture['specialties']),
            'web',
        ];
        $familyTemplateSkills = array_sum(array_map(
            static fn (array $template): int => count($template[2]),
            $fixture['familyTemplates'],
        ));
        $familyTemplateCareers = array_sum(array_map(
            static fn (array $template): int => count($template[3]),
            $fixture['familyTemplates'],
        ));
        $generatedPathwaySkills = array_sum(array_map(
            static function (string $domainId) use ($fixture): int {
                $familyId = collect($fixture['domains'])->firstWhere('id', $domainId)['family'];

                return count($fixture['familyTemplates'][$familyId][2]);
            },
            $fixture['guidedProfileIds'],
        ));
        $generatedPathwayCareers = array_sum(array_map(
            static function (string $domainId) use ($fixture): int {
                $familyId = collect($fixture['domains'])->firstWhere('id', $domainId)['family'];

                return count($fixture['familyTemplates'][$familyId][3]);
            },
            $fixture['guidedProfileIds'],
        ));
        $specialtySkills = array_sum(array_map(
            static fn (array $profile): int => count($profile['skills']),
            $fixture['specialties'],
        ));
        sort($sourceFamilyIds);
        sort($runtimeDomainIds);

        $this->assertDatabaseCount('domain_families', 11);
        $this->assertDatabaseCount('source_domain_records', 250);
        $this->assertDatabaseCount('source_domain_resources', 158);
        $this->assertDatabaseCount('source_domain_id_inventory', 192);
        $this->assertDatabaseCount('runtime_domain_inventory', 101);
        $this->assertDatabaseCount('runtime_domain_inventory_sources', 174);
        $this->assertDatabaseCount('domains', 101);
        $this->assertDatabaseCount('domain_id_alias_sources', 72);
        $this->assertDatabaseCount('domain_id_aliases', 70);
        $this->assertDatabaseCount('domain_family_aliases', 7);
        $this->assertDatabaseCount('family_pathway_templates', 11);
        $this->assertDatabaseCount('family_pathway_template_content_sources', 11);
        $this->assertDatabaseCount('family_template_skills', 33);
        $this->assertDatabaseCount('family_template_career_examples', 45);
        $this->assertDatabaseCount('family_template_skills', $familyTemplateSkills);
        $this->assertDatabaseCount('family_template_career_examples', $familyTemplateCareers);
        $this->assertDatabaseCount('family_template_weeks', 44);
        $this->assertDatabaseCount('family_template_stages', 132);
        $this->assertDatabaseCount('family_template_quiz_options', 132);
        $this->assertDatabaseCount('family_template_domain_topics', 360);
        $this->assertDatabaseCount('family_template_domain_topic_alias_sources', 32);
        $this->assertDatabaseCount('pathways', 101);
        $this->assertDatabaseCount('pathway_skills', 300);
        $this->assertDatabaseCount('pathway_career_examples', 372);
        $this->assertDatabaseCount('pathway_skills', $generatedPathwaySkills + $specialtySkills);
        $this->assertDatabaseCount('pathway_career_examples', $generatedPathwayCareers);
        $this->assertDatabaseCount('pathway_weeks', 404);
        $this->assertDatabaseCount('lessons', 1132);
        $this->assertDatabaseCount('quizzes', 1132);
        $this->assertDatabaseCount('quiz_questions', 1184);
        $this->assertDatabaseCount('quiz_options', 3625);
        $this->assertDatabaseCount('resources', 233);
        $this->assertDatabaseCount('projects', 101);
        $this->assertDatabaseCount('project_checklist_items', 6);
        $this->assertDatabaseCount('content_sources', 2);
        $this->assertSame(2, DB::table('content_sources')->where('license_status', 'review_required')->count());
        $this->assertSame(2, DB::table('content_sources')->whereNotNull('revision_author_id')->count());
        $this->assertSame(
            $this->rootUuid('content_source', 'script.js'),
            DB::table('content_sources')->where('source_path', 'script.js')->value('id'),
        );
        $this->assertSame(
            $this->rootUuid('content_source', 'guided-pathways.js'),
            DB::table('content_sources')->where('source_path', 'guided-pathways.js')->value('id'),
        );
        $this->assertSame(
            $this->rootUuid('pathway', 'networks'),
            DB::table('pathways')->where('domain_id', 'networks')->value('id'),
        );
        $this->assertSame(
            $this->pathwayUuid('software', 'guided-intro-digital'),
            DB::table('pathways')->where('domain_id', 'software')->value('id'),
        );

        $this->assertSame(
            $sourceFamilyIds,
            DB::table('domain_families')->orderBy('id')->pluck('id')->all(),
        );
        $this->assertSame(
            $runtimeDomainIds,
            DB::table('domains')->orderBy('id')->pluck('id')->all(),
        );
        $this->assertSame($runtimeDomainIds, DB::table('runtime_domain_inventory')->orderBy('domain_id')->pluck('domain_id')->all());
        $sourceDomainIds = array_values(array_unique(array_column($fixture['domains'], 'id')));
        sort($sourceDomainIds);
        $storedSourceDomainIds = DB::table('source_domain_id_inventory')
            ->where('source_system', 'script.js')
            ->orderBy('source_domain_id')
            ->pluck('source_domain_id')
            ->all();
        $this->assertSame($sourceDomainIds, $storedSourceDomainIds);

        $expectedSourceRecords = [];

        foreach ($fixture['domains'] as $position => $record) {
            $expectedSourceRecords[] = [
                'source_position' => $position + 1,
                'source_domain_id' => $record['id'],
                'raw_family_id' => $record['family'],
                'record_checksum' => hash(
                    'sha256',
                    json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
                ),
            ];
        }

        $storedSourceRecords = DB::table('source_domain_records')
            ->where('source_system', 'script.js')
            ->orderBy('source_position')
            ->get(['source_position', 'source_domain_id', 'raw_family_id', 'record_checksum'])
            ->map(static fn (object $record): array => [
                'source_position' => (int) $record->source_position,
                'source_domain_id' => $record->source_domain_id,
                'raw_family_id' => $record->raw_family_id,
                'record_checksum' => $record->record_checksum,
            ])
            ->all();
        $this->assertSame($expectedSourceRecords, $storedSourceRecords);

        $sourceAliasPairs = $fixture['domainAliases'];
        ksort($sourceAliasPairs);
        $storedAliasPairs = DB::table('domain_id_alias_sources')
            ->where('source_system', 'script.js')
            ->orderBy('source_key')
            ->pluck('source_target', 'source_key')
            ->all();
        $this->assertSame($sourceAliasPairs, $storedAliasPairs);

        $resolvableAliasPairs = array_filter(
            $sourceAliasPairs,
            static fn (string $target, string $alias): bool => $alias !== $target,
            ARRAY_FILTER_USE_BOTH,
        );
        $storedResolvableAliasPairs = DB::table('domain_id_aliases')
            ->orderBy('alias')
            ->pluck('domain_id', 'alias')
            ->all();
        ksort($resolvableAliasPairs);
        $this->assertSame($resolvableAliasPairs, $storedResolvableAliasPairs);

        $expectedRuntimeSources = [];

        foreach ($fixture['domains'] as $record) {
            if (! in_array($record['family'], array_column($fixture['families'], 'id'), true)) {
                continue;
            }

            $canonicalDomainId = $fixture['domainAliases'][$record['id']] ?? $record['id'];
            $expectedRuntimeSources[] = [
                'runtime_domain_id' => $canonicalDomainId,
                'raw_family_id' => $record['family'],
                'raw_domain_id' => $record['id'],
                'applied_alias' => $record['id'] !== $canonicalDomainId ? $record['id'] : null,
            ];
        }

        $storedRuntimeSources = DB::table('runtime_domain_inventory_sources')
            ->join('source_domain_records', 'source_domain_records.id', '=', 'runtime_domain_inventory_sources.source_record_id')
            ->orderBy('source_domain_records.source_position')
            ->get([
                'runtime_domain_inventory_sources.runtime_domain_id',
                'runtime_domain_inventory_sources.raw_family_id',
                'runtime_domain_inventory_sources.raw_domain_id',
                'runtime_domain_inventory_sources.applied_alias',
            ])
            ->map(static fn (object $record): array => [
                'runtime_domain_id' => $record->runtime_domain_id,
                'raw_family_id' => $record->raw_family_id,
                'raw_domain_id' => $record->raw_domain_id,
                'applied_alias' => $record->applied_alias,
            ])
            ->all();
        $this->assertSame($expectedRuntimeSources, $storedRuntimeSources);
        $familyAliasPairs = [];

        foreach ($fixture['familyAliases'] as $familyAlias) {
            $familyAliasPairs[$familyAlias['id']] = $familyAlias['proposedFamily'];
        }

        ksort($familyAliasPairs);
        $storedFamilyAliasPairs = DB::table('domain_family_aliases')
            ->orderBy('alias')
            ->pluck('proposed_family_id', 'alias')
            ->all();
        $this->assertSame($familyAliasPairs, $storedFamilyAliasPairs);
        $this->assertSame(7, DB::table('domain_family_aliases')
            ->where('mapping_status', 'proposed')
            ->whereNull('canonical_family_id')
            ->count());

        $guidedSourceId = DB::table('content_sources')->where('source_path', 'guided-pathways.js')->value('id');
        $expectedTemplateSources = [];

        foreach ($fixture['families'] as $family) {
            $familyId = $family['id'];
            [$stableKey, $version] = $fixture['familyTemplates'][$familyId];
            $expectedTemplateSources[] = [
                'template_id' => $this->rootUuid('family_template', "{$familyId}/{$stableKey}", $version),
                'source_id' => $guidedSourceId,
                'source_path' => 'guided-pathways.js',
            ];
        }

        usort(
            $expectedTemplateSources,
            static fn (array $left, array $right): int => $left['template_id'] <=> $right['template_id'],
        );
        $actualTemplateSources = DB::table('family_pathway_template_content_sources')
            ->join(
                'family_pathway_templates',
                'family_pathway_templates.id',
                '=',
                'family_pathway_template_content_sources.family_template_id',
            )
            ->join(
                'content_sources',
                'content_sources.id',
                '=',
                'family_pathway_template_content_sources.content_source_id',
            )
            ->orderBy('family_pathway_templates.id')
            ->get([
                'family_pathway_templates.id as template_id',
                'content_sources.id as source_id',
                'content_sources.source_path',
            ])
            ->map(static fn (object $relation): array => [
                'template_id' => $relation->template_id,
                'source_id' => $relation->source_id,
                'source_path' => $relation->source_path,
            ])
            ->all();

        $this->assertSame(
            11,
            DB::table('family_pathway_template_content_sources')->distinct()->count('family_template_id'),
        );
        $this->assertSame($expectedTemplateSources, $actualTemplateSources);

        foreach ($fixture['families'] as $family) {
            $familyId = $family['id'];
            [$stableKey, $version, $skills, $careers, $projectTextTemplate, $projectTopicsSuffixTemplate, $sourceWeeks] =
                $fixture['familyTemplates'][$familyId];
            $storedTemplate = DB::table('family_pathway_templates')
                ->where('family_id', $familyId)
                ->where('stable_key', $stableKey)
                ->where('version', $version)
                ->first();

            $this->assertNotNull($storedTemplate);
            $this->assertSame('draft', $storedTemplate->status);
            $this->assertSame(
                [$guidedSourceId],
                FamilyPathwayTemplate::query()->findOrFail($storedTemplate->id)->contentSources->modelKeys(),
            );
            $this->assertSame(
                DB::table('content_sources')->where('source_path', 'guided-pathways.js')->value('source_revision'),
                $storedTemplate->source_version,
            );
            $this->assertSame($projectTextTemplate, $storedTemplate->project_text_template);
            $this->assertSame($projectTopicsSuffixTemplate, $storedTemplate->project_topics_suffix_template);
            $this->assertSame(
                $skills,
                DB::table('family_template_skills')
                    ->where('template_id', $storedTemplate->id)
                    ->orderBy('position')
                    ->pluck('label')
                    ->all(),
            );
            $this->assertSame(
                $careers,
                DB::table('family_template_career_examples')
                    ->where('template_id', $storedTemplate->id)
                    ->orderBy('position')
                    ->pluck('label')
                    ->all(),
            );

            foreach ($sourceWeeks as $sourceWeek) {
                [$weekStableKey, $weekPosition, $title, $explanation, $exercise, $quizPrompt, $options, $answerIndex, $feedback] = $sourceWeek;
                $storedWeek = DB::table('family_template_weeks')
                    ->where('template_id', $storedTemplate->id)
                    ->where('stable_key', $weekStableKey)
                    ->first();

                $this->assertNotNull($storedWeek);
                $this->assertSame($weekPosition, (int) $storedWeek->position);
                $this->assertSame($title, $storedWeek->title);
                $this->assertSame($explanation, $storedWeek->explanation);
                $this->assertSame($exercise, $storedWeek->exercise);
                $this->assertSame($quizPrompt, $storedWeek->quiz_prompt);
                $this->assertSame($answerIndex, (int) $storedWeek->source_answer_index);
                $this->assertSame($answerIndex + 1, (int) $storedWeek->correct_option_position);
                $this->assertSame($feedback, $storedWeek->feedback);
                $this->assertSame(
                    $options,
                    DB::table('family_template_quiz_options')
                        ->where('template_week_id', $storedWeek->id)
                        ->orderBy('position')
                        ->pluck('label')
                        ->all(),
                );

                foreach ($fixture['generatedStageTemplates'] as $stage) {
                    $storedStage = DB::table('family_template_stages')
                        ->where('template_week_id', $storedWeek->id)
                        ->where('stable_key', $stage['stableKey'])
                        ->first();

                    $this->assertNotNull($storedStage);
                    $this->assertSame($stage['position'], (int) $storedStage->position);
                    $this->assertSame($stage['titleTemplate'], $storedStage->stage_title_template);
                    $this->assertSame($stage['objectiveTemplate'], $storedStage->objective_template);
                    $this->assertSame($stage['exerciseTemplate'], $storedStage->exercise_template);
                    $this->assertSame($stage['quizPromptTemplate'], $storedStage->quiz_prompt_template);
                }
            }
        }

        foreach ($fixture['domainTopics']['canonical'] as $domainId => $topics) {
            $familyId = DB::table('domains')->where('id', $domainId)->value('family_id');
            $templateId = DB::table('family_pathway_templates')->where('family_id', $familyId)->value('id');

            foreach ($topics as $topicIndex => $topic) {
                $weekPosition = $topicIndex + 1;
                $storedTopic = DB::table('family_template_domain_topics')
                    ->where('template_id', $templateId)
                    ->where('domain_id', $domainId)
                    ->where('week_position', $weekPosition)
                    ->first();

                $this->assertNotNull($storedTopic);
                $this->assertSame($topic, $storedTopic->topic);
                $this->assertSame($guidedSourceId, $storedTopic->source_id);
            }
        }

        foreach ($fixture['domainTopics']['aliases'] as $sourceKey => $aliasTopic) {
            $familyId = DB::table('domains')->where('id', $aliasTopic['canonicalDomainId'])->value('family_id');
            $templateId = DB::table('family_pathway_templates')->where('family_id', $familyId)->value('id');

            foreach ($aliasTopic['topics'] as $topicIndex => $sourceTopic) {
                $weekPosition = $topicIndex + 1;
                $storedAliasTopic = DB::table('family_template_domain_topic_alias_sources')
                    ->where('template_id', $templateId)
                    ->where('source_key', $sourceKey)
                    ->where('week_position', $weekPosition)
                    ->first();

                $this->assertNotNull($storedAliasTopic);
                $this->assertSame($sourceTopic, $storedAliasTopic->source_topic);
                $this->assertSame($aliasTopic['canonicalDomainId'], $storedAliasTopic->canonical_domain_id);
                $this->assertSame('identical', $storedAliasTopic->topic_match);
                $this->assertSame($guidedSourceId, $storedAliasTopic->source_id);
                $canonicalTopic = DB::table('family_template_domain_topics')
                    ->where('id', $storedAliasTopic->canonical_topic_id)
                    ->first();
                $this->assertNotNull($canonicalTopic);
                $this->assertSame($sourceTopic, $canonicalTopic->topic);
            }
        }

        $this->assertSame(0, DB::table('domains')->where('availability', 'published')->count());
        $this->assertSame(101, DB::table('domains')->where('availability', 'preparing')->count());
        $this->assertSame(0, DB::table('pathways')->where('status', 'published')->count());
        $this->assertSame(101, DB::table('pathways')->where('status', 'draft')->count());
        $this->assertSame(0, DB::table('quizzes')->where('status', 'published')->count());
        $this->assertSame(1132, DB::table('quizzes')->where('status', 'draft')->count());
        $this->assertSame(0, DB::table('projects')->where('status', 'published')->count());
        $this->assertSame(101, DB::table('projects')->where('status', 'draft')->count());
        $this->assertSame(11, DB::table('projects')
            ->join('pathways', 'pathways.id', '=', 'projects.pathway_id')
            ->whereIn('pathways.domain_id', [...self::SPECIALTY_DOMAIN_IDS, 'web'])
            ->count());
        $this->assertSame(90, DB::table('projects')
            ->join('pathways', 'pathways.id', '=', 'projects.pathway_id')
            ->whereNotNull('pathways.family_template_id')
            ->count());
        $this->assertSame(191, DB::table('domain_content_sources')->count());
        $this->assertSame(191, DB::table('pathway_content_sources')->count());
        $this->assertSame(2212, DB::table('lesson_content_sources')->count());
        $this->assertSame(2212, DB::table('quiz_content_sources')->count());
        $this->assertSame(76, DB::table('source_domain_records')
            ->where('family_resolution', 'quarantined')
            ->whereNull('canonical_family_id')
            ->whereNull('canonical_domain_id')
            ->count());
        $this->assertSame(174, DB::table('source_domain_records')
            ->where('family_resolution', 'active_raw')
            ->whereNotNull('canonical_family_id')
            ->whereNotNull('canonical_domain_id')
            ->count());
        $this->assertSame(0, DB::table('runtime_domain_inventory_sources')
            ->whereIn('raw_family_id', array_keys(self::QUARANTINED_FAMILY_COUNTS))
            ->count());
        $this->assertSame(0, DB::table('source_domain_records')
            ->whereIn('raw_family_id', array_keys(self::QUARANTINED_FAMILY_COUNTS))
            ->whereNotNull('canonical_family_id')
            ->count());
        $this->assertSame(0, DB::table('domains')
            ->whereIn('family_id', array_keys(self::QUARANTINED_FAMILY_COUNTS))
            ->count());
        $this->assertSame(0, DB::table('pathways')
            ->join('domains', 'domains.id', '=', 'pathways.domain_id')
            ->whereIn('domains.family_id', array_keys(self::QUARANTINED_FAMILY_COUNTS))
            ->count());
        $this->assertSame(233, DB::table('resources')
            ->where('status', 'draft')
            ->where('verification_status', 'unverified')
            ->count());

        foreach (self::SPECIALTY_DOMAIN_IDS as $domainId) {
            $pathwayId = DB::table('pathways')->where('domain_id', $domainId)->value('id');
            $profile = $fixture['specialties'][$domainId];

            $this->assertNotNull($pathwayId);
            $this->assertSame(4, DB::table('pathway_weeks')->where('pathway_id', $pathwayId)->count());
            $this->assertSame(4, DB::table('lessons')
                ->whereIn('week_id', DB::table('pathway_weeks')->select('id')->where('pathway_id', $pathwayId))
                ->count());
            $this->assertSame(4, DB::table('quizzes')
                ->whereIn('lesson_id', DB::table('lessons')
                    ->select('lessons.id')
                    ->join('pathway_weeks', 'pathway_weeks.id', '=', 'lessons.week_id')
                    ->where('pathway_weeks.pathway_id', $pathwayId))
                ->count());
            $this->assertSame(8, DB::table('quiz_questions')
                ->whereIn('quiz_id', DB::table('quizzes')
                    ->select('quizzes.id')
                    ->join('lessons', 'lessons.id', '=', 'quizzes.lesson_id')
                    ->join('pathway_weeks', 'pathway_weeks.id', '=', 'lessons.week_id')
                    ->where('pathway_weeks.pathway_id', $pathwayId))
                ->count());

            foreach ($profile['weeks'] as $weekIndex => $sourceWeek) {
                $weekPosition = $weekIndex + 1;
                $storedWeek = DB::table('pathway_weeks')
                    ->where('pathway_id', $pathwayId)
                    ->where('stable_key', 'week-'.$weekPosition)
                    ->first();

                $this->assertNotNull($storedWeek);
                $this->assertSame($sourceWeek['title'], $storedWeek->title);

                foreach ($sourceWeek['sessions'] as $sessionIndex => $sourceSession) {
                    $lessonStableKey = "{$domainId}-week-{$weekPosition}-session-".($sessionIndex + 1);
                    $storedLesson = DB::table('lessons')
                        ->where('week_id', $storedWeek->id)
                        ->where('stable_key', $lessonStableKey)
                        ->first();

                    $this->assertNotNull($storedLesson);
                    $this->assertSame($sourceSession['title'], $storedLesson->title);
                    $this->assertSame($sourceSession['objective'], $storedLesson->objective);
                    $this->assertSame($sourceSession['explanation'], $storedLesson->explanation);
                    $this->assertSame($sourceSession['exercise'], $storedLesson->activity);
                    $storedQuiz = DB::table('quizzes')->where('lesson_id', $storedLesson->id)->first();
                    $this->assertNotNull($storedQuiz);
                    $this->assertSame('draft', $storedQuiz->status);

                    foreach ($sourceSession['quiz'] as $questionIndex => $sourceQuestion) {
                        $questionStableKey = 'question-'.($questionIndex + 1);
                        $storedQuestion = DB::table('quiz_questions')
                            ->where('quiz_id', $storedQuiz->id)
                            ->where('stable_key', $questionStableKey)
                            ->first();

                        $this->assertNotNull($storedQuestion);
                        $this->assertSame($sourceQuestion['question'], $storedQuestion->prompt);
                        $this->assertSame($sourceQuestion['explanation'], $storedQuestion->explanation);
                        $storedOptions = DB::table('quiz_options')
                            ->where('question_id', $storedQuestion->id)
                            ->orderBy('position')
                            ->get();
                        $this->assertSame($sourceQuestion['options'], $storedOptions->pluck('label')->all());
                        $this->assertSame(
                            $sourceQuestion['answer'],
                            $storedOptions->search(static fn (object $option): bool => (bool) $option->is_correct),
                        );
                    }
                }
            }

            $specialtyProject = DB::table('projects')->where('pathway_id', $pathwayId)->first();
            $this->assertNotNull($specialtyProject);
            $this->assertSame($profile['project'], $specialtyProject->instructions);
            $this->assertSame('draft', $specialtyProject->status);
        }

        foreach ($fixture['webModules'] as $module) {
            $webPathwayId = DB::table('pathways')->where('domain_id', 'web')->value('id');

            foreach ($module['lessons'] as $lesson) {
                $storedLesson = DB::table('lessons')->where('stable_key', $lesson['id'])->first();
                $this->assertNotNull($storedLesson);
                $this->assertSame($lesson['title'], $storedLesson->title);
                $this->assertSame($lesson['objective'], $storedLesson->objective);
                $this->assertSame($lesson['explanation'], $storedLesson->explanation);
                $this->assertSame($lesson['activity'], $storedLesson->activity);
                $webQuiz = DB::table('quizzes')->where('lesson_id', $storedLesson->id)->first();
                $this->assertNotNull($webQuiz);

                foreach ($lesson['quiz'] as $questionIndex => $sourceQuestion) {
                    $storedQuestion = DB::table('quiz_questions')
                        ->where('quiz_id', $webQuiz->id)
                        ->where('stable_key', 'question-'.($questionIndex + 1))
                        ->first();
                    $this->assertNotNull($storedQuestion);
                    $this->assertSame($sourceQuestion['question'], $storedQuestion->prompt);
                    $this->assertSame($sourceQuestion['explanation'], $storedQuestion->explanation);
                    $storedOptions = DB::table('quiz_options')
                        ->where('question_id', $storedQuestion->id)
                        ->orderBy('position')
                        ->get();
                    $this->assertSame($sourceQuestion['options'], $storedOptions->pluck('label')->all());
                    $this->assertSame(
                        $sourceQuestion['answer'],
                        $storedOptions->search(static fn (object $option): bool => (bool) $option->is_correct),
                    );
                }
            }

            $webProject = DB::table('projects')->where('pathway_id', $webPathwayId)->first();
            $this->assertNotNull($webProject);
            $this->assertSame($fixture['webProject'], $webProject->instructions);
        }

        foreach ($fixture['guidedProfileIds'] as $domainId) {
            $pathwayId = DB::table('pathways')->where('domain_id', $domainId)->value('id');
            $lessonIds = DB::table('lessons')
                ->select('lessons.id')
                ->join('pathway_weeks', 'pathway_weeks.id', '=', 'lessons.week_id')
                ->where('pathway_weeks.pathway_id', $pathwayId);

            $this->assertNotNull($pathwayId);
            $this->assertSame('draft', DB::table('pathways')->where('id', $pathwayId)->value('status'));
            $this->assertSame(4, DB::table('pathway_weeks')->where('pathway_id', $pathwayId)->count());
            $this->assertSame(12, (clone $lessonIds)->count());
            $quizIds = DB::table('quizzes')->select('id')->whereIn('lesson_id', $lessonIds);
            $this->assertSame(12, DB::table('quizzes')->whereIn('lesson_id', $lessonIds)->count());
            $this->assertSame(12, DB::table('quiz_questions')->whereIn('quiz_id', $quizIds)->count());
            $this->assertSame(36, DB::table('quiz_options')
                ->whereIn('question_id', DB::table('quiz_questions')->select('id')->whereIn('quiz_id', $quizIds))
                ->count());

            $pathway = DB::table('pathways')->where('id', $pathwayId)->first();
            $familyId = DB::table('domains')->where('id', $domainId)->value('family_id');
            $template = $fixture['familyTemplates'][$familyId];
            $topics = $fixture['domainTopics']['canonical'][$domainId];
            $expectedDescription = DB::table('domains')->where('id', $domainId)->value('summary');
            $expectedBaseDescription = $expectedDescription !== ''
                ? $expectedDescription
                : "Découvrir {$pathway->title}.";
            $expectedOverview = $expectedDescription !== ''
                ? $expectedDescription
                : "Découvrir les bases de {$pathway->title}.";
            $expectedFullDescription = $expectedBaseDescription
                .' Ce parcours de quatre semaines suit une méthode adaptée à cette famille. Il propose des exercices d’initiation et ne remplace pas une qualification professionnelle.';
            $this->assertSame($expectedFullDescription, $pathway->description);
            $this->assertSame($expectedOverview, $pathway->overview);
            $familyName = collect($fixture['families'])->firstWhere('id', $familyId)['name'];
            $this->assertSame($familyName.' · PARCOURS D’INITIATION', $pathway->eyebrow);
            $this->assertSame('Environ 2 h 35 par semaine · 4 semaines · 12 cours', $pathway->weekly_time);
            $this->assertSame(
                [
                    'Aucun prérequis spécialisé pour cette initiation.',
                    'Curiosité et respect des règles propres au domaine.',
                ],
                json_decode($pathway->prerequisites, true, 512, JSON_THROW_ON_ERROR),
            );
            $this->assertSame(
                [
                    'Papier et stylo ou un appareil connecté.',
                    'Aucun équipement spécialisé requis pour les activités proposées.',
                ],
                json_decode($pathway->equipment, true, 512, JSON_THROW_ON_ERROR),
            );
            $this->assertSame($fixture['pathwaySafetyNotes'][$familyId] ?? '', $pathway->safety_note);
            $this->assertSame(1, (int) $pathway->family_template_version);
            $this->assertSame(64, strlen($pathway->generation_key));
            $this->assertSame(64, strlen($pathway->generation_checksum));
            $this->assertSame($template[2], DB::table('pathway_skills')
                ->where('pathway_id', $pathwayId)
                ->orderBy('position')
                ->pluck('label')
                ->all());
            $this->assertSame($template[3], DB::table('pathway_career_examples')
                ->where('pathway_id', $pathwayId)
                ->orderBy('position')
                ->pluck('label')
                ->all());

            $storedTopics = DB::table('pathway_generation_topics')
                ->where('pathway_id', $pathwayId)
                ->orderBy('week_position')
                ->get();
            $this->assertSame($topics, $storedTopics->pluck('topic')->all());
            $this->assertSame(['domain_override', 'domain_override', 'domain_override', 'domain_override'], $storedTopics->pluck('topic_source')->all());
            $this->assertSame(
                array_fill(0, 4, DB::table('content_sources')->where('source_path', 'guided-pathways.js')->value('id')),
                $storedTopics->pluck('source_id')->all(),
            );

            foreach ($template[6] as $weekIndex => $sourceWeek) {
                [$weekStableKey, $weekPosition, $weekTitle, $weekExplanation, $weekExercise, , $weekOptions, $answerIndex, $feedback] = $sourceWeek;
                $storedWeek = DB::table('pathway_weeks')
                    ->where('pathway_id', $pathwayId)
                    ->where('stable_key', $weekStableKey)
                    ->first();

                $this->assertNotNull($storedWeek);
                $this->assertSame($weekPosition, (int) $storedWeek->position);
                $this->assertSame($topics[$weekIndex], $storedWeek->title);
                $storedLessons = DB::table('lessons')
                    ->where('week_id', $storedWeek->id)
                    ->orderBy('position')
                    ->get();
                $this->assertCount(3, $storedLessons);

                foreach ($fixture['generatedStageTemplates'] as $stageIndex => $stage) {
                    $storedLesson = $storedLessons[$stageIndex];
                    $replacements = [
                        '{topic}' => $topics[$weekIndex],
                        '{domain_name}' => $pathway->title,
                        '{week_explanation}' => $weekExplanation,
                        '{week_exercise}' => $weekExercise,
                    ];
                    $expectedSessionTitle = $this->renderSourceTemplate($stage['titleTemplate'], $replacements);
                    $expectedObjective = $this->renderSourceTemplate($stage['objectiveTemplate'], $replacements);
                    $expectedExercise = $this->renderSourceTemplate($stage['exerciseTemplate'], $replacements);
                    $expectedQuizPrompt = $this->renderSourceTemplate($stage['quizPromptTemplate'], $replacements);
                    $expectedExplanation = $weekExplanation
                        .' Cette séance porte sur « '.$topics[$weekIndex].' » en '.$pathway->title.'. Vérifie les règles et informations propres à ton pays ou à ton contexte si nécessaire.';

                    $this->assertSame('stage-'.($stageIndex + 1), $storedLesson->stable_key);
                    $this->assertSame($expectedSessionTitle, $storedLesson->title);
                    $this->assertSame($expectedObjective, $storedLesson->objective);
                    $this->assertSame($expectedExplanation, $storedLesson->explanation);
                    $this->assertSame($expectedExercise, $storedLesson->activity);

                    $storedQuiz = DB::table('quizzes')->where('lesson_id', $storedLesson->id)->first();
                    $this->assertNotNull($storedQuiz);
                    $storedQuestion = DB::table('quiz_questions')->where('quiz_id', $storedQuiz->id)->first();
                    $this->assertNotNull($storedQuestion);
                    $storedOptions = DB::table('quiz_options')
                        ->where('question_id', $storedQuestion->id)
                        ->orderBy('position')
                        ->get();
                    $this->assertSame('draft', $storedQuiz->status);
                    $this->assertSame($expectedQuizPrompt, $storedQuestion->prompt);
                    $this->assertSame($feedback, $storedQuestion->explanation);
                    $this->assertSame($weekOptions, $storedOptions->pluck('label')->all());
                    $this->assertSame($answerIndex, $storedOptions->search(
                        static fn (object $option): bool => (bool) $option->is_correct,
                    ));
                }
            }

            $expectedProjectInstructions = $this->renderSourceTemplate(
                $template[4],
                ['{domain_name}' => $pathway->title],
            ).$this->renderSourceTemplate(
                $template[5],
                ['{topics}' => implode(' ; ', $topics)],
            );
            $project = DB::table('projects')->where('pathway_id', $pathwayId)->first();
            $this->assertNotNull($project);
            $this->assertSame($expectedProjectInstructions, $project->instructions);
            $this->assertSame('draft', $project->status);
        }

        $this->assertSame(90, DB::table('pathways')->whereNotNull('family_template_id')->count());
        $this->assertSame(360, DB::table('pathway_generation_topics')->count());
        $this->assertSame(11, DB::table('family_pathway_templates')->where('version', 1)->where('status', 'draft')->count());

        $webPathwayId = DB::table('pathways')->where('domain_id', 'web')->value('id');
        $webLessonIds = DB::table('lessons')
            ->select('lessons.id')
            ->join('pathway_weeks', 'pathway_weeks.id', '=', 'lessons.week_id')
            ->where('pathway_weeks.pathway_id', $webPathwayId);

        $this->assertSame(4, DB::table('pathway_weeks')->where('pathway_id', $webPathwayId)->count());
        $this->assertSame(12, (clone $webLessonIds)->count());
        $this->assertSame(12, DB::table('quizzes')->whereIn('lesson_id', $webLessonIds)->count());
        $this->assertSame(24, DB::table('quiz_questions')
            ->whereIn('quiz_id', DB::table('quizzes')->select('id')->whereIn('lesson_id', $webLessonIds))
            ->count());
    }

    public function test_running_the_seed_twice_is_idempotent_and_preserves_learner_data(): void
    {
        $this->seedCatalog();
        $learner = User::factory()->create();
        $learnerAttributes = $learner->getAttributes();
        $learnerAttributes['deleted_at'] = null;
        ksort($learnerAttributes);
        $pathwayId = DB::table('pathways')->where('domain_id', 'networks')->value('id');
        $this->assertNotNull($pathwayId);
        DB::table('pathways')->where('id', $pathwayId)->update(['description' => 'Existing editorial change']);

        $before = [
            'families' => DB::table('domain_families')->count(),
            'domains' => DB::table('domains')->count(),
            'domainAliases' => DB::table('domain_id_aliases')->count(),
            'domainAliasSources' => DB::table('domain_id_alias_sources')->count(),
            'familyAliases' => DB::table('domain_family_aliases')->count(),
            'sourceRecords' => DB::table('source_domain_records')->count(),
            'sourceResources' => DB::table('source_domain_resources')->count(),
            'sourceDomainIds' => DB::table('source_domain_id_inventory')->count(),
            'runtimeDomains' => DB::table('runtime_domain_inventory')->count(),
            'runtimeSources' => DB::table('runtime_domain_inventory_sources')->count(),
            'templates' => DB::table('family_pathway_templates')->count(),
            'templateSkills' => DB::table('family_template_skills')->count(),
            'templateCareers' => DB::table('family_template_career_examples')->count(),
            'templateWeeks' => DB::table('family_template_weeks')->count(),
            'templateOptions' => DB::table('family_template_quiz_options')->count(),
            'templateStages' => DB::table('family_template_stages')->count(),
            'templateTopics' => DB::table('family_template_domain_topics')->count(),
            'templateAliases' => DB::table('family_template_domain_topic_alias_sources')->count(),
            'pathways' => DB::table('pathways')->count(),
            'pathwaySkills' => DB::table('pathway_skills')->count(),
            'pathwayCareers' => DB::table('pathway_career_examples')->count(),
            'generationTopics' => DB::table('pathway_generation_topics')->count(),
            'weeks' => DB::table('pathway_weeks')->count(),
            'lessons' => DB::table('lessons')->count(),
            'quizzes' => DB::table('quizzes')->count(),
            'questions' => DB::table('quiz_questions')->count(),
            'options' => DB::table('quiz_options')->count(),
            'resources' => DB::table('resources')->count(),
            'projects' => DB::table('projects')->count(),
            'domainSources' => DB::table('domain_content_sources')->count(),
            'pathwaySources' => DB::table('pathway_content_sources')->count(),
            'lessonSources' => DB::table('lesson_content_sources')->count(),
            'quizSources' => DB::table('quiz_content_sources')->count(),
            'templateSources' => DB::table('family_pathway_template_content_sources')
                ->orderBy('family_template_id')
                ->get(['family_template_id', 'content_source_id'])
                ->map(static fn (object $relation): array => [
                    $relation->family_template_id,
                    $relation->content_source_id,
                ])
                ->all(),
        ];

        $this->seedCatalog();
        $this->seedCatalog();

        $after = [
            'families' => DB::table('domain_families')->count(),
            'domains' => DB::table('domains')->count(),
            'domainAliases' => DB::table('domain_id_aliases')->count(),
            'domainAliasSources' => DB::table('domain_id_alias_sources')->count(),
            'familyAliases' => DB::table('domain_family_aliases')->count(),
            'sourceRecords' => DB::table('source_domain_records')->count(),
            'sourceResources' => DB::table('source_domain_resources')->count(),
            'sourceDomainIds' => DB::table('source_domain_id_inventory')->count(),
            'runtimeDomains' => DB::table('runtime_domain_inventory')->count(),
            'runtimeSources' => DB::table('runtime_domain_inventory_sources')->count(),
            'templates' => DB::table('family_pathway_templates')->count(),
            'templateSkills' => DB::table('family_template_skills')->count(),
            'templateCareers' => DB::table('family_template_career_examples')->count(),
            'templateWeeks' => DB::table('family_template_weeks')->count(),
            'templateOptions' => DB::table('family_template_quiz_options')->count(),
            'templateStages' => DB::table('family_template_stages')->count(),
            'templateTopics' => DB::table('family_template_domain_topics')->count(),
            'templateAliases' => DB::table('family_template_domain_topic_alias_sources')->count(),
            'pathways' => DB::table('pathways')->count(),
            'pathwaySkills' => DB::table('pathway_skills')->count(),
            'pathwayCareers' => DB::table('pathway_career_examples')->count(),
            'generationTopics' => DB::table('pathway_generation_topics')->count(),
            'weeks' => DB::table('pathway_weeks')->count(),
            'lessons' => DB::table('lessons')->count(),
            'quizzes' => DB::table('quizzes')->count(),
            'questions' => DB::table('quiz_questions')->count(),
            'options' => DB::table('quiz_options')->count(),
            'resources' => DB::table('resources')->count(),
            'projects' => DB::table('projects')->count(),
            'domainSources' => DB::table('domain_content_sources')->count(),
            'pathwaySources' => DB::table('pathway_content_sources')->count(),
            'lessonSources' => DB::table('lesson_content_sources')->count(),
            'quizSources' => DB::table('quiz_content_sources')->count(),
            'templateSources' => DB::table('family_pathway_template_content_sources')
                ->orderBy('family_template_id')
                ->get(['family_template_id', 'content_source_id'])
                ->map(static fn (object $relation): array => [
                    $relation->family_template_id,
                    $relation->content_source_id,
                ])
                ->all(),
        ];

        $this->assertSame($before, $after);
        $this->assertCount(11, $after['templateSources']);
        $this->assertSame(
            11,
            DB::table('family_pathway_template_content_sources')->distinct()->count('family_template_id'),
        );
        $this->assertSame(
            'Existing editorial change',
            DB::table('pathways')->where('id', $pathwayId)->value('description'),
        );
        $refreshedLearnerAttributes = $learner->refresh()->getAttributes();
        ksort($refreshedLearnerAttributes);
        $this->assertSame($learnerAttributes, $refreshedLearnerAttributes);
    }

    public function test_quiz_feedback_options_and_private_corrections_match_the_source(): void
    {
        $this->seedCatalog();
        $fixture = $this->sourceFixture();
        $sourceQuestion = $fixture['specialties']['networks']['weeks'][0]['sessions'][0]['quiz'][0];
        $storedQuestion = DB::table('quiz_questions')
            ->join('quizzes', 'quizzes.id', '=', 'quiz_questions.quiz_id')
            ->join('lessons', 'lessons.id', '=', 'quizzes.lesson_id')
            ->where('lessons.stable_key', 'networks-week-1-session-1')
            ->where('quiz_questions.stable_key', 'question-1')
            ->select('quiz_questions.*')
            ->first();

        $this->assertNotNull($storedQuestion);
        $this->assertSame($sourceQuestion['question'], $storedQuestion->prompt);
        $this->assertSame($sourceQuestion['explanation'], $storedQuestion->explanation);

        $storedOptions = DB::table('quiz_options')
            ->where('question_id', $storedQuestion->id)
            ->orderBy('position')
            ->get();

        $this->assertSame($sourceQuestion['options'], $storedOptions->pluck('label')->all());
        $this->assertSame(
            $sourceQuestion['answer'],
            $storedOptions->search(static fn (object $option): bool => (bool) $option->is_correct),
        );
        $this->assertSame(1184, DB::table('quiz_options')->where('is_correct', true)->count());
        $invalidQuestions = DB::table('quiz_questions')
            ->leftJoin('quiz_options', 'quiz_options.question_id', '=', 'quiz_questions.id')
            ->groupBy('quiz_questions.id')
            ->havingRaw('COUNT(quiz_options.id) < 2')
            ->orHavingRaw('SUM(CASE WHEN quiz_options.is_correct THEN 1 ELSE 0 END) <> 1')
            ->get();

        $this->assertCount(0, $invalidQuestions);

        $publicOptionProjection = DB::table('quiz_options')
            ->select(['id', 'stable_key', 'position', 'label'])
            ->first();

        $this->assertArrayNotHasKey('is_correct', (array) $publicOptionProjection);
        $this->assertArrayNotHasKey('answer', (array) $storedQuestion);

        $softwarePathwayId = DB::table('pathways')->where('domain_id', 'software')->value('id');
        $softwareGeneratedQuestion = DB::table('quiz_questions')
            ->join('quizzes', 'quizzes.id', '=', 'quiz_questions.quiz_id')
            ->join('lessons', 'lessons.id', '=', 'quizzes.lesson_id')
            ->join('pathway_weeks', 'pathway_weeks.id', '=', 'lessons.week_id')
            ->where('pathway_weeks.pathway_id', $softwarePathwayId)
            ->where('pathway_weeks.stable_key', 'week-1')
            ->where('lessons.stable_key', 'stage-1')
            ->where('quiz_questions.stable_key', 'question-1')
            ->select('quiz_questions.*')
            ->first();
        $softwareFamilyId = DB::table('domains')->where('id', 'software')->value('family_id');
        $softwareTemplateWeek = $fixture['familyTemplates'][$softwareFamilyId][6][0];
        $softwareStage = $fixture['generatedStageTemplates'][0];
        $softwareTopic = $fixture['domainTopics']['canonical']['software'][0];
        $softwareDomainName = DB::table('domains')->where('id', 'software')->value('name');

        $this->assertNotNull($softwareGeneratedQuestion);
        $this->assertSame(
            $this->renderSourceTemplate($softwareStage['quizPromptTemplate'], [
                '{topic}' => $softwareTopic,
                '{domain_name}' => $softwareDomainName,
                '{week_explanation}' => $softwareTemplateWeek[3],
                '{week_exercise}' => $softwareTemplateWeek[4],
            ]),
            $softwareGeneratedQuestion->prompt,
        );
        $this->assertSame($softwareTemplateWeek[8], $softwareGeneratedQuestion->explanation);
    }

    public function test_seeder_fails_closed_when_contract_migrations_or_source_fixture_are_missing(): void
    {
        $missingTables = array_values(array_filter(
            [
                'source_domain_records',
                'source_domain_id_inventory',
                'runtime_domain_inventory',
                'domain_id_alias_sources',
                'domain_family_aliases',
                'family_pathway_templates',
                'pathway_skills',
                'pathway_career_examples',
                'domain_content_sources',
                'pathway_content_sources',
                'lesson_content_sources',
                'quiz_content_sources',
                'family_pathway_template_content_sources',
            ],
            static fn (string $table): bool => ! Schema::hasTable($table),
        ));

        if (Schema::hasTable('content_sources') && ! Schema::hasColumn('content_sources', 'revision_author_id')) {
            $missingTables[] = 'content_sources.revision_author_id';
        }

        if ($missingTables === []) {
            $fixture = $this->sourceFixture();

            if (! isset($fixture['familyTemplates'], $fixture['domainTopics'])) {
                $this->expectException(RuntimeException::class);
                $this->expectExceptionMessage('family templates and BesaDomainTracks observations');

                $this->seedCatalog();

                return;
            }
        }

        if ($missingTables === []) {
            $this->seedCatalog();

            $this->assertDatabaseCount('family_pathway_templates', 11);

            return;
        }

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage($missingTables[0]);

        $this->seed(ContentCatalogSeeder::class);
    }

    private function seedCatalog(): void
    {
        if ($this->fixtureRevisionAuthorId === null) {
            $author = User::factory()->create();

            DB::table('roles')->insertOrIgnore([
                'code' => 'content_editor',
                'description' => 'Fixture editor for content migration tests.',
            ]);
            DB::table('user_role_assignments')->insertOrIgnore([
                'user_id' => $author->id,
                'role_code' => 'content_editor',
                'granted_by' => $author->id,
                'granted_at' => now(),
                'revoked_at' => null,
            ]);

            $this->fixtureRevisionAuthorId = $author->id;
            putenv('CONTENT_REVISION_AUTHOR_ID='.$author->id);
        }

        $this->seed(ContentCatalogSeeder::class);
    }

    /**
     * @param  array<string, string>  $replacements
     */
    private function renderSourceTemplate(string $template, array $replacements): string
    {
        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }

    private function rootUuid(string $entityType, string $canonicalSourceKey, int $version = 1): string
    {
        $name = implode('/', [
            'urn:librescence:content:v1',
            rawurlencode($entityType),
            rawurlencode($canonicalSourceKey),
            'v'.$version,
        ]);

        return Uuid::uuid5(Uuid::fromString('6ba7b811-9dad-11d1-80b4-00c04fd430c8'), $name)->toString();
    }

    private function pathwayUuid(string $domainId, string $stableKey, int $version = 1): string
    {
        $name = implode('/', [
            'urn:librescence:content:v1',
            'pathway',
            rawurlencode($domainId),
            rawurlencode($stableKey),
            'v'.$version,
        ]);

        return Uuid::uuid5(Uuid::fromString('6ba7b811-9dad-11d1-80b4-00c04fd430c8'), $name)->toString();
    }

    /**
     * @return array<string, mixed>
     */
    private function sourceFixture(): array
    {
        $contents = file_get_contents(database_path('seeders/content/source-content.json'));

        $this->assertNotFalse($contents);

        return json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }
}
