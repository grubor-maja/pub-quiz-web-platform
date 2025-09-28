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

        return response()->json($leagues);
    }

    /**
     * Get leagues by organization
     */
    public function listByOrg($orgId)
    {
        $leagues = League::where('organization_id', $orgId)
                         ->with(['teams:id,name'])
                         ->orderBy('year', 'desc')
                         ->orderBy('season')
                         ->get();

        return response()->json($leagues);
    }

    /**
     * Create a new league
     */
    public function store(Request $request)
    {
        $uid = (int) $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');
        $userOrgId = (int) $request->header('X-User-Org-Id');
        
        // Debug logging
        \Log::info('League creation attempt', [
            'uid' => $uid,
            'userRole' => $userRole,
            'userOrgId' => $userOrgId,
            'all_headers' => $request->headers->all()
        ]);
        
        abort_unless($uid, 401, 'Missing user');
        abort_unless($userRole, 401, 'Missing user role');

        // Check permissions: admin can create leagues only for their org, super admin for any
        if ($userRole === 'ADMIN' && !$userOrgId) {
            \Log::error('Admin without organization', ['uid' => $uid, 'userRole' => $userRole, 'userOrgId' => $userOrgId]);
            abort(403, 'Insufficient permissions');
        }
        if ($userRole !== 'ADMIN' && $userRole !== 'SUPER_ADMIN') {
            \Log::error('Invalid role', ['uid' => $uid, 'userRole' => $userRole]);
            abort(403, 'Insufficient permissions');
        }

        $data = $request->validate([
            'organization_id' => 'required|integer',
            'name' => 'required|string|min:2|max:100',
            'season' => 'required|in:Prolece,Leto,Jesen,Zima',
            'year' => 'required|integer|min:2020|max:2030',
            'total_rounds' => 'required|integer|min:1|max:50',
            'description' => 'nullable|string|max:1000',
        ]);

        // Admin can only create leagues for their organization
        if ($userRole === 'ADMIN' && $data['organization_id'] !== $userOrgId) {
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
            'teams:id,name,member_count,contact_phone',
            'rounds' => function($query) {
                $query->with('team:id,name')->orderBy('round_number')->orderBy('position');
            }
        ])->findOrFail($id);

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
        
        abort_unless($uid, 401, 'Missing user');
        abort_unless($userRole, 401, 'Missing user role');

        $league = League::findOrFail($id);

        // Check permissions
        if ($userRole === 'ADMIN' && $league->organization_id !== $userOrgId) {
            abort(403, 'You can only modify leagues for your organization');
        }
        if ($userRole !== 'ADMIN' && $userRole !== 'SUPER_ADMIN') {
            abort(403, 'Insufficient permissions');
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
        
        abort_unless($uid, 401, 'Missing user');
        abort_unless($userRole, 401, 'Missing user role');

        $league = League::findOrFail($id);
        
        // Check permissions
        if ($userRole === 'ADMIN' && $league->organization_id !== $userOrgId) {
            abort(403, 'You can only delete leagues for your organization');
        }
        if ($userRole !== 'ADMIN' && $userRole !== 'SUPER_ADMIN') {
            abort(403, 'Insufficient permissions');
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
        
        abort_unless($uid, 401, 'Missing user');
        abort_unless($userRole, 401, 'Missing user role');

        $league = League::findOrFail($leagueId);
        
        // Check permissions
        if ($userRole === 'admin' && $league->organization_id !== $userOrgId) {
            abort(403, 'You can only manage teams for leagues in your organization');
        }
        if ($userRole !== 'admin' && $userRole !== 'super_admin') {
            abort(403, 'Insufficient permissions');
        }
        
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
        
        abort_unless($uid, 401, 'Missing user');
        abort_unless($userRole, 401, 'Missing user role');

        $league = League::findOrFail($leagueId);
        
        // Check permissions
        if ($userRole === 'admin' && $league->organization_id !== $userOrgId) {
            abort(403, 'You can only manage teams for leagues in your organization');
        }
        if ($userRole !== 'admin' && $userRole !== 'super_admin') {
            abort(403, 'Insufficient permissions');
        }
        
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
        
        abort_unless($uid, 401, 'Missing user');
        abort_unless($userRole, 401, 'Missing user role');

        $league = League::findOrFail($leagueId);
        
        // Check permissions
        if ($userRole === 'ADMIN' && $league->organization_id !== $userOrgId) {
            abort(403, 'You can only enter results for leagues in your organization');
        }
        if ($userRole !== 'ADMIN' && $userRole !== 'SUPER_ADMIN') {
            abort(403, 'Insufficient permissions');
        }
        
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
