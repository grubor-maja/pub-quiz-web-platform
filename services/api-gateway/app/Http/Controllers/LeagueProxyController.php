<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\Response as HttpResponse;

class LeagueProxyController extends Controller
{
    private string $base;

    public function __construct()
    {
        // npr. services.quiz_service.url = http://quiz-svc:8003
        $this->base = rtrim(config('services.quiz_service.url', env('QUIZ_SVC_URL', 'http://localhost:8003')), '/') . '/api/internal';
    }

    /** ------------------------- helpers ------------------------- */

    private function headers(Request $request): array
    {
        return [
            'X-Internal-Auth' => config('services.internal_auth_token', env('INTERNAL_SHARED_SECRET', 'devsecret123')),
            'X-User-Id'       => optional($request->user())->id, // može i null
            'Accept'          => 'application/json',
            'Content-Type'    => 'application/json',
        ];
    }

    private function json(HttpResponse $resp)
    {
        // robustno dekodiranje zbog BOM-a / duplog JSON-a
        $body  = $resp->body() ?? '';
        $clean = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE");
        $data  = json_decode($clean, true);
        if (json_last_error() === JSON_ERROR_NONE) return $data;

        $str = json_decode($clean, true);
        if (json_last_error() === JSON_ERROR_NONE && is_string($str)) {
            $data2 = json_decode($str, true);
            if (json_last_error() === JSON_ERROR_NONE) return $data2;
        }

        Log::warning('LeagueProxy json decode failed', [
            'status' => $resp->status(),
            'len'    => strlen($body),
            'err'    => json_last_error_msg(),
            'peek'   => substr($clean, 0, 128),
        ]);
        return null;
    }

    private function passThrough(HttpResponse $resp)
    {
        $payload = $this->json($resp);
        return response()->json($payload, $resp->status());
    }

    /** ------------------------- public GET ------------------------- */

    public function getLeagues(Request $request)
    {
        try {
            $r = Http::timeout(10)->withHeaders($this->headers($request))
                ->get("{$this->base}/leagues");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Service communication error', 'message' => $e->getMessage()], 500);
        }
    }

    public function getLeaguesByOrganization(Request $request, $orgId)
    {
        try {
            $r = Http::timeout(10)->withHeaders($this->headers($request))
                ->get("{$this->base}/orgs/{$orgId}/leagues");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Service communication error', 'message' => $e->getMessage()], 500);
        }
    }

    public function getLeague(Request $request, $id)
    {
        try {
            $r = Http::timeout(10)->withHeaders($this->headers($request))
                ->get("{$this->base}/leagues/{$id}");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Service communication error', 'message' => $e->getMessage()], 500);
        }
    }

    public function getLeagueTable(Request $request, $leagueId)
    {
        try {
            $r = Http::timeout(10)->withHeaders($this->headers($request))
                ->get("{$this->base}/leagues/{$leagueId}/table");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Service communication error', 'message' => $e->getMessage()], 500);
        }
    }

    /** ------------------------- mutations (auth:sanctum na rutama) ------------------------- */

    public function createLeague(Request $request)
    {
        try {
            $r = Http::timeout(15)->withHeaders($this->headers($request))
                ->post("{$this->base}/leagues", $request->all());
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Service communication error', 'message' => $e->getMessage()], 500);
        }
    }

    public function updateLeague(Request $request, $id)
    {
        try {
            $r = Http::timeout(15)->withHeaders($this->headers($request))
                ->put("{$this->base}/leagues/{$id}", $request->all());
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Service communication error', 'message' => $e->getMessage()], 500);
        }
    }

    public function deleteLeague(Request $request, $id)
    {
        try {
            $r = Http::timeout(15)->withHeaders($this->headers($request))
                ->delete("{$this->base}/leagues/{$id}");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Service communication error', 'message' => $e->getMessage()], 500);
        }
    }

    public function addTeamToLeague(Request $request, $leagueId)
    {
        try {
            $r = Http::timeout(15)->withHeaders($this->headers($request))
                ->post("{$this->base}/leagues/{$leagueId}/teams", $request->all());
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Service communication error', 'message' => $e->getMessage()], 500);
        }
    }

    public function removeTeamFromLeague(Request $request, $leagueId, $teamId)
    {
        try {
            $r = Http::timeout(15)->withHeaders($this->headers($request))
                ->delete("{$this->base}/leagues/{$leagueId}/teams/{$teamId}");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Service communication error', 'message' => $e->getMessage()], 500);
        }
    }

    public function enterRoundResults(Request $request, $leagueId)
    {
        try {
            $r = Http::timeout(15)->withHeaders($this->headers($request))
                ->post("{$this->base}/leagues/{$leagueId}/rounds", $request->all());
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Service communication error', 'message' => $e->getMessage()], 500);
        }
    }

    /** ------------------------- health ------------------------- */

    public function health(Request $request)
    {
        try {
            $r = Http::timeout(5)->withHeaders($this->headers($request))
                ->get(rtrim(config('services.quiz_service.url', env('QUIZ_SVC_URL', 'http://localhost:8003')), '/') . '/api/health');

            return response()->json([
                'league_proxy' => 'ok',
                'quiz_service' => $r->successful() ? 'ok' : 'error',
                'quiz_service_data' => $this->json($r),
            ], $r->status());
        } catch (\Throwable $e) {
            return response()->json([
                'league_proxy' => 'ok',
                'quiz_service' => 'error',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
