<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\Internal\QuizController;
use App\Http\Controllers\Internal\TeamController;
use App\Http\Controllers\Internal\LeagueController;

Route::middleware('internal.only')->get('/health', function (Request $r) {
    return response()->json([
        'service'    => 'quiz-svc',
        'x_user_id'  => $r->header('X-User-Id'),
        'x_internal' => $r->header('X-Internal-Auth') ? 'present' : 'missing',
    ]);
});

Route::middleware(['internal.only', 'auth.context'])->prefix('internal')->group(function () {
    // Quiz routes
    Route::post('/quizzes', [QuizController::class, 'store']);
    Route::get('/quizzes/{id}', [QuizController::class, 'show']);
    Route::get('/orgs/{orgId}/quizzes', [QuizController::class, 'listByOrg']);
    Route::get('/quizzes', [QuizController::class, 'index']);
    Route::put('/quizzes/{id}', [QuizController::class, 'update']);
    Route::delete('/quizzes/{id}', [QuizController::class, 'destroy']);

    // Team routes
    Route::post('/teams', [TeamController::class, 'store']);
    Route::get('/teams/{id}', [TeamController::class, 'show']);
    Route::get('/orgs/{orgId}/teams', [TeamController::class, 'listByOrg']);
    Route::put('/teams/{id}', [TeamController::class, 'update']);
    Route::delete('/teams/{id}', [TeamController::class, 'destroy']);

    // Team-Quiz registration routes
    Route::post('/teams/{teamId}/apply-quiz', [TeamController::class, 'applyForQuiz']);
    Route::post('/teams/{teamId}/approve-quiz', [TeamController::class, 'approveApplication']);
    Route::post('/teams/{teamId}/reject-quiz', [TeamController::class, 'rejectApplication']);
    Route::post('/teams/{teamId}/register-quiz', [TeamController::class, 'registerForQuiz']);
    Route::post('/teams/{teamId}/unregister-quiz', [TeamController::class, 'unregisterFromQuiz']);
    Route::get('/quizzes/{quizId}/teams', [TeamController::class, 'getQuizTeams']);

    // League routes
    Route::get('/leagues', [LeagueController::class, 'index']); // Public - all active leagues
    Route::get('/orgs/{orgId}/leagues', [LeagueController::class, 'listByOrg']); // Leagues by org
    Route::post('/leagues', [LeagueController::class, 'store']); // Create league
    Route::get('/leagues/{id}', [LeagueController::class, 'show']); // Get league details
    Route::put('/leagues/{id}', [LeagueController::class, 'update']); // Update league
    Route::delete('/leagues/{id}', function($id, Request $request) {
        return app(LeagueController::class)->destroy($id, $request);
    }); // Delete league
    Route::post('/leagues/{leagueId}/teams', [LeagueController::class, 'addTeam']); // Add team to league
    Route::delete('/leagues/{leagueId}/teams/{teamId}', function($leagueId, $teamId, Request $request) {
        return app(LeagueController::class)->removeTeam($leagueId, $teamId, $request);
    }); // Remove team
    Route::post('/leagues/{leagueId}/rounds', [LeagueController::class, 'enterRoundResults']); // Enter round results
    Route::get('/leagues/{leagueId}/table', [LeagueController::class, 'getLeagueTable']); // Get league table
});
