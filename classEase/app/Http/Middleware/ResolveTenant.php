<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Tenant\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs after auth:sanctum and binds the tenant of the authenticated
 * user, so every Eloquent query downstream is scoped by TenantScope.
 *
 * Platform admins have no tenant (they see and manage all tenants);
 * any other account without a tenant is rejected outright so it can
 * never read across tenants. Users of a soft-deleted (deactivated)
 * institution are rejected too.
 */
class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || $user->role === 'platform_admin') {
            TenantContext::set(null);

            return $next($request);
        }

        if ($user->tenant_id === null) {
            return response()->json([
                'message' => 'Your account is not linked to an institution.',
            ], 403);
        }

        $tenant = Tenant::withTrashed()->find((int) $user->tenant_id);

        if ($tenant === null || $tenant->trashed()) {
            return response()->json([
                'message' => 'Your institution has been deactivated.',
            ], 403);
        }

        TenantContext::set((int) $user->tenant_id);

        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        TenantContext::clear();
    }
}
