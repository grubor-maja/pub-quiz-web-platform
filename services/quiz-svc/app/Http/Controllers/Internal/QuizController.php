<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function store(Request $r)
    {
        $uid = $r->user_id ?? null;
        abort_unless($uid, 401, 'Missing user');

        $data = $r->validate([
            'organization_id' => 'required|integer',
            'title'           => 'required|string|min:3',
            'description'     => 'nullable|string',
            'image_url'       => 'nullable|string',
            'venue'           => 'required|string|min:2',
            'date'            => 'required|date',
            'time'            => 'required|date_format:H:i',
            'min_team_size'   => 'required|integer|min:1',
            'max_team_size'   => 'required|integer|min:1',
            'fee'             => 'nullable|numeric|min:0',
            'contact_phone'   => 'nullable|string',
        ]);

        $quiz = Quiz::create(array_merge($data, ['created_by' => $uid]));

        return response()->json($quiz, 201);
    }

    public function show($id)
    {
        $quiz = Quiz::findOrFail($id);
        return response()->json($quiz);
    }

    public function listByOrg($orgId)
    {
        $items = Quiz::where('organization_id', $orgId)->orderBy('date')->get();
        return response()->json($items);
    }

    public function index()
    {
        $items = Quiz::orderBy('date')->get();
        return response()->json($items);
    }

    public function update($id, Request $r)
    {
        $uid = $r->user_id ?? null;
        abort_unless($uid, 401, 'Missing user');

        $quiz = Quiz::findOrFail($id);

        $data = $r->validate([
            'organization_id' => 'sometimes|required|integer',
            'title'           => 'sometimes|required|string|min:3',
            'description'     => 'nullable|string',
            'image_url'       => 'nullable|string',
            'venue'           => 'sometimes|required|string|min:2',
            'date'            => 'sometimes|required|date',
            'time'            => 'sometimes|required|date_format:H:i',
            'min_team_size'   => 'sometimes|required|integer|min:1',
            'max_team_size'   => 'sometimes|required|integer|min:1',
            'fee'             => 'nullable|numeric|min:0',
            'contact_phone'   => 'nullable|string',
        ]);

        $quiz->update($data);

        return response()->json($quiz);
    }

    public function destroy($id)
    {
        $quiz = Quiz::findOrFail($id);
        $quiz->delete();

        return response()->json(null, 204);
    }
}
