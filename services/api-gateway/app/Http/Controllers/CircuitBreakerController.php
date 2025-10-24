<?php

namespace App\Http\Controllers;

use App\Services\CircuitBreaker;
use Illuminate\Http\JsonResponse;

class CircuitBreakerController extends Controller
{

    public function status(): JsonResponse
    {
        $services = ['org-svc', 'quiz-svc', 'team-svc', 'league-svc'];
        $statuses = [];

        foreach ($services as $service) {
            $cb = new CircuitBreaker($service);
            $statuses[$service] = $cb->getStatus();
        }

        return response()->json([
            'circuit_breakers' => $statuses,
            'timestamp' => now()->toIso8601String()
        ]);
    }


    public function serviceStatus(string $service): JsonResponse
    {
        $cb = new CircuitBreaker($service);
        return response()->json($cb->getStatus());
    }
}

