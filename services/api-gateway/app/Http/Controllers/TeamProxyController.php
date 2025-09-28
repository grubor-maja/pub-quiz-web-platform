<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TeamProxyController extends Controller
{
    private $quizServiceUrl;

    public function __construct()
    {
        $this->quizServiceUrl = config('services.quiz_service.url') . '/api/internal';
    }

    /**
     * Get teams by organization
     */
    public function getTeamsByOrganization(Request $request, $orgId)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id,
                'X-User-Role' => $request->user()->role,
                'X-User-Org-Id' => $request->user()->organization_id,
            ])->get("{$this->quizServiceUrl}/orgs/{$orgId}/teams");

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to fetch teams',
                    'details' => $response->json()
                ], $response->status());
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Service communication error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new team
     */
    public function createTeam(Request $request)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id,
                'X-User-Role' => $request->user()->role,
                'X-User-Org-Id' => $request->user()->organization_id,
                'Content-Type' => 'application/json',
            ])->post("{$this->quizServiceUrl}/teams", $request->all());

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to create team',
                    'details' => $response->json()
                ], $response->status());
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Service communication error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get team by ID
     */
    public function getTeam(Request $request, $id)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id,
                'X-User-Role' => $request->user()->role,
                'X-User-Org-Id' => $request->user()->organization_id,
            ])->get("{$this->quizServiceUrl}/teams/{$id}");

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to fetch team',
                    'details' => $response->json()
                ], $response->status());
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Service communication error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update team
     */
    public function updateTeam(Request $request, $id)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id,
                'X-User-Role' => $request->user()->role,
                'X-User-Org-Id' => $request->user()->organization_id,
                'Content-Type' => 'application/json',
            ])->put("{$this->quizServiceUrl}/teams/{$id}", $request->all());

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to update team',
                    'details' => $response->json()
                ], $response->status());
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Service communication error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete team
     */
    public function deleteTeam(Request $request, $id)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id,
                'X-User-Role' => $request->user()->role,
                'X-User-Org-Id' => $request->user()->organization_id,
            ])->delete("{$this->quizServiceUrl}/teams/{$id}");

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to delete team',
                    'details' => $response->json()
                ], $response->status());
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Service communication error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Apply team for quiz (pending status)
     */
    public function applyTeamForQuiz(Request $request, $teamId)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id,
                'X-User-Role' => $request->user()->role,
                'X-User-Org-Id' => $request->user()->organization_id,
                'Content-Type' => 'application/json',
            ])->post("{$this->quizServiceUrl}/teams/{$teamId}/apply-quiz", $request->all());

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to apply team for quiz',
                    'details' => $response->json()
                ], $response->status());
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Service communication error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve team application (admin only)
     */
    public function approveTeamApplication(Request $request, $teamId)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id,
                'X-User-Role' => $request->user()->role,
                'X-User-Org-Id' => $request->user()->organization_id,
                'Content-Type' => 'application/json',
            ])->post("{$this->quizServiceUrl}/teams/{$teamId}/approve-quiz", $request->all());

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to approve team application',
                    'details' => $response->json()
                ], $response->status());
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Service communication error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject team application (admin only)
     */
    public function rejectTeamApplication(Request $request, $teamId)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id,
                'X-User-Role' => $request->user()->role,
                'X-User-Org-Id' => $request->user()->organization_id,
                'Content-Type' => 'application/json',
            ])->post("{$this->quizServiceUrl}/teams/{$teamId}/reject-quiz", $request->all());

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to reject team application',
                    'details' => $response->json()
                ], $response->status());
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Service communication error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Register team for quiz
     */
    public function registerTeamForQuiz(Request $request, $teamId)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id,
                'X-User-Role' => $request->user()->role,
                'X-User-Org-Id' => $request->user()->organization_id,
                'Content-Type' => 'application/json',
            ])->post("{$this->quizServiceUrl}/teams/{$teamId}/register-quiz", $request->all());

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to register team for quiz',
                    'details' => $response->json()
                ], $response->status());
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Service communication error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unregister team from quiz
     */
    public function unregisterTeamFromQuiz(Request $request, $teamId)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id,
                'X-User-Role' => $request->user()->role,
                'X-User-Org-Id' => $request->user()->organization_id,
                'Content-Type' => 'application/json',
            ])->post("{$this->quizServiceUrl}/teams/{$teamId}/unregister-quiz", $request->all());

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to unregister team from quiz',
                    'details' => $response->json()
                ], $response->status());
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Service communication error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get teams registered for a quiz
     */
    public function getQuizTeams(Request $request, $quizId)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id,
                'X-User-Role' => $request->user()->role,
                'X-User-Org-Id' => $request->user()->organization_id,
            ])->get("{$this->quizServiceUrl}/quizzes/{$quizId}/teams");

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to fetch quiz teams',
                    'details' => $response->json()
                ], $response->status());
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Service communication error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Health check for quiz service
     */
    public function health(Request $request)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id ?? 'guest',
            ])->get(config('services.quiz_service.url') . '/api/health');

            return response()->json([
                'team_proxy' => 'ok',
                'quiz_service' => $response->successful() ? 'ok' : 'error',
                'quiz_service_data' => $response->json()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'team_proxy' => 'ok',
                'quiz_service' => 'error',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}