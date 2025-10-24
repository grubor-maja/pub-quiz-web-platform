<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\CircuitBreaker;
use App\Services\CircuitBreakerOpenException;

class OrgProxyController extends Controller
{
    private string $base;
    private string $secret;
    private CircuitBreaker $circuitBreaker;

    public function __construct()
    {
        $this->base   = rtrim(env('ORG_SVC_URL', 'http://localhost:8001'), '/');
        $this->secret = env('INTERNAL_SHARED_SECRET', 'devsecret123');
        $this->circuitBreaker = new CircuitBreaker('org-svc');
    }

    private function headers(Request $request): array
    {
        return [
            'X-Internal-Auth' => $this->secret,
            'X-User-Id'       => optional($request->user())->id,
            'Accept'          => 'application/json',
            'Content-Type'    => 'application/json',
        ];
    }

    private function passThrough($resp)
    {
        $data = json_decode(ltrim($resp->body(), "\xEF\xBB\xBF\xFE\xFF\xFF\xFE"), true);
        return response()->json($data, $resp->status());
    }

    public function getOrganizations(Request $req)
    {
        try {
            return $this->circuitBreaker->call(function () use ($req) {
                $r = Http::withHeaders($this->headers($req))
                    ->get("{$this->base}/api/internal/organizations");
                return $this->passThrough($r);
            });
        } catch (CircuitBreakerOpenException $e) {
            return response()->json(['error' => 'org-svc circuit breaker open', 'msg' => $e->getMessage()], 503);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'org-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function getOrganization(Request $req, $id)
    {
        try {
            return $this->circuitBreaker->call(function () use ($req, $id) {
                $r = Http::withHeaders($this->headers($req))
                    ->get("{$this->base}/api/internal/organizations/{$id}");
                return $this->passThrough($r);
            });
        } catch (CircuitBreakerOpenException $e) {
            return response()->json(['error' => 'org-svc circuit breaker open', 'msg' => $e->getMessage()], 503);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'org-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function createOrganization(Request $req)
    {
        try {
            return $this->circuitBreaker->call(function () use ($req) {
                $r = Http::withHeaders($this->headers($req))
                    ->post("{$this->base}/api/internal/organizations", $req->all());
                return $this->passThrough($r);
            });
        } catch (CircuitBreakerOpenException $e) {
            return response()->json(['error' => 'org-svc circuit breaker open', 'msg' => $e->getMessage()], 503);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'org-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function updateOrganization(Request $req, $id)
    {
        try {
            return $this->circuitBreaker->call(function () use ($req, $id) {
                $r = Http::withHeaders($this->headers($req))
                    ->put("{$this->base}/api/internal/organizations/{$id}", $req->all());
                return $this->passThrough($r);
            });
        } catch (CircuitBreakerOpenException $e) {
            return response()->json(['error' => 'org-svc circuit breaker open', 'msg' => $e->getMessage()], 503);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'org-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function deleteOrganization(Request $req, $id)
    {
        try {
            return $this->circuitBreaker->call(function () use ($req, $id) {
                $r = Http::withHeaders($this->headers($req))
                    ->delete("{$this->base}/api/internal/organizations/{$id}");
                return $this->passThrough($r);
            });
        } catch (CircuitBreakerOpenException $e) {
            return response()->json(['error' => 'org-svc circuit breaker open', 'msg' => $e->getMessage()], 503);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'org-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function getMembers(Request $req, $id)
    {
        try {
            return $this->circuitBreaker->call(function () use ($req, $id) {
                $r = Http::withHeaders($this->headers($req))
                    ->get("{$this->base}/api/internal/organizations/{$id}/members");
                return $this->passThrough($r);
            });
        } catch (CircuitBreakerOpenException $e) {
            return response()->json(['error' => 'org-svc circuit breaker open', 'msg' => $e->getMessage()], 503);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'org-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function addMember(Request $req, $id)
    {
        try {
            return $this->circuitBreaker->call(function () use ($req, $id) {
                $r = Http::withHeaders($this->headers($req))
                    ->post("{$this->base}/api/internal/organizations/{$id}/members", $req->all());
                return $this->passThrough($r);
            });
        } catch (CircuitBreakerOpenException $e) {
            return response()->json(['error' => 'org-svc circuit breaker open', 'msg' => $e->getMessage()], 503);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'org-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function removeMember(Request $req, $id, $userId)
    {
        try {
            return $this->circuitBreaker->call(function () use ($req, $id, $userId) {
                $r = Http::withHeaders($this->headers($req))
                    ->delete("{$this->base}/api/internal/organizations/{$id}/members/{$userId}");
                return $this->passThrough($r);
            });
        } catch (CircuitBreakerOpenException $e) {
            return response()->json(['error' => 'org-svc circuit breaker open', 'msg' => $e->getMessage()], 503);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'org-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function updateMemberRole(Request $req, $id, $userId)
    {
        try {
            return $this->circuitBreaker->call(function () use ($req, $id, $userId) {
                $r = Http::withHeaders($this->headers($req))
                    ->put("{$this->base}/api/internal/organizations/{$id}/members/{$userId}", $req->all());
                return $this->passThrough($r);
            });
        } catch (CircuitBreakerOpenException $e) {
            return response()->json(['error' => 'org-svc circuit breaker open', 'msg' => $e->getMessage()], 503);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'org-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function health(Request $req)
    {
        try {
            return $this->circuitBreaker->call(function () use ($req) {
                $r = Http::withHeaders($this->headers($req))
                    ->get("{$this->base}/api/health");
                return response()->json([
                    'org_proxy' => 'ok',
                    'org_svc'   => $r->successful() ? 'ok' : 'error',
                    'org_data'  => json_decode($r->body(), true),
                ], $r->status());
            });
        } catch (CircuitBreakerOpenException $e) {
            return response()->json(['org_proxy' => 'ok', 'org_svc' => 'circuit_open', 'msg' => $e->getMessage()], 503);
        } catch (\Throwable $e) {
            return response()->json(['org_proxy' => 'ok', 'org_svc' => 'error', 'msg' => $e->getMessage()], 503);
        }
    }

    public function getUserOrganizations(Request $req)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->get("{$this->base}/api/internal/users/me/organizations");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'org-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }
}
