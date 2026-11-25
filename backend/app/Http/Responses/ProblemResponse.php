<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ProblemResponse
{
    /**
     * @param  array<string, mixed>  $additional
     * @param  array<string, string>  $headers
     */
    public static function make(
        int $status,
        string $title,
        ?string $detail = null,
        array $additional = [],
        array $headers = [],
    ): JsonResponse {
        return response()->json(array_filter([
            'type' => 'about:blank',
            'title' => $title,
            'status' => $status,
            'detail' => $detail,
            'traceId' => (string) Str::uuid(),
            ...$additional,
        ], static fn (mixed $value): bool => $value !== null), $status, [
            'Content-Type' => 'application/problem+json',
            ...$headers,
        ]);
    }

    public static function featureDisabled(string $feature): JsonResponse
    {
        return self::make(503, 'Service Unavailable', 'Cette fonctionnalité est temporairement désactivée.', [
            'code' => 'FEATURE_DISABLED',
            'feature' => $feature,
        ]);
    }
}
