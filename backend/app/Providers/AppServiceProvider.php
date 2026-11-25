<?php

namespace App\Providers;

use App\Contracts\HostAddressResolver;
use App\Http\Responses\ProblemResponse;
use App\Services\DnsHostAddressResolver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(HostAddressResolver::class, DnsHostAddressResolver::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        config([
            'cors.exposed_headers' => array_values(array_unique([
                ...config('cors.exposed_headers', []),
                'Content-Disposition',
            ])),
        ]);

        $keyFor = static fn (Request $request, string $value): string => hash_hmac(
            'sha256',
            $value,
            (string) config('app.key'),
        );
        $ipKey = static fn (Request $request): string => $keyFor($request, (string) $request->ip());
        $problemLimit = static fn (Limit $limit): Limit => $limit->response(
            static fn (Request $request, array $headers) => ProblemResponse::make(
                429,
                'Too Many Requests',
                'Trop de requêtes. Réessayez après le délai indiqué.',
                headers: $headers,
            ),
        );

        RateLimiter::for('csrf-bootstrap', fn (Request $request): Limit => $problemLimit(
            Limit::perMinute(60)->by($ipKey($request)),
        ));
        RateLimiter::for('register', fn (Request $request): Limit => $problemLimit(
            Limit::perMinutes(15, 3)->by($ipKey($request)),
        ));
        RateLimiter::for('login', function (Request $request) use ($problemLimit, $keyFor): Limit {
            $email = $request->input('email');
            $normalizedEmail = is_string($email) ? Str::lower(trim($email)) : '';

            return $problemLimit(Limit::perMinutes(15, 5)->by($keyFor(
                $request,
                (string) $request->ip().'|'.$normalizedEmail,
            )));
        });
        RateLimiter::for('logout', fn (Request $request): Limit => $problemLimit(
            Limit::perMinute(30)->by($keyFor(
                $request,
                $request->session()->getId() ?: (string) $request->user()?->getAuthIdentifier(),
            ))->after(static fn (Response $response): bool => $response->getStatusCode() !== 204),
        ));

        foreach (['profileRead' => 120, 'accountWrite' => 30] as $limiter => $maximumAttempts) {
            RateLimiter::for($limiter, fn (Request $request): Limit => $problemLimit(
                Limit::perMinute($maximumAttempts)->by($keyFor(
                    $request,
                    'account:'.(string) $request->user()?->getAuthIdentifier(),
                )),
            ));
        }

        RateLimiter::for('portfolioUpload', fn (Request $request): Limit => $problemLimit(
            Limit::perHour(10)->by($keyFor(
                $request,
                'account:'.(string) $request->user()?->getAuthIdentifier(),
            )),
        ));

        foreach (['domain-list', 'domain-read', 'pathway-read', 'quiz-read'] as $limiter) {
            RateLimiter::for($limiter, fn (Request $request): Limit => $problemLimit(
                Limit::perMinute(60)->by($ipKey($request)),
            ));
        }
    }
}
