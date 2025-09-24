<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OrgProxyController extends Controller
{

public function getOrganizations(Request $request)
{
    try {
        $res = Http::withHeaders($this->getInternalHeaders($request))
            ->get($this->getOrgSvcUrl() . "/api/internal/organizations");

        $body = $res->body();
        $body = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE"); 
        
        $data = json_decode($body, true);
        
        \Log::debug('response processing', [
            'raw_body' => $body,
            'parsed_data' => $data,
            'json_error' => json_last_error_msg()
        ]);

        return response()->json($data, $res->status());
    } catch (\Throwable $e) {
        \Log::error('Error fetching organizations from org-svc', [
            'message' => $e->getMessage(),
        ]);
        return response()->json([
            'error'   => 'org-svc unavailable',
            'message' => $e->getMessage(),
        ], 503);
    }
}


    public function createOrganization(Request $request)
    {
        try {
            $res = Http::withHeaders($this->getInternalHeaders($request))
                ->post($this->getOrgSvcUrl().'/api/internal/organizations', $request->all());

            $body = $res->body();
            $body = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE");
            $data = json_decode($body, true);
            
            return response()->json($data, $res->status());
        } catch (\Throwable $e) {
            Log::error('Error creating organization via org-svc', ['message'=>$e->getMessage()]);
            return response()->json([
                'error'   => 'org-svc unavailable',
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    public function getOrganization(Request $request, $id)
    {
        try {
            $res = Http::withHeaders($this->getInternalHeaders($request))
                ->get($this->getOrgSvcUrl() . "/api/internal/organizations/{$id}");

            $body = $res->body();
            $body = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE");
            $data = json_decode($body, true);
            
            return response()->json($data, $res->status());
        } catch (\Throwable $e) {
            return response()->json([
                'error'=>'org-svc unavailable',
                'message'=>$e->getMessage(),
            ], 503);
        }
    }

    public function addMember(Request $request, $id)
    {
        try {
            $res = Http::withHeaders($this->getInternalHeaders($request))
                ->post($this->getOrgSvcUrl() . "/api/internal/organizations/{$id}/members", $request->all());

            $body = $res->body();
            $body = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE");
            $data = json_decode($body, true);
            
            return response()->json($data, $res->status());
        } catch (\Throwable $e) {
            return response()->json([
                'error'=>'org-svc unavailable',
                'message'=>$e->getMessage(),
            ], 503);
        }
    }

    public function getMembers(Request $request, $id)
    {
        try {
            $res = Http::withHeaders($this->getInternalHeaders($request))
                ->get($this->getOrgSvcUrl() . "/api/internal/organizations/{$id}/members");

            $body = $res->body();
            $body = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE");
            $data = json_decode($body, true);
            
            return response()->json($data, $res->status());
        } catch (\Throwable $e) {
            return response()->json([
                'error'=>'org-svc unavailable',
                'message'=>$e->getMessage(),
            ], 503);
        }
    }

    public function health(Request $request)
    {
        try {
            $res = Http::withHeaders($this->getInternalHeaders($request))
                ->get($this->getOrgSvcUrl() . '/api/health');

            $body = $res->body();
            $body = ltrim($body, "\xEF\xBB\xBF\xFE\xFF\xFF\xFE");
            $orgResponse = json_decode($body, true);

            return response()->json([
                'org_svc_status' => $res->successful() ? 'OK' : 'ERROR',
                'org_response'   => $orgResponse,
                'user_id'        => optional($request->user())->id,
            ], $res->status());
        } catch (\Throwable $e) {
            return response()->json([
                'error'=>'org-svc unavailable',
                'message'=>$e->getMessage(),
            ], 503);
        }
    }

    private function getOrgSvcUrl()
    {
        return env('ORG_SVC_URL', 'http://localhost:8001');
    }

    private function getInternalHeaders(Request $request)
    {
        $headers = [
            'X-Internal-Auth' => env('INTERNAL_SHARED_SECRET', 'devsecret123'),
            'X-User-Id'       => optional($request->user())->id,
            'Accept'          => 'application/json',
            'Content-Type'    => 'application/json',
        ];

        Log::debug('Forwarding headers to org-svc', [
            'X-Internal-Auth' => $headers['X-Internal-Auth'] ? '***present***' : 'MISSING',
            'X-User-Id'       => $headers['X-User-Id'],
        ]);

        return $headers;
    }
}
