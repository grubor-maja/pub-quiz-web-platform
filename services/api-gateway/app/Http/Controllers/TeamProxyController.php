<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TeamProxyController extends Controller
{
    private string $base;
    private string $secret;

    public function __construct()
    {
        $this->base   = rtrim(env('QUIZ_SVC_URL', 'http://localhost:8002'), '/');
        $this->secret = env('INTERNAL_SHARED_SECRET', 'devsecret123');
    }

    private function headers(Request $req): array
    {
        return [
            'X-Internal-Auth' => $this->secret,
            'X-User-Id'       => optional($req->user())->id,
            'Accept'          => 'application/json',
            'Content-Type'    => 'application/json',
        ];
    }

    private function passThrough($resp)
    {
        $data = json_decode(ltrim($resp->body(), "\xEF\xBB\xBF\xFE\xFF\xFF\xFE"), true);
        return response()->json($data, $resp->status());
    }

    // ---- TEAM CRUD ----

    public function getTeamsByOrganization(Request $req, $orgId)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->get("{$this->base}/api/internal/orgs/{$orgId}/teams");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'quiz-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function createTeam(Request $req)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->post("{$this->base}/api/internal/teams", $req->all());
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'quiz-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function getTeam(Request $req, $id)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->get("{$this->base}/api/internal/teams/{$id}");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'quiz-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function updateTeam(Request $req, $id)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->put("{$this->base}/api/internal/teams/{$id}", $req->all());
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'quiz-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function deleteTeam(Request $req, $id)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->delete("{$this->base}/api/internal/teams/{$id}");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'quiz-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    // ---- QUIZ REGISTRATIONS ----

    public function applyTeamForQuiz(Request $req, $teamId)
    {
        return $this->simpleForward($req, "teams/{$teamId}/apply-quiz");
    }

    public function approveTeamApplication(Request $req, $teamId)
    {
        return $this->simpleForward($req, "teams/{$teamId}/approve-quiz");
    }

    public function rejectTeamApplication(Request $req, $teamId)
    {
        return $this->simpleForward($req, "teams/{$teamId}/reject-quiz");
    }

    public function registerTeamForQuiz(Request $req, $teamId)
    {
        return $this->simpleForward($req, "teams/{$teamId}/register-quiz");
    }

    public function unregisterTeamFromQuiz(Request $req, $teamId)
    {
        return $this->simpleForward($req, "teams/{$teamId}/unregister-quiz");
    }

    public function getQuizTeams(Request $req, $quizId)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->get("{$this->base}/api/internal/quizzes/{$quizId}/teams");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'quiz-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    // ---- HEALTH ----

    public function health(Request $req)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->get("{$this->base}/api/health");

            return response()->json([
                'team_proxy' => 'ok',
                'quiz_svc'   => $r->successful() ? 'ok' : 'error',
                'quiz_data'  => json_decode($r->body(), true),
            ], $r->status());
        } catch (\Throwable $e) {
            return response()->json(['team_proxy' => 'ok', 'quiz_svc' => 'error', 'msg' => $e->getMessage()], 503);
        }
    }

    // ---- Helper for POST forwards ----

    private function simpleForward(Request $req, string $path)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->post("{$this->base}/api/internal/{$path}", $req->all());
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'quiz-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }
}
