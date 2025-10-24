<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Client\Response as HttpResponse;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ]);

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'USER', // Default role
            ]);

            return response()->json([
                'message' => 'User created successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ]
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Registration error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Registration failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            if (!Auth::attempt($request->only('email', 'password'))) {
                return response()->json([
                    'message' => 'Invalid credentials'
                ], 401);
            }

            $user = Auth::user();
            $token = $user->createToken('api-token')->plainTextToken;

            $orgData = $this->getOrganizationData($user);
            \Log::info('Organization data: ' . ($orgData['organization_id'] ?? 'null'));
            return response()->json([
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'organization_id' => $orgData['organization_id'] ?? null,
                    'organization_role' => $orgData['organization_role'] ?? null,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Login failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

        private function decodeJsonFlexible(\Illuminate\Http\Client\Response $resp): array
    {
        $body  = $resp->body() ?? '';
        $clean = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE");

        $data = json_decode($clean, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($data)) return $data;

        $str = json_decode($clean, true);
        if (json_last_error() === JSON_ERROR_NONE && is_string($str)) {
            $data2 = json_decode($str, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($data2)) return $data2;
        }

        \Log::warning('decodeJsonFlexible (AuthController) failed', [
            'status' => $resp->status(),
            'len'    => strlen($body),
            'err'    => json_last_error_msg(),
            'peek'   => substr($clean, 0, 128),
        ]);
        return [];
    }

    private function normalizeList(mixed $payload): array
    {
        if (!is_array($payload)) return [];
        if (isset($payload['data'])  && is_array($payload['data']))  return $payload['data'];
        if (isset($payload['items']) && is_array($payload['items'])) return $payload['items'];
        return $payload; // već lista
    }


    public function me(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['error' => 'User not found'], 401);
            }

            // Get organization_id and role from org-svc if exists
            $orgData = $this->getOrganizationData($user);
            \Log::debug('Organization data me metoda: ' . ($orgData['organization_id'] ?? 'null'));
            return response()->json([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_super_admin' => $user->isSuperAdmin(),
                'is_user' => $user->isUser(),
                'organization_id' => $orgData['organization_id'] ?? null,
                'organization_role' => $orgData['organization_role'] ?? null,
            ]);
        } catch (\Exception $e) {
            \Log::error('Me endpoint error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to get user info',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getOrganizationData($user): array
    {
        try {
            $orgSvcUrl      = config('services.org_service.url', env('ORG_SVC_URL', 'http://localhost:8001'));
            $internalSecret = config('services.internal_auth_token', env('INTERNAL_SHARED_SECRET', 'devsecret123'));

            // 1) organizacije
            $orgResp = Http::timeout(10)->withHeaders([
                'X-Internal-Auth' => $internalSecret,
                'X-User-Id'       => $user->id,
                'Accept'          => 'application/json',
            ])->get($orgSvcUrl . '/api/internal/organizations');

            if (!$orgResp->successful()) {
                \Log::warning("getOrganizationData: orgs fetch failed", ['status' => $orgResp->status(), 'body' => $orgResp->body()]);
                return [];
            }

            $orgs = $this->normalizeList($this->decodeJsonFlexible($orgResp));
            if (empty($orgs)) return [];

            // 2) za svaku org – članovi
            foreach ($orgs as $org) {
                $orgId   = $org['id']   ?? null;
                if (!$orgId) continue;

                $memResp = Http::timeout(10)->withHeaders([
                    'X-Internal-Auth' => $internalSecret,
                    'X-User-Id'       => $user->id,
                    'Accept'          => 'application/json',
                ])->get($orgSvcUrl . "/api/internal/organizations/{$orgId}/members");

                if (!$memResp->successful()) {
                    \Log::warning("getOrganizationData: members fetch failed", [
                        'org_id' => $orgId, 'status' => $memResp->status(), 'body' => $memResp->body()
                    ]);
                    continue;
                }

                $members = $this->normalizeList($this->decodeJsonFlexible($memResp));
                foreach ($members as $m) {
                    $memberId = $m['user_id'] ?? $m['userId'] ?? $m['id'] ?? null;
                    if ((int)$memberId === (int)$user->id) {
                        return [
                            'organization_id'   => $orgId,
                            'organization_role' => $m['role'] ?? 'member',
                        ];
                    }
                }
            }

            return [];
        } catch (\Throwable $e) {
            \Log::error('getOrganizationData exception: '.$e->getMessage(), ['user_id' => $user->id]);
            return [];
        }
    }
    public function getOrganizationId($user)
    {
        $orgData = $this->getOrganizationData($user);
        return $orgData['organization_id'] ?? null;
    }

    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'message' => 'Logged out successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Logout error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Logout failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
