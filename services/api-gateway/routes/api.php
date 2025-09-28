<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrgProxyController;
use App\Http\Controllers\QuizProxyController;
use App\Http\Controllers\TeamProxyController;
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
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Public routes (no authentication required)
Route::get('/organizations', [OrgProxyController::class, 'getOrganizations']);
Route::get('/organizations/{id}', [OrgProxyController::class, 'getOrganization']);
Route::get('/quizzes', [QuizProxyController::class, 'getQuizzes']);
Route::get('/quizzes/{id}', [QuizProxyController::class, 'getQuiz']);
Route::get('/organizations/{orgId}/quizzes', [QuizProxyController::class, 'getQuizzesByOrganization']);

// Protected routes (require Bearer token)
Route::middleware(['auth:sanctum', 'fwd.user'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    
    // SUPER_ADMIN only routes
    Route::middleware(['role:SUPER_ADMIN'])->prefix('manage')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        
        // SUPER_ADMIN može sve nad organizacijama
        Route::post('/organizations', [OrgProxyController::class, 'createOrganization']);
        Route::put('/organizations/{id}', [OrgProxyController::class, 'updateOrganization']);
        Route::delete('/organizations/{id}', [OrgProxyController::class, 'deleteOrganization']);
    });
    
    // Accessible to authenticated users for dropdowns etc.Ok
    Route::get('/users/list', [UserController::class, 'index']);
    
    // Organization management (SUPER_ADMIN ili ORG_ADMIN)
    Route::middleware(['role:SUPER_ADMIN,ORG_ADMIN'])->group(function () {
        Route::put('/organizations/{id}', [OrgProxyController::class, 'updateOrganization']);
        Route::post('/organizations/{id}/members', [OrgProxyController::class, 'addMember']);
        Route::delete('/organizations/{id}/members/{userId}', [OrgProxyController::class, 'removeMember']);
    });

    
    // Quiz management (SUPER_ADMIN, ORG_ADMIN ili ORG_MEMBER)
    Route::middleware(['role:SUPER_ADMIN,ORG_ADMIN,ORG_MEMBER'])->group(function () {
        Route::post('/quizzes', [QuizProxyController::class, 'createQuiz']);
        Route::put('/quizzes/{id}', [QuizProxyController::class, 'updateQuiz']);
        Route::delete('/quizzes/{id}', [QuizProxyController::class, 'deleteQuiz']);
        
        // Team management routes
        Route::get('/orgs/{orgId}/teams', [TeamProxyController::class, 'getTeamsByOrganization']);
        Route::post('/teams', [TeamProxyController::class, 'createTeam']);
        Route::get('/teams/{id}', [TeamProxyController::class, 'getTeam']);
        Route::put('/teams/{id}', [TeamProxyController::class, 'updateTeam']);
        Route::delete('/teams/{id}', [TeamProxyController::class, 'deleteTeam']);
        
        // Team-Quiz registration routes
        Route::post('/teams/{teamId}/register-quiz', [TeamProxyController::class, 'registerTeamForQuiz']);
        Route::post('/teams/{teamId}/unregister-quiz', [TeamProxyController::class, 'unregisterTeamFromQuiz']);
        Route::get('/quizzes/{quizId}/teams', [TeamProxyController::class, 'getQuizTeams']);
    });
    
    // Basic authenticated routes (svi ulogovani korisnici)
    Route::get('/organizations/{id}/members', [OrgProxyController::class, 'getMembers']);
});

// Debug/health routes  
Route::get('/_debug/org-health', [OrgProxyController::class, 'health'])->middleware('auth:sanctum');
Route::get('/_debug/quiz-health', [QuizProxyController::class, 'health'])->middleware('auth:sanctum');
Route::get('/_debug/team-health', [TeamProxyController::class, 'health'])->middleware('auth:sanctum');


