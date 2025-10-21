<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ForwardUserContext
{
    public function handle(Request $request, Closure $next)
    {
        if (auth()->check()) {
            $request->headers->set('X-User-Id', auth()->id());
            $request->headers->set('X-User-Email', auth()->user()->email ?? '');
        }
        $request->headers->set('X-Internal-Auth', env('APP_INTERNAL_SHARED_SECRET', 'devsecret123'));

        return $next($request);
    }
}
