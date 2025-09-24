<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\Internal\QuizController;

Route::middleware('internal.only')->get('/health', function (Request $r) {
    return response()->json([
        'service'    => 'quiz-svc',
        'x_user_id'  => $r->header('X-User-Id'),
        'x_internal' => $r->header('X-Internal-Auth') ? 'present' : 'missing',
    ]);
});

Route::middleware(['internal.only', 'auth.context'])->prefix('internal')->group(function () {
    Route::post('/quizzes', [QuizController::class, 'store']);
    Route::get('/quizzes/{id}', [QuizController::class, 'show']);
    Route::get('/orgs/{orgId}/quizzes', [QuizController::class, 'listByOrg']);
    Route::get('/quizzes', [QuizController::class, 'index']);
    Route::put('/quizzes/{id}', [QuizController::class, 'update']);
    Route::delete('/quizzes/{id}', [QuizController::class, 'destroy']);
});
