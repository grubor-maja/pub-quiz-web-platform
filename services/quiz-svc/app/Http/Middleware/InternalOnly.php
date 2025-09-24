<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class InternalOnly
{
    public function handle(Request $request, Closure $next)
    {
        $internalSecret = env('INTERNAL_SHARED_SECRET', 'devsecret123');

        if ($request->header('X-Internal-Auth') !== $internalSecret) {
            return response()->json([
                'error'   => 'Unauthorized internal call',
                'message' => 'Missing or invalid X-Internal-Auth header'
            ], 401);
        }

        return $next($request);
    }
}
