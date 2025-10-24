<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CircuitBreaker
{
    // States
    const STATE_CLOSED = 'closed';
    const STATE_OPEN = 'open';
    const STATE_HALF_OPEN = 'half_open';
    private string $serviceName;
    private int $failureThreshold;
    private int $successThreshold;
    private int $timeout;
    private int $halfOpenTimeout;

    public function __construct(
        string $serviceName,
        int $failureThreshold = 5,
        int $successThreshold = 2,
        int $timeout = 60,
        int $halfOpenTimeout = 30
    ) {
        $this->serviceName = $serviceName;
        $this->failureThreshold = $failureThreshold;
        $this->successThreshold = $successThreshold;
        $this->timeout = $timeout;
        $this->halfOpenTimeout = $halfOpenTimeout;
    }


    public function call(callable $callback)
    {
        $state = $this->getState();

        Log::info("CircuitBreaker [{$this->serviceName}] - State: {$state}");

        if ($state === self::STATE_OPEN) {
            if ($this->shouldAttemptReset()) {
                Log::info("CircuitBreaker [{$this->serviceName}] - Attempting reset to HALF_OPEN");
                $this->setState(self::STATE_HALF_OPEN);
            } else {
                Log::warning("CircuitBreaker [{$this->serviceName}] - Circuit is OPEN, request blocked");
                throw new CircuitBreakerOpenException(
                    "Service {$this->serviceName} is temporarily unavailable. Circuit breaker is OPEN."
                );
            }
        }

        try {
            $result = $callback();

            $this->onSuccess();
            return $result;

        } catch (\Throwable $e) {
            $this->onFailure();
            throw $e;
        }
    }

    /**
     * Beleži uspešan poziv
     */
    private function onSuccess(): void
    {
        $state = $this->getState();

        if ($state === self::STATE_HALF_OPEN) {
            $successCount = $this->incrementSuccessCount();
            Log::info("CircuitBreaker [{$this->serviceName}] - Success in HALF_OPEN ({$successCount}/{$this->successThreshold})");

            if ($successCount >= $this->successThreshold) {
                $this->reset();
                Log::info("CircuitBreaker [{$this->serviceName}] - Circuit CLOSED after successful recovery");
            }
        } else if ($state === self::STATE_CLOSED) {
            $this->resetFailureCount();
        }
    }

    /**
     * Beleži neuspešan poziv
     */
    private function onFailure(): void
    {
        $failureCount = $this->incrementFailureCount();
        $state = $this->getState();

        Log::warning("CircuitBreaker [{$this->serviceName}] - Failure recorded ({$failureCount}/{$this->failureThreshold}) in state {$state}");

        if ($state === self::STATE_HALF_OPEN) {
            $this->trip();
            Log::error("CircuitBreaker [{$this->serviceName}] - Circuit REOPENED after failure in HALF_OPEN");
        } else if ($failureCount >= $this->failureThreshold) {
            $this->trip();
            Log::error("CircuitBreaker [{$this->serviceName}] - Circuit OPENED after {$failureCount} failures");
        }
    }

    /**
     * Otvara circuit breaker
     */
    private function trip(): void
    {
        $this->setState(self::STATE_OPEN);
        $this->resetFailureCount();
        $this->resetSuccessCount();
        Cache::put($this->getOpenedAtKey(), time(), $this->timeout * 2);
    }

    /**
     * Resetuje circuit breaker u zatvoreno stanje
     */
    private function reset(): void
    {
        $this->setState(self::STATE_CLOSED);
        $this->resetFailureCount();
        $this->resetSuccessCount();
        Cache::forget($this->getOpenedAtKey());
    }

    /**
     * Proverava da li je vreme da pokušamo reset
     */
    private function shouldAttemptReset(): bool
    {
        $openedAt = Cache::get($this->getOpenedAtKey());
        if (!$openedAt) {
            return true;
        }

        return (time() - $openedAt) >= $this->timeout;
    }

    // Helper methods za state management
    private function getState(): string
    {
        return Cache::get($this->getStateKey(), self::STATE_CLOSED);
    }

    private function setState(string $state): void
    {
        Cache::put($this->getStateKey(), $state, 3600);
    }

    private function incrementFailureCount(): int
    {
        $key = $this->getFailureCountKey();
        $count = Cache::get($key, 0) + 1;
        Cache::put($key, $count, 300); // 5 minuta
        return $count;
    }

    private function resetFailureCount(): void
    {
        Cache::forget($this->getFailureCountKey());
    }

    private function incrementSuccessCount(): int
    {
        $key = $this->getSuccessCountKey();
        $count = Cache::get($key, 0) + 1;
        Cache::put($key, $count, 300);
        return $count;
    }

    private function resetSuccessCount(): void
    {
        Cache::forget($this->getSuccessCountKey());
    }

    // Cache keys
    private function getStateKey(): string
    {
        return "circuit_breaker:{$this->serviceName}:state";
    }

    private function getFailureCountKey(): string
    {
        return "circuit_breaker:{$this->serviceName}:failures";
    }

    private function getSuccessCountKey(): string
    {
        return "circuit_breaker:{$this->serviceName}:successes";
    }

    private function getOpenedAtKey(): string
    {
        return "circuit_breaker:{$this->serviceName}:opened_at";
    }


    public function getStatus(): array
    {
        return [
            'service' => $this->serviceName,
            'state' => $this->getState(),
            'failure_count' => Cache::get($this->getFailureCountKey(), 0),
            'success_count' => Cache::get($this->getSuccessCountKey(), 0),
            'failure_threshold' => $this->failureThreshold,
            'success_threshold' => $this->successThreshold,
            'timeout' => $this->timeout,
            'opened_at' => Cache::get($this->getOpenedAtKey()),
        ];
    }
}

class CircuitBreakerOpenException extends \Exception
{
}

