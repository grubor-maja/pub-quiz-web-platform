<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * Organization data loaded from members table
     */
    protected $organizationData = null;

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Helper methods for role checking
    public function isSuperAdmin(): bool
    {
        return $this->role === 'SUPER_ADMIN';
    }

    public function isUser(): bool
    {
        return $this->role === 'USER';
    }

    /**
     * Load organization data from members table via org-svc
     */
    public function loadOrganizationData()
    {
        // Check if data is already loaded
        if ($this->organizationData !== null) {
            return;
        }

        // Use cache to avoid repeated API calls
        $cacheKey = "user_org_data_{$this->id}";
        $this->organizationData = Cache::remember($cacheKey, 300, function () { // Cache for 5 minutes
            try {
                // Get all organizations
                $response = Http::withHeaders([
                    'X-Internal-Auth' => config('services.internal_auth_token'),
                    'Accept' => 'application/json',
                ])->get(config('services.org_service.url') . "/api/internal/organizations");
                
                if (!$response->successful()) {
                    return ['organization_id' => null, 'organization_role' => null];
                }
                
                $organizations = $response->json();
                
                // Check each organization for membership
                if (is_array($organizations)) {
                    foreach ($organizations as $org) {
                        $membersResponse = Http::withHeaders([
                            'X-Internal-Auth' => config('services.internal_auth_token'),
                            'Accept' => 'application/json',
                        ])->get(config('services.org_service.url') . "/api/internal/organizations/{$org['id']}/members");
                        
                        if ($membersResponse->successful()) {
                            $members = $membersResponse->json();
                            if (is_array($members)) {
                                foreach ($members as $member) {
                                    if (($member['user_id'] ?? null) == $this->id) {
                                        return [
                                            'organization_id' => $org['id'] ?? null,
                                            'organization_role' => $member['role'] ?? null,
                                            'organization_name' => $org['name'] ?? null
                                        ];
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                \Log::error("Failed to load organization data for user {$this->id}: " . $e->getMessage());
            }
            
            return ['organization_id' => null, 'organization_role' => null, 'organization_name' => null];
        });
    }

    /**
     * Get organization_id from members table
     */
    public function getOrganizationIdAttribute()
    {
        $this->loadOrganizationData();
        return $this->organizationData['organization_id'] ?? null;
    }

    /**
     * Get organization_role from members table
     */
    public function getOrganizationRoleAttribute()
    {
        $this->loadOrganizationData();
        return $this->organizationData['organization_role'] ?? null;
    }

    /**
     * Get organization_name from members table
     */
    public function getOrganizationNameAttribute()
    {
        $this->loadOrganizationData();
        return $this->organizationData['organization_name'] ?? null;
    }
}
