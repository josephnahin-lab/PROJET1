<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class DeferredFeaturesApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_deferred_public_and_authenticated_features_return_problem_503(): void
    {
        $response = $this->postJson('/api/v1/quizzes/not-a-uuid/sessions');

        $response->assertServiceUnavailable()
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('code', 'FEATURE_DISABLED')
            ->assertJsonPath('feature', 'guest_quiz_session')
            ->assertJsonPath('status', 503);

        $this->postJson('/api/v1/contacts', ['message' => 'Do not store'])
            ->assertServiceUnavailable()
            ->assertJsonPath('feature', 'contact_storage');

        $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/quizzes/not-a-uuid/attempts', ['answers' => []])
            ->assertServiceUnavailable()
            ->assertJsonPath('feature', 'quiz_attempt_persistence');

        $this->getJson('/api/v1/me/quiz-attempts')
            ->assertServiceUnavailable()
            ->assertJsonPath('feature', 'quiz_attempt_history');
    }

    public function test_protected_deferred_endpoints_return_401_without_a_session(): void
    {
        $this->postJson('/api/v1/quizzes/'.Str::uuid().'/attempts')
            ->assertUnauthorized()
            ->assertHeader('Content-Type', 'application/problem+json');

        $this->getJson('/api/v1/me/quiz-attempts')
            ->assertUnauthorized()
            ->assertHeader('Content-Type', 'application/problem+json');

        $this->postJson('/api/v1/me/imports/guest-state', ['state' => ['quizResults' => [['score' => 1]]]])
            ->assertUnauthorized()
            ->assertHeader('Content-Type', 'application/problem+json');
    }

    public function test_import_rejects_nonempty_quiz_results_atomically_without_persisting_them(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/v1/me/imports/guest-state', [
                'state' => [
                    'quizResults' => [['score' => 100, 'answers' => ['private']]],
                    'progress' => ['mustNotBeImported'],
                ],
            ])
            ->assertServiceUnavailable()
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('feature', 'imported_quiz_results');

        $this->assertDatabaseCount('users', 1);
        $this->assertFalse(Schema::hasTable('guest_import_batches'));
    }

    public function test_import_rejects_non_json_before_reading_quiz_results(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->call('POST', '/api/v1/me/imports/guest-state', [], [], [], [
                'CONTENT_TYPE' => 'text/plain',
                'HTTP_ACCEPT' => 'application/json',
            ], '{"state":{"quizResults":[{"score":100}]}}')
            ->assertStatus(415)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('code', 'UNSUPPORTED_MEDIA_TYPE')
            ->assertJsonMissingPath('feature');

        $this->assertDatabaseCount('users', 1);
        $this->assertFalse(Schema::hasTable('guest_import_batches'));
    }
}
