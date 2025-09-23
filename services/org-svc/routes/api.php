<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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

Route::middleware('internal.only')->get('/health', function (Request $r) {
    return response()->json([
        'service'    => 'org-svc',
        'x_user_id'  => $r->header('X-User-Id'),
        'x_internal' => $r->header('X-Internal-Auth') ? 'present' : 'missing',
    ]);
});