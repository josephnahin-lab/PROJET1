<?php

namespace App\Http\Middleware;

use App\Http\Responses\ProblemResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RejectBearerToken
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken() !== null) {
            return ProblemResponse::make(401, 'Unauthorized', 'Cette API utilise uniquement les sessions navigateur.');
        }

        return $next($request);
    }
}
