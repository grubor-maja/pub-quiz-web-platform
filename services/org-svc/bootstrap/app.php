<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use \App\Http\Middleware\InternalOnly;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'internal.only' => InternalOnly::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // 1) Standardne Laravel exceptions -> JSON
        $exceptions->render(function (ValidationException $e) {
            return response()->json([
                'error' => [
                    'code'    => 'VALIDATION_ERROR',
                    'message' => 'Validation failed.',
                ],
                'details' => $e->errors(),
            ], 422);
        });

        $exceptions->render(function (AuthenticationException $e) {
            return response()->json([
                'error' => ['code'=>'UNAUTHENTICATED','message'=>'Authentication required.']
            ], 401);
        });

        $exceptions->render(function (AuthorizationException $e) {
            return response()->json([
                'error' => ['code'=>'FORBIDDEN','message'=>'You are not allowed to perform this action.']
            ], 403);
        });

        $exceptions->render(function (ModelNotFoundException $e) {
            return response()->json([
                'error' => ['code'=>'NOT_FOUND','message'=>'Resource not found.']
            ], 404);
        });

        $exceptions->render(function (ThrottleRequestsException $e) {
            return response()->json([
                'error' => ['code'=>'RATE_LIMITED','message'=>'Too many requests.']
            ], 429);
        });

        // 2) Kada gateway ne može do internog servisa
        $exceptions->render(function (ConnectionException $e) {
            return response()->json([
                'error' => ['code'=>'UPSTREAM_UNAVAILABLE','message'=>'Internal service unavailable.']
            ], 503);
        });

        // 3) Svi ostali (HttpException sa status kodom, ili fallback 500)
        $exceptions->render(function (\Throwable $e) {
            if ($e instanceof HttpExceptionInterface) {
                return response()->json([
                    'error' => [
                        'code'    => 'HTTP_ERROR',
                        'message' => $e->getMessage() ?: 'HTTP error',
                    ]
                ], $e->getStatusCode());
            }

            // Fallback 500 (u produkciji bez stack trace)
            return response()->json([
                'error' => [
                    'code'    => 'SERVER_ERROR',
                    'message' => 'Something went wrong.',
                ],
            ], 500);
        });

        // 4) Logovanje (možeš filtrirati/obogatiti)
        $exceptions->report(function (\Throwable $e) {
            // ovde možeš dodati dodatni context, npr. request-id
            // logger()->error($e->getMessage(), ['trace' => $e->getTraceAsString()]);
        });
    })->create();
