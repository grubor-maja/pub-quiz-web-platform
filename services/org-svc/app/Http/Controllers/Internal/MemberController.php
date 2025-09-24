<?php

namespace App\Http\Controllers\Internal;

use App\Models\Member;
use App\Models\Organization;
use Illuminate\Http\Request;

class MemberController extends Controller
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
        $uid = (int) $r->header('X-User-Id');
        abort_unless($uid, 401, 'Missing user');

        Organization::findOrFail($id);
        $this->ensureAdmin((int) $id, $uid);

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
    }

    public function index($id)
    {
        Organization::findOrFail($id);
        $members = Member::where('organization_id', $id)->get();
        return response()->json($members);
    }
}
