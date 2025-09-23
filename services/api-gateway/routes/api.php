<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Http;


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


Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me',     [AuthController::class, 'me']);
    Route::post('/auth/logout',[AuthController::class, 'logout']);
});


Route::middleware('auth:sanctum')->get('/_debug/org-health', function () {
    $target = rtrim(env('ORG_SVC_URL', 'http://127.0.0.1:7001'), '/');

    $res = Http::withHeaders([
        // identitet korisnika:
        'X-User-Id'      => auth()->id(),
        // shared secret – koristi vrednost iz .env gateway-a
        'X-Internal-Auth'=> env('INTERNAL_SHARED_SECRET', 'devsecret'),
    ])->get($target.'/api/health');

    return response()->json($res->json(), $res->status());
});

