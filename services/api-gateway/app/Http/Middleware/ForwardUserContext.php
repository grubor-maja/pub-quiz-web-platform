<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ForwardUserContext
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        // Ako je korisnik autentifikovan, dodaj X-User-Id header na interne pozive
        if ($request->user()) {
            // Ovde možete dodati logiku za prosleđivanje user konteksta
            // na interne servisne pozive
        }
        
        return $response;
    }
}