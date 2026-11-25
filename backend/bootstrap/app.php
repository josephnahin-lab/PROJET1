<?php

use App\Http\Middleware\RejectBearerToken;
use App\Http\Responses\ProblemResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->alias(['reject-bearer' => RejectBearerToken::class]);
        $middleware->prependToPriorityList(AuthenticatesRequests::class, RejectBearerToken::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (ValidationException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return ProblemResponse::make(422, 'Unprocessable Content', 'La requête est invalide.', [
                'code' => 'VALIDATION_ERROR',
                'errors' => $exception->errors(),
            ]);
        });

        $exceptions->render(function (AuthenticationException $exception, Request $request) {
            return $request->is('api/*')
                ? ProblemResponse::make(401, 'Unauthorized', 'Une authentification est requise.')
                : null;
        });

        $exceptions->render(function (AuthorizationException $exception, Request $request) {
            return $request->is('api/*')
                ? ProblemResponse::make(403, 'Forbidden', 'Cette action n’est pas autorisée.')
                : null;
        });

        $exceptions->render(function (ModelNotFoundException|NotFoundHttpException $exception, Request $request) {
            return $request->is('api/*')
                ? ProblemResponse::make(404, 'Not Found', 'La ressource demandée est introuvable.')
                : null;
        });

        $exceptions->render(function (ThrottleRequestsException $exception, Request $request) {
            return $request->is('api/*')
                ? ProblemResponse::make(429, 'Too Many Requests', 'Trop de requêtes. Réessayez après le délai indiqué.', headers: $exception->getHeaders())
                : null;
        });
    })->create();
