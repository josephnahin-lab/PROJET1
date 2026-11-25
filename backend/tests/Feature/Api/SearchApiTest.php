<?php

namespace Tests\Feature\Api;

use App\Models\ContentSeedUuid;
use App\Models\ContentSource;
use App\Models\Domain;
use App\Models\DomainFamily;
use App\Models\FamilyPathwayTemplate;
use App\Models\Lesson;
use App\Models\Pathway;
use App\Models\PathwayWeek;
use App\Models\Resource;
use App\Models\User;
use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Ramsey\Uuid\Uuid;
use Tests\TestCase;

class SearchApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_returns_only_published_result_types_with_the_contract_shape(): void
    {
        $family = DomainFamily::factory()->create(['id' => 'digital', 'status' => 'published']);
        $domain = Domain::factory()->for($family, 'family')->create([
            'id' => 'web',
            'name' => 'Web development',
            'summary' => 'Learn to create a website.',
        ]);
        Domain::factory()->for($family, 'family')->create([
            'id' => 'draft-domain',
            'name' => 'Web drafts',
            'availability' => 'preparing',
        ]);

        $pathway = Pathway::factory()->for($domain)->create([
            'title' => 'Web pathway',
            'description' => 'A published web learning pathway.',
        ]);
        Pathway::factory()->for($domain)->create([
            'status' => 'draft',
            'title' => 'Web hidden draft pathway',
        ]);

        $week = PathwayWeek::factory()->for($pathway)->create();
        $lesson = Lesson::factory()->for($week, 'week')->create([
            'title' => 'Web lesson',
            'objective' => 'Practice a responsive web layout.',
        ]);

        $source = $this->createContentSource();
        Resource::factory()->for($pathway)->create([
            'domain_id' => null,
            'lesson_id' => null,
            'title' => 'Web reference',
            'url' => 'https://example.test/guide',
            'source_record_id' => $source->id,
        ]);
        Resource::factory()->for($pathway)->create([
            'domain_id' => null,
            'lesson_id' => null,
            'title' => 'Web unsafe link',
            'url' => 'javascript:alert(1)',
            'source_record_id' => $source->id,
        ]);

        $this->createQuarantinedRawOccurrence($source, 'Web quarantined raw domain');

        $response = $this->getJson('/api/v1/search?q=web');

        $response->assertOk()
            ->assertJsonPath('meta.limit', 20)
            ->assertJsonPath('meta.hasMore', false)
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('data.0.type', 'domain')
            ->assertJsonPath('data.0.id', 'web')
            ->assertJsonPath('data.0.domainId', 'web')
            ->assertJsonPath('data.1.type', 'lesson')
            ->assertJsonPath('data.1.id', $lesson->id)
            ->assertJsonPath('data.2.type', 'pathway')
            ->assertJsonPath('data.2.id', $pathway->id)
            ->assertJsonPath('data.3.type', 'resource');

        $body = $response->getContent();
        $this->assertIsString($body);
        $this->assertStringNotContainsString('Web hidden draft pathway', $body);
        $this->assertStringNotContainsString('Web drafts', $body);
        $this->assertStringNotContainsString('Web quarantined raw domain', $body);
        $this->assertStringNotContainsString('Web unsafe link', $body);

        foreach ($response->json('data') as $result) {
            $this->assertSame(
                $result['type'] === 'resource'
                    ? ['type', 'id', 'title', 'summary', 'availability']
                    : ['type', 'id', 'title', 'summary', 'domainId', 'availability'],
                array_keys($result),
            );
            $this->assertSame('published', $result['availability']);
        }
    }

    public function test_search_filters_by_family_and_cursor_paginates_without_duplicates(): void
    {
        $digitalFamily = DomainFamily::factory()->create(['id' => 'digital', 'status' => 'published']);
        $otherFamily = DomainFamily::factory()->create(['id' => 'culture', 'status' => 'published']);
        $digitalDomain = Domain::factory()->for($digitalFamily, 'family')->create([
            'id' => 'digital-web',
            'name' => 'Web digital',
        ]);
        Domain::factory()->for($otherFamily, 'family')->create([
            'id' => 'culture-web',
            'name' => 'Web culture',
        ]);
        Pathway::factory()->for($digitalDomain)->create(['title' => 'Web curriculum']);

        $firstPage = $this->getJson('/api/v1/search?q=web&family=digital&limit=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', 'digital-web')
            ->assertJsonPath('meta.hasMore', true);

        $cursor = $firstPage->json('meta.nextCursor');
        $this->assertIsString($cursor);

        $secondPage = $this->getJson('/api/v1/search?q=web&family=digital&limit=1&cursor='.urlencode($cursor))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'pathway')
            ->assertJsonPath('meta.hasMore', false);

        $this->assertNotSame($firstPage->json('data.0.id'), $secondPage->json('data.0.id'));
        $this->getJson('/api/v1/search?q=web&family=culture')
            ->assertOk()
            ->assertJsonPath('data.0.id', 'culture-web');
    }

    public function test_search_validates_openapi_parameters_and_cursor(): void
    {
        $this->getJson('/api/v1/search')->assertUnprocessable();
        $this->getJson('/api/v1/search?q=w')->assertUnprocessable();
        $this->getJson('/api/v1/search?q='.str_repeat('a', 121))->assertUnprocessable();
        $this->getJson('/api/v1/search?q=web&limit=101')->assertUnprocessable();
        $this->getJson('/api/v1/search?q=web&limit=0')->assertUnprocessable();
        $this->getJson('/api/v1/search?q=web&cursor=not-a-cursor')->assertUnprocessable()
            ->assertHeader('Content-Type', 'application/problem+json');
    }

    public function test_import_ids_follow_the_contract_uuid_v5_names_and_are_versioned(): void
    {
        $namespace = Uuid::fromString('6ba7b811-9dad-11d1-80b4-00c04fd430c8');
        $expectedRoot = Uuid::uuid5(
            $namespace,
            'urn:librescence:content:v1/pathway/web%2Fexample/v1',
        )->toString();
        $expectedChild = Uuid::uuid5(
            $namespace,
            'urn:librescence:content:v1/week/web/week%201/v2',
        )->toString();

        $this->assertSame($expectedRoot, ContentSeedUuid::root('pathway', 'web/example', 1));
        $this->assertSame($expectedChild, ContentSeedUuid::child('week', 'web', 'week 1', 2));
        $this->assertNotSame(
            ContentSeedUuid::root('pathway', 'web/example', 1),
            ContentSeedUuid::root('pathway', 'web/example', 2),
        );
    }

    public function test_seed_uuid_generation_rejects_empty_or_whitespace_keys(): void
    {
        foreach (['', " \t\n", "\u{00A0}"] as $key) {
            $this->assertInvalidArgument(static fn (): string => ContentSeedUuid::root('pathway', $key, 1));
            $this->assertInvalidArgument(static fn (): string => ContentSeedUuid::child('week', $key, 'week-1', 1));
            $this->assertInvalidArgument(static fn (): string => ContentSeedUuid::child('week', 'pathway-1', $key, 1));
        }
    }

    public function test_content_source_seed_path_preserves_uuid_v5_without_mass_assigning_id(): void
    {
        $author = User::factory()->create();
        $requestedId = (string) Str::uuid();
        $sourceAttributes = [
            'source_path' => 'script.js',
            'source_key' => 'uuid-boundary-test',
            'source_revision' => 'test-revision',
            'source_checksum' => str_repeat('d', 64),
            'extracted_at' => now(),
            'revision_author_id' => $author->id,
            'license_status' => 'review_required',
        ];

        $ordinarySource = ContentSource::query()->create([
            ...$sourceAttributes,
            'id' => $requestedId,
        ]);
        $this->assertNotSame($requestedId, $ordinarySource->id);
        $this->assertFalse($ordinarySource->isFillable('id'));

        $seedSource = ContentSource::createFromSeed('script.js', 1, [
            ...$sourceAttributes,
            'id' => $requestedId,
        ]);

        $this->assertSame(ContentSeedUuid::root('content_source', 'script.js', 1), $seedSource->id);
        $this->assertNotSame($requestedId, $seedSource->id);
        $this->assertDatabaseHas('content_sources', [
            'id' => $seedSource->id,
            'source_path' => 'script.js',
            'revision_author_id' => $author->id,
        ]);

        $this->assertInvalidArgument(static function () use ($sourceAttributes): ContentSource {
            return ContentSource::createFromSeed('attempted-approved-source', 1, [
                ...$sourceAttributes,
                'source_key' => 'attempted-approved-source',
                'license_status' => 'approved',
            ]);
        });
        $this->assertDatabaseMissing('content_sources', ['source_key' => 'attempted-approved-source']);
    }

    public function test_database_checks_reject_inconsistent_aliases_quarantine_and_template_versions(): void
    {
        $family = DomainFamily::factory()->create(['id' => 'digital']);
        $domain = Domain::factory()->for($family, 'family')->create(['id' => 'web']);
        $source = $this->createContentSource();

        $this->assertCheckConstraintViolation(static function () use ($domain): void {
            DB::table('domain_id_aliases')->insert([
                'alias' => 'web',
                'domain_id' => $domain->id,
                'source_system' => 'script.js',
                'source_revision' => 'test-revision',
                'mapping_status' => 'source_verified',
                'reviewed_by' => null,
                'reviewed_at' => null,
                'created_at' => now(),
            ]);
        });

        $this->assertCheckConstraintViolation(static function () use ($family): void {
            DB::table('domain_family_aliases')->insert([
                'alias' => 'hospitality',
                'proposed_family_id' => $family->id,
                'canonical_family_id' => $family->id,
                'source_system' => 'script.js',
                'mapping_status' => 'proposed',
                'reviewed_by' => null,
                'reviewed_at' => null,
                'created_at' => now(),
            ]);
        });

        $this->assertCheckConstraintViolation(static function () use ($domain): void {
            DB::table('source_domain_id_inventory')->insert([
                'source_system' => 'script.js',
                'source_domain_id' => 'invalid-quarantine-inventory',
                'canonical_domain_id' => $domain->id,
                'resolution' => 'quarantined_family',
            ]);
        });

        $this->assertCheckConstraintViolation(function () use ($source, $domain): void {
            DB::table('domain_id_alias_sources')->insert([
                'source_system' => 'script.js',
                'source_revision' => 'test-revision',
                'source_key' => 'identity-id',
                'source_target' => 'other-id',
                'canonical_domain_id' => $domain->id,
                'source_id' => $source->id,
                'resolution_kind' => 'identity',
            ]);
        });

        DB::table('source_domain_id_inventory')->insert([
            'source_system' => 'script.js',
            'source_domain_id' => 'quarantined-domain',
            'canonical_domain_id' => null,
            'resolution' => 'quarantined_family',
        ]);

        $this->assertCheckConstraintViolation(function () use ($source, $domain): void {
            DB::table('source_domain_records')->insert([
                'id' => (string) Str::uuid(),
                'content_source_id' => $source->id,
                'source_system' => 'script.js',
                'source_record_key' => 'invalid-quarantine-record',
                'source_position' => 1,
                'source_domain_id' => 'quarantined-domain',
                'raw_family_id' => 'hospitality',
                'canonical_family_id' => null,
                'family_resolution' => 'quarantined',
                'canonical_domain_id' => $domain->id,
                'raw_name' => 'Quarantined raw record',
                'raw_description' => null,
                'raw_status' => 'guided',
                'record_checksum' => str_repeat('e', 64),
                'created_at' => now(),
            ]);
        });

        DB::table('source_domain_id_inventory')->insert([
            'source_system' => 'script.js',
            'source_domain_id' => 'position-zero',
            'canonical_domain_id' => null,
            'resolution' => 'unresolved',
        ]);
        $this->assertCheckConstraintViolation(function () use ($source): void {
            DB::table('source_domain_records')->insert([
                'id' => (string) Str::uuid(),
                'content_source_id' => $source->id,
                'source_system' => 'script.js',
                'source_record_key' => 'invalid-zero-position',
                'source_position' => 0,
                'source_domain_id' => 'position-zero',
                'raw_family_id' => 'unknown-family',
                'canonical_family_id' => null,
                'family_resolution' => 'unresolved',
                'canonical_domain_id' => null,
                'raw_name' => 'Invalid position',
                'raw_description' => null,
                'raw_status' => null,
                'record_checksum' => str_repeat('f', 64),
                'created_at' => now(),
            ]);
        });

        $parentPathway = Pathway::factory()->for($domain)->create();
        $this->assertCheckConstraintViolation(function () use ($parentPathway): void {
            PathwayWeek::factory()->for($parentPathway)->create(['position' => 0]);
        });

        $this->assertCheckConstraintViolation(function () use ($domain): void {
            Pathway::factory()->for($domain)->create(['version' => 0]);
        });
        $this->assertCheckConstraintViolation(function () use ($domain): void {
            Pathway::factory()->for($domain)->create(['family_template_version' => 1]);
        });

        $this->assertCheckConstraintViolation(static function () use ($family): void {
            DB::table('family_pathway_templates')->insert([
                'id' => (string) Str::uuid(),
                'family_id' => $family->id,
                'stable_key' => 'invalid-version',
                'version' => 0,
                'status' => 'draft',
                'project_text_template' => 'Project',
                'project_topics_suffix_template' => 'Topics',
                'source_version' => 'test-revision',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        $templateId = ContentSeedUuid::root('family_template', 'digital', 1);
        DB::table('family_pathway_templates')->insert([
            'id' => $templateId,
            'family_id' => $family->id,
            'stable_key' => 'guided-intro',
            'version' => 1,
            'status' => 'draft',
            'project_text_template' => 'Project',
            'project_topics_suffix_template' => 'Topics',
            'source_version' => 'test-revision',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $validWeekId = ContentSeedUuid::child('template_week', 'digital', 'week-1', 1);
        DB::table('family_template_weeks')->insert([
            'id' => $validWeekId,
            'template_id' => $templateId,
            'stable_key' => 'week-1',
            'position' => 1,
            'title' => 'Week one',
            'explanation' => 'Explanation',
            'exercise' => 'Exercise',
            'quiz_prompt' => 'Question',
            'source_answer_index' => 0,
            'correct_option_position' => 1,
            'feedback' => 'Feedback',
        ]);

        $this->assertCheckConstraintViolation(static function () use ($templateId): void {
            DB::table('family_template_weeks')->insert([
                'id' => (string) Str::uuid(),
                'template_id' => $templateId,
                'stable_key' => 'wrong-correct-option',
                'position' => 2,
                'title' => 'Week two',
                'explanation' => 'Explanation',
                'exercise' => 'Exercise',
                'quiz_prompt' => 'Question',
                'source_answer_index' => 0,
                'correct_option_position' => 2,
                'feedback' => 'Feedback',
            ]);
        });

        $this->assertCheckConstraintViolation(static function () use ($templateId): void {
            DB::table('family_template_weeks')->insert([
                'id' => (string) Str::uuid(),
                'template_id' => $templateId,
                'stable_key' => 'week-five',
                'position' => 5,
                'title' => 'Out of range',
                'explanation' => 'Explanation',
                'exercise' => 'Exercise',
                'quiz_prompt' => 'Question',
                'source_answer_index' => 0,
                'correct_option_position' => 1,
                'feedback' => 'Feedback',
            ]);
        });

        $this->assertCheckConstraintViolation(static function () use ($validWeekId): void {
            DB::table('family_template_stages')->insert([
                'id' => (string) Str::uuid(),
                'template_week_id' => $validWeekId,
                'stable_key' => 'stage-four',
                'position' => 4,
                'stage_title_template' => 'Stage',
                'objective_template' => 'Objective',
                'exercise_template' => 'Exercise',
                'quiz_prompt_template' => 'Question',
            ]);
        });

        $generatedPathway = Pathway::factory()->for($domain)->create([
            'family_template_id' => $templateId,
            'family_template_version' => 1,
            'generation_key' => str_repeat('1', 64),
            'generation_checksum' => str_repeat('2', 64),
        ]);
        $this->assertCheckConstraintViolation(function () use ($generatedPathway, $source): void {
            DB::table('pathway_generation_topics')->insert([
                'pathway_id' => $generatedPathway->id,
                'week_position' => 5,
                'topic' => 'Outside four-week pathway',
                'topic_source' => 'template_title',
                'source_id' => $source->id,
            ]);
        });
    }

    public function test_approved_family_alias_is_required_for_insert_and_update_canonicalization(): void
    {
        $family = DomainFamily::factory()->create(['id' => 'digital']);
        $proposedFamily = DomainFamily::factory()->create(['id' => 'culture']);
        $domain = Domain::factory()->for($family, 'family')->create(['id' => 'web']);
        $source = $this->createContentSource();
        $reviewer = User::factory()->create();

        DB::table('domain_family_aliases')->insert([
            'alias' => 'hospitality',
            'proposed_family_id' => $proposedFamily->id,
            'canonical_family_id' => null,
            'source_system' => 'script.js',
            'mapping_status' => 'proposed',
            'reviewed_by' => null,
            'reviewed_at' => null,
            'created_at' => now(),
        ]);
        DB::table('source_domain_id_inventory')->insert([
            'source_system' => 'script.js',
            'source_domain_id' => 'web',
            'canonical_domain_id' => $domain->id,
            'resolution' => 'canonical',
        ]);
        $recordId = (string) Str::uuid();
        DB::table('source_domain_records')->insert([
            'id' => $recordId,
            'content_source_id' => $source->id,
            'source_system' => 'script.js',
            'source_record_key' => 'historical-family-record',
            'source_position' => 1,
            'source_domain_id' => 'web',
            'raw_family_id' => 'hospitality',
            'canonical_family_id' => null,
            'family_resolution' => 'quarantined',
            'canonical_domain_id' => null,
            'raw_name' => 'Raw historical domain',
            'raw_description' => 'Kept quarantined before approval.',
            'raw_status' => 'guided',
            'record_checksum' => str_repeat('a', 64),
            'created_at' => now(),
        ]);

        $this->assertDatabaseConstraintViolation(function () use ($domain, $family, $source): void {
            DB::table('source_domain_records')->insert([
                'id' => (string) Str::uuid(),
                'content_source_id' => $source->id,
                'source_system' => 'script.js',
                'source_record_key' => 'proposed-alias-insert',
                'source_position' => 2,
                'source_domain_id' => 'web',
                'raw_family_id' => 'hospitality',
                'canonical_family_id' => $family->id,
                'family_resolution' => 'approved_alias',
                'canonical_domain_id' => $domain->id,
                'raw_name' => 'Unapproved family alias',
                'raw_description' => null,
                'raw_status' => 'guided',
                'record_checksum' => str_repeat('b', 64),
                'created_at' => now(),
            ]);
        });

        $this->assertDatabaseConstraintViolation(function () use ($recordId, $domain, $family): void {
            DB::table('source_domain_records')->where('id', $recordId)->update([
                'canonical_family_id' => $family->id,
                'family_resolution' => 'approved_alias',
                'canonical_domain_id' => $domain->id,
            ]);
        });

        DB::table('domain_family_aliases')->where('alias', 'hospitality')->update([
            'canonical_family_id' => $family->id,
            'mapping_status' => 'approved',
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
        ]);

        $this->assertDatabaseConstraintViolation(function () use ($domain, $proposedFamily, $source): void {
            DB::table('source_domain_records')->insert([
                'id' => (string) Str::uuid(),
                'content_source_id' => $source->id,
                'source_system' => 'script.js',
                'source_record_key' => 'wrong-alias-target',
                'source_position' => 3,
                'source_domain_id' => 'web',
                'raw_family_id' => 'hospitality',
                'canonical_family_id' => $proposedFamily->id,
                'family_resolution' => 'approved_alias',
                'canonical_domain_id' => $domain->id,
                'raw_name' => 'Wrong canonical family',
                'raw_description' => null,
                'raw_status' => 'guided',
                'record_checksum' => str_repeat('c', 64),
                'created_at' => now(),
            ]);
        });

        DB::table('source_domain_records')->where('id', $recordId)->update([
            'canonical_family_id' => $family->id,
            'family_resolution' => 'approved_alias',
            'canonical_domain_id' => $domain->id,
        ]);

        $this->assertDatabaseHas('source_domain_records', [
            'id' => $recordId,
            'canonical_family_id' => $family->id,
            'family_resolution' => 'approved_alias',
            'canonical_domain_id' => $domain->id,
        ]);

        $this->assertDatabaseConstraintViolation(static function (): void {
            DB::table('domain_family_aliases')->where('alias', 'hospitality')->update([
                'canonical_family_id' => null,
                'mapping_status' => 'proposed',
                'reviewed_by' => null,
                'reviewed_at' => null,
            ]);
        });
    }

    public function test_template_topic_alias_foreign_key_requires_matching_template_domain_and_week(): void
    {
        $digitalFamily = DomainFamily::factory()->create(['id' => 'digital']);
        $cultureFamily = DomainFamily::factory()->create(['id' => 'culture']);
        $webDomain = Domain::factory()->for($digitalFamily, 'family')->create(['id' => 'web']);
        $cultureDomain = Domain::factory()->for($cultureFamily, 'family')->create(['id' => 'culture-domain']);
        $source = $this->createContentSource();
        $templateId = ContentSeedUuid::root('family_template', 'digital', 1);
        $otherTemplateId = ContentSeedUuid::root('family_template', 'culture', 1);

        $this->insertFamilyTemplate($templateId, $digitalFamily->id, 'guided-intro', 1);
        $this->insertFamilyTemplate($otherTemplateId, $cultureFamily->id, 'guided-intro', 1);

        $canonicalTopicId = ContentSeedUuid::child('template_domain_topic', 'digital', 'web:week-1', 1);
        DB::table('family_template_domain_topics')->insert([
            'id' => $canonicalTopicId,
            'template_id' => $templateId,
            'stable_key' => 'web:week-1',
            'domain_id' => $webDomain->id,
            'week_position' => 1,
            'topic' => 'Web topic',
            'source_id' => $source->id,
        ]);

        $validAliasId = (string) Str::uuid();
        DB::table('family_template_domain_topic_alias_sources')->insert([
            'id' => $validAliasId,
            'template_id' => $templateId,
            'source_key' => 'web-alias',
            'week_position' => 1,
            'source_topic' => 'Web topic',
            'canonical_domain_id' => $webDomain->id,
            'canonical_topic_id' => $canonicalTopicId,
            'source_id' => $source->id,
            'topic_match' => 'identical',
        ]);

        $this->assertDatabaseConstraintViolation(function () use ($templateId, $cultureDomain, $canonicalTopicId, $source): void {
            $this->insertTopicAliasObservation(
                (string) Str::uuid(),
                $templateId,
                'cross-domain',
                1,
                $cultureDomain->id,
                $canonicalTopicId,
                $source->id,
            );
        });

        $this->assertDatabaseConstraintViolation(function () use ($templateId, $webDomain, $canonicalTopicId, $source): void {
            $this->insertTopicAliasObservation(
                (string) Str::uuid(),
                $templateId,
                'cross-week',
                2,
                $webDomain->id,
                $canonicalTopicId,
                $source->id,
            );
        });

        $this->assertDatabaseConstraintViolation(function () use ($otherTemplateId, $webDomain, $canonicalTopicId, $source): void {
            $this->insertTopicAliasObservation(
                (string) Str::uuid(),
                $otherTemplateId,
                'cross-template',
                1,
                $webDomain->id,
                $canonicalTopicId,
                $source->id,
            );
        });

        $this->assertDatabaseConstraintViolation(static function () use ($validAliasId, $cultureDomain): void {
            DB::table('family_template_domain_topic_alias_sources')
                ->where('id', $validAliasId)
                ->update(['canonical_domain_id' => $cultureDomain->id]);
        });
    }

    public function test_family_template_source_ids_are_retrievable_idempotent_and_foreign_keyed(): void
    {
        $family = DomainFamily::factory()->create(['id' => 'digital']);
        $source = $this->createContentSource();
        $template = FamilyPathwayTemplate::query()->create([
            'id' => ContentSeedUuid::root('family_template', 'digital/guided-intro-digital', 1),
            'family_id' => $family->id,
            'stable_key' => 'guided-intro-digital',
            'version' => 1,
            'status' => 'draft',
            'project_text_template' => 'Project for {domain_name}.',
            'project_topics_suffix_template' => 'Topics: {topics}.',
            'source_version' => 'test-revision',
        ]);

        $template->contentSources()->syncWithoutDetaching([$source->id]);
        $template->contentSources()->syncWithoutDetaching([$source->id]);

        $this->assertSame([$source->id], $template->fresh()->contentSources->pluck('id')->all());
        $this->assertDatabaseCount('family_pathway_template_content_sources', 1);

        $this->assertDatabaseConstraintViolation(static function () use ($template): void {
            DB::table('family_pathway_template_content_sources')->insert([
                'family_template_id' => $template->id,
                'content_source_id' => (string) Uuid::uuid4(),
            ]);
        });
    }

    public function test_importer_schema_keeps_raw_occurrences_and_template_data_without_publication_defaults(): void
    {
        $requiredTables = [
            'roles',
            'user_role_assignments',
            'content_sources',
            'pathway_skills',
            'pathway_career_examples',
            'domain_content_sources',
            'pathway_content_sources',
            'lesson_content_sources',
            'quiz_content_sources',
            'content_audit_events',
            'content_audit_event_sources',
            'domain_id_aliases',
            'domain_id_alias_sources',
            'domain_family_aliases',
            'source_domain_id_inventory',
            'source_domain_records',
            'source_domain_resources',
            'runtime_domain_inventory',
            'runtime_domain_inventory_sources',
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

        foreach ($requiredTables as $table) {
            $this->assertTrue(Schema::hasTable($table), "Missing importer table [{$table}].");
        }

        $this->assertTrue(Schema::hasColumns('content_sources', ['revision_author_id']));
        $this->assertTrue(Schema::hasColumns('pathways', [
            'eyebrow',
            'family_template_id',
            'family_template_version',
            'generation_key',
            'generation_checksum',
        ]));
        $this->assertTrue(Schema::hasColumns('family_template_weeks', [
            'source_answer_index',
            'correct_option_position',
            'feedback',
        ]));
        $this->assertTrue(Schema::hasColumns('family_template_domain_topic_alias_sources', [
            'source_key',
            'source_topic',
            'canonical_topic_id',
            'topic_match',
        ]));

        $family = DomainFamily::factory()->create(['id' => 'digital']);
        $domain = Domain::factory()->for($family, 'family')->create(['id' => 'web']);
        $proposedFamily = DomainFamily::factory()->create(['id' => 'mobilite-accompagnement']);
        $source = $this->createContentSource();

        DB::table('source_domain_id_inventory')->insert([
            'source_system' => 'script.js',
            'source_domain_id' => 'raw-web',
            'canonical_domain_id' => 'web',
            'resolution' => 'alias',
        ]);

        foreach (['occurrence-one', 'occurrence-two'] as $position => $recordKey) {
            DB::table('source_domain_records')->insert([
                'id' => (string) Str::uuid(),
                'content_source_id' => $source->id,
                'source_system' => 'script.js',
                'source_record_key' => $recordKey,
                'source_position' => $position + 1,
                'source_domain_id' => 'raw-web',
                'raw_family_id' => 'digital',
                'canonical_family_id' => 'digital',
                'family_resolution' => 'active_raw',
                'canonical_domain_id' => 'web',
                'raw_name' => 'Raw occurrence',
                'raw_description' => 'Preserved source content.',
                'raw_status' => 'guided',
                'record_checksum' => str_repeat((string) ($position + 1), 64),
                'created_at' => now(),
            ]);
        }

        DB::table('source_domain_id_inventory')->insert([
            'source_system' => 'script.js',
            'source_domain_id' => 'raw-hospitality',
            'canonical_domain_id' => null,
            'resolution' => 'quarantined_family',
        ]);
        DB::table('source_domain_records')->insert([
            'id' => (string) Str::uuid(),
            'content_source_id' => $source->id,
            'source_system' => 'script.js',
            'source_record_key' => 'historical-family-occurrence',
            'source_position' => 3,
            'source_domain_id' => 'raw-hospitality',
            'raw_family_id' => 'hospitality',
            'canonical_family_id' => null,
            'family_resolution' => 'quarantined',
            'canonical_domain_id' => null,
            'raw_name' => 'Historical family occurrence',
            'raw_description' => 'Preserved and not canonicalized.',
            'raw_status' => 'guided',
            'record_checksum' => str_repeat('c', 64),
            'created_at' => now(),
        ]);

        DB::table('domain_family_aliases')->insert([
            'alias' => 'hospitality',
            'proposed_family_id' => $proposedFamily->id,
            'canonical_family_id' => null,
            'source_system' => 'script.js',
            'mapping_status' => 'proposed',
            'reviewed_by' => null,
            'reviewed_at' => null,
            'created_at' => now(),
        ]);

        $this->assertSame(2, DB::table('source_domain_records')->where('canonical_domain_id', $domain->id)->count());
        $this->assertSame(1, DB::table('source_domain_records')->whereNull('canonical_family_id')->whereNull('canonical_domain_id')->where('family_resolution', 'quarantined')->count());
        $this->assertDatabaseHas('domain_family_aliases', [
            'alias' => 'hospitality',
            'canonical_family_id' => null,
            'mapping_status' => 'proposed',
        ]);
    }

    private function createContentSource(): ContentSource
    {
        $author = User::factory()->create();

        return ContentSource::createFromSeed('search-test', 1, [
            'source_path' => 'script.js',
            'source_key' => 'search-test',
            'source_revision' => 'test-revision',
            'source_checksum' => str_repeat('a', 64),
            'extracted_at' => now(),
            'revision_author_id' => $author->id,
            'license_status' => 'review_required',
        ]);
    }

    private function assertInvalidArgument(Closure $operation): void
    {
        try {
            $operation();
        } catch (InvalidArgumentException $exception) {
            $this->assertNotSame('', $exception->getMessage());

            return;
        }

        $this->fail('Expected an invalid deterministic UUID key to be rejected.');
    }

    private function assertCheckConstraintViolation(Closure $operation): void
    {
        try {
            $operation();
        } catch (QueryException $exception) {
            $this->assertStringContainsString('CHECK constraint failed:', $exception->getMessage());

            return;
        }

        $this->fail('Expected the database invariant to reject the row.');
    }

    private function assertDatabaseConstraintViolation(Closure $operation): void
    {
        try {
            $operation();
        } catch (QueryException $exception) {
            $this->assertStringContainsString('constraint failed', strtolower($exception->getMessage()));

            return;
        }

        $this->fail('Expected the database constraint or trigger to reject the row.');
    }

    private function insertFamilyTemplate(string $id, string $familyId, string $stableKey, int $version): void
    {
        DB::table('family_pathway_templates')->insert([
            'id' => $id,
            'family_id' => $familyId,
            'stable_key' => $stableKey,
            'version' => $version,
            'status' => 'draft',
            'project_text_template' => 'Project',
            'project_topics_suffix_template' => 'Topics',
            'source_version' => 'test-revision',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function insertTopicAliasObservation(
        string $id,
        string $templateId,
        string $sourceKey,
        int $weekPosition,
        string $canonicalDomainId,
        string $canonicalTopicId,
        string $sourceId,
    ): void {
        DB::table('family_template_domain_topic_alias_sources')->insert([
            'id' => $id,
            'template_id' => $templateId,
            'source_key' => $sourceKey,
            'week_position' => $weekPosition,
            'source_topic' => 'Observed topic',
            'canonical_domain_id' => $canonicalDomainId,
            'canonical_topic_id' => $canonicalTopicId,
            'source_id' => $sourceId,
            'topic_match' => 'review_required',
        ]);
    }

    private function createQuarantinedRawOccurrence(ContentSource $source, string $rawName): void
    {
        DB::table('source_domain_id_inventory')->insert([
            'source_system' => 'script.js',
            'source_domain_id' => 'raw-quarantine',
            'canonical_domain_id' => null,
            'resolution' => 'quarantined_family',
        ]);

        DB::table('source_domain_records')->insert([
            'id' => (string) Str::uuid(),
            'content_source_id' => $source->id,
            'source_system' => 'script.js',
            'source_record_key' => 'quarantined-occurrence',
            'source_position' => 1,
            'source_domain_id' => 'raw-quarantine',
            'raw_family_id' => 'hospitality',
            'canonical_family_id' => null,
            'family_resolution' => 'quarantined',
            'canonical_domain_id' => null,
            'raw_name' => $rawName,
            'raw_description' => 'Hidden until an approved family mapping exists.',
            'raw_status' => 'guided',
            'record_checksum' => str_repeat('b', 64),
            'created_at' => now(),
        ]);
    }
}
