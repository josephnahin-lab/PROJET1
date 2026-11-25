<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Ramsey\Uuid\Uuid;
use RuntimeException;

class ContentCatalogSeeder extends Seeder
{
    /**
     * Detailed source curricula retained in draft until separate editorial publication.
     *
     * @var list<string>
     */
    private const DETAILED_DOMAIN_IDS = [
        'web',
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

    private const UUID_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

    /**
     * @var array<string, mixed>
     */
    private array $fixture = [];

    /**
     * @var array<string, string>
     */
    private array $sourceIds = [];

    /**
     * @var array<string, string>
     */
    private array $templateIds = [];

    /**
     * @var array<string, string>
     */
    private array $templateTopicIds = [];

    private string $revisionAuthorId;

    public function run(): void
    {
        $this->assertContractTablesExist();
        $this->fixture = $this->loadFixture();
        $this->revisionAuthorId = $this->revisionAuthorId();

        DB::transaction(function (): void {
            $timestamp = now();

            $this->seedContentSources($timestamp);
            $this->seedFamilies($timestamp);
            $this->seedDomains($timestamp);
            $this->seedSourceDomainInventory($timestamp);
            $this->seedDomainAliases($timestamp);
            $this->seedDomainFamilyAliases($timestamp);
            $this->seedRuntimeInventory($timestamp);
            $this->seedFamilyTemplates($timestamp);
            $this->seedDetailedPathways($timestamp);
            $this->seedGeneratedPathways($timestamp);
        });
    }

    private function assertContractTablesExist(): void
    {
        $requiredTables = [
            'domain_families',
            'domains',
            'content_sources',
            'roles',
            'user_role_assignments',
            'source_domain_id_inventory',
            'source_domain_records',
            'source_domain_resources',
            'domain_id_aliases',
            'domain_id_alias_sources',
            'domain_family_aliases',
            'runtime_domain_inventory',
            'runtime_domain_inventory_sources',
            'domain_content_sources',
            'pathway_content_sources',
            'lesson_content_sources',
            'quiz_content_sources',
            'content_audit_events',
            'content_audit_event_sources',
            'pathways',
            'pathway_skills',
            'pathway_career_examples',
            'pathway_weeks',
            'lessons',
            'quizzes',
            'quiz_questions',
            'quiz_options',
            'projects',
            'project_checklist_items',
            'resources',
            'family_pathway_templates',
            'family_pathway_template_content_sources',
            'family_template_skills',
            'family_template_career_examples',
            'family_template_weeks',
            'family_template_quiz_options',
            'family_template_stages',
            'family_template_domain_topics',
            'family_template_domain_topic_alias_sources',
            'pathway_generation_topics',
        ];

        $missingTables = array_values(array_filter(
            $requiredTables,
            static fn (string $table): bool => ! Schema::hasTable($table),
        ));

        if ($missingTables !== []) {
            throw new RuntimeException(
                'The content seeder requires contract tables not present in the API migrations: '
                .implode(', ', $missingTables).'.',
            );
        }

        if (! Schema::hasColumn('content_sources', 'revision_author_id')) {
            throw new RuntimeException(
                'The content_sources contract migration must record revision_author_id before content can be imported.',
            );
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function loadFixture(): array
    {
        $fixturePath = __DIR__.'/content/source-content.json';
        $contents = file_get_contents($fixturePath);

        if ($contents === false) {
            throw new RuntimeException("Unable to read content fixture at [{$fixturePath}].");
        }

        $fixture = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);

        if (! is_array($fixture)
            || ! isset(
                $fixture['families'],
                $fixture['domains'],
                $fixture['domainAliases'],
                $fixture['familyAliases'],
                $fixture['pathwaySafetyNotes'],
                $fixture['webProject'],
                $fixture['specialties'],
                $fixture['webModules'],
                $fixture['source'],
            )) {
            throw new RuntimeException('The content fixture is incomplete.');
        }

        foreach (['scriptPath', 'scriptSha256', 'guidedPathwaysPath', 'guidedPathwaysSha256'] as $sourceProperty) {
            if (! isset($fixture['source'][$sourceProperty])) {
                throw new RuntimeException("The content fixture is missing source metadata [{$sourceProperty}].");
            }
        }

        foreach (['scriptPath', 'guidedPathwaysPath'] as $pathProperty) {
            $sourcePath = base_path('../'.$fixture['source'][$pathProperty]);
            $checksumProperty = $pathProperty === 'scriptPath' ? 'scriptSha256' : 'guidedPathwaysSha256';
            $actualChecksum = hash_file('sha256', $sourcePath);

            if ($actualChecksum === false || $actualChecksum !== $fixture['source'][$checksumProperty]) {
                throw new RuntimeException("The content fixture checksum does not match source [{$sourcePath}].");
            }
        }

        $rawDomainIds = array_unique(array_column($fixture['domains'], 'id'));
        $historicalFamilies = array_fill_keys(array_column($fixture['familyAliases'], 'id'), true);
        $historicalOccurrences = count(array_filter(
            $fixture['domains'],
            static fn (array $domain): bool => isset($historicalFamilies[$domain['family']]),
        ));
        $activeFamilies = array_fill_keys(array_column($fixture['families'], 'id'), true);
        $runtimeDomainIds = [];

        foreach ($fixture['domains'] as $domain) {
            if (isset($activeFamilies[$domain['family']])) {
                $runtimeDomainIds[] = $fixture['domainAliases'][$domain['id']] ?? $domain['id'];
            }
        }

        $runtimeDomainIds = array_values(array_unique($runtimeDomainIds));
        $expectedRuntimeDomainIds = [
            ...$fixture['guidedProfileIds'],
            ...array_keys($fixture['specialties']),
            'web',
        ];
        sort($runtimeDomainIds);
        sort($expectedRuntimeDomainIds);
        $identityAliases = array_filter(
            $fixture['domainAliases'],
            static fn (string $target, string $alias): bool => $alias === $target,
            ARRAY_FILTER_USE_BOTH,
        );

        if (count($fixture['domains']) !== 250
            || count($rawDomainIds) !== 192
            || $historicalOccurrences !== 76
            || count($fixture['domainAliases']) !== 72
            || count($runtimeDomainIds) !== 101
            || $runtimeDomainIds !== $expectedRuntimeDomainIds
            || $identityAliases !== [
                'gestion-equipe' => 'gestion-equipe',
                'gestion-projet' => 'gestion-projet',
            ]) {
            throw new RuntimeException('The source inventory does not match the reviewed 250/192/76/72 manifest.');
        }

        if (! isset($fixture['familyTemplates'], $fixture['domainTopics'])) {
            throw new RuntimeException(
                'The content fixture does not yet include the source family templates and BesaDomainTracks observations.',
            );
        }

        $canonicalTopics = $fixture['domainTopics']['canonical'] ?? [];
        $aliasTopics = $fixture['domainTopics']['aliases'] ?? [];
        $guidedDomainIds = $fixture['guidedProfileIds'];
        $canonicalTopicIds = array_keys($canonicalTopics);
        $expectedAliasTargets = [
            'social-entrepreneurship' => 'entrepreneuriat-social',
            'team-management' => 'gestion-equipe',
            'project-management' => 'gestion-projet',
            'content-creation' => 'creation-contenu',
            'content' => 'creation-contenu',
            'photography' => 'photo',
            'media-education' => 'education-medias',
            'professional-communication' => 'communication-professionnelle',
        ];
        $actualAliasTargets = [];

        foreach ($aliasTopics as $sourceKey => $aliasTopic) {
            $actualAliasTargets[$sourceKey] = $aliasTopic['canonicalDomainId'] ?? null;
        }

        sort($canonicalTopicIds);
        sort($guidedDomainIds);
        ksort($expectedAliasTargets);
        ksort($actualAliasTargets);

        if (count($fixture['familyTemplates']) !== 11
            || count($fixture['generatedStageTemplates']) !== 3
            || count($canonicalTopics) !== 90
            || count($aliasTopics) !== 8
            || $canonicalTopicIds !== $guidedDomainIds
            || $actualAliasTargets !== $expectedAliasTargets) {
            throw new RuntimeException('The family template or BesaDomainTracks fixture count does not match the reviewed source.');
        }

        foreach ($fixture['families'] as $family) {
            $familyId = $family['id'];
            $template = $fixture['familyTemplates'][$familyId] ?? null;

            if (! is_array($template)
                || count($template) !== 7
                || $template[0] !== "guided-intro-{$familyId}"
                || $template[1] !== 1
                || count($template[2]) === 0
                || count($template[3]) === 0
                || count($template[6]) !== 4) {
                throw new RuntimeException("The family template [{$familyId}] is incomplete or has an invalid stable key/version.");
            }

            foreach ($template[6] as $position => $week) {
                if (! is_array($week)
                    || count($week) !== 9
                    || $week[0] !== 'week-'.($position + 1)
                    || $week[1] !== $position + 1
                    || count($week[6]) < 2
                    || $week[7] < 0
                    || $week[7] >= count($week[6])
                    || trim($week[8]) === '') {
                    throw new RuntimeException("The family template [{$familyId}] has an invalid quiz week at position [".($position + 1).'].');
                }
            }
        }

        foreach ($aliasTopics as $sourceKey => $aliasTopic) {
            $canonicalDomainId = $aliasTopic['canonicalDomainId'];
            $canonicalTopic = $canonicalTopics[$canonicalDomainId] ?? null;

            if (! is_array($canonicalTopic)
                || count($aliasTopic['topics']) !== 4
                || $aliasTopic['topics'] !== $canonicalTopic) {
                throw new RuntimeException("The BesaDomainTracks alias observation [{$sourceKey}] differs from its canonical topics.");
            }
        }

        foreach ($fixture['generatedStageTemplates'] as $position => $stage) {
            if (($stage['position'] ?? null) !== $position + 1
                || ! is_string($stage['stableKey'] ?? null)
                || ! is_string($stage['titleTemplate'] ?? null)
                || ! is_string($stage['objectiveTemplate'] ?? null)
                || ! is_string($stage['exerciseTemplate'] ?? null)
                || ! is_string($stage['quizPromptTemplate'] ?? null)) {
                throw new RuntimeException('The generated stage templates are incomplete or out of order.');
            }
        }

        return $fixture;
    }

    private function seedContentSources(Carbon $timestamp): void
    {
        $sourceDefinitions = [
            'script.js' => [
                'source_key' => 'catalog-and-curricula',
                'source_revision' => 'sha256:'.$this->fixture['source']['scriptSha256'],
                'source_checksum' => $this->fixture['source']['scriptSha256'],
                'notes' => 'Legacy catalog and detailed curricula. External resource links remain unverified.',
            ],
            'guided-pathways.js' => [
                'source_key' => 'generic-family-templates',
                'source_revision' => 'sha256:'.$this->fixture['source']['guidedPathwaysSha256'],
                'source_checksum' => $this->fixture['source']['guidedPathwaysSha256'],
                'notes' => 'Versioned family templates and generated pathways; all imported content remains a draft.',
            ],
        ];

        foreach ($sourceDefinitions as $sourcePath => $definition) {
            $sourceId = $this->stableUuid('content_source', $sourcePath);
            $this->sourceIds[$sourcePath] = $sourceId;

            DB::table('content_sources')->insertOrIgnore([
                'id' => $sourceId,
                'source_path' => $sourcePath,
                'source_key' => $definition['source_key'],
                'source_revision' => $definition['source_revision'],
                'source_checksum' => $definition['source_checksum'],
                'extracted_at' => $timestamp,
                'revision_author_id' => $this->revisionAuthorId,
                'license_status' => 'review_required',
                'attribution' => null,
                'reviewed_by' => null,
                'reviewed_at' => null,
                'notes' => $definition['notes'],
            ]);
        }
    }

    private function revisionAuthorId(): string
    {
        $authorId = getenv('CONTENT_REVISION_AUTHOR_ID');

        if (! is_string($authorId) || trim($authorId) === '') {
            throw new RuntimeException(
                'Set CONTENT_REVISION_AUTHOR_ID to an existing content_editor account before importing content.',
            );
        }

        $isContentEditor = DB::table('user_role_assignments')
            ->where('user_id', $authorId)
            ->where('role_code', 'content_editor')
            ->whereNull('revoked_at')
            ->exists();

        if (! DB::table('users')->where('id', $authorId)->exists() || ! $isContentEditor) {
            throw new RuntimeException(
                'CONTENT_REVISION_AUTHOR_ID must identify an existing user with an active content_editor role.',
            );
        }

        return $authorId;
    }

    private function seedFamilies(Carbon $timestamp): void
    {
        foreach ($this->fixture['families'] as $position => $family) {
            DB::table('domain_families')->insertOrIgnore([
                'id' => $family['id'],
                'name' => $family['name'],
                'description' => $family['description'],
                'sort_order' => $position + 1,
                'status' => 'published',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
        }
    }

    private function seedDomains(Carbon $timestamp): void
    {
        $activeFamilyIds = array_fill_keys(array_column($this->fixture['families'], 'id'), true);
        $recordsByCanonicalId = [];

        foreach ($this->fixture['domains'] as $domain) {
            if (! isset($activeFamilyIds[$domain['family']])) {
                continue;
            }

            $canonicalDomainId = $this->fixture['domainAliases'][$domain['id']] ?? $domain['id'];
            $recordsByCanonicalId[$canonicalDomainId][] = $domain;
        }

        $domainNameOverrides = $this->fixture['domainNameOverrides'] ?? [];
        $scriptSourceId = $this->sourceIds['script.js'];
        $guidedSourceId = $this->sourceIds['guided-pathways.js'];
        $scriptRevision = substr($this->fixture['source']['scriptSha256'], 0, 12);

        foreach ($recordsByCanonicalId as $canonicalDomainId => $records) {
            $canonicalRecords = array_values(array_filter(
                $records,
                static fn (array $record): bool => $record['id'] === $canonicalDomainId,
            ));
            $candidates = $canonicalRecords === [] ? $records : $canonicalRecords;
            usort(
                $candidates,
                static fn (array $left, array $right): int => count($right['resources'] ?? [])
                    <=> count($left['resources'] ?? []),
            );
            $domain = $candidates[0];
            $sourceStatus = in_array($canonicalDomainId, $this->fixture['guidedProfileIds'], true)
                || in_array($canonicalDomainId, array_keys($this->fixture['specialties']), true)
                ? 'guided'
                : ($domain['status'] ?? 'preparing');

            DB::table('domains')->insertOrIgnore([
                'id' => $canonicalDomainId,
                'family_id' => $domain['family'],
                'name' => $domainNameOverrides[$canonicalDomainId] ?? $domain['name'],
                'summary' => $domain['description'],
                'availability' => 'preparing',
                'content_status' => 'draft',
                'source_version' => "legacy-status:{$sourceStatus};script:{$scriptRevision}",
                'published_at' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);

            $this->insertSourceLink('domain_content_sources', 'domain_id', $canonicalDomainId, $scriptSourceId);

            if (in_array($canonicalDomainId, $this->fixture['guidedProfileIds'], true)) {
                $this->insertSourceLink('domain_content_sources', 'domain_id', $canonicalDomainId, $guidedSourceId);
            }

            $resourcesByUrl = [];

            foreach ($records as $sourceRecord) {
                foreach ($sourceRecord['resources'] ?? [] as $resource) {
                    if (preg_match('/^https?:\/\//i', $resource['url']) === 1) {
                        $resourcesByUrl[$resource['url']] = $resource;
                    }
                }
            }

            foreach (array_values($resourcesByUrl) as $position => $resource) {
                $this->seedResource(
                    $resource,
                    'domain:'.$canonicalDomainId.':resource:'.($position + 1),
                    ['domain_id' => $canonicalDomainId],
                    $position + 1,
                    $scriptSourceId,
                    $timestamp,
                );
            }
        }
    }

    private function seedSourceDomainInventory(Carbon $timestamp): void
    {
        $activeFamilyIds = array_fill_keys(array_column($this->fixture['families'], 'id'), true);
        $recordsBySourceId = [];

        foreach ($this->fixture['domains'] as $position => $domain) {
            $isActiveFamily = isset($activeFamilyIds[$domain['family']]);
            $canonicalDomainId = $isActiveFamily
                ? ($this->fixture['domainAliases'][$domain['id']] ?? $domain['id'])
                : null;

            $recordsBySourceId[$domain['id']][] = [
                'canonical_domain_id' => $canonicalDomainId,
                'family' => $domain['family'],
                'family_is_active' => $isActiveFamily,
            ];
        }

        foreach ($recordsBySourceId as $sourceDomainId => $records) {
            $activeRecords = array_values(array_filter(
                $records,
                static fn (array $record): bool => $record['family_is_active'],
            ));
            $canonicalDomainId = $activeRecords[0]['canonical_domain_id'] ?? null;
            $resolution = $activeRecords === []
                ? 'quarantined_family'
                : ($sourceDomainId === $canonicalDomainId ? 'canonical' : 'alias');

            DB::table('source_domain_id_inventory')->insertOrIgnore([
                'source_system' => 'script.js',
                'source_domain_id' => $sourceDomainId,
                'canonical_domain_id' => $canonicalDomainId,
                'resolution' => $resolution,
            ]);
        }

        foreach ($this->fixture['domains'] as $position => $domain) {
            $sourceRecordKey = 'script.js:domain-occurrence-'.($position + 1);
            $isActiveFamily = isset($activeFamilyIds[$domain['family']]);
            $canonicalDomainId = $isActiveFamily
                ? ($this->fixture['domainAliases'][$domain['id']] ?? $domain['id'])
                : null;
            $sourceRecordId = $this->stableUuid('source_record', $sourceRecordKey);
            $recordChecksum = hash('sha256', json_encode($domain, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));

            DB::table('source_domain_records')->insertOrIgnore([
                'id' => $sourceRecordId,
                'content_source_id' => $this->sourceIds['script.js'],
                'source_system' => 'script.js',
                'source_record_key' => $sourceRecordKey,
                'source_position' => $position + 1,
                'source_domain_id' => $domain['id'],
                'raw_family_id' => $domain['family'],
                'canonical_family_id' => $isActiveFamily ? $domain['family'] : null,
                'family_resolution' => $isActiveFamily ? 'active_raw' : 'quarantined',
                'canonical_domain_id' => $canonicalDomainId,
                'raw_name' => $domain['name'],
                'raw_description' => $domain['description'] ?? null,
                'raw_status' => $domain['status'] ?? null,
                'record_checksum' => $recordChecksum,
                'created_at' => $timestamp,
            ]);

            foreach ($domain['resources'] ?? [] as $resourcePosition => $resource) {
                DB::table('source_domain_resources')->insertOrIgnore([
                    'id' => $this->childUuid(
                        'source_resource',
                        $sourceRecordKey,
                        'resource-'.($resourcePosition + 1),
                    ),
                    'source_record_id' => $sourceRecordId,
                    'position' => $resourcePosition + 1,
                    'title' => $resource['title'],
                    'url' => $resource['url'],
                    'language' => $resource['language'] ?? null,
                    'provider' => $resource['source'] ?? null,
                    'resource_checksum' => hash(
                        'sha256',
                        json_encode($resource, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
                    ),
                ]);
            }
        }
    }

    private function seedDomainAliases(Carbon $timestamp): void
    {
        $sourceId = $this->sourceIds['script.js'];
        $sourceRevision = 'sha256:'.$this->fixture['source']['scriptSha256'];

        foreach ($this->fixture['domainAliases'] as $alias => $target) {
            $isIdentity = $alias === $target;

            DB::table('domain_id_alias_sources')->insertOrIgnore([
                'source_system' => 'script.js',
                'source_revision' => $sourceRevision,
                'source_key' => $alias,
                'source_target' => $target,
                'canonical_domain_id' => $target,
                'source_id' => $sourceId,
                'resolution_kind' => $isIdentity ? 'identity' : 'resolvable',
            ]);

            if ($isIdentity) {
                continue;
            }

            DB::table('domain_id_aliases')->insertOrIgnore([
                'alias' => $alias,
                'domain_id' => $target,
                'source_system' => 'script.js',
                'source_revision' => $sourceRevision,
                'mapping_status' => 'source_verified',
                'reviewed_by' => null,
                'reviewed_at' => null,
                'created_at' => $timestamp,
            ]);
        }
    }

    private function seedDomainFamilyAliases(Carbon $timestamp): void
    {
        foreach ($this->fixture['familyAliases'] as $alias) {
            DB::table('domain_family_aliases')->insertOrIgnore([
                'alias' => $alias['id'],
                'proposed_family_id' => $alias['proposedFamily'],
                'canonical_family_id' => null,
                'source_system' => 'script.js',
                'mapping_status' => 'proposed',
                'reviewed_by' => null,
                'reviewed_at' => null,
                'created_at' => $timestamp,
            ]);
        }
    }

    private function seedRuntimeInventory(Carbon $timestamp): void
    {
        $activeFamilyIds = array_fill_keys(array_column($this->fixture['families'], 'id'), true);
        $recordsByCanonicalId = [];

        foreach ($this->fixture['domains'] as $position => $domain) {
            if (! isset($activeFamilyIds[$domain['family']])) {
                continue;
            }

            $sourceRecordKey = 'script.js:domain-occurrence-'.($position + 1);
            $sourceRecordId = $this->stableUuid('source_record', $sourceRecordKey);
            $canonicalDomainId = $this->fixture['domainAliases'][$domain['id']] ?? $domain['id'];
            $recordsByCanonicalId[$canonicalDomainId][] = [
                'domain' => $domain,
                'source_record_id' => $sourceRecordId,
            ];
        }

        foreach ($recordsByCanonicalId as $canonicalDomainId => $records) {
            $canonicalFamilyId = DB::table('domains')->where('id', $canonicalDomainId)->value('family_id');
            $runtimeKind = $canonicalDomainId === 'web'
                ? 'web'
                : (isset($this->fixture['specialties'][$canonicalDomainId]) ? 'specialty' : 'generic_template');

            DB::table('runtime_domain_inventory')->insertOrIgnore([
                'domain_id' => $canonicalDomainId,
                'family_id' => $canonicalFamilyId,
                'runtime_kind' => $runtimeKind,
                'source_revision' => 'sha256:'.$this->fixture['source']['scriptSha256'],
                'created_at' => $timestamp,
            ]);

            foreach ($records as $record) {
                $rawDomainId = $record['domain']['id'];
                $appliedAlias = $rawDomainId !== $canonicalDomainId
                    && ($this->fixture['domainAliases'][$rawDomainId] ?? null) === $canonicalDomainId
                    ? $rawDomainId
                    : null;

                DB::table('runtime_domain_inventory_sources')->insertOrIgnore([
                    'runtime_domain_id' => $canonicalDomainId,
                    'source_record_id' => $record['source_record_id'],
                    'raw_family_id' => $record['domain']['family'],
                    'raw_domain_id' => $rawDomainId,
                    'applied_alias' => $appliedAlias,
                    'source_revision' => 'sha256:'.$this->fixture['source']['scriptSha256'],
                ]);
            }
        }
    }

    private function seedFamilyTemplates(Carbon $timestamp): void
    {
        $sourceId = $this->sourceIds['guided-pathways.js'];
        $sourceVersion = 'sha256:'.$this->fixture['source']['guidedPathwaysSha256'];

        foreach ($this->fixture['families'] as $family) {
            $familyId = $family['id'];
            [$stableKey, $version, $skills, $careers, $projectTextTemplate, $projectTopicsSuffixTemplate, $weeks] =
                $this->fixture['familyTemplates'][$familyId];
            $templateSourceKey = "{$familyId}/{$stableKey}";
            $templateId = $this->stableUuid('family_template', $templateSourceKey, $version);
            $existingTemplate = DB::table('family_pathway_templates')
                ->where('family_id', $familyId)
                ->where('stable_key', $stableKey)
                ->where('version', $version)
                ->first();

            if ($existingTemplate !== null
                && ($existingTemplate->id !== $templateId || $existingTemplate->source_version !== $sourceVersion)) {
                throw new RuntimeException(
                    "Family template [{$familyId}/{$stableKey}/v{$version}] already exists with different source identity.",
                );
            }

            DB::table('family_pathway_templates')->insertOrIgnore([
                'id' => $templateId,
                'family_id' => $familyId,
                'stable_key' => $stableKey,
                'version' => $version,
                'status' => 'draft',
                'project_text_template' => $projectTextTemplate,
                'project_topics_suffix_template' => $projectTopicsSuffixTemplate,
                'source_version' => $sourceVersion,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
            $this->templateIds[$familyId] = $templateId;

            DB::table('family_pathway_template_content_sources')->insertOrIgnore([
                'family_template_id' => $templateId,
                'content_source_id' => $sourceId,
            ]);

            foreach ($skills as $position => $label) {
                DB::table('family_template_skills')->insertOrIgnore([
                    'id' => $this->childUuid('template_skill', $templateSourceKey, 'skill-'.($position + 1), $version),
                    'template_id' => $templateId,
                    'position' => $position + 1,
                    'label' => $label,
                ]);
            }

            foreach ($careers as $position => $label) {
                DB::table('family_template_career_examples')->insertOrIgnore([
                    'id' => $this->childUuid(
                        'template_career_example',
                        $templateSourceKey,
                        'career-'.($position + 1),
                        $version,
                    ),
                    'template_id' => $templateId,
                    'position' => $position + 1,
                    'label' => $label,
                ]);
            }

            foreach ($weeks as $week) {
                [$weekStableKey, $weekPosition, $title, $explanation, $exercise, $quizPrompt, $options, $answerIndex, $feedback] = $week;
                $weekSourceKey = "{$templateSourceKey}/{$weekStableKey}";
                $weekId = $this->childUuid('template_week', $templateSourceKey, $weekStableKey, $version);

                DB::table('family_template_weeks')->insertOrIgnore([
                    'id' => $weekId,
                    'template_id' => $templateId,
                    'stable_key' => $weekStableKey,
                    'position' => $weekPosition,
                    'title' => $title,
                    'explanation' => $explanation,
                    'exercise' => $exercise,
                    'quiz_prompt' => $quizPrompt,
                    'source_answer_index' => $answerIndex,
                    'correct_option_position' => $answerIndex + 1,
                    'feedback' => $feedback,
                ]);

                foreach ($options as $optionPosition => $label) {
                    $optionStableKey = 'option-'.($optionPosition + 1);

                    DB::table('family_template_quiz_options')->insertOrIgnore([
                        'id' => $this->childUuid('template_option', $weekSourceKey, $optionStableKey, $version),
                        'template_week_id' => $weekId,
                        'stable_key' => $optionStableKey,
                        'position' => $optionPosition + 1,
                        'label' => $label,
                    ]);
                }

                foreach ($this->fixture['generatedStageTemplates'] as $stage) {
                    DB::table('family_template_stages')->insertOrIgnore([
                        'id' => $this->childUuid('template_stage', $weekSourceKey, $stage['stableKey'], $version),
                        'template_week_id' => $weekId,
                        'stable_key' => $stage['stableKey'],
                        'position' => $stage['position'],
                        'stage_title_template' => $stage['titleTemplate'],
                        'objective_template' => $stage['objectiveTemplate'],
                        'exercise_template' => $stage['exerciseTemplate'],
                        'quiz_prompt_template' => $stage['quizPromptTemplate'],
                    ]);
                }
            }
        }

        $topicsByDomainId = $this->fixture['domainTopics']['canonical'];

        foreach ($topicsByDomainId as $domainId => $topics) {
            $familyId = DB::table('domains')->where('id', $domainId)->value('family_id');
            $templateId = $this->templateIds[$familyId];
            $template = $this->fixture['familyTemplates'][$familyId];
            $templateSourceKey = "{$familyId}/{$template[0]}";

            foreach ($topics as $topicIndex => $topic) {
                $weekPosition = $topicIndex + 1;
                $stableKey = "{$domainId}:week-{$weekPosition}";
                $topicId = $this->childUuid(
                    'template_domain_topic',
                    $templateSourceKey,
                    $stableKey,
                    $template[1],
                );
                $this->templateTopicIds[$stableKey] = $topicId;

                DB::table('family_template_domain_topics')->insertOrIgnore([
                    'id' => $topicId,
                    'template_id' => $templateId,
                    'stable_key' => $stableKey,
                    'domain_id' => $domainId,
                    'week_position' => $weekPosition,
                    'topic' => $topic,
                    'source_id' => $sourceId,
                ]);
            }
        }

        foreach ($this->fixture['domainTopics']['aliases'] as $sourceKey => $aliasTopic) {
            $canonicalDomainId = $aliasTopic['canonicalDomainId'];
            $familyId = DB::table('domains')->where('id', $canonicalDomainId)->value('family_id');
            $templateId = $this->templateIds[$familyId];
            $template = $this->fixture['familyTemplates'][$familyId];
            $templateSourceKey = "{$familyId}/{$template[0]}";

            foreach ($aliasTopic['topics'] as $topicIndex => $sourceTopic) {
                $weekPosition = $topicIndex + 1;
                $canonicalTopicKey = "{$canonicalDomainId}:week-{$weekPosition}";

                DB::table('family_template_domain_topic_alias_sources')->insertOrIgnore([
                    'id' => $this->childUuid(
                        'template_domain_topic_alias_source',
                        $templateSourceKey,
                        "{$sourceKey}:week-{$weekPosition}",
                        $template[1],
                    ),
                    'template_id' => $templateId,
                    'source_key' => $sourceKey,
                    'week_position' => $weekPosition,
                    'source_topic' => $sourceTopic,
                    'canonical_domain_id' => $canonicalDomainId,
                    'canonical_topic_id' => $this->templateTopicIds[$canonicalTopicKey],
                    'source_id' => $sourceId,
                    'topic_match' => $sourceTopic === $this->fixture['domainTopics']['canonical'][$canonicalDomainId][$topicIndex]
                        ? 'identical'
                        : 'review_required',
                ]);
            }
        }
    }

    private function seedDetailedPathways(Carbon $timestamp): void
    {
        foreach (self::DETAILED_DOMAIN_IDS as $domainId) {
            $pathway = $domainId === 'web'
                ? $this->seedWebPathway($timestamp)
                : $this->seedComputerPathway($domainId, $timestamp);

            $this->seedProject($pathway, $domainId, $timestamp);
        }
    }

    private function seedGeneratedPathways(Carbon $timestamp): void
    {
        $familyNames = array_column($this->fixture['families'], 'name', 'id');
        $scriptSourceId = $this->sourceIds['script.js'];
        $templateSourceId = $this->sourceIds['guided-pathways.js'];
        $sourceVersion = 'script.js@'.substr($this->fixture['source']['scriptSha256'], 0, 12);
        $templateChecksum = $this->fixture['source']['guidedPathwaysSha256'];

        foreach ($this->fixture['guidedProfileIds'] as $domainId) {
            $domain = DB::table('domains')->where('id', $domainId)->first();

            if ($domain === null) {
                throw new RuntimeException("A guided runtime domain [{$domainId}] has no canonical domain row.");
            }

            $familyId = $domain->family_id;
            $template = $this->fixture['familyTemplates'][$familyId];
            $templateId = $this->templateIds[$familyId];
            $templateVersion = $template[1];
            $templateSourceKey = "{$familyId}/{$template[0]}";
            $topics = $this->fixture['domainTopics']['canonical'][$domainId];
            $topicOverrideChecksum = hash(
                'sha256',
                json_encode($topics, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
            );
            $rendererVersion = 'renderer-v1';
            $generationKey = hash('sha256', json_encode(
                [
                    $domainId,
                    $templateId,
                    $templateVersion,
                    $templateChecksum,
                    $topicOverrideChecksum,
                    $rendererVersion,
                ],
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR,
            ));

            $pathwayKey = "guided-intro-{$familyId}";
            $pathwaySourceKey = "{$domainId}/{$pathwayKey}";
            $pathwayVersion = 1;
            $pathwayId = $this->uuidV5WithComponents(
                'pathway',
                [$domainId, $pathwayKey],
                $pathwayVersion,
            );
            $domainName = $domain->name;
            $domainDescription = trim((string) $domain->summary);
            $baseDescription = $domainDescription !== ''
                ? $domainDescription
                : "Découvrir {$domainName}.";
            $overview = $domainDescription !== ''
                ? $domainDescription
                : "Découvrir les bases de {$domainName}.";
            $description = $baseDescription
                .' Ce parcours de quatre semaines suit une méthode adaptée à cette famille. Il propose des exercices d’initiation et ne remplace pas une qualification professionnelle.';
            $eyebrow = ($familyNames[$familyId] ?? 'Domaine').' · PARCOURS D’INITIATION';
            $prerequisites = [
                'Aucun prérequis spécialisé pour cette initiation.',
                'Curiosité et respect des règles propres au domaine.',
            ];
            $equipment = [
                'Papier et stylo ou un appareil connecté.',
                'Aucun équipement spécialisé requis pour les activités proposées.',
            ];
            $weeklyTime = 'Environ 2 h 35 par semaine · 4 semaines · 12 cours';
            $safetyNote = $this->fixture['pathwaySafetyNotes'][$familyId] ?? '';
            $projectInstructions = $this->renderTemplate(
                $template[4],
                ['{domain_name}' => $domainName],
            ).$this->renderTemplate(
                $template[5],
                ['{topics}' => implode(' ; ', $topics)],
            );
            $renderedWeeks = [];

            foreach ($template[6] as $weekIndex => $sourceWeek) {
                [$weekStableKey, $weekPosition, $weekTitle, $weekExplanation, $weekExercise, , $weekOptions, $answerIndex, $feedback] = $sourceWeek;
                $topic = $topics[$weekIndex] ?? $weekTitle;
                $sessions = [];

                foreach ($this->fixture['generatedStageTemplates'] as $stage) {
                    $stageReplacements = [
                        '{topic}' => $topic,
                        '{domain_name}' => $domainName,
                        '{week_explanation}' => $weekExplanation,
                        '{week_exercise}' => $weekExercise,
                    ];
                    $sessions[] = [
                        'stable_key' => 'stage-'.$stage['position'],
                        'title' => $this->renderTemplate($stage['titleTemplate'], $stageReplacements),
                        'objective' => $this->renderTemplate($stage['objectiveTemplate'], $stageReplacements),
                        'explanation' => $weekExplanation
                            .' Cette séance porte sur « '.$topic.' » en '.$domainName.'. Vérifie les règles et informations propres à ton pays ou à ton contexte si nécessaire.',
                        'exercise' => $this->renderTemplate($stage['exerciseTemplate'], $stageReplacements),
                        'quiz_prompt' => $this->renderTemplate($stage['quizPromptTemplate'], $stageReplacements),
                        'options' => $weekOptions,
                        'answer_index' => $answerIndex,
                        'feedback' => $feedback,
                    ];
                }

                $renderedWeeks[] = [
                    'stable_key' => $weekStableKey,
                    'position' => $weekPosition,
                    'topic' => $topic,
                    'sessions' => $sessions,
                ];
            }

            $generationManifest = [
                'domain_id' => $domainId,
                'family_id' => $familyId,
                'template_id' => $templateId,
                'template_version' => $templateVersion,
                'topic_override_checksum' => $topicOverrideChecksum,
                'renderer_version' => $rendererVersion,
                'title' => $domainName,
                'eyebrow' => $eyebrow,
                'description' => $description,
                'overview' => $overview,
                'prerequisites' => $prerequisites,
                'equipment' => $equipment,
                'weekly_time' => $weeklyTime,
                'safety_note' => $safetyNote,
                'project_instructions' => $projectInstructions,
                'skills' => $template[2],
                'careers' => $template[3],
                'weeks' => $renderedWeeks,
            ];
            $generationChecksum = hash(
                'sha256',
                json_encode($generationManifest, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
            );
            $existingPathway = DB::table('pathways')
                ->where('domain_id', $domainId)
                ->where('stable_key', $pathwayKey)
                ->where('version', $pathwayVersion)
                ->first();

            if ($existingPathway !== null
                && ($existingPathway->id !== $pathwayId
                    || $existingPathway->generation_key !== $generationKey
                    || $existingPathway->generation_checksum !== $generationChecksum)) {
                throw new RuntimeException(
                    "Generated pathway [{$domainId}/{$pathwayKey}/v{$pathwayVersion}] already exists with a different immutable generation.",
                );
            }

            DB::table('pathways')->insertOrIgnore([
                'id' => $pathwayId,
                'domain_id' => $domainId,
                'stable_key' => $pathwayKey,
                'slug' => $pathwayKey,
                'status' => 'draft',
                'title' => $domainName,
                'eyebrow' => $eyebrow,
                'description' => $description,
                'overview' => $overview,
                'difficulty' => null,
                'prerequisites' => $this->databaseTextArray($prerequisites),
                'equipment' => $this->databaseTextArray($equipment),
                'weekly_time' => $weeklyTime,
                'safety_note' => $safetyNote,
                'completion_policy' => null,
                'family_template_id' => $templateId,
                'family_template_version' => $templateVersion,
                'generation_key' => $generationKey,
                'generation_checksum' => $generationChecksum,
                'version' => $pathwayVersion,
                'source_version' => $sourceVersion,
                'published_at' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
            $this->insertSourceLink('pathway_content_sources', 'pathway_id', $pathwayId, $scriptSourceId);
            $this->insertSourceLink('pathway_content_sources', 'pathway_id', $pathwayId, $templateSourceId);

            foreach ($template[2] as $position => $label) {
                DB::table('pathway_skills')->insertOrIgnore([
                    'id' => $this->childUuid(
                        'pathway_skill',
                        $pathwaySourceKey,
                        'skill-'.($position + 1),
                        $pathwayVersion,
                    ),
                    'pathway_id' => $pathwayId,
                    'position' => $position + 1,
                    'label' => $label,
                ]);
            }

            foreach ($template[3] as $position => $label) {
                DB::table('pathway_career_examples')->insertOrIgnore([
                    'id' => $this->childUuid(
                        'career_example',
                        $pathwaySourceKey,
                        'career-'.($position + 1),
                        $pathwayVersion,
                    ),
                    'pathway_id' => $pathwayId,
                    'position' => $position + 1,
                    'label' => $label,
                ]);
            }

            foreach ($renderedWeeks as $week) {
                $weekId = $this->childUuid('week', $pathwaySourceKey, $week['stable_key'], $pathwayVersion);

                DB::table('pathway_weeks')->insertOrIgnore([
                    'id' => $weekId,
                    'pathway_id' => $pathwayId,
                    'stable_key' => $week['stable_key'],
                    'position' => $week['position'],
                    'title' => $week['topic'],
                    'label' => 'Semaine '.$week['position'],
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ]);
                DB::table('pathway_generation_topics')->insertOrIgnore([
                    'pathway_id' => $pathwayId,
                    'week_position' => $week['position'],
                    'topic' => $week['topic'],
                    'topic_source' => 'domain_override',
                    'source_id' => $templateSourceId,
                ]);

                foreach ($week['sessions'] as $sessionIndex => $session) {
                    $stageStableKey = $session['stable_key'];
                    $lessonStableKey = "{$week['stable_key']}-{$stageStableKey}";
                    $parentSourceKey = "{$pathwaySourceKey}/{$week['stable_key']}";
                    $lessonId = $this->childUuid('lesson', $parentSourceKey, $stageStableKey, $pathwayVersion);

                    DB::table('lessons')->insertOrIgnore([
                        'id' => $lessonId,
                        'week_id' => $weekId,
                        'stable_key' => $stageStableKey,
                        'position' => $sessionIndex + 1,
                        'title' => $session['title'],
                        'objective' => $session['objective'],
                        'explanation' => $session['explanation'],
                        'activity' => $session['exercise'],
                        'duration_minutes' => null,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ]);
                    $this->insertSourceLink('lesson_content_sources', 'lesson_id', $lessonId, $scriptSourceId);
                    $this->insertSourceLink('lesson_content_sources', 'lesson_id', $lessonId, $templateSourceId);

                    $quizStableKey = 'quiz-'.$week['position'].'-'.($sessionIndex + 1);
                    $quizId = $this->childUuid(
                        'quiz',
                        "{$parentSourceKey}/{$stageStableKey}",
                        $quizStableKey,
                        $pathwayVersion,
                    );
                    DB::table('quizzes')->insertOrIgnore([
                        'id' => $quizId,
                        'lesson_id' => $lessonId,
                        'stable_key' => $quizStableKey,
                        'version' => 1,
                        'status' => 'draft',
                        'pass_score' => null,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ]);
                    $this->insertSourceLink('quiz_content_sources', 'quiz_id', $quizId, $scriptSourceId);
                    $this->insertSourceLink('quiz_content_sources', 'quiz_id', $quizId, $templateSourceId);

                    $questionStableKey = 'question-1';
                    $questionSourceKey = "{$pathwaySourceKey}/{$week['stable_key']}/{$stageStableKey}/{$quizStableKey}/{$questionStableKey}";
                    $questionId = $this->childUuid('question', $questionSourceKey, $questionStableKey);
                    DB::table('quiz_questions')->insertOrIgnore([
                        'id' => $questionId,
                        'quiz_id' => $quizId,
                        'stable_key' => $questionStableKey,
                        'position' => 1,
                        'prompt' => $session['quiz_prompt'],
                        'explanation' => $session['feedback'],
                        'points' => 1,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ]);

                    foreach ($session['options'] as $optionIndex => $label) {
                        $optionStableKey = 'option-'.($optionIndex + 1);
                        DB::table('quiz_options')->insertOrIgnore([
                            'id' => $this->childUuid(
                                'option',
                                $questionSourceKey,
                                $optionStableKey,
                            ),
                            'question_id' => $questionId,
                            'stable_key' => $optionStableKey,
                            'position' => $optionIndex + 1,
                            'label' => $label,
                            'is_correct' => $optionIndex === $session['answer_index'],
                            'created_at' => $timestamp,
                            'updated_at' => $timestamp,
                        ]);
                    }
                }
            }

            $projectId = $this->childUuid('project', $pathwaySourceKey, 'final-project', $pathwayVersion);
            DB::table('projects')->insertOrIgnore([
                'id' => $projectId,
                'pathway_id' => $pathwayId,
                'stable_key' => 'final-project',
                'title' => 'Projet final · '.$domainName,
                'instructions' => $projectInstructions,
                'position' => 1,
                'status' => 'draft',
                'source_record_id' => $templateSourceId,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
        }
    }

    /**
     * @param  array<string, string>  $replacements
     */
    private function renderTemplate(string $template, array $replacements): string
    {
        $rendered = str_replace(array_keys($replacements), array_values($replacements), $template);

        if (preg_match('/\{[a-z_]+\}/', $rendered) === 1) {
            throw new RuntimeException('A source template contains an unresolved substitution token.');
        }

        return $rendered;
    }

    /**
     * @return array{id: string, stable_key: string, title: string}
     */
    private function seedComputerPathway(string $domainId, Carbon $timestamp): array
    {
        $profile = $this->fixture['specialties'][$domainId];
        $pathwayId = $this->stableUuid('pathway', $domainId);
        $sourceId = $this->sourceIds['script.js'];
        $sourceRevision = 'script.js@'.substr($this->fixture['source']['scriptSha256'], 0, 12);

        DB::table('pathways')->insertOrIgnore([
            'id' => $pathwayId,
            'domain_id' => $domainId,
            'stable_key' => $domainId,
            'slug' => $domainId,
            'status' => 'draft',
            'title' => $profile['title'],
            'description' => $profile['description'],
            'overview' => $profile['overview'],
            'difficulty' => null,
            'prerequisites' => $this->databaseTextArray($profile['prerequisites']),
            'equipment' => $this->databaseTextArray($profile['equipment']),
            'weekly_time' => $profile['weeklyTime'],
            'safety_note' => null,
            'completion_policy' => null,
            'version' => 1,
            'source_version' => $sourceRevision,
            'published_at' => null,
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ]);
        $this->insertSourceLink('pathway_content_sources', 'pathway_id', $pathwayId, $sourceId);

        foreach ($profile['skills'] as $position => $label) {
            DB::table('pathway_skills')->insertOrIgnore([
                'id' => $this->childUuid('pathway_skill', $domainId, 'skill-'.($position + 1)),
                'pathway_id' => $pathwayId,
                'position' => $position + 1,
                'label' => $label,
            ]);
        }

        foreach ($profile['resources'] as $position => $resource) {
            $this->seedResource(
                $resource,
                "{$domainId}:pathway:resource:".($position + 1),
                ['pathway_id' => $pathwayId],
                $position + 1,
                $sourceId,
                $timestamp,
            );
        }

        foreach ($profile['weeks'] as $weekIndex => $sourceWeek) {
            $weekPosition = $weekIndex + 1;
            $weekStableKey = 'week-'.$weekPosition;
            $weekId = $this->childUuid('week', $domainId, $weekStableKey);

            DB::table('pathway_weeks')->insertOrIgnore([
                'id' => $weekId,
                'pathway_id' => $pathwayId,
                'stable_key' => $weekStableKey,
                'position' => $weekPosition,
                'title' => $sourceWeek['title'],
                'label' => $sourceWeek['label'],
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);

            foreach ($sourceWeek['sessions'] as $sessionIndex => $session) {
                $lessonStableKey = "{$domainId}-week-{$weekPosition}-session-".($sessionIndex + 1);
                $lessonId = $this->seedLesson(
                    $weekId,
                    "{$domainId}/{$weekStableKey}",
                    $lessonStableKey,
                    $sessionIndex + 1,
                    $session,
                    $timestamp,
                );
                $this->insertSourceLink('lesson_content_sources', 'lesson_id', $lessonId, $sourceId);

                if (isset($session['resource'])) {
                    $this->seedResource(
                        $session['resource'],
                        "{$domainId}:{$lessonStableKey}:resource",
                        ['lesson_id' => $lessonId],
                        1,
                        $sourceId,
                        $timestamp,
                    );
                }

                $this->seedQuiz($lessonId, $lessonStableKey, $session['quiz'], $sourceId, $timestamp);
            }
        }

        return ['id' => $pathwayId, 'stable_key' => $domainId, 'title' => $profile['title']];
    }

    /**
     * @return array{id: string, stable_key: string, title: string}
     */
    private function seedWebPathway(Carbon $timestamp): array
    {
        $domain = collect($this->fixture['domains'])->firstWhere('id', 'web');
        $pathwayId = $this->stableUuid('pathway', 'web');
        $sourceId = $this->sourceIds['script.js'];
        $sourceRevision = 'script.js@'.substr($this->fixture['source']['scriptSha256'], 0, 12);

        DB::table('pathways')->insertOrIgnore([
            'id' => $pathwayId,
            'domain_id' => 'web',
            'stable_key' => 'web',
            'slug' => 'web',
            'status' => 'draft',
            'title' => $domain['name'],
            'description' => $domain['description'],
            'overview' => null,
            'difficulty' => null,
            'prerequisites' => $this->databaseTextArray([]),
            'equipment' => $this->databaseTextArray([]),
            'weekly_time' => null,
            'safety_note' => null,
            'completion_policy' => null,
            'version' => 1,
            'source_version' => $sourceRevision,
            'published_at' => null,
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ]);
        $this->insertSourceLink('pathway_content_sources', 'pathway_id', $pathwayId, $sourceId);

        foreach ($this->fixture['webModules'] as $moduleIndex => $module) {
            $weekPosition = $moduleIndex + 1;
            $weekStableKey = 'module-'.$module['id'];
            $weekId = $this->childUuid('week', 'web', $weekStableKey);

            DB::table('pathway_weeks')->insertOrIgnore([
                'id' => $weekId,
                'pathway_id' => $pathwayId,
                'stable_key' => $weekStableKey,
                'position' => $weekPosition,
                'title' => $module['title'],
                'label' => $module['id'],
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);

            foreach ($module['lessons'] as $lessonIndex => $lesson) {
                $lessonId = $this->seedLesson(
                    $weekId,
                    "web/{$weekStableKey}",
                    $lesson['id'],
                    $lessonIndex + 1,
                    [
                        ...$lesson,
                        'exercise' => $lesson['activity'],
                    ],
                    $timestamp,
                );
                $this->insertSourceLink('lesson_content_sources', 'lesson_id', $lessonId, $sourceId);

                if (isset($lesson['resource'])) {
                    $this->seedResource(
                        $lesson['resource'],
                        "web:{$lesson['id']}:resource",
                        ['lesson_id' => $lessonId],
                        1,
                        $sourceId,
                        $timestamp,
                    );
                }

                $this->seedQuiz($lessonId, $lesson['id'], $lesson['quiz'], $sourceId, $timestamp);
            }
        }

        return ['id' => $pathwayId, 'stable_key' => 'web', 'title' => $domain['name']];
    }

    /**
     * @param  array<string, mixed>  $sourceLesson
     */
    private function seedLesson(
        string $weekId,
        string $parentCanonicalSourceKey,
        string $stableKey,
        int $position,
        array $sourceLesson,
        Carbon $timestamp,
    ): string {
        $lessonId = $this->childUuid('lesson', $parentCanonicalSourceKey, $stableKey);

        DB::table('lessons')->insertOrIgnore([
            'id' => $lessonId,
            'week_id' => $weekId,
            'stable_key' => $stableKey,
            'position' => $position,
            'title' => $sourceLesson['title'],
            'objective' => $sourceLesson['objective'],
            'explanation' => $sourceLesson['explanation'],
            'activity' => $sourceLesson['activity'] ?? $sourceLesson['exercise'],
            'duration_minutes' => $sourceLesson['duration'] ?? null,
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ]);

        return $lessonId;
    }

    /**
     * @param  list<array{question: string, options: list<string>, answer: int, explanation: string}>  $sourceQuestions
     */
    private function seedQuiz(
        string $lessonId,
        string $lessonStableKey,
        array $sourceQuestions,
        string $sourceId,
        Carbon $timestamp,
    ): void {
        if ($sourceQuestions === []) {
            return;
        }

        $quizStableKey = 'quiz-'.$lessonStableKey;
        $quizId = $this->childUuid('quiz', $lessonStableKey, $quizStableKey);

        DB::table('quizzes')->insertOrIgnore([
            'id' => $quizId,
            'lesson_id' => $lessonId,
            'stable_key' => $quizStableKey,
            'version' => 1,
            'status' => 'draft',
            'pass_score' => null,
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ]);
        $this->insertSourceLink('quiz_content_sources', 'quiz_id', $quizId, $sourceId);

        foreach ($sourceQuestions as $questionIndex => $sourceQuestion) {
            $questionStableKey = 'question-'.($questionIndex + 1);
            $questionId = $this->childUuid('question', $quizStableKey, $questionStableKey);

            DB::table('quiz_questions')->insertOrIgnore([
                'id' => $questionId,
                'quiz_id' => $quizId,
                'stable_key' => $questionStableKey,
                'position' => $questionIndex + 1,
                'prompt' => $sourceQuestion['question'],
                'explanation' => $sourceQuestion['explanation'],
                'points' => 1,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);

            foreach ($sourceQuestion['options'] as $optionIndex => $label) {
                DB::table('quiz_options')->insertOrIgnore([
                    'id' => $this->childUuid(
                        'option',
                        $quizStableKey.'/'.$questionStableKey,
                        'option-'.($optionIndex + 1),
                    ),
                    'question_id' => $questionId,
                    'stable_key' => 'option-'.($optionIndex + 1),
                    'position' => $optionIndex + 1,
                    'label' => $label,
                    'is_correct' => $optionIndex === $sourceQuestion['answer'],
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ]);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $sourceProject
     */
    private function seedProject(array $sourceProject, string $domainId, Carbon $timestamp): void
    {
        $pathwayId = $sourceProject['id'];
        $sourceId = $this->sourceIds['script.js'];
        $projectId = $this->childUuid('project', $domainId, 'final-project');
        $instructions = $domainId === 'web'
            ? $this->fixture['webProject']
            : $this->fixture['specialties'][$domainId]['project'];

        DB::table('projects')->insertOrIgnore([
            'id' => $projectId,
            'pathway_id' => $pathwayId,
            'stable_key' => 'final-project',
            'title' => $domainId === 'web' ? 'Projet final · Développement web' : 'Projet final · '.$sourceProject['title'],
            'instructions' => $instructions,
            'position' => 1,
            'status' => 'draft',
            'source_record_id' => $sourceId,
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ]);

        $webChecklist = [
            'Choisir le sujet et le public de ma page.',
            'Écrire un titre, quelques informations et des liens utiles.',
            'Mettre en forme la page pour qu’elle soit lisible.',
            'Vérifier le rendu sur téléphone ou petite fenêtre.',
            'Parcourir les liens et les boutons au clavier.',
            'Présenter mon travail à une personne de confiance.',
        ];

        if ($domainId === 'web') {
            foreach ($webChecklist as $position => $label) {
                DB::table('project_checklist_items')->insertOrIgnore([
                    'id' => $this->childUuid(
                        'project_checklist_item',
                        'web/final-project',
                        'check-'.($position + 1),
                    ),
                    'project_id' => $projectId,
                    'stable_key' => 'check-'.($position + 1),
                    'position' => $position + 1,
                    'label' => $label,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ]);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $sourceResource
     * @param  array{domain_id?: string, pathway_id?: string, lesson_id?: string}  $parent
     */
    private function seedResource(
        array $sourceResource,
        string $stableKey,
        array $parent,
        int $position,
        string $sourceId,
        Carbon $timestamp,
    ): void {
        $sourceLanguage = $sourceResource['language'] ?? null;
        $accessNote = null;

        if (is_string($sourceLanguage) && mb_strlen($sourceLanguage) > 16) {
            $accessNote = $sourceLanguage;
            $sourceLanguage = null;
        }

        DB::table('resources')->insertOrIgnore([
            'id' => $this->stableUuid('resource', $stableKey),
            'stable_key' => $stableKey,
            'domain_id' => $parent['domain_id'] ?? null,
            'pathway_id' => $parent['pathway_id'] ?? null,
            'lesson_id' => $parent['lesson_id'] ?? null,
            'title' => $sourceResource['title'],
            'url' => $sourceResource['url'],
            'provider' => $sourceResource['source'] ?? null,
            'language' => $sourceLanguage,
            'resource_kind' => 'other',
            'access_note' => $accessNote,
            'status' => 'draft',
            'verification_status' => 'unverified',
            'verified_at' => null,
            'source_record_id' => $sourceId,
            'position' => $position,
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ]);
    }

    private function insertSourceLink(string $table, string $entityKey, string $entityId, string $sourceId): void
    {
        DB::table($table)->insertOrIgnore([
            $entityKey => $entityId,
            'content_source_id' => $sourceId,
        ]);
    }

    /**
     * @param  list<string>  $values
     */
    private function databaseTextArray(array $values): string
    {
        if (DB::getDriverName() !== 'pgsql') {
            return json_encode(array_values($values), JSON_THROW_ON_ERROR);
        }

        if ($values === []) {
            return '{}';
        }

        return '{'.implode(',', array_map(
            static fn (string $value): string => '"'.addcslashes($value, '"\\').'"',
            $values,
        )).'}';
    }

    private function stableUuid(string $entityType, string $canonicalSourceKey, int $version = 1): string
    {
        return $this->uuidV5WithComponents($entityType, [$canonicalSourceKey], $version);
    }

    private function childUuid(
        string $entityType,
        string $parentCanonicalSourceKey,
        string $stableKey,
        int $version = 1,
    ): string {
        return $this->uuidV5WithComponents(
            $entityType,
            [$parentCanonicalSourceKey, $stableKey],
            $version,
        );
    }

    /**
     * @param  list<string>  $sourceKeyComponents
     */
    private function uuidV5WithComponents(string $entityType, array $sourceKeyComponents, int $version): string
    {
        $name = implode('/', [
            'urn:librescence:content:v1',
            rawurlencode($entityType),
            ...array_map('rawurlencode', $sourceKeyComponents),
            'v'.$version,
        ]);

        return Uuid::uuid5(Uuid::fromString(self::UUID_NAMESPACE), $name)->toString();
    }
}
