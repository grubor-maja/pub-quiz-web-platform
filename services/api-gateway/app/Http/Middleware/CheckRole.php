<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Super admin ima pristup svemu osim quiz management-u
        if ($user->isSuperAdmin()) {
            // Super admin ne može upravljati kvizovima ako nije član organizacije  
            if (in_array('ORG_MEMBER', $roles) || in_array('ORG_ADMIN', $roles)) {
                $quizId = $request->route('id');
                if ($quizId && !$this->canManageQuiz($user->id, $quizId)) {
                    return response()->json(['error' => 'Super admin must be organization member to manage quizzes'], 403);
                }
                
                // Za CREATE quiz, provjeri organization_id iz request-a
                if ($request->isMethod('post') && $request->has('organization_id')) {
                    $orgId = $request->input('organization_id');
                    if (!$this->isOrgMember($user->id, $orgId)) {
                        return response()->json(['error' => 'Must be organization member to create quizzes'], 403);
                    }
                }
            }
            
            return $next($request);
        }

        // Provjeri da li user ima potrebnu ulogu
        if (in_array($user->role, $roles)) {
            return $next($request);
        }

        // Za organizacijske operacije provjeri member role
        if ($request->route('id') || $request->route('orgId')) {
            $orgId = $request->route('id') ?? $request->route('orgId');
            
            if ($this->isOrgAdmin($user->id, $orgId) && in_array('ORG_ADMIN', $roles)) {
                return $next($request);
            }

            if ($this->isOrgMember($user->id, $orgId) && in_array('ORG_MEMBER', $roles)) {
                return $next($request);
            }
        }

        return response()->json(['error' => 'Insufficient permissions'], 403);
    }

    private function isOrgAdmin($userId, $orgId): bool
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => env('INTERNAL_SHARED_SECRET'),
                'X-User-Id' => $userId,
                'Accept' => 'application/json',
            ])->get(env('ORG_SVC_URL', 'http://localhost:8001') . "/api/internal/organizations/{$orgId}/members");

            if (!$response->successful()) {
                return false;
            }

            $members = $response->json();
            foreach ($members as $member) {
                if ($member['user_id'] == $userId && $member['role'] === 'ADMIN') {
                    return true;
                }
            }
            return false;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function isOrgMember($userId, $orgId): bool
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Auth' => env('INTERNAL_SHARED_SECRET'),
                'X-User-Id' => $userId,
                'Accept' => 'application/json',
            ])->get(env('ORG_SVC_URL', 'http://localhost:8001') . "/api/internal/organizations/{$orgId}/members");

            if (!$response->successful()) {
                return false;
            }

            $members = $response->json();
            foreach ($members as $member) {
                if ($member['user_id'] == $userId) {
                    return true;
                }
            }
            return false;
        } catch (\Exception $e) {
            return false;
        }
    }

    // Za quiz operacije provjeri da li user pripada organizaciji kviza
    private function canManageQuiz($userId, $quizId): bool
    {
        try {
            // Dohvati quiz da vidiš kojoj organizaciji pripada
            $response = Http::withHeaders([
                'X-Internal-Auth' => env('INTERNAL_SHARED_SECRET'),
                'Accept' => 'application/json',
            ])->get(env('QUIZ_SVC_URL', 'http://localhost:8002') . "/api/internal/quizzes/{$quizId}");

            if (!$response->successful()) {
                return false;
            }

            $quiz = $response->json();
            $orgId = $quiz['organization_id'] ?? null;
            
            if (!$orgId) {
                return false;
            }

            // Provjeri da li je user član te organizacije
            return $this->isOrgMember($userId, $orgId);
            
        } catch (\Exception $e) {
            return false;
        }
    }
}