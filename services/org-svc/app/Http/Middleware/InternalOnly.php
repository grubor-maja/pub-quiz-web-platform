<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
class InternalOnly
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->header('X-Internal-Auth') !== env('INTERNAL_SHARED_SECRET', 'devsecret')) {
            abort(401, 'Unauthorized internal call');
        }
        return $next($request);
    }
}

