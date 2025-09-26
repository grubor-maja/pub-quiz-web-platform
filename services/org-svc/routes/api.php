<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Internal\OrganizationController;
use App\Http\Controllers\Internal\MemberController;

Route::middleware('internal.only')->get('/health', function (Request $r) {
    return response()->json([
    'service'    => 'org-svc',
    'x_user_id'  => $r->header('X-User-Id'),
    'x_internal' => $r->header('X-Internal-Auth') ? 'present' : 'missing',
    ]);
});

Route::get('/test-error', function () {
    throw new \Exception('Test error za Handler!');
});

Route::middleware('internal.only')->prefix('internal')->group(function () {
    Route::get('/organizations', [OrganizationController::class, 'index']);
    Route::post('/organizations', [OrganizationController::class, 'store']);
    Route::get('/organizations/{id}', [OrganizationController::class, 'show']);
    Route::put('/organizations/{id}', [OrganizationController::class, 'update']);
    Route::delete('/organizations/{id}', [OrganizationController::class, 'destroy']);
    
    Route::post('/organizations/{id}/members', [MemberController::class, 'store']);
    Route::get('/organizations/{id}/members', [MemberController::class, 'index']);
    Route::delete('/organizations/{id}/members/{userId}', [MemberController::class, 'destroy']);
});
