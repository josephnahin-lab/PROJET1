<?php

namespace Tests\Feature\Api;

use App\Contracts\HostAddressResolver;
use App\Models\ContentSource;
use App\Models\Domain;
use App\Models\DomainFamily;
use App\Models\LearnerNote;
use App\Models\LearnerProfile;
use App\Models\LearnerProgress;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Pathway;
use App\Models\PathwayWeek;
use App\Models\Project;
use App\Models\ProjectChecklistItem;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class LearnerApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_private_learner_routes_require_a_session_and_reject_bearer_tokens(): void
    {
        $paths = [
            ['GET', '/api/v1/me/profile'],
            ['PATCH', '/api/v1/me/profile'],
            ['GET', '/api/v1/me/progress'],
            ['PUT', '/api/v1/me/progress'],
            ['PUT', '/api/v1/me/lesson-progress'],
            ['GET', '/api/v1/me/notes'],
            ['POST', '/api/v1/me/notes'],
            ['DELETE', '/api/v1/me/notes/'.Str::uuid()],
            ['GET', '/api/v1/me/saved-resources'],
            ['POST', '/api/v1/me/saved-resources'],
            ['DELETE', '/api/v1/me/saved-resources/'.Str::uuid()],
            ['GET', '/api/v1/me/weekly-goal'],
            ['PUT', '/api/v1/me/weekly-goal'],
            ['PUT', '/api/v1/me/project-progress/'.Str::uuid()],
        ];

        foreach ($paths as [$method, $uri]) {
            $this->json($method, $uri)
                ->assertUnauthorized()
                ->assertHeader('Content-Type', 'application/problem+json');
        }

        $this->withHeader('Authorization', 'Bearer not-a-session-token')
            ->getJson('/api/v1/me/profile')
            ->assertUnauthorized()
            ->assertHeader('Content-Type', 'application/problem+json');
    }

    public function test_cors_preflight_allows_the_explicit_dev_origin_and_exposes_etag(): void
    {
        $origin = 'http://127.0.0.1:3000';
        $headers = [
            'Origin' => $origin,
            'Access-Control-Request-Method' => 'GET',
            'Access-Control-Request-Headers' => 'if-match,idempotency-key,content-type,x-xsrf-token',
        ];

        $preflight = $this->options('/api/v1/me/progress', [], $headers);
        $preflight->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', $origin)
            ->assertHeader('Access-Control-Allow-Credentials', 'true');

        $allowedHeaders = strtolower((string) $preflight->headers->get('Access-Control-Allow-Headers'));
        $this->assertStringContainsString('if-match', $allowedHeaders);
        $this->assertStringContainsString('idempotency-key', $allowedHeaders);
        $this->assertStringContainsString('content-type', $allowedHeaders);
        $this->assertStringContainsString('x-xsrf-token', $allowedHeaders);
        $this->assertNotSame('*', $preflight->headers->get('Access-Control-Allow-Origin'));

        $response = $this->actingAs(User::factory()->create())
            ->withHeader('Origin', $origin)
            ->getJson('/api/v1/me/progress');
        $response->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', $origin)
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
        $exposedHeaders = strtolower((string) $response->headers->get('Access-Control-Expose-Headers'));
        $this->assertStringContainsString('etag', $exposedHeaders);
        $this->assertStringContainsString('retry-after', $exposedHeaders);
    }

    public function test_learner_json_mutations_reject_other_media_types_before_processing(): void
    {
        $user = User::factory()->create();
        $requests = [
            ['PATCH', '/api/v1/me/profile', '{"theme":"dark"}'],
            ['PUT', '/api/v1/me/weekly-goal', '{"targetDays":7}'],
            ['POST', '/api/v1/me/notes', '{"lessonId":"invalid","body":"ignored"}'],
        ];

        foreach ($requests as [$method, $uri, $body]) {
            $this->actingAs($user)
                ->call($method, $uri, [], [], [], [
                    'CONTENT_TYPE' => 'text/plain',
                    'HTTP_ACCEPT' => 'application/json',
                ], $body)
                ->assertStatus(415)
                ->assertHeader('Content-Type', 'application/problem+json')
                ->assertJsonPath('code', 'UNSUPPORTED_MEDIA_TYPE');
        }

        $this->assertDatabaseCount('weekly_goals', 0);
        $this->assertDatabaseCount('learner_notes', 0);

        Auth::forgetGuards();
        $this->call('PUT', '/api/v1/me/weekly-goal', [], [], [], [
            'CONTENT_TYPE' => 'text/plain',
            'HTTP_ACCEPT' => 'application/json',
        ], '{"targetDays":7}')
            ->assertUnauthorized();
    }

    public function test_profile_read_and_learner_writes_use_the_contract_rate_limits(): void
    {
        $reader = User::factory()->create();
        $this->actingAs($reader);

        for ($request = 0; $request < 120; $request++) {
            $this->getJson('/api/v1/me/profile')->assertOk();
        }

        $this->getJson('/api/v1/me/profile')
            ->assertStatus(429)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertHeader('Retry-After');

        $writer = User::factory()->create();
        $this->actingAs($writer);

        for ($request = 0; $request < 30; $request++) {
            $this->putJson('/api/v1/me/weekly-goal', [
                'targetDays' => [2, 3, 5, 7][$request % 4],
            ])->assertOk();
        }

        $this->putJson('/api/v1/me/weekly-goal', ['targetDays' => 3])
            ->assertStatus(429)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertHeader('Retry-After');
    }

    public function test_current_user_read_uses_the_profile_read_rate_limit(): void
    {
        $this->actingAs(User::factory()->create());

        for ($request = 0; $request < 120; $request++) {
            $this->getJson('/api/v1/me')->assertOk();
        }

        $this->getJson('/api/v1/me')
            ->assertStatus(429)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertHeader('Retry-After');
    }

    public function test_profile_is_allowlisted_private_and_does_not_collect_birth_date_or_email(): void
    {
        $user = User::factory()->create(['email' => 'private@example.test']);
        $profile = LearnerProfile::factory()->for($user)->create(['locale' => 'fr']);

        $this->actingAs($user)
            ->getJson('/api/v1/me/profile')
            ->assertOk()
            ->assertJsonMissingPath('data.email')
            ->assertJsonMissingPath('data.dateOfBirth')
            ->assertExactJsonStructure(['data' => [
                'displayName',
                'avatar',
                'interests',
                'theme',
                'resourceLanguage',
                'learningMode',
                'locale',
            ]]);

        $this->patchJson('/api/v1/me/profile', [
            'displayName' => 'Learner',
            'interests' => ['design', 'web'],
            'theme' => 'dark',
            'resourceLanguage' => 'en',
        ])->assertOk()
            ->assertJsonPath('data.displayName', 'Learner')
            ->assertJsonPath('data.interests', ['design', 'web'])
            ->assertJsonPath('data.theme', 'dark')
            ->assertJsonMissingPath('data.email')
            ->assertJsonMissingPath('data.dateOfBirth');

        $this->assertDatabaseHas('learner_profiles', [
            'user_id' => $user->id,
            'display_name' => 'Learner',
            'theme' => 'dark',
            'resource_language' => 'en',
        ]);
        $this->assertArrayNotHasKey('date_of_birth', $profile->getAttributes());
        $this->assertFalse(Schema::hasColumn('learner_profiles', 'date_of_birth'));

        foreach ([
            ['email' => 'other@example.test'],
            ['dateOfBirth' => '2000-01-01'],
            ['user_id' => (string) Str::uuid()],
        ] as $forbiddenProperty) {
            $this->patchJson('/api/v1/me/profile', $forbiddenProperty)->assertUnprocessable();
        }
    }

    public function test_profile_without_an_avatar_serializes_an_empty_json_object(): void
    {
        $user = User::factory()->create();
        LearnerProfile::query()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/v1/me/profile');
        $response->assertOk();

        $decoded = json_decode($response->getContent());

        $this->assertInstanceOf(\stdClass::class, $decoded->data->avatar);
        $this->assertSame([], get_object_vars($decoded->data->avatar));
    }

    public function test_profile_patch_with_an_empty_avatar_serializes_an_empty_json_object(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->patchJson('/api/v1/me/profile', ['avatar' => (object) []]);
        $response->assertOk();

        $decoded = json_decode($response->getContent());

        $this->assertInstanceOf(\stdClass::class, $decoded->data->avatar);
        $this->assertSame([], get_object_vars($decoded->data->avatar));
    }

    public function test_progress_reads_only_owned_rows_for_published_pathways_and_returns_an_etag(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        [$pathway, $lesson] = $this->publishedLesson();
        [$draftPathway] = $this->publishedLesson('draft');

        LearnerProgress::factory()->for($user)->for($pathway)->create([
            'status' => 'in_progress',
            'plan' => 'four_weeks',
        ]);
        LearnerProgress::factory()->for($user)->for($draftPathway)->create();
        LearnerProgress::factory()->for($otherUser)->for($pathway)->create();
        LessonProgress::factory()->for($user)->for($lesson)->create(['status' => 'completed']);
        LessonProgress::factory()->for($otherUser)->for($lesson)->create(['status' => 'completed']);

        $response = $this->actingAs($user)->getJson('/api/v1/me/progress');

        $response->assertOk()
            ->assertHeader('ETag')
            ->assertJsonCount(1, 'data.pathways')
            ->assertJsonPath('data.pathways.0.pathwayId', $pathway->id)
            ->assertJsonPath('data.pathways.0.completedLessonIds', [$lesson->id])
            ->assertJsonCount(1, 'data.lessonProgress')
            ->assertJsonPath('data.lessonProgress.0.lessonId', $lesson->id)
            ->assertJsonPath('data.weeklyGoal.targetDays', 3)
            ->assertJsonPath('data.activeDays', []);

        $this->assertSame(
            '"'.hash('sha256', json_encode($response->json('data'), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)).'"',
            $response->headers->get('ETag'),
        );
    }

    public function test_progress_put_requires_the_read_etag_and_only_marks_explicit_lessons(): void
    {
        $user = User::factory()->create();
        [$pathway, $lesson] = $this->publishedLesson();
        $etag = $this->actingAs($user)->getJson('/api/v1/me/progress')->headers->get('ETag');

        $payload = [
            'pathways' => [[
                'pathwayId' => $pathway->id,
                'status' => 'in_progress',
                'plan' => 'four_weeks',
                'completedLessonIds' => [],
                'startedAt' => null,
                'completedAt' => null,
            ]],
        ];

        $staleResponse = $this->withHeader('If-Match', '"stale"')
            ->putJson('/api/v1/me/progress', $payload);
        $this->assertSame(412, $staleResponse->getStatusCode(), $staleResponse->getContent());
        $staleResponse->assertHeader('Content-Type', 'application/problem+json');
        $this->assertDatabaseCount('learner_progress', 0);

        $this->withHeader('If-Match', $etag)
            ->putJson('/api/v1/me/progress', $payload)
            ->assertOk()
            ->assertJsonPath('data.pathways.0.status', 'in_progress')
            ->assertJsonPath('data.pathways.0.completedLessonIds', []);

        $this->assertDatabaseHas('learner_progress', [
            'user_id' => $user->id,
            'pathway_id' => $pathway->id,
            'status' => 'in_progress',
        ]);
        $this->assertDatabaseMissing('lesson_progress', [
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
        ]);
        $this->assertDatabaseCount('active_days', 0);
    }

    public function test_progress_rejects_lesson_ids_from_another_pathway_or_unpublished_content(): void
    {
        $user = User::factory()->create();
        [$pathway] = $this->publishedLesson();
        [, $foreignLesson] = $this->publishedLesson();
        $etag = $this->actingAs($user)->getJson('/api/v1/me/progress')->headers->get('ETag');

        $this->withHeader('If-Match', $etag)
            ->putJson('/api/v1/me/progress', [
                'pathways' => [[
                    'pathwayId' => $pathway->id,
                    'status' => 'completed',
                    'plan' => 'four_weeks',
                    'completedLessonIds' => [$foreignLesson->id],
                ]],
            ])
            ->assertUnprocessable();

        $this->assertDatabaseCount('learner_progress', 0);
        $this->assertDatabaseCount('lesson_progress', 0);
    }

    public function test_lesson_progress_uses_idempotent_user_scoped_writes_and_only_public_lessons(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        [, $lesson] = $this->publishedLesson();
        [, $unpublishedLesson] = $this->publishedLesson('draft');
        $this->actingAs($user)
            ->putJson('/api/v1/me/lesson-progress', [
                'lessonId' => $lesson->id,
                'status' => 'completed',
            ])
            ->assertOk()
            ->assertJsonPath('data.lessonId', $lesson->id)
            ->assertJsonPath('data.status', 'completed');

        $this->assertDatabaseHas('lesson_progress', [
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'status' => 'completed',
        ]);
        $this->assertDatabaseHas('active_days', [
            'user_id' => $user->id,
            'activity_source' => 'lesson_completed',
        ]);
        $this->assertDatabaseMissing('lesson_progress', ['user_id' => $otherUser->id, 'lesson_id' => $lesson->id]);

        $this->putJson('/api/v1/me/lesson-progress', [
            'lessonId' => $unpublishedLesson->id,
            'status' => 'completed',
        ])
            ->assertNotFound();

        $this->assertDatabaseCount('lesson_progress', 1);
    }

    public function test_notes_upsert_sanitize_html_and_paginate_only_the_current_users_notes(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        [, $firstLesson] = $this->publishedLesson();
        [, $secondLesson] = $this->publishedLesson();
        [, $thirdLesson] = $this->publishedLesson();
        [, $unpublishedLesson] = $this->publishedLesson('draft');

        $created = $this->actingAs($user)
            ->postJson('/api/v1/me/notes', [
                'lessonId' => $firstLesson->id,
                'body' => 'Avant <script>alert(1)</script> après',
            ]);
        $created->assertCreated()
            ->assertJsonPath('data.body', 'Avant alert(1) après')
            ->assertJsonMissing(['body' => 'Avant <script>alert(1)</script> après']);

        $noteId = $created->json('data.id');
        $this->postJson('/api/v1/me/notes', ['lessonId' => $firstLesson->id, 'body' => 'Updated'])
            ->assertOk()
            ->assertJsonPath('data.id', $noteId)
            ->assertJsonPath('data.body', 'Updated');

        $this->postJson('/api/v1/me/notes', ['lessonId' => $secondLesson->id, 'body' => 'Second'])->assertCreated();
        $this->postJson('/api/v1/me/notes', ['lessonId' => $thirdLesson->id, 'body' => 'Third'])->assertCreated();
        $this->postJson('/api/v1/me/notes', ['lessonId' => $unpublishedLesson->id, 'body' => 'No'])
            ->assertNotFound();
        $this->postJson('/api/v1/me/notes', [
            'lessonId' => $firstLesson->id,
            'body' => 'No',
            'user_id' => $otherUser->id,
        ])->assertUnprocessable();
        $this->postJson('/api/v1/me/notes', ['lessonId' => $firstLesson->id, 'body' => str_repeat('x', 10001)])
            ->assertUnprocessable();

        LearnerNote::factory()->for($otherUser)->for($firstLesson)->create(['body' => 'Private']);

        $firstPage = $this->getJson('/api/v1/me/notes?limit=1');
        $firstPage->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.limit', 1)
            ->assertJsonPath('meta.hasMore', true);
        $firstCursor = $firstPage->json('meta.nextCursor');
        $this->assertNotNull($firstCursor);

        $secondPage = $this->getJson('/api/v1/me/notes?limit=1&cursor='.urlencode($firstCursor));
        $secondPage->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.hasMore', true);
        $thirdPage = $this->getJson('/api/v1/me/notes?limit=1&cursor='.urlencode($secondPage->json('meta.nextCursor')));
        $thirdPage->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.hasMore', false)
            ->assertJsonPath('meta.nextCursor', null);

        $this->assertNotSame($firstPage->json('data.0.id'), $secondPage->json('data.0.id'));
        $this->assertNotSame($secondPage->json('data.0.id'), $thirdPage->json('data.0.id'));
        $this->assertDatabaseCount('learner_notes', 4);

        $this->deleteJson('/api/v1/me/notes/'.$noteId)->assertNoContent();
        $this->deleteJson('/api/v1/me/notes/'.$otherUser->notes()->value('id'))->assertNotFound();
        $this->assertDatabaseMissing('learner_notes', ['id' => $noteId]);
    }

    public function test_saved_resources_enforce_https_public_hosts_unique_ownership_and_consistent_cursors(): void
    {
        $this->useDnsAnswers(['example.com' => ['93.184.216.34']]);
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        foreach ([
            'http://example.com/resource',
            'https://localhost/resource',
            'https://127.0.0.1/resource',
            'https://metadata.google.internal/resource',
            'https://example.test/resource',
        ] as $unsafeUrl) {
            $this->actingAs($user)
                ->postJson('/api/v1/me/saved-resources', ['url' => $unsafeUrl, 'title' => 'Unsafe'])
                ->assertUnprocessable();
        }

        $firstUrl = 'https://example.com/first';
        $secondUrl = 'https://example.com/second';
        $thirdUrl = 'https://example.com/third';
        $first = $this->actingAs($user)
            ->postJson('/api/v1/me/saved-resources', ['url' => $firstUrl, 'title' => 'First', 'source' => 'web']);
        $first->assertCreated()
            ->assertJsonPath('data.url', $firstUrl)
            ->assertJsonPath('data.resourceId', null);

        $this->postJson('/api/v1/me/saved-resources', ['url' => $firstUrl, 'title' => 'Duplicate'])
            ->assertUnprocessable();
        $this->postJson('/api/v1/me/saved-resources', ['url' => $secondUrl, 'title' => 'Second'])->assertCreated();
        $this->postJson('/api/v1/me/saved-resources', ['url' => $thirdUrl, 'title' => 'Third'])->assertCreated();
        $this->actingAs($otherUser)
            ->postJson('/api/v1/me/saved-resources', ['url' => $firstUrl, 'title' => 'Other user'])
            ->assertCreated();

        $firstPage = $this->actingAs($user)->getJson('/api/v1/me/saved-resources?limit=1');
        $firstPage->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('meta.hasMore', true);
        $secondPage = $this->getJson('/api/v1/me/saved-resources?limit=1&cursor='.urlencode($firstPage->json('meta.nextCursor')));
        $secondPage->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('meta.hasMore', true);
        $thirdPage = $this->getJson('/api/v1/me/saved-resources?limit=1&cursor='.urlencode($secondPage->json('meta.nextCursor')));
        $thirdPage->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.hasMore', false)
            ->assertJsonPath('meta.nextCursor', null);

        $this->deleteJson('/api/v1/me/saved-resources/'.$first->json('data.id'))->assertNoContent();
        $this->deleteJson('/api/v1/me/saved-resources/'.$otherUser->savedResources()->value('id'))->assertNotFound();
        $this->assertDatabaseCount('saved_resources', 3);
    }

    public function test_saved_resource_links_must_reference_a_published_matching_resource(): void
    {
        $this->useDnsAnswers(['example.com' => ['93.184.216.34']]);
        $user = User::factory()->create();
        [$pathway] = $this->publishedLesson();
        $sourceAuthor = User::factory()->create();
        $source = ContentSource::factory()->for($sourceAuthor, 'revisionAuthor')->create();
        $resource = Resource::factory()->for($pathway)->create([
            'url' => 'https://example.com/course',
            'source_record_id' => $source->id,
            'status' => 'published',
            'verification_status' => 'verified',
        ]);

        $this->actingAs($user)
            ->postJson('/api/v1/me/saved-resources', [
                'url' => $resource->url,
                'title' => $resource->title,
                'resourceId' => $resource->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.resourceId', $resource->id);

        $this->postJson('/api/v1/me/saved-resources', [
            'url' => 'https://example.com/different',
            'title' => 'Mismatch',
            'resourceId' => $resource->id,
        ])->assertNotFound();

        $this->assertDatabaseCount('saved_resources', 1);
    }

    public function test_weekly_goal_is_allowlisted_and_has_no_timezone_or_inferred_quiz_activity(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)
            ->getJson('/api/v1/me/weekly-goal')
            ->assertOk()
            ->assertJsonPath('data.targetDays', 3)
            ->assertJsonMissingPath('data.timezone');

        $this->putJson('/api/v1/me/weekly-goal', ['targetDays' => 5])
            ->assertOk()
            ->assertJsonPath('data.targetDays', 5)
            ->assertJsonMissingPath('data.timezone');
        $this->putJson('/api/v1/me/weekly-goal', ['targetDays' => 4])->assertUnprocessable();
        $this->putJson('/api/v1/me/weekly-goal', ['targetDays' => 7, 'user_id' => (string) Str::uuid()])
            ->assertUnprocessable();

        $this->assertDatabaseHas('weekly_goals', ['user_id' => $user->id, 'target_days' => 5]);
        $this->assertDatabaseCount('active_days', 0);
    }

    public function test_project_progress_validates_checklist_and_isolation_without_claiming_unprovided_completion(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        [$pathway] = $this->publishedLesson();
        $project = Project::factory()->for($pathway)->create(['status' => 'published']);
        $checklistItem = ProjectChecklistItem::factory()->for($project)->create(['stable_key' => 'first-step']);
        $this->actingAs($user)
            ->putJson('/api/v1/me/project-progress/'.$project->id, [
                'status' => 'in_progress',
                'checkedItemIds' => [$checklistItem->stable_key],
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.checkedItemIds', ['first-step'])
            ->assertJsonPath('data.completedAt', null);

        $this->assertDatabaseHas('learner_project_progress', [
            'user_id' => $user->id,
            'project_id' => $project->id,
            'status' => 'in_progress',
        ]);
        $this->assertDatabaseMissing('learner_project_progress', ['user_id' => $otherUser->id]);

        $this->putJson('/api/v1/me/project-progress/'.$project->id, [
            'status' => 'completed',
            'checkedItemIds' => ['unknown'],
        ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('learner_project_progress', [
            'user_id' => $user->id,
            'project_id' => $project->id,
            'status' => 'in_progress',
        ]);
    }

    /**
     * @return array{Pathway, Lesson}
     */
    private function publishedLesson(string $pathwayStatus = 'published'): array
    {
        $family = DomainFamily::factory()->create(['status' => 'published']);
        $domain = Domain::factory()->for($family, 'family')->create(['availability' => 'published']);
        $pathway = Pathway::factory()->for($domain)->create(['status' => $pathwayStatus]);
        $week = PathwayWeek::factory()->for($pathway)->create();
        $lesson = Lesson::factory()->for($week, 'week')->create();

        return [$pathway, $lesson];
    }

    public function test_saved_resource_dns_answers_must_all_be_public_and_dns_must_resolve(): void
    {
        $user = User::factory()->create();
        $this->useDnsAnswers([
            'public.example.com' => ['93.184.216.34', '2606:4700:4700::1111'],
            'private.example.com' => ['93.184.216.34', '10.10.0.2'],
            'shared.example.com' => ['100.64.10.2'],
            'documentation.example.com' => ['192.0.2.10'],
            'private-v6.example.com' => ['fd00::10'],
            'empty.example.com' => [],
            'failed.example.com' => null,
        ]);

        $this->actingAs($user)
            ->postJson('/api/v1/me/saved-resources', [
                'url' => 'https://PUBLIC.example.com:443/path',
                'title' => 'Public',
            ])
            ->assertCreated()
            ->assertJsonPath('data.url', 'https://public.example.com/path');

        foreach ([
            'private.example.com',
            'shared.example.com',
            'documentation.example.com',
            'private-v6.example.com',
            'empty.example.com',
            'failed.example.com',
        ] as $host) {
            $this->postJson('/api/v1/me/saved-resources', [
                'url' => 'https://'.$host.'/path',
                'title' => 'Rejected',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/v1/me/saved-resources', [
            'url' => 'https://8.8.8.8/dns-free',
            'title' => 'Public IP literal',
        ])->assertCreated();

        foreach (['127.0.0.1', '192.168.1.1', '198.18.0.1', '[::1]', '[fe80::1]', '[2001:db8::1]'] as $address) {
            $this->postJson('/api/v1/me/saved-resources', [
                'url' => 'https://'.$address.'/blocked',
                'title' => 'Private IP',
            ])->assertUnprocessable();
        }

        $this->assertDatabaseCount('saved_resources', 2);
    }

    /**
     * @param  array<string, list<string>|null>  $answers
     */
    private function useDnsAnswers(array $answers): void
    {
        $this->app->instance(HostAddressResolver::class, new class($answers) implements HostAddressResolver
        {
            /**
             * @param  array<string, list<string>|null>  $answers
             */
            public function __construct(private array $answers) {}

            public function resolve(string $hostname): ?array
            {
                return $this->answers[$hostname] ?? null;
            }
        });
    }
}
