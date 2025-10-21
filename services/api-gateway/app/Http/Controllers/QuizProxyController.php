<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class QuizProxyController extends Controller
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
        $userId = null;
        try {
            $userId = optional($req->user())->id;
        } catch (\Exception $e) {
            \Log::warning('User not authenticated for internal request');
        }

        return [
            'X-Internal-Auth' => $this->secret,
            'X-User-Id'       => $userId,
            'Accept'          => 'application/json',
            'Content-Type'    => 'application/json',
        ];
    }

    private function passThrough($resp)
    {
        $data = json_decode(ltrim($resp->body(), "\xEF\xBB\xBF\xFE\xFF\xFF\xFE"), true);
        return response()->json($data, $resp->status());
    }

    public function getQuizzes(Request $req)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->get("{$this->base}/api/internal/quizzes");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'quiz-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function getQuiz(Request $req, $id)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->get("{$this->base}/api/internal/quizzes/{$id}");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'quiz-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function getQuizzesByOrganization(Request $req, $orgId)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->get("{$this->base}/api/internal/orgs/{$orgId}/quizzes");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'quiz-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }
    public function getQuizzesByOrg(Request $req, $orgId)
        {
            try {
                \Log::info('Forwarding headers to quiz-11', $this->headers($req));

                $r = Http::withHeaders($this->headers($req))
                    ->get("{$this->base}/api/internal/orgs/{$orgId}/quizzes");
                \Log::info('Forwarding headers to quiz-svc', $this->headers($req));
                return $this->passThrough($r);
            } catch (\Throwable $e) {
                return response()->json(['error' => 'quiz-svc unavailable', 'msg' => $e->getMessage()], 503);
            }
        }
    public function createQuiz(Request $req)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->post("{$this->base}/api/internal/quizzes", $req->all());
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'quiz-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function updateQuiz(Request $req, $id)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->put("{$this->base}/api/internal/quizzes/{$id}", $req->all());
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'quiz-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function deleteQuiz(Request $req, $id)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->delete("{$this->base}/api/internal/quizzes/{$id}");
            return $this->passThrough($r);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'quiz-svc unavailable', 'msg' => $e->getMessage()], 503);
        }
    }

    public function health(Request $req)
    {
        try {
            $r = Http::withHeaders($this->headers($req))
                ->get("{$this->base}/api/health");

            return response()->json([
                'quiz_proxy' => 'ok',
                'quiz_svc'   => $r->successful() ? 'ok' : 'error',
                'quiz_data'  => json_decode($r->body(), true),
            ], $r->status());
        } catch (\Throwable $e) {
            return response()->json(['quiz_proxy' => 'ok', 'quiz_svc' => 'error', 'msg' => $e->getMessage()], 503);
        }
    }
}
