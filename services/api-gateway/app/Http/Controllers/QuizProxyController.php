<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class QuizProxyController extends Controller
{
    public function getQuizzes(Request $request)
    {
        try {
            $res = Http::withHeaders($this->getInternalHeaders($request))
                ->get($this->getQuizSvcUrl() . "/api/internal/quizzes");

            $body = $res->body();
            $body = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE");
            $data = json_decode($body, true);
            
            return response()->json($data, $res->status());
        } catch (\Throwable $e) {
            Log::error('Error fetching quizzes from quiz-svc', [
                'message' => $e->getMessage(),
            ]);
            return response()->json([
                'error' => 'quiz-svc unavailable',
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    public function createQuiz(Request $request)
    {
        try {
            $res = Http::withHeaders($this->getInternalHeaders($request))
                ->post($this->getQuizSvcUrl() . '/api/internal/quizzes', $request->all());

            $body = $res->body();
            $body = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE");
            $data = json_decode($body, true);
            
            return response()->json($data, $res->status());
        } catch (\Throwable $e) {
            Log::error('Error creating quiz via quiz-svc', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'quiz-svc unavailable',
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    public function getQuiz(Request $request, $id)
    {
        try {
            $res = Http::withHeaders($this->getInternalHeaders($request))
                ->get($this->getQuizSvcUrl() . "/api/internal/quizzes/{$id}");

            $body = $res->body();
            $body = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE");
            $data = json_decode($body, true);
            
            return response()->json($data, $res->status());
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'quiz-svc unavailable',
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    public function updateQuiz(Request $request, $id)
    {
        try {
            $res = Http::withHeaders($this->getInternalHeaders($request))
                ->put($this->getQuizSvcUrl() . "/api/internal/quizzes/{$id}", $request->all());

            $body = $res->body();
            $body = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE");
            $data = json_decode($body, true);
            
            return response()->json($data, $res->status());
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'quiz-svc unavailable',
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    public function deleteQuiz(Request $request, $id)
    {
        try {
            $res = Http::withHeaders($this->getInternalHeaders($request))
                ->delete($this->getQuizSvcUrl() . "/api/internal/quizzes/{$id}");

            $body = $res->body();
            $body = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE");
            $data = json_decode($body, true);
            
            return response()->json($data, $res->status());
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'quiz-svc unavailable',
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    public function getQuizzesByOrganization(Request $request, $orgId)
    {
        try {
            $res = Http::withHeaders($this->getInternalHeaders($request))
                ->get($this->getQuizSvcUrl() . "/api/internal/organizations/{$orgId}/quizzes");

            $body = $res->body();
            $body = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE");
            $data = json_decode($body, true);
            
            return response()->json($data, $res->status());
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'quiz-svc unavailable',
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    public function health(Request $request)
    {
        try {
            $res = Http::withHeaders($this->getInternalHeaders($request))
                ->get($this->getQuizSvcUrl() . '/api/health');

            $body = $res->body();
            $body = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE");
            $quizResponse = json_decode($body, true);

            return response()->json([
                'quiz_svc_status' => $res->successful() ? 'OK' : 'ERROR',
                'quiz_response' => $quizResponse,
                'user_id' => optional($request->user())->id,
            ], $res->status());
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'quiz-svc unavailable',
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    private function getQuizSvcUrl()
    {
        return env('QUIZ_SVC_URL', 'http://localhost:8002');
    }

    private function getInternalHeaders(Request $request)
    {
        $headers = [
            'X-Internal-Auth' => env('INTERNAL_SHARED_SECRET', 'devsecret123'),
            'X-User-Id' => optional($request->user())->id,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];

        Log::debug('Forwarding headers to quiz-svc', [
            'X-Internal-Auth' => $headers['X-Internal-Auth'] ? '***present***' : 'MISSING',
            'X-User-Id' => $headers['X-User-Id'],
        ]);

        return $headers;
    }
}