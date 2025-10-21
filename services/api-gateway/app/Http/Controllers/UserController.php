<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /** Vraća listu svih korisnika (bez poziva na org-svc) */
    public function index()
    {
        $users = User::select(['id', 'name', 'email', 'role', 'created_at'])->get();

        return response()->json($users);
    }

    /** Vraća pojedinačnog korisnika */
    public function show($id)
    {
        $user = User::select(['id', 'name', 'email', 'role', 'created_at'])
            ->findOrFail($id);

        return response()->json($user);
    }

    /** Kreira novog korisnika */
    public function store(Request $request)
    {
        try {
            \Log::info('Creating user with data: ' . json_encode($request->only(['name', 'email', 'role'])));

            $data = $request->validate([
                'name'     => 'required|string|max:255',
                'email'    => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
                'role'     => ['required', Rule::in(['SUPER_ADMIN', 'USER'])],
            ]);

            $user = User::create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'password' => Hash::make($data['password']),
                'role'     => $data['role'],
            ]);

            \Log::info('User created successfully', ['user_id' => $user->id, 'email' => $user->email]);

            // Return user without password field
            return response()->json([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('User validation failed', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Throwable $e) {
            \Log::error('User creation failed: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'User creation failed', 'error' => $e->getMessage()], 500);
        }
    }

    /** Ažurira postojećeg korisnika */
    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            \Log::info('Updating user', ['user_id' => $id, 'data' => $request->only(['name', 'email', 'role'])]);

            $data = $request->validate([
                'name'     => 'sometimes|required|string|max:255',
                'email'    => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
                'password' => 'sometimes|string|min:8|confirmed',
                'role'     => ['sometimes', 'required', Rule::in(['SUPER_ADMIN', 'USER'])],
            ]);

            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            $user->update($data);

            \Log::info('User updated successfully', ['user_id' => $user->id]);

            // Return user without password field
            return response()->json([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('User update validation failed', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Throwable $e) {
            \Log::error('User update failed: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'User update failed', 'error' => $e->getMessage()], 500);
        }
    }

    /** Briše korisnika */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json(['error' => 'Cannot delete your own account'], 400);
        }

        $user->delete();
        return response()->json(null, 204);
    }
}
