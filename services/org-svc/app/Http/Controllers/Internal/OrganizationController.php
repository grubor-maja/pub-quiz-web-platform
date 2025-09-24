<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Member;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function store(Request $r)
    {
        try {
            $uid = (int) $r->header('X-User-Id');
            abort_unless($uid, 401, 'Missing user');
            
            $data = $r->validate(['name' => 'required|string|min:2']);
            
            // Debug info
            \Log::info('Creating organization', [
                'user_id' => $uid,
                'name' => $data['name'],
                'headers' => $r->headers->all()
            ]);
            
            $org = Organization::create([
                'name' => $data['name'], 
                'created_by' => $uid
            ]);
            
            Member::create([
                'organization_id' => $org->id, 
                'user_id' => $uid, 
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

    public function show($id)
    {
        $org = Organization::findOrFail($id);
        return response()->json($org);
    }

    public function index()
    {
        $orgs = Organization::all();
        // log in terinal all organziations
        \Log::info('Listing all organizations', ['count' => $orgs->count()]);
        \Log::info($orgs);
        return response()->json($orgs);
    }
}
