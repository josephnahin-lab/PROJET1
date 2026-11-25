<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_accepts_only_email_and_password_and_starts_a_cookie_session(): void
    {
        $response = $this->withHeader('Origin', 'http://localhost:3000')
            ->postJson('/api/v1/auth/register', [
                'email' => '  LEARNER@Example.test ',
                'password' => 'correct horse battery staple',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.email', 'learner@example.test')
            ->assertJsonPath('data.user.emailVerified', false)
            ->assertJsonPath('data.user.status', 'active')
            ->assertJsonPath('data.csrfRequired', true)
            ->assertJsonMissingPath('data.user.password')
            ->assertJsonMissingPath('data.user.name');

        $this->assertDatabaseHas('users', ['email' => 'learner@example.test', 'name' => null]);
        $this->assertDatabaseHas('learner_profiles', ['locale' => 'fr']);
        $this->assertContains(
            'laravel_session',
            collect($response->headers->getCookies())->map(fn ($cookie): string => $cookie->getName())->all(),
        );
    }

    public function test_registration_normalizes_email_before_enforcing_uniqueness(): void
    {
        User::factory()->create(['email' => 'LEARNER@example.test']);

        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'LEARNER@example.test',
            'password' => 'correct horse battery staple',
        ]);

        $response->assertUnprocessable()
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('status', 422)
            ->assertJsonStructure(['traceId', 'errors' => ['email']]);

        $this->assertDatabaseCount('users', 1);
    }

    public function test_registration_rejects_short_passwords_and_unrecognized_properties(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'learner@example.test',
            'password' => 'short',
            'name' => 'Not collected',
        ]);

        $response->assertUnprocessable()
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('status', 422);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_login_returns_generic_unauthorized_problem_for_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'unknown@example.test',
            'password' => 'invalid-password',
        ]);

        $response->assertUnauthorized()
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('status', 401);
    }

    public function test_login_normalizes_email_and_establishes_a_session(): void
    {
        User::factory()->create(['email' => 'learner@example.test']);

        $response = $this->withHeader('Origin', 'http://localhost:3000')
            ->postJson('/api/v1/auth/login', [
                'email' => 'LEARNER@EXAMPLE.TEST',
                'password' => 'password',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.user.email', 'learner@example.test')
            ->assertJsonPath('data.csrfRequired', true);

        $this->assertContains(
            'laravel_session',
            collect($response->headers->getCookies())->map(fn ($cookie): string => $cookie->getName())->all(),
        );
    }

    public function test_csrf_bootstrap_and_authenticated_user_use_first_party_cookies_only(): void
    {
        $csrf = $this->get('/api/v1/auth/csrf-cookie', [
            'Origin' => 'http://localhost:3000',
            'Accept' => 'application/json',
        ]);
        $csrf->assertNoContent();

        $cookieNames = collect($csrf->headers->getCookies())
            ->map(fn ($cookie): string => $cookie->getName())
            ->all();

        $this->assertContains('laravel_session', $cookieNames);
        $this->assertContains('XSRF-TOKEN', $cookieNames);

        $this->withHeader('Authorization', 'Bearer not-a-session-token')
            ->getJson('/api/v1/me')
            ->assertUnauthorized()
            ->assertHeader('Content-Type', 'application/problem+json');

        $this->flushHeaders();

        $user = User::factory()->create(['email' => 'learner@example.test']);
        $this->actingAs($user)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', 'learner@example.test')
            ->assertJsonPath('data.status', 'active')
            ->assertJsonMissingPath('data.password');
    }

    public function test_logout_revokes_the_current_session(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->withHeader('Origin', 'http://localhost:3000')
            ->postJson('/api/v1/auth/logout')
            ->assertNoContent();

        Auth::forgetGuards();

        $this->getJson('/api/v1/me')
            ->assertUnauthorized()
            ->assertHeader('Content-Type', 'application/problem+json');
    }
}
