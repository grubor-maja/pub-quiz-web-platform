<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class LeagueProxyController extends Controller
{
    private $quizServiceUrl;

    public function __construct()
    {
        $this->quizServiceUrl = config('services.quiz_service.url') . '/api/internal';
    }

    /**
     * Get all leagues (public)
     */
    public function getLeagues(Request $request)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id ?? 'guest',
            ])->get("{$this->quizServiceUrl}/leagues");

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to fetch leagues',
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
     * Get leagues by organization
     */
    public function getLeaguesByOrganization(Request $request, $orgId)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id ?? 'guest',
            ])->get("{$this->quizServiceUrl}/orgs/{$orgId}/leagues");

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to fetch organization leagues',
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
     * Get league by ID
     */
    public function getLeague(Request $request, $id)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id ?? 'guest',
            ])->get("{$this->quizServiceUrl}/leagues/{$id}");

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to fetch league',
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
     * Create league
     */
    public function createLeague(Request $request)
    {
        try {
            $user = $request->user();
            
            // Ensure organization data is loaded
            if ($user) {
                $user->loadOrganizationData();
            }
            
            // Debug logging
            \Log::info('League creation proxy', [
                'user_id' => $user ? $user->id : 'null',
                'user_role' => $user ? $user->role : 'null',
                'user_org_id' => $user ? $user->organization_id : 'null',
                'user_org_role' => $user ? $user->organization_role : 'null',
                'request_data' => $request->all()
            ]);
            \Log::info("SALJEM OVDE");
            \Log::info("{$this->quizServiceUrl}/leagues", $request->all());
            
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $user ? $user->id : null,
                'X-User-Role' => $user ? $user->organization_role : null,
                'X-User-Org-Id' => $user ? $user->organization_id : null,
                'Content-Type' => 'application/json',
            ])->post("{$this->quizServiceUrl}/leagues", $request->all());

            if ($response->failed()) {
                \Log::error('League creation failed', [
                    'status' => $response->status(),
                    'response' => $response->json(),
                    'error' => 'Failed to create league',
                    'request_data' => $request->all()
                ]);
                return response()->json([
                    'error' => 'Failed to create league',
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
     * Update league
     */
    public function updateLeague(Request $request, $id)
    {
        try {
            $user = $request->user();
            if ($user) {
                $user->loadOrganizationData();
            }
            
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $user ? $user->id : null,
                'X-User-Role' => $user ? $user->organization_role : null,
                'X-User-Org-Id' => $user ? $user->organization_id : null,
                'Content-Type' => 'application/json',
            ])->put("{$this->quizServiceUrl}/leagues/{$id}", $request->all());

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to update league',
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
     * Delete league
     */
    public function deleteLeague(Request $request, $id)
    {
        try {
            $user = $request->user();
            if ($user) {
                $user->loadOrganizationData();
            }
            
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $user ? $user->id : null,
                'X-User-Role' => $user ? $user->organization_role : null,
                'X-User-Org-Id' => $user ? $user->organization_id : null,
            ])->delete("{$this->quizServiceUrl}/leagues/{$id}");

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to delete league',
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
     * Add team to league
     */
    public function addTeamToLeague(Request $request, $leagueId)
    {
        try {
            $user = $request->user();
            if ($user) {
                $user->loadOrganizationData();
            }
            
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $user ? $user->id : null,
                'X-User-Role' => $user ? $user->organization_role : null,
                'X-User-Org-Id' => $user ? $user->organization_id : null,
                'Content-Type' => 'application/json',
            ])->post("{$this->quizServiceUrl}/leagues/{$leagueId}/teams", $request->all());

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to add team to league',
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
     * Remove team from league
     */
    public function removeTeamFromLeague(Request $request, $leagueId, $teamId)
    {
        try {
            $user = $request->user();
            if ($user) {
                $user->loadOrganizationData();
            }
            
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $user ? $user->id : null,
                'X-User-Role' => $user ? $user->organization_role : null,
                'X-User-Org-Id' => $user ? $user->organization_id : null,
            ])->delete("{$this->quizServiceUrl}/leagues/{$leagueId}/teams/{$teamId}");

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to remove team from league',
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
     * Enter round results
     */
    public function enterRoundResults(Request $request, $leagueId)
    {
        try {
            $user = $request->user();
            if ($user) {
                $user->loadOrganizationData();
            }
            
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $user ? $user->id : null,
                'X-User-Role' => $user ? $user->organization_role : null,
                'X-User-Org-Id' => $user ? $user->organization_id : null,
                'Content-Type' => 'application/json',
            ])->post("{$this->quizServiceUrl}/leagues/{$leagueId}/rounds", $request->all());

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to enter round results',
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
     * Get league table
     */
    public function getLeagueTable(Request $request, $leagueId)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id ?? 'guest',
            ])->get("{$this->quizServiceUrl}/leagues/{$leagueId}/table");

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to fetch league table',
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
     * Health check
     */
    public function health(Request $request)
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'X-User-Id' => $request->user()->id ?? 'guest',
            ])->get(config('services.quiz_service.url') . '/api/health');

            return response()->json([
                'league_proxy' => 'ok',
                'quiz_service' => $response->successful() ? 'ok' : 'error',
                'quiz_service_data' => $response->json()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'league_proxy' => 'ok',
                'quiz_service' => 'error',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
