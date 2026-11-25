<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Tests\TestCase;

class FoundationContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_uses_a_uuid_and_allows_a_null_name(): void
    {
        $user = User::factory()->create(['name' => null]);

        $this->assertTrue(Str::isUuid($user->id));
        $this->assertNull($user->name);
        $this->assertSame($user->id, DB::table('users')->value('id'));
    }

    public function test_email_uniqueness_is_case_insensitive(): void
    {
        User::factory()->create(['email' => 'Learner@example.test']);

        $this->expectException(QueryException::class);

        User::factory()->create(['email' => 'learner@example.test']);
    }

    public function test_cors_preflight_allows_contract_headers_with_credentials(): void
    {
        $response = $this->call('OPTIONS', '/api/v1/auth/csrf-cookie', [], [], [], [
            'HTTP_ORIGIN' => 'http://localhost:3000',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'content-type,if-match,idempotency-key,x-xsrf-token',
        ]);

        $this->assertSame(204, $response->getStatusCode());
        $this->assertSame('http://localhost:3000', $response->headers->get('Access-Control-Allow-Origin'));
        $this->assertSame('true', $response->headers->get('Access-Control-Allow-Credentials'));

        $allowedHeaders = strtolower((string) $response->headers->get('Access-Control-Allow-Headers'));

        foreach (['content-type', 'if-match', 'idempotency-key', 'x-xsrf-token'] as $header) {
            $this->assertStringContainsString($header, $allowedHeaders);
        }
    }

    public function test_csrf_bootstrap_uses_sanctums_cookie_response(): void
    {
        $response = $this->get('/api/v1/auth/csrf-cookie', [
            'Origin' => 'http://localhost:3000',
            'Accept' => 'application/json',
        ]);

        $this->assertSame(204, $response->getStatusCode());

        $cookieNames = collect($response->headers->getCookies())
            ->map(fn ($cookie): string => $cookie->getName())
            ->all();

        $this->assertContains('laravel_session', $cookieNames);
        $this->assertContains('XSRF-TOKEN', $cookieNames);
    }

    public function test_csrf_bootstrap_observes_the_contract_rate_limit(): void
    {
        for ($requestNumber = 0; $requestNumber < 60; $requestNumber++) {
            $response = $this->get('/api/v1/auth/csrf-cookie');

            $this->assertSame(204, $response->getStatusCode());
        }

        $response = $this->get('/api/v1/auth/csrf-cookie');

        $this->assertSame(429, $response->getStatusCode());
        $this->assertNotNull($response->headers->get('Retry-After'));
    }

    public function test_deferred_operations_return_the_contract_feature_without_side_effects(): void
    {
        $user = User::factory()->create(['email' => 'support@example.test']);
        $userCount = User::count();
        Gate::define('support_contact', fn (User $authenticatedUser): bool => $authenticatedUser->email === 'support@example.test');
        $this->actingAs($user);

        $operations = [
            ['POST', '/api/v1/quizzes/not-a-uuid/sessions', 'guest_quiz_session'],
            ['POST', '/api/v1/quizzes/not-a-uuid/attempts', 'quiz_attempt_persistence'],
            ['GET', '/api/v1/me/quiz-attempts', 'quiz_attempt_history'],
            ['POST', '/api/v1/contacts', 'contact_storage'],
            ['GET', '/api/v1/admin/contacts', 'contact_storage'],
            ['PATCH', '/api/v1/admin/contacts/'.Str::uuid(), 'contact_storage'],
        ];

        foreach ($operations as [$method, $uri, $feature]) {
            $response = $this->call($method, $uri, [], [], [], [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
            ], json_encode(['unexpected' => 'must-not-be-read-or-stored'], JSON_THROW_ON_ERROR));

            $this->assertSame(503, $response->getStatusCode(), "{$method} {$uri}");
            $this->assertSame('FEATURE_DISABLED', $response->json('code'));
            $this->assertSame($feature, $response->json('feature'));
            $this->assertSame(503, $response->json('status'));
            $this->assertSame('application/problem+json', $response->headers->get('Content-Type'));
            $this->assertNotEmpty($response->json('traceId'));
            $this->assertSame($userCount, User::count());
        }
    }

    public function test_protected_deferred_quiz_and_admin_operations_require_sanctum(): void
    {
        $protectedOperations = [
            ['POST', '/api/v1/quizzes/'.Str::uuid().'/attempts'],
            ['GET', '/api/v1/me/quiz-attempts'],
            ['GET', '/api/v1/admin/contacts'],
            ['PATCH', '/api/v1/admin/contacts/'.Str::uuid()],
            ['POST', '/api/v1/me/imports/guest-state'],
        ];

        foreach ($protectedOperations as [$method, $uri]) {
            $response = $this->call($method, $uri, [], [], [], [
                'HTTP_ACCEPT' => 'application/json',
            ]);

            $this->assertSame(401, $response->getStatusCode(), "{$method} {$uri}");
        }
    }

    public function test_admin_contact_operations_require_the_contract_role(): void
    {
        $this->actingAs(User::factory()->create());

        $this->getJson('/api/v1/admin/contacts')->assertForbidden();
        $this->patchJson('/api/v1/admin/contacts/'.Str::uuid())->assertForbidden();
    }

    public function test_imported_quiz_results_are_refused_before_any_import_side_effect(): void
    {
        $user = User::factory()->create();
        $userCount = User::count();

        $response = $this->actingAs($user)->postJson('/api/v1/me/imports/guest-state', [
            'state' => [
                'quizResults' => [
                    ['quizId' => Str::uuid(), 'score' => 100],
                ],
            ],
        ]);

        $this->assertSame(503, $response->getStatusCode());
        $this->assertSame('FEATURE_DISABLED', $response->json('code'));
        $this->assertSame('imported_quiz_results', $response->json('feature'));
        $this->assertSame('application/problem+json', $response->headers->get('Content-Type'));
        $this->assertSame($userCount, User::count());
    }

    public function test_guest_state_import_does_not_implement_non_quiz_imports(): void
    {
        $response = $this->actingAs(User::factory()->create())->postJson('/api/v1/me/imports/guest-state', [
            'state' => ['quizResults' => []],
        ]);

        $this->assertSame(501, $response->getStatusCode());
        $this->assertSame('NOT_IMPLEMENTED', $response->json('code'));
        $this->assertSame('application/problem+json', $response->headers->get('Content-Type'));
    }
}
