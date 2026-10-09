<?php

namespace App\Http\Controllers;

use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TenantController extends Controller
{
    /**
     * List institutions available for self-registration (public).
     */
    public function signupList(): JsonResponse
    {
        $tenants = Tenant::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return response()->json([
            'tenants' => $tenants,
        ]);
    }

    /**
     * List every institution (platform view).
     */
    public function index(): JsonResponse
    {
        $tenants = Tenant::query()
            ->withCount('users')
            ->withCount(['users as admins_count' => function ($query): void {
                $query->where('role', 'admin');
            }])
            ->with('admins:id,name,email,tenant_id')
            ->orderBy('name')
            ->get();

        return response()->json([
            'tenants' => $tenants,
        ]);
    }

    /**
     * Create an institution and its first admin account.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9\-]+$/',
                Rule::unique('tenants', 'slug'),
            ],
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->whereNull('deleted_at'),
            ],
            'admin_password' => ['required', 'string', 'min:6'],
        ]);

        $tenant = DB::transaction(function () use ($validated): Tenant {
            $tenant = Tenant::create([
                'name' => $validated['name'],
                'slug' => $validated['slug'],
            ]);

            User::create([
                'name' => $validated['admin_name'],
                'email' => $validated['admin_email'],
                'password' => $validated['admin_password'],
                'role' => 'admin',
                'tenant_id' => $tenant->id,
            ]);

            return $tenant;
        });

        return response()->json([
            'message' => 'Institution created',
            'tenant' => $tenant,
        ], 201);
    }

    /**
     * Update an institution's name / slug.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9\-]+$/',
                Rule::unique('tenants', 'slug')->ignore($tenant->id),
            ],
        ]);

        $tenant->update($validated);

        return response()->json([
            'message' => 'Institution updated',
            'tenant' => $tenant,
        ]);
    }

    /**
     * Add another admin account to an existing institution.
     */
    public function storeAdmin(Request $request, int $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->whereNull('deleted_at'),
            ],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $admin = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'admin',
            'tenant_id' => $tenant->id,
        ]);

        return response()->json([
            'message' => 'Admin account created',
            'admin' => $admin,
        ], 201);
    }

    /**
     * Delete a user account permanently. Platform only — guards against
     * deleting platform admins, yourself, or the last admin of a school.
     *
     * The linked Student/Teacher profile is purged too (force delete), so the
     * email and row are fully freed for reuse instead of leaving a half-deleted
     * user whose active profile blocked re-adding the same email.
     */
    public function destroyUser(int $id): JsonResponse
    {
        $user = User::withoutGlobalScope(TenantScope::class)->findOrFail($id);

        if ($user->role === 'platform_admin') {
            return response()->json([
                'message' => 'Platform admin accounts cannot be deleted.',
            ], 422);
        }

        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        if ($user->role === 'admin' && $user->tenant_id !== null) {
            $adminCount = User::withoutGlobalScope(TenantScope::class)
                ->where('tenant_id', $user->tenant_id)
                ->where('role', 'admin')
                ->whereNull('deleted_at')
                ->count();

            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'An institution must keep at least one admin.',
                ], 422);
            }
        }

        DB::transaction(function () use ($user): void {
            $user->student()->withTrashed()->forceDelete();
            $user->teacher()->withTrashed()->forceDelete();
            $user->tokens()->delete();
            $user->forceDelete();
        });

        return response()->json([
            'message' => 'User deleted',
        ]);
    }

    /**
     * Remove an institution. Soft delete: the account data stays intact
     * until a hard delete is issued deliberately.
     */
    public function destroy(int $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $tenant->delete();

        return response()->json([
            'message' => 'Institution deleted',
        ]);
    }
}
