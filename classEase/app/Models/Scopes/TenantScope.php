<?php

namespace App\Models\Scopes;

use App\Tenant\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Restricts every query on a tenant-scoped model to the tenant of the
 * current request. When no tenant is set (platform admin, console,
 * unauthenticated routes) no filter is applied.
 *
 * @implements Scope<Model>
 */
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (TenantContext::has()) {
            $builder->where($model->qualifyColumn('tenant_id'), TenantContext::id());
        }
    }
}
