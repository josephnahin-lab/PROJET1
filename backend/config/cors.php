<?php

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env(
            'FRONTEND_ORIGINS',
            'http://localhost:3000,http://127.0.0.1:3000',
        )),
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Accept',
        'Content-Type',
        'If-Match',
        'Idempotency-Key',
        'X-Requested-With',
        'X-XSRF-TOKEN',
    ],

    'exposed_headers' => ['ETag', 'Retry-After'],

    'max_age' => 0,

    'supports_credentials' => true,
];
