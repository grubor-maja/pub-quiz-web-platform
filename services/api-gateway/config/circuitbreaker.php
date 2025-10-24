<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Circuit Breaker Configuration
    |--------------------------------------------------------------------------
    |

    |
    */

    'failure_threshold' => env('CIRCUIT_BREAKER_FAILURE_THRESHOLD', 5),

    'success_threshold' => env('CIRCUIT_BREAKER_SUCCESS_THRESHOLD', 2),

    'timeout' => env('CIRCUIT_BREAKER_TIMEOUT', 60),

    'half_open_timeout' => env('CIRCUIT_BREAKER_HALF_OPEN_TIMEOUT', 30),

    'fallback_messages' => [
        'org-svc' => 'Organization service is temporarily unavailable. Please try again later.',
        'quiz-svc' => 'Quiz service is temporarily unavailable. Please try again later.',
        'team-svc' => 'Team service is temporarily unavailable. Please try again later.',
        'league-svc' => 'League service is temporarily unavailable. Please try again later.',
    ],
];

