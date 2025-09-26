<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
class InternalOnly
{
    public function handle(Request $request, Closure $next)
    {
        $expected = env('INTERNAL_SHARED_SECRET', 'devsecret123');
        $provided = $request->header('X-Internal-Auth');
        
        \Log::debug('Internal auth check', [
            'expected' => $expected ? 'present' : 'missing',
            'provided' => $provided ? 'present' : 'missing',
            'match' => $provided === $expected
        ]);
        
        if ($provided !== $expected) {
            abort(401, 'Unauthorized internal call');
        }
        
        return $next($request);
    }
}

