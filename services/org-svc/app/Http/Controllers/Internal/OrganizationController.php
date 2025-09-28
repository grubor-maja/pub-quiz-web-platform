<?php

namespace App\Http\Controllers\Internal;

use App\Models\Organization;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;

class OrganizationController extends BaseController
{
    public function store(Request $r)
    {
        try {
            $uid = (int) $r->header('X-User-Id');
            abort_unless($uid, 401, 'Missing user');
            
            $data = $r->validate([
                'name' => 'required|string|min:2',
                'admin_user_id' => 'required|integer'
            ]);
            
            // Debug info
            \Log::info('Creating organization', [
                'user_id' => $uid,
                'name' => $data['name'],
                'admin_user_id' => $data['admin_user_id'],
                'headers' => $r->headers->all()
            ]);
            
            $org = Organization::create([
                'name' => $data['name'], 
                'created_by' => $uid
            ]);
            
            // Dodaj izabranog korisnika kao ADMIN
            Member::create([
                'organization_id' => $org->id, 
                'user_id' => $data['admin_user_id'], 
                'role' => 'ADMIN'
            ]);
            
            return response()->json($org, 201);
        } catch (\Exception $e) {
            \Log::error('Organization creation failed: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'exception' => get_class($e),
                'service' => 'org-svc'
            ], 500);
        }
    }

    public function update(Request $r, $id)
    {
        try {
            $uid = (int) $r->header('X-User-Id');
            abort_unless($uid, 401, 'Missing user');
            
            $org = Organization::findOrFail($id);
            
            $data = $r->validate(['name' => 'required|string|min:2']);
            
            $org->update($data);
            
            return response()->json($org);
        } catch (\Exception $e) {
            \Log::error('Organization update failed: ' . $e->getMessage());
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'exception' => get_class($e),
                'service' => 'org-svc'
            ], 500);
        }
    }

    public function show($id)
    {
        $org = Organization::findOrFail($id);
        return response()->json($org);
    }


    public function destroy($id)
    {
        try {
            $org = Organization::findOrFail($id);
            
            // Obriši sve članove prvo
            Member::where('organization_id', $id)->delete();
            
            // Obriši organizaciju
            $org->delete();
            
            return response()->json(null, 204);
        } catch (\Exception $e) {
            \Log::error('Organization deletion failed: ' . $e->getMessage());
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'service' => 'org-svc'
            ], 500);
        }
    }

    public function index()
    {
        $orgs = Organization::all();
        return response()->json($orgs);
    }
}
