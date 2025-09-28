<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\Internal\QuizController;
use App\Http\Controllers\Internal\TeamController;

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
    Route::post('/teams/{teamId}/register-quiz', [TeamController::class, 'registerForQuiz']);
    Route::post('/teams/{teamId}/unregister-quiz', [TeamController::class, 'unregisterFromQuiz']);
    Route::get('/quizzes/{quizId}/teams', [TeamController::class, 'getQuizTeams']);
});
