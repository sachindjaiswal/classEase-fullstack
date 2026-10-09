<?php

namespace App\Models\Concerns;

use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Tenant\TenantContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Makes a model tenant-scoped: reads are filtered by TenantScope and
 * writes are stamped with the current tenant.
 *
 * When a tenant context is active it ALWAYS wins on creating/updating,
 * so a crafted payload can never move a row across tenants. With no
 * context (seeder/console) an explicit tenant_id is respected as-is.
 */
trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (Model $model): void {
            if (TenantContext::has()) {
                $model->setAttribute('tenant_id', TenantContext::id());
            }
        });

        static::updating(function (Model $model): void {
            if (TenantContext::has()) {
                $model->setAttribute('tenant_id', TenantContext::id());
            }
        });
    }

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
