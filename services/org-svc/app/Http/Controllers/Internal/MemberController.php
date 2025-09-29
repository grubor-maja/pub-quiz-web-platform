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
        abort_unless($uid, 401, 'Missing user');

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
}
