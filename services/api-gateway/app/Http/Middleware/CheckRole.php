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

        if ($request->isMethod('post') && $request->is('*/leagues')) {
            if ($user->id != 2) {
                return $next($request);
            }
        }

        if ($user->isSuperAdmin()) {
            if (in_array('ORG_ADMIN', $roles)) {
                return $next($request);
            }

            if (in_array('ORG_MEMBER', $roles)) {
                $quizId = $request->route('id');
                if ($quizId && !$this->canManageQuiz($user->id, $quizId)) {
                    return response()->json(['error' => 'Super admin must be organization member to manage quizzes'], 403);
                }
            }

            return $next($request);
        }

        if (in_array($user->role, $roles)) {
            return $next($request);
        }
        \Log::info('Ovde sam 1');

        if ($request->route('id') || $request->route('orgId') || $request->has('organization_id')) {
            \Log::info('Ovde sam 2');
            $orgId = $request->route('id')
                ?? $request->route('orgId')
                ?? $request->input('organization_id')
                ?? ($request->user() ? $request->user()->organization_id : null);
            if ($this->isOrgAdmin($user->id, $orgId) && in_array('ADMIN', $roles)) {
                return $next($request);
            }

            if ($this->isOrgMember($user->id, $orgId) && in_array('ORG_MEMBER', $roles)) {
                return $next($request);
            }
        }
        \Log::info("User {$user->id} with role {$user->role} denied access. Required roles: " . implode(',', $roles));

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
            \Log::info('Members of org ' . $orgId, ['members' => $members]);
            foreach ($members as $member) {
                if ($member['user_id'] == $userId && $member['role'] === 'ADMIN') {
                    return true;
                }
            }
            return false;
        } catch (\Exception $e) {
            \Log::info("Error checking org admin status: " . $e->getMessage());
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

    private function canManageQuiz($userId, $quizId): bool
    {
        try {
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

            return $this->isOrgMember($userId, $orgId);

        } catch (\Exception $e) {
            return false;
        }
    }
}
