<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\League;
use App\Models\LeagueRound;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LeagueController extends Controller
{
    /**
     * Get all leagues (public)
     */
    public function index()
    {
        $leagues = League::with(['teams:id,name'])
                         ->where('is_active', true)
                         ->orderBy('organization_id')
                         ->orderBy('year', 'desc')
                         ->orderBy('season')
                         ->get();

        // Fetch organization names from org-svc
        try {
            $orgSvcUrl = config('services.org_service.url', env('ORG_SVC_URL', 'http://localhost:8001'));
            $internalSecret = config('services.internal_auth_token', env('INTERNAL_SHARED_SECRET', 'devsecret123'));

            $orgResponse = \Http::timeout(10)->withHeaders([
                'X-Internal-Auth' => $internalSecret,
                'Accept' => 'application/json',
            ])->get($orgSvcUrl . '/api/internal/organizations');

            if ($orgResponse->successful()) {
                $rawBody = $orgResponse->body();
                $cleanBody = ltrim($rawBody, "\xEF\xBB\xBF\x00\x20\x09\x0A\x0D");
                $organizations = json_decode($cleanBody, true);

                // Create a map of organization_id => organization_name
                $orgMap = [];
                if (is_array($organizations)) {
                    foreach ($organizations as $org) {
                        $orgMap[$org['id']] = $org['name'] ?? "Organizacija {$org['id']}";
                    }
                }

                // Add organization_name to each league
                $leagues->transform(function ($league) use ($orgMap) {
                    $league->organization_name = $orgMap[$league->organization_id] ?? "Organizacija {$league->organization_id}";
                    return $league;
                });
            } else {
                // If org-svc is unavailable, use fallback names
                $leagues->transform(function ($league) {
                    $league->organization_name = "Organizacija {$league->organization_id}";
                    return $league;
                });
            }
        } catch (\Exception $e) {
            \Log::error('Failed to fetch organization names for leagues', ['error' => $e->getMessage()]);
            // Use fallback names if request fails
            $leagues->transform(function ($league) {
                $league->organization_name = "Organizacija {$league->organization_id}";
                return $league;
            });
        }

        return response()->json($leagues);
    }

    /**
     * Get leagues by organization
     */
    public function listByOrg($orgId)
    {
        $leagues = League::where('organization_id', $orgId)
                         ->with(['teams'])
                         ->orderBy('year', 'desc')
                         ->orderBy('season')
                         ->get();

        // Recalculate stats for each league to ensure pivot data is fresh
        foreach ($leagues as $league) {
            $league->recalculateTeamStats();
            $league->load('teams'); // Reload with fresh pivot data

            // Map teams with pivot data explicitly
            $league->teams->transform(function ($team) {
                $team->total_points = $team->pivot->total_points ?? 0;
                $team->matches_played = $team->pivot->matches_played ?? 0;
                return $team;
            });
        }

        return response()->json($leagues);
    }

    /**
     * Create a new league
     */
    public function store(Request $request)
    {
        // Get user_id from request payload (sent from frontend)
        $requestUserId = (int) $request->input('user_id');
        $uid = $requestUserId ?: (int) $request->header('X-User-Id');

        \Log::info('League creation attempt', [
            'payload_user_id' => $requestUserId,
            'header_user_id' => (int) $request->header('X-User-Id'),
            'final_uid' => $uid,
            'request_data' => $request->all(),
        ]);

        abort_unless($uid, 401, 'Missing user ID');

        // Always fetch user's organization from org-svc using user_id
        $userRole = null;
        $userOrgId = null;

        try {
            $orgSvcUrl = config('services.org_service.url', env('ORG_SVC_URL', 'http://localhost:8001'));
            $internalSecret = config('services.internal_auth_token', env('INTERNAL_SHARED_SECRET', 'devsecret123'));

            \Log::info('Fetching user organization from org-svc', ['user_id' => $uid]);

            // Get all organizations
            $orgResponse = \Http::timeout(10)->withHeaders([
                'X-Internal-Auth' => $internalSecret,
                'Accept' => 'application/json',
            ])->get($orgSvcUrl . '/api/internal/organizations');

            if ($orgResponse->successful()) {
                $rawBody = $orgResponse->body();

                // Remove BOM and trim whitespace
                $cleanBody = ltrim($rawBody, "\xEF\xBB\xBF\x00\x20\x09\x0A\x0D");
                $organizations = json_decode($cleanBody, true);

                \Log::info('Organizations response from org-svc', [
                    'status' => $orgResponse->status(),
                    'raw_body_length' => strlen($rawBody),
                    'clean_body_length' => strlen($cleanBody),
                    'raw_body_first_20' => bin2hex(substr($rawBody, 0, 20)),
                    'clean_body_first_20' => bin2hex(substr($cleanBody, 0, 20)),
                    'organizations_count' => is_array($organizations) ? count($organizations) : 'not array',
                    'organizations_type' => gettype($organizations),
                    'json_last_error' => json_last_error_msg()
                ]);

                if (!is_array($organizations)) {
                    \Log::error('Invalid organizations response format', ['response' => $organizations]);
                    $organizations = [];
                }

                // Find user's organization by checking members
                foreach ($organizations as $org) {
                    $membersResponse = \Http::timeout(10)->withHeaders([
                        'X-Internal-Auth' => $internalSecret,
                        'Accept' => 'application/json',
                    ])->get($orgSvcUrl . "/api/internal/organizations/{$org['id']}/members");

                    if ($membersResponse->successful()) {
                        $rawMembersBody = $membersResponse->body();
                        $cleanMembersBody = ltrim($rawMembersBody, "\xEF\xBB\xBF\x00\x20\x09\x0A\x0D");
                        $members = json_decode($cleanMembersBody, true);

                        if (!is_array($members)) {
                            \Log::warning('Invalid members response format for org', [
                                'org_id' => $org['id'],
                                'response' => $members,
                                'raw_length' => strlen($rawMembersBody),
                                'clean_length' => strlen($cleanMembersBody),
                                'json_error' => json_last_error_msg()
                            ]);
                            continue;
                        }

                        foreach ($members as $member) {
                            if (isset($member['user_id']) && $member['user_id'] == $uid) {
                                $userOrgId = $org['id'];
                                $userRole = $member['role'] ?? 'MEMBER';
                                \Log::info('Found user organization', [
                                    'user_id' => $uid,
                                    'organization_id' => $userOrgId,
                                    'role' => $userRole
                                ]);
                                break 2;
                            }
                        }
                    }
                }
            } else {
                \Log::error('Failed to fetch organizations', ['status' => $orgResponse->status()]);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to fetch user organization from org-svc: ' . $e->getMessage());
        }

        // Check if we found user's organization
        if (!$userRole) {
            \Log::error('Could not determine user role', ['uid' => $uid]);
            abort(403, 'Insufficient permissions2 - role not found');
        }

        // Only ADMIN and SUPER_ADMIN allowed
        if ($userRole !== 'ADMIN' && $userRole !== 'SUPER_ADMIN') {
            \Log::error('Invalid role', ['uid' => $uid, 'userRole' => $userRole]);
            abort(403, 'Insufficient permissions3');
        }

        // If user is ADMIN, force their organization_id
        if ($userRole === 'ADMIN') {
            if (!$userOrgId) {
                \Log::error('Admin without organization', ['uid' => $uid, 'userRole' => $userRole]);
                abort(403, 'Insufficient permissions4 - organization not found');
            }

            // Force organization_id to be the admin's org (ignore supplied value)
            $request->merge(['organization_id' => $userOrgId]);
            \Log::info('Admin creating league - using discovered organization_id', ['uid' => $uid, 'organization_id' => $userOrgId]);
        }

        // Validation: SUPER_ADMIN must provide organization_id, ADMIN will have it merged above
        $validationRules = [
            'name' => 'required|string|min:2|max:100',
            'season' => 'required|in:Prolece,Leto,Jesen,Zima',
            'year' => 'required|integer|min:2020|max:2030',
            'total_rounds' => 'required|integer|min:1|max:50',
            'description' => 'nullable|string|max:1000',
        ];

        // For SUPER_ADMIN, organization_id is required in request
        if ($userRole === 'SUPER_ADMIN') {
            $validationRules['organization_id'] = 'required|integer';
        } else {
            // For ADMIN, organization_id should now be merged
            $validationRules['organization_id'] = 'required|integer';
        }

        $data = $request->validate($validationRules);

        // Extra safety: Admin can only create leagues for their organization
        if ($userRole === 'ADMIN' && $data['organization_id'] !== $userOrgId) {
            \Log::warning('Admin attempted to create league for different org', ['uid' => $uid, 'payload_org' => $data['organization_id'], 'discovered_org' => $userOrgId]);
            abort(403, 'You can only create leagues for your organization');
        }

        // Check if league with same name/season/year exists for this org
        $exists = League::where('organization_id', $data['organization_id'])
                       ->where('name', $data['name'])
                       ->where('season', $data['season'])
                       ->where('year', $data['year'])
                       ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'name' => ['Liga sa ovim nazivom već postoji za datu sezonu i godinu']
            ]);
        }

        $league = League::create(array_merge($data, ['created_by' => $uid]));

        return response()->json($league->load('teams'), 201);
    }

    /**
     * Get league by ID with full details
     */
    public function show($id)
    {
        $league = League::with([
            'teams',
            'rounds' => function($query) {
                $query->with('team:id,name')->orderBy('round_number')->orderBy('position');
            }
        ])->findOrFail($id);

        // Recalculate team stats before showing
        $league->recalculateTeamStats();

        // Reload teams with fresh pivot data
        $league->load('teams');

        // Map teams with pivot data explicitly
        $league->teams->transform(function ($team) {
            $team->total_points = $team->pivot->total_points ?? 0;
            $team->matches_played = $team->pivot->matches_played ?? 0;
            return $team;
        });

        // Calculate current table standings
        $league->current_table = $league->table;
        $league->completed_rounds_count = $league->completed_rounds;
        $league->next_round_number = $league->next_round;

        return response()->json($league);
    }

    /**
     * Update league
     */
    public function update($id, Request $request)
    {
        $uid = (int) $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');
        $userOrgId = (int) $request->header('X-User-Org-Id');

//        abort_unless($uid, 401, 'Missing user');
//        abort_unless($userRole, 401, 'Missing user role');

        $league = League::findOrFail($id);

        // Check permissions
        if ($userRole === 'ADMIN' && $league->organization_id !== $userOrgId) {
            abort(403, 'You can only modify leagues for your organization');
        }
        if ($userRole !== 'ADMIN' && $userRole !== 'SUPER_ADMIN') {
            abort(403, 'Insufficient permissions5');
        }

        $data = $request->validate([
            'name' => 'sometimes|required|string|min:2|max:100',
            'season' => 'sometimes|required|in:Prolece,Leto,Jesen,Zima',
            'year' => 'sometimes|required|integer|min:2020|max:2030',
            'total_rounds' => 'sometimes|required|integer|min:1|max:50',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'sometimes|boolean',
        ]);

        // Check uniqueness if name/season/year changed
        if (isset($data['name']) || isset($data['season']) || isset($data['year'])) {
            $exists = League::where('organization_id', $league->organization_id)
                           ->where('name', $data['name'] ?? $league->name)
                           ->where('season', $data['season'] ?? $league->season)
                           ->where('year', $data['year'] ?? $league->year)
                           ->where('id', '!=', $id)
                           ->exists();

            if ($exists) {
                throw ValidationException::withMessages([
                    'name' => ['Liga sa ovim nazivom već postoji za datu sezonu i godinu']
                ]);
            }
        }

        $league->update($data);

        return response()->json($league->load('teams'));
    }

    /**
     * Delete league
     */
    public function destroy($id, Request $request)
    {
        $uid = (int) $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');
        $userOrgId = (int) $request->header('X-User-Org-Id');

//        abort_unless($uid, 401, 'Missing user');
//        abort_unless($userRole, 401, 'Missing user role');

        $league = League::findOrFail($id);

        // Check permissions
        if ($userRole === 'ADMIN' && $league->organization_id !== $userOrgId) {
            abort(403, 'You can only delete leagues for your organization');
        }
        if ($userRole !== 'ADMIN' && $userRole !== 'SUPER_ADMIN') {
            abort(403, 'Insufficient permissions6');
        }

        // Check if league has any rounds played
        if ($league->rounds()->count() > 0) {
            return response()->json([
                'message' => 'Ne možete obrisati ligu koja ima unet rezultate. Dezaktivirajte je umesto brisanja.'
            ], 400);
        }

        $league->delete();

        return response()->json(null, 204);
    }

    /**
     * Add team to league
     */
    public function addTeam($leagueId, Request $request)
    {
        $uid = (int) $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');
        $userOrgId = (int) $request->header('X-User-Org-Id');

//        abort_unless($uid, 401, 'Missing user');
//        abort_unless($userRole, 401, 'Missing user role');

        $league = League::findOrFail($leagueId);

        // Check permissions
        if ($userRole === 'ADMIN' && $league->organization_id !== $userOrgId) {
            abort(403, 'You can only manage teams for leagues in your organization');
        }
//        if ($userRole !== 'ADMIN' && $userRole !== 'SUPER_ADMIN') {
//            abort(403, 'Insufficient permissions7');
//        }

        $data = $request->validate([
            'team_id' => 'required|integer|exists:teams,id'
        ]);

        $team = Team::findOrFail($data['team_id']);

        // Check if team is already in league
        if ($league->teams()->where('team_id', $team->id)->exists()) {
            return response()->json([
                'message' => 'Tim je već u ovoj ligi'
            ], 400);
        }

        // Add team to league
        $league->teams()->attach($team->id);

        return response()->json([
            'message' => 'Tim je uspešno dodat u ligu',
            'league' => $league->load('teams')
        ]);
    }

    /**
     * Remove team from league
     */
    public function removeTeam($leagueId, $teamId, Request $request)
    {
        $uid = (int) $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');
        $userOrgId = (int) $request->header('X-User-Org-Id');

//        abort_unless($uid, 401, 'Missing user');
//        abort_unless($userRole, 401, 'Missing user role');

        $league = League::findOrFail($leagueId);

        // Check permissions
        if ($userRole === 'ADMIN' && $league->organization_id !== $userOrgId) {
            abort(403, 'You can only manage teams for leagues in your organization');
        }
//        if ($userRole !== 'ADMIN' && $userRole !== 'SUPER_ADMIN') {
//            abort(403, 'Insufficient permissions8');
//        }

        // Check if team has played any rounds
        $hasRounds = $league->rounds()->where('team_id', $teamId)->exists();

        if ($hasRounds) {
            return response()->json([
                'message' => 'Ne možete ukloniti tim koji je već igrao u nekim kolima'
            ], 400);
        }

        $league->teams()->detach($teamId);

        return response()->json([
            'message' => 'Tim je uspešno uklonjen iz lige'
        ]);
    }

    /**
     * Enter round results
     */
    public function enterRoundResults($leagueId, Request $request)
    {
        $uid = (int) $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');
        $userOrgId = (int) $request->header('X-User-Org-Id');

//        abort_unless($uid, 401, 'Missing user');
//        abort_unless($userRole, 401, 'Missing user role');

        $league = League::findOrFail($leagueId);

        // Check permissions
        if ($userRole === 'ADMIN' && $league->organization_id !== $userOrgId) {
            abort(403, 'You can only enter results for leagues in your organization');
        }
//        if ($userRole !== 'ADMIN' && $userRole !== 'SUPER_ADMIN') {
//            abort(403, 'Insufficient permissions9');
//        }

        $data = $request->validate([
            'round_number' => 'required|integer|min:1|max:' . $league->total_rounds,
            'results' => 'required|array',
            'results.*.team_id' => 'required|integer|exists:teams,id',
            'results.*.points' => 'required|integer|min:0',
            'results.*.position' => 'nullable|integer|min:1',
            'results.*.notes' => 'nullable|string|max:500',
        ]);

        // Check if all teams in results are part of league
        $leagueTeamIds = $league->teams()->pluck('teams.id')->toArray();
        $resultTeamIds = collect($data['results'])->pluck('team_id')->toArray();

        $invalidTeams = array_diff($resultTeamIds, $leagueTeamIds);
        if (!empty($invalidTeams)) {
            return response()->json([
                'message' => 'Neki timovi nisu deo ove lige',
                'invalid_teams' => $invalidTeams
            ], 400);
        }

        // Remove existing results for this round if any
        $league->rounds()->where('round_number', $data['round_number'])->delete();

        // Insert new results
        foreach ($data['results'] as $result) {
            LeagueRound::create([
                'league_id' => $league->id,
                'round_number' => $data['round_number'],
                'team_id' => $result['team_id'],
                'points' => $result['points'],
                'position' => $result['position'] ?? null,
                'notes' => $result['notes'] ?? null,
                'played_at' => now(),
                'recorded_by' => $uid
            ]);
        }

        // Recalculate team statistics
        $league->recalculateTeamStats();

        return response()->json([
            'message' => 'Rezultati kola su uspešno zabeleženi',
            'league' => $league->fresh()->load('teams', 'rounds')
        ]);
    }

    /**
     * Get league standings/table
     */
    public function getLeagueTable($leagueId)
    {
        $league = League::with('teams')->findOrFail($leagueId);

        return response()->json([
            'league' => $league,
            'table' => $league->table,
            'completed_rounds' => $league->completed_rounds,
            'total_rounds' => $league->total_rounds
        ]);
    }
}
