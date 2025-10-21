<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrgProxyController;
use App\Http\Controllers\QuizProxyController;
use App\Http\Controllers\TeamProxyController;
use App\Http\Controllers\LeagueProxyController;
use App\Http\Controllers\UserController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// CSRF cookie for SPA


// Auth routes (public)
// Public (bez auth)
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/organizations', [OrgProxyController::class, 'getOrganizations']);
Route::get('/organizations/{id}', [OrgProxyController::class, 'getOrganization']);

Route::get('/quizzes', [QuizProxyController::class, 'getQuizzes']);
Route::get('/quizzes/{id}', [QuizProxyController::class, 'getQuiz']);
Route::get('/organizations/{orgId}/quizzes', [QuizProxyController::class, 'getQuizzesByOrganization']);

// Quiz CRUD routes (moved outside auth middleware)
Route::get('/orgs/{orgId}/quizzes', [QuizProxyController::class, 'getQuizzesByOrg']);
Route::post('/quizzes', [QuizProxyController::class, 'createQuiz']);
Route::put('/quizzes/{id}', [QuizProxyController::class, 'updateQuiz']);
Route::delete('/quizzes/{id}', [QuizProxyController::class, 'deleteQuiz']);

Route::get('/leagues', [LeagueProxyController::class, 'getLeagues']);
Route::get('/leagues/{id}', [LeagueProxyController::class, 'getLeague']);
Route::get('/leagues/{leagueId}/table', [LeagueProxyController::class, 'getLeagueTable']);
Route::get('/organizations/{orgId}/leagues', [LeagueProxyController::class, 'getLeaguesByOrganization']);

// Auth samo (bez role middleware-a i bez fwd.user)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Users (bivši SUPER_ADMIN) – sada samo auth
    Route::prefix('manage')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        // Org CRUD
        Route::post('/organizations', [OrgProxyController::class, 'createOrganization']);
        Route::put('/organizations/{id}', [OrgProxyController::class, 'updateOrganization']);
        Route::delete('/organizations/{id}', [OrgProxyController::class, 'deleteOrganization']);
    });

    // dropdowns itd.
    Route::get('/users/list', [UserController::class, 'index']);

    // Org management (bez role filtera)
    Route::put('/organizations/{id}', [OrgProxyController::class, 'updateOrganization']);
    Route::post('/organizations/{id}/members', [OrgProxyController::class, 'addMember']);
    Route::put('/organizations/{id}/members/{userId}', [OrgProxyController::class, 'updateMemberRole']);
    Route::delete('/organizations/{id}/members/{userId}', [OrgProxyController::class, 'removeMember']);

    // Teams
    Route::get('/orgs/{orgId}/teams', [TeamProxyController::class, 'getTeamsByOrganization']);
    Route::post('/teams', [TeamProxyController::class, 'createTeam']);
    Route::get('/teams/{id}', [TeamProxyController::class, 'getTeam']);
    Route::put('/teams/{id}', [TeamProxyController::class, 'updateTeam']);
    Route::delete('/teams/{id}', [TeamProxyController::class, 'deleteTeam']);

    // Team-Quiz actions
    Route::post('/teams/{teamId}/apply-quiz', [TeamProxyController::class, 'applyTeamForQuiz']);
    Route::post('/teams/{teamId}/approve-quiz', [TeamProxyController::class, 'approveTeamApplication']);
    Route::post('/teams/{teamId}/reject-quiz', [TeamProxyController::class, 'rejectTeamApplication']);
    Route::post('/teams/{teamId}/register-quiz', [TeamProxyController::class, 'registerTeamForQuiz']);
    Route::post('/teams/{teamId}/unregister-quiz', [TeamProxyController::class, 'unregisterTeamFromQuiz']);
    Route::get('/quizzes/{quizId}/teams', [TeamProxyController::class, 'getQuizTeams']);

    // Leagues CRUD
    Route::post('/leagues', [LeagueProxyController::class, 'createLeague']);
    Route::put('/leagues/{id}', [LeagueProxyController::class, 'updateLeague']);
    Route::delete('/leagues/{id}', [LeagueProxyController::class, 'deleteLeague']);
    Route::post('/leagues/{leagueId}/teams', [LeagueProxyController::class, 'addTeamToLeague']);
    Route::delete('/leagues/{leagueId}/teams/{teamId}', [LeagueProxyController::class, 'removeTeamFromLeague']);
    Route::post('/leagues/{leagueId}/rounds', [LeagueProxyController::class, 'enterRoundResults']);

    // Members list
    Route::get('/organizations/{id}/members', [OrgProxyController::class, 'getMembers']);
    // Get current user's organizations
    Route::get('/users/me/organizations', [OrgProxyController::class, 'getUserOrganizations']);
});

// Health bez auth – da možeš odmah da vidiš da li proxy radi
Route::get('/_debug/org-health', [OrgProxyController::class, 'health']);
Route::get('/_debug/quiz-health', [QuizProxyController::class, 'health']);
Route::get('/_debug/team-health', [TeamProxyController::class, 'health']);
Route::get('/_debug/league-health', [LeagueProxyController::class, 'health']);
