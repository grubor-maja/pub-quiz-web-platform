<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    private function normalizeList(mixed $payload): array
    {
        // prihvati plain array ili { data: [...] } ili { items: [...] }
        if (is_array($payload)) {
            if (array_key_exists('data', $payload) && is_array($payload['data'])) {
                return $payload['data'];
            }
            if (array_key_exists('items', $payload) && is_array($payload['items'])) {
                return $payload['items'];
            }
            return $payload; // već je lista
        }
        return [];
    }

    private function normalizeMember(array $m): array
    {
        // user id može doći kao user_id, userId ili id
        $userId = $m['user_id'] ?? $m['userId'] ?? $m['id'] ?? null;

        // role može biti string ili ugnježdeno (pivot.role, role.name)
        $role = $m['role']
            ?? ($m['pivot']['role'] ?? null)
            ?? ($m['role']['name'] ?? null);

        return [
            'user_id' => $userId,
            'role'    => $role,
        ];
    }

    public function index(Request $request)
    {
        $users = User::select(['id', 'name', 'email', 'role', 'created_at'])->get();
        
        // Dodaj informacije o organizaciji za svaki korisnik
        foreach ($users as $user) {
            $user->organization_name = null;
            $user->organization_role = null;
        }
        
        try {
            // Pozovi org-svc da dobijemo sve organizacije
            $orgSvcUrl = config('services.org_service.url', env('ORG_SVC_URL', 'http://localhost:8001'));
            $internalSecret = config('services.internal_auth_token', env('INTERNAL_SHARED_SECRET', 'devsecret123'));
            $currentUserId = optional($request->user())->id ?? 1;
            
            \Log::debug("Fetching orgs from: {$orgSvcUrl}/api/internal/organizations", [
                'user_id' => $currentUserId,
                'internal_secret' => $internalSecret ? 'present' : 'missing'
            ]);
            
            $orgResponse = Http::timeout(10)->withHeaders([
                'X-Internal-Auth' => $internalSecret,
                'X-User-Id'       => $currentUserId,
                'Accept'          => 'application/json',
            ])->get($orgSvcUrl . '/api/internal/organizations');
            
            if ($orgResponse->successful()) {
                $orgPayload = $orgResponse->json();
                $organizations = $this->normalizeList($orgPayload);
                
                \Log::debug("Found organizations", [
                    'count' => count($organizations),
                    'first_org' => $organizations[0] ?? null
                ]);
                
                $allMembers = [];
                
                foreach ($organizations as $org) {
                    $orgId = $org['id'] ?? null;
                    if (!$orgId) { continue; }
                    
                    \Log::debug("Fetching members for org", ['org_id' => $orgId]);
                    
                    $membersResponse = Http::timeout(10)->withHeaders([
                        'X-Internal-Auth' => $internalSecret,
                        'X-User-Id'       => $currentUserId,
                        'Accept'          => 'application/json',
                    ])->get($orgSvcUrl . "/api/internal/organizations/{$orgId}/members");
                    
                    if (!$membersResponse->successful()) {
                        \Log::warning("Members fetch failed", [
                            'org_id' => $orgId, 
                            'status' => $membersResponse->status(), 
                            'body' => $membersResponse->body()
                        ]);
                        continue;
                    }
                    
                    $membersPayload = $membersResponse->json();
                    $membersList = $this->normalizeList($membersPayload);
                    
                    \Log::debug("Found members for org {$orgId}", [
                        'count' => count($membersList),
                        'members' => $membersList
                    ]);
                    
                    foreach ($membersList as $rawMember) {
                        $m = $this->normalizeMember($rawMember);
                        if (!$m['user_id']) { continue; }
                        
                        // Ako isti user u više organizacija – poslednja pobedi
                        $allMembers[$m['user_id']] = [
                            'organization_name' => $org['name'] ?? null,
                            'organization_role' => $m['role'] ?? null,
                        ];
                    }
                }
                
                // Dodeli organizacije korisnicima
                foreach ($users as $u) {
                    if (isset($allMembers[$u->id])) {
                        $u->organization_name = $allMembers[$u->id]['organization_name'];
                        $u->organization_role = $allMembers[$u->id]['organization_role'];
                    }
                }
                
            } else {
                \Log::error("Failed to fetch organizations", [
                    'status' => $orgResponse->status(), 
                    'body' => $orgResponse->body()
                ]);
            }
            
        } catch (\Exception $e) {
            \Log::error("Error fetching organization data: " . $e->getMessage());
        }
        
        return response()->json($users);
    }

    public function show($id)
    {
        $user = User::select(['id', 'name', 'email', 'role', 'created_at'])->findOrFail($id);
        
        $user->organization_name = null;
        $user->organization_role = null;
        
        try {
            // Pozovi org-svc da dobijemo sve organizacije
            $response = Http::withHeaders([
                'X-Internal-Auth' => config('services.internal_auth_token'),
                'Accept' => 'application/json',
            ])->get(config('services.org_service.url') . "/api/internal/organizations");
            
            if ($response->successful()) {
                $organizations = $response->json();
                
                // Za svaku organizaciju provjeri da li je korisnik član
                foreach ($organizations as $org) {
                    $membersResponse = Http::withHeaders([
                        'X-Internal-Auth' => config('services.internal_auth_token'),
                        'Accept' => 'application/json',
                    ])->get(config('services.org_service.url') . "/api/internal/organizations/{$org['id']}/members");
                    
                    if ($membersResponse->successful()) {
                        $members = $membersResponse->json();
                        foreach ($members as $member) {
                            if ($member['user_id'] == $user->id) {
                                $user->organization_name = $org['name'];
                                $user->organization_role = $member['role'];
                                break 2; // Break iz oba loop-a
                            }
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            \Log::error("Failed to fetch organization for user {$user->id}: " . $e->getMessage());
        }
        
        return response()->json($user);
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
                'role' => ['required', Rule::in(['SUPER_ADMIN', 'USER'])],
            ]);

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
            ]);

            return response()->json([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at,
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('User creation failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'User creation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'sometimes|string|min:8|confirmed',
            'role' => ['sometimes', 'required', Rule::in(['SUPER_ADMIN', 'USER'])],
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'updated_at' => $user->updated_at,
        ]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        
        // Ne dozvoli brisanje vlastitog naloga
        if ($user->id === auth()->id()) {
            return response()->json(['error' => 'Cannot delete your own account'], 400);
        }

        $user->delete();
        return response()->json(null, 204);
    }
}