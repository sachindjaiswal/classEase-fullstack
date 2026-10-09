<?php

namespace App\Http\Controllers;

use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\User;
use App\Tenant\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a student account into an institution (tenant).
     *
     * Registration is open, but a tenant_slug (school code) is required —
     * an account is always created inside exactly one institution, and
     * admins/teachers are created by that institution's admin.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->whereNull('deleted_at')],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'tenant_slug' => ['required', 'string', 'max:255', Rule::exists('tenants', 'slug')->whereNull('deleted_at')],
        ]);

        $tenant = Tenant::query()->where('slug', $validated['tenant_slug'])->firstOrFail();

        // Bind the target tenant so the model hook stamps the new
        // account with the right institution, then restore whatever was
        // bound before (nothing, in a normal request).
        $previousTenant = TenantContext::id();
        TenantContext::set((int) $tenant->id);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'student',
            'tenant_id' => $tenant->id,
        ]);

        TenantContext::set($previousTenant);

        $token = $user->createToken('classEase-api-token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Credential lookup must ignore tenant scoping: the tenant is
        // derived from the account itself, and no context is bound yet.
        $user = User::withoutGlobalScope(TenantScope::class)
            ->where('email', $request->email)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('classEase-api-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Get currently authenticated user (with their institution)
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('tenant'),
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful',
        ]);
    }
}
