<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    public function render($request, Throwable $e)
    {
        // UVEK vraćaj JSON sa detaljima za API rute
        if ($request->is('api/*') || $request->wantsJson()) {
            
            // Log grešku da vidimo da Handler radi
            \Log::error('🔥 CUSTOM HANDLER TRIGGERED', [
                'message' => $e->getMessage(),
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            $response = [
                'error' => true,
                'message' => $e->getMessage(),
                'exception' => get_class($e),
                'file' => basename($e->getFile()),
                'line' => $e->getLine(),
                'service' => 'org-svc',
                'handler_status' => 'CUSTOM_HANDLER_WORKING',
                'debug_mode' => config('app.debug', false)
            ];
            
            // Dodaj trace ako je debug
            if (config('app.debug')) {
                $response['trace'] = array_slice($e->getTrace(), 0, 3);
            }
            
            return response()->json($response, 500);
        }

        return parent::render($request, $e);
    }
}