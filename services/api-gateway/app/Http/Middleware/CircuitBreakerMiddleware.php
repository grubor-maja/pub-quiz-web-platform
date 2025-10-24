<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\CircuitBreaker;
use App\Services\CircuitBreakerOpenException;
use Symfony\Component\HttpFoundation\Response;

class CircuitBreakerMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $serviceName = 'default'): Response
    {
        $circuitBreaker = new CircuitBreaker(
            serviceName: $serviceName,
            failureThreshold: config('circuitbreaker.failure_threshold', 5),
            successThreshold: config('circuitbreaker.success_threshold', 2),
            timeout: config('circuitbreaker.timeout', 60),
            halfOpenTimeout: config('circuitbreaker.half_open_timeout', 30)
        );

        try {
            $response = $circuitBreaker->call(function () use ($next, $request) {
                return $next($request);
            });

            return $response;

        } catch (CircuitBreakerOpenException $e) {
            return response()->json([
                'error' => 'Service Temporarily Unavailable',
                'message' => $e->getMessage(),
                'service' => $serviceName,
                'circuit_breaker_status' => 'OPEN',
                'retry_after' => config('circuitbreaker.timeout', 60) . ' seconds'
            ], 503);
        }
    }
}

