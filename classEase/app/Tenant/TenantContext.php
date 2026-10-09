<?php

namespace App\Tenant;

/**
 * Holds the tenant (school/institution) that the current request operates in.
 *
 * Bound as a singleton so the global scope can read it without passing
 * state through every query. Set by the resolve-tenant middleware from
 * the authenticated user's tenant_id; left null for platform admins and
 * for console commands (seeders) where all tenants are visible.
 */
class TenantContext
{
    private ?int $tenantId = null;

    public static function set(?int $tenantId): void
    {
        app(self::class)->tenantId = $tenantId;
    }

    public static function id(): ?int
    {
        return app(self::class)->tenantId;
    }

    public static function has(): bool
    {
        return self::id() !== null;
    }

    public static function clear(): void
    {
        self::set(null);
    }
}
