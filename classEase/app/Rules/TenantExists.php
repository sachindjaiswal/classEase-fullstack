<?php

namespace App\Rules;

use App\Tenant\TenantContext;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

/**
 * An `exists` validation rule scoped to the current tenant.
 *
 * The plain `exists:table,id` rule runs on the query builder and ignores
 * Eloquent global scopes, so on its own it would happily accept another
 * institution's id. Wrapping it here keeps every write path from
 * referencing rows outside the current tenant.
 */
class TenantExists
{
    public static function make(string $table, string $column = 'id'): Exists
    {
        $exists = Rule::exists($table, $column);

        if (TenantContext::has()) {
            $exists->where('tenant_id', TenantContext::id());
        }

        return $exists;
    }
}
