<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\Quiz;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TeamController extends Controller
{
    /**
     * Create a new team for an organization
     */
    public function store(Request $request)
    {
        $uid = (int) $request->header('X-User-Id');
        abort_unless($uid, 401, 'Missing user');

        $data = $request->validate([
            'organization_id' => 'required|integer',
            'name' => 'required|string|min:2|max:100',
            'member_count' => 'required|integer|min:1|max:20',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Check if team name is unique within organization
        $exists = Team::where('organization_id', $data['organization_id'])
                     ->where('name', $data['name'])
                     ->exists();
        
        if ($exists) {
            throw ValidationException::withMessages([
                'name' => ['Team name already exists in this organization']
            ]);
        }

        $team = Team::create(array_merge($data, ['created_by' => $uid]));

        return response()->json($team, 201);
    }

    /**
     * Get team by ID
     */
    public function show($id)
    {
        $team = Team::with(['quizzes' => function($query) {
            $query->withPivot('registered_at', 'status', 'final_position');
        }])->findOrFail($id);
        
        return response()->json($team);
    }

    /**
     * List teams by organization
     */
    public function listByOrg($orgId)
    {
        $teams = Team::where('organization_id', $orgId)
                    ->with(['quizzes:id,title,date'])
                    ->orderBy('name')
                    ->get();
        
        return response()->json($teams);
    }

    /**
     * Update team
     */
    public function update($id, Request $request)
    {
        $uid = (int) $request->header('X-User-Id');
        abort_unless($uid, 401, 'Missing user');

        $team = Team::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|required|string|min:2|max:100',
            'member_count' => 'sometimes|required|integer|min:1|max:20',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Check if new name is unique within organization (excluding current team)
        if (isset($data['name']) && $data['name'] !== $team->name) {
            $exists = Team::where('organization_id', $team->organization_id)
                         ->where('name', $data['name'])
                         ->where('id', '!=', $id)
                         ->exists();
            
            if ($exists) {
                throw ValidationException::withMessages([
                    'name' => ['Team name already exists in this organization']
                ]);
            }
        }

        $team->update($data);

        return response()->json($team);
    }

    /**
     * Delete team
     */
    public function destroy($id)
    {
        $team = Team::findOrFail($id);
        
        // Check if team is registered for any active quizzes
        $activeRegistrations = $team->quizzes()
                                  ->wherePivot('status', 'registered')
                                  ->where('date', '>=', now()->toDateString())
                                  ->count();
        
        if ($activeRegistrations > 0) {
            return response()->json([
                'message' => 'Cannot delete team with active quiz registrations. Please cancel registrations first.'
            ], 400);
        }

        $team->delete();

        return response()->json(null, 204);
    }

    /**
     * Apply team for a quiz (pending status)
     */
    public function applyForQuiz($teamId, Request $request)
    {
        $uid = (int) $request->header('X-User-Id');
        abort_unless($uid, 401, 'Missing user');

        $data = $request->validate([
            'quiz_id' => 'required|integer|exists:quizzes,id'
        ]);

        $team = Team::findOrFail($teamId);
        $quiz = Quiz::findOrFail($data['quiz_id']);

        // Check if team already has application/registration for this quiz
        $existingEntry = $team->quizzes()
                             ->wherePivot('quiz_id', $quiz->id)
                             ->whereIn('team_quiz.status', ['pending', 'registered'])
                             ->exists();

        if ($existingEntry) {
            return response()->json([
                'message' => 'Team already has an application or is registered for this quiz.'
            ], 400);
        }

        // Create pending application
        $team->quizzes()->attach($quiz->id, [
            'registered_at' => now(),
            'status' => 'pending'
        ]);

        return response()->json([
            'message' => 'Team application submitted successfully. Waiting for admin approval.',
            'status' => 'pending'
        ]);
    }

    /**
     * Approve team application (admin only)
     */
    public function approveApplication($teamId, Request $request)
    {
        $uid = (int) $request->header('X-User-Id');
        abort_unless($uid, 401, 'Missing user');

        $data = $request->validate([
            'quiz_id' => 'required|integer|exists:quizzes,id'
        ]);

        $team = Team::findOrFail($teamId);
        $quiz = Quiz::findOrFail($data['quiz_id']);

        // Check if quiz has available spots
        if (!$quiz->hasAvailableSpots()) {
            return response()->json([
                'message' => 'Quiz is full. Cannot approve more teams.'
            ], 400);
        }

        // Update pending application to registered
        $updated = $team->quizzes()
                       ->wherePivot('quiz_id', $quiz->id)
                       ->wherePivot('status', 'pending')
                       ->updateExistingPivot($quiz->id, [
                           'status' => 'registered',
                           'registered_at' => now()
                       ]);

        if (!$updated) {
            return response()->json([
                'message' => 'No pending application found for this team and quiz.'
            ], 400);
        }

        return response()->json([
            'message' => 'Team application approved successfully',
            'status' => 'registered',
            'remaining_capacity' => $quiz->fresh()->remaining_capacity
        ]);
    }

    /**
     * Reject team application (admin only)
     */
    public function rejectApplication($teamId, Request $request)
    {
        $uid = (int) $request->header('X-User-Id');
        abort_unless($uid, 401, 'Missing user');

        $data = $request->validate([
            'quiz_id' => 'required|integer|exists:quizzes,id'
        ]);

        $team = Team::findOrFail($teamId);
        $quiz = Quiz::findOrFail($data['quiz_id']);

        // Remove pending application
        $deleted = $team->quizzes()
                       ->wherePivot('quiz_id', $quiz->id)
                       ->wherePivot('status', 'pending')
                       ->detach($quiz->id);

        if (!$deleted) {
            return response()->json([
                'message' => 'No pending application found for this team and quiz.'
            ], 400);
        }

        return response()->json([
            'message' => 'Team application rejected successfully'
        ]);
    }

    /**
     * Register team for a quiz
     */
    public function registerForQuiz($teamId, Request $request)
    {
        $uid = (int) $request->header('X-User-Id');
        abort_unless($uid, 401, 'Missing user');

        $data = $request->validate([
            'quiz_id' => 'required|integer|exists:quizzes,id'
        ]);

        $team = Team::findOrFail($teamId);
        $quiz = Quiz::findOrFail($data['quiz_id']);

        // Check if quiz has available spots
        if (!$quiz->hasAvailableSpots()) {
            return response()->json([
                'message' => 'Quiz is full. No available spots.'
            ], 400);
        }

        // Check if team is already registered
        $existingRegistration = $team->quizzes()
                                   ->wherePivot('quiz_id', $quiz->id)
                                   ->exists();

        if ($existingRegistration) {
            return response()->json([
                'message' => 'Team is already registered for this quiz.'
            ], 400);
        }

        // Register team
        $team->quizzes()->attach($quiz->id, [
            'registered_at' => now(),
            'status' => 'registered'
        ]);

        return response()->json([
            'message' => 'Team successfully registered for quiz',
            'remaining_capacity' => $quiz->fresh()->remaining_capacity
        ]);
    }

    /**
     * Unregister team from quiz
     */
    public function unregisterFromQuiz($teamId, Request $request)
    {
        $uid = (int) $request->header('X-User-Id');
        abort_unless($uid, 401, 'Missing user');

        $data = $request->validate([
            'quiz_id' => 'required|integer|exists:quizzes,id'
        ]);

        $team = Team::findOrFail($teamId);
        $quiz = Quiz::findOrFail($data['quiz_id']);

        // Update status to cancelled instead of deleting
        $updated = $team->quizzes()
                       ->wherePivot('quiz_id', $quiz->id)
                       ->wherePivot('status', 'registered')
                       ->updateExistingPivot($quiz->id, [
                           'status' => 'cancelled'
                       ]);

        if (!$updated) {
            return response()->json([
                'message' => 'Team is not registered for this quiz or already cancelled.'
            ], 400);
        }

        return response()->json([
            'message' => 'Team successfully unregistered from quiz',
            'remaining_capacity' => $quiz->fresh()->remaining_capacity
        ]);
    }

    /**
     * Get teams registered for a quiz
     */
    public function getQuizTeams($quizId)
    {
        $quiz = Quiz::findOrFail($quizId);
        
        $teams = $quiz->teams()
                     ->withPivot('registered_at', 'status', 'final_position')
                     ->orderByPivot('registered_at')
                     ->get();

        return response()->json([
            'quiz' => $quiz,
            'teams' => $teams,
            'registered_count' => $teams->where('pivot.status', 'registered')->count(),
            'remaining_capacity' => $quiz->remaining_capacity
        ]);
    }
}
