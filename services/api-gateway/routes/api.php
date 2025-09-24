<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrgProxyController;
use App\Http\Controllers\QuizProxyController;


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

// Protected routes (require Bearer token)
Route::middleware(['auth:sanctum', 'fwd.user'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    
    // Organization proxy routes
    Route::get('/organizations', [OrgProxyController::class, 'getOrganizations']);
    Route::post('/organizations', [OrgProxyController::class, 'createOrganization']);
    Route::get('/organizations/{id}', [OrgProxyController::class, 'getOrganization']);
    Route::post('/organizations/{id}/members', [OrgProxyController::class, 'addMember']);
    Route::get('/organizations/{id}/members', [OrgProxyController::class, 'getMembers']);
    
    // Quiz proxy routes
    Route::get('/quizzes', [QuizProxyController::class, 'getQuizzes']);
    Route::post('/quizzes', [QuizProxyController::class, 'createQuiz']);
    Route::get('/quizzes/{id}', [QuizProxyController::class, 'getQuiz']);
    Route::put('/quizzes/{id}', [QuizProxyController::class, 'updateQuiz']);
    Route::delete('/quizzes/{id}', [QuizProxyController::class, 'deleteQuiz']);
    Route::get('/organizations/{orgId}/quizzes', [QuizProxyController::class, 'getQuizzesByOrganization']);
});

// Debug/health routes  
Route::get('/_debug/org-health', [OrgProxyController::class, 'health'])->middleware('auth:sanctum');
Route::get('/_debug/quiz-health', [QuizProxyController::class, 'health'])->middleware('auth:sanctum');


