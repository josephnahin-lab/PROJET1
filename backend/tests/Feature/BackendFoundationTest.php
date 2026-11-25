<?php

namespace Tests\Feature;

use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class BackendFoundationTest extends TestCase
{
    public function test_health_endpoint_is_available(): void
    {
        $this->get('/up')->assertOk();
    }

    public function test_only_contractual_api_routes_are_exposed(): void
    {
        $apiRoutes = collect(Route::getRoutes()->getRoutes())
            ->filter(fn (RoutingRoute $route): bool => str_starts_with($route->uri(), 'api/'))
            ->flatMap(fn (RoutingRoute $route): array => collect($route->methods())
                ->reject(fn (string $method): bool => in_array($method, ['HEAD', 'OPTIONS'], true))
                ->map(fn (string $method): string => "{$method} {$route->uri()}")
                ->all())
            ->sort()
            ->values()
            ->all();

        $this->assertSame([
            'DELETE api/v1/me/notes/{noteId}',
            'DELETE api/v1/me/portfolio/{itemId}',
            'DELETE api/v1/me/portfolio/{itemId}/attachments/{attachmentId}',
            'DELETE api/v1/me/saved-resources/{resourceId}',
            'GET api/v1/admin/contacts',
            'GET api/v1/auth/csrf-cookie',
            'GET api/v1/domains',
            'GET api/v1/domains/{domainId}',
            'GET api/v1/me',
            'GET api/v1/me/notes',
            'GET api/v1/me/portfolio',
            'GET api/v1/me/portfolio/{itemId}/attachments/{attachmentId}/content',
            'GET api/v1/me/profile',
            'GET api/v1/me/progress',
            'GET api/v1/me/quiz-attempts',
            'GET api/v1/me/saved-resources',
            'GET api/v1/me/weekly-goal',
            'GET api/v1/pathways/{pathwayId}',
            'GET api/v1/quizzes/{quizId}',
            'GET api/v1/search',
            'PATCH api/v1/admin/contacts/{contactId}',
            'PATCH api/v1/me/portfolio/{itemId}',
            'PATCH api/v1/me/profile',
            'POST api/v1/auth/login',
            'POST api/v1/auth/logout',
            'POST api/v1/auth/register',
            'POST api/v1/contacts',
            'POST api/v1/me/imports/guest-state',
            'POST api/v1/me/notes',
            'POST api/v1/me/portfolio',
            'POST api/v1/me/portfolio/{itemId}/attachments',
            'POST api/v1/me/saved-resources',
            'POST api/v1/quizzes/{quizId}/attempts',
            'POST api/v1/quizzes/{quizId}/sessions',
            'PUT api/v1/me/lesson-progress',
            'PUT api/v1/me/progress',
            'PUT api/v1/me/project-progress/{projectId}',
            'PUT api/v1/me/weekly-goal',
        ], $apiRoutes);
    }

    public function test_sanctum_and_postgresql_are_configured(): void
    {
        $this->assertSame(['web'], config('sanctum.guard'));
        $this->assertSame('laravel_session', config('session.cookie'));
        $this->assertSame('pgsql', config('database.connections.pgsql.driver'));
        $this->assertNotContains('*', config('cors.allowed_origins'));
    }
}
