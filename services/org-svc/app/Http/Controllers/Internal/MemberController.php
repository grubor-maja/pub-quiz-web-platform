<?php

namespace App\Http\Controllers\Internal;

use App\Models\Member;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;

class MemberController extends BaseController
{
    private function ensureAdmin(int $orgId, int $uid): void
    {
        $isAdmin = Member::where([
        'organization_id' => $orgId,
        'user_id' => $uid,
        'role' => 'ADMIN'
        ])->exists();

        abort_unless($isAdmin, 403, 'Only ADMIN can manage members');
    }


    public function store($id, Request $r)
    {

        try {
        $uid = (int) $r->header('X-User-Id');
//        abort_unless($uid, 401, 'Missing user');

        Organization::findOrFail($id);

        $data = $r->validate([
        'user_id' => 'required|integer',
        'role'    => 'required|string|in:ADMIN,MEMBER'
        ]);

        $m = Member::firstOrCreate(
        ['organization_id' => $id, 'user_id' => $data['user_id']],
        ['role' => $data['role']]
        );

        if (!$m->wasRecentlyCreated && $m->role !== $data['role']) {
            $m->role = $data['role'];
            $m->save();
        }

        return response()->json($m, 201);
        } catch( \Exception $e) {
            \Log::error('Member addition failed: ' . $e->getMessage());
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'service' => 'org-svc'
            ], 500);
        }

    }

    public function index($id)
    {
        $org = Organization::findOrFail($id);

        $members = Member::where('organization_id', $id)->get()
            ->map(function ($m) use ($org) {
                return [
                    'user_id'           => $m->user_id,
                    'role'              => $m->role,
                    'organization_id'   => $org->id,
                    'organization_name' => $org->name,
                ];
            });

        return response()->json($members);
    }

    public function destroy($orgId, $userId)
    {
        try {
            $member = Member::where('organization_id', $orgId)
                           ->where('user_id', $userId)
                           ->firstOrFail();

            $member->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            \Log::error('Member deletion failed: ' . $e->getMessage());
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'service' => 'org-svc'
            ], 500);
        }
    }

    public function update($orgId, $userId, Request $r)
    {
        try {
            $data = $r->validate([
                'role' => 'required|string|in:ADMIN,MEMBER'
            ]);

            $member = Member::where('organization_id', $orgId)
                           ->where('user_id', $userId)
                           ->firstOrFail();

            $member->role = $data['role'];
            $member->save();

            return response()->json($member);
        } catch (\Exception $e) {
            \Log::error('Member role update failed: ' . $e->getMessage());
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'service' => 'org-svc'
            ], 500);
        }
    }

    // Get all organizations for a specific user
    public function getUserOrganizations(Request $r)
    {
        try {
            $userId = (int) $r->header('X-User-Id');

            if (!$userId) {
                return response()->json([
                    'error' => true,
                    'message' => 'User ID not provided'
                ], 401);
            }

            $memberships = Member::where('user_id', $userId)
                ->with('organization')
                ->get()
                ->map(function ($m) {
                    return [
                        'organization_id' => $m->organization_id,
                        'organization_name' => $m->organization->name,
                        'role' => $m->role,
                        'created_at' => $m->created_at,
                    ];
                });

            return response()->json($memberships);
        } catch (\Exception $e) {
            \Log::error('Get user organizations failed: ' . $e->getMessage());
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'service' => 'org-svc'
            ], 500);
        }
    }
}
