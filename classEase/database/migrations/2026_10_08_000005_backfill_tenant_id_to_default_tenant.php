<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Domain tables that receive a tenant_id backfill.
     * `users` is handled separately because platform admins must stay
     * tenant-less (they are the only accounts that span tenants).
     *
     * @var list<string>
     */
    private const TABLES = [
        'teachers',
        'classes',
        'students',
        'subjects',
        'attendances',
        'homeworks',
        'scores',
        'timetables',
        'announcements',
        'concerns',
        'attendance_corrections',
    ];

    /**
     * Pre-tenancy rows keep a NULL tenant_id, which would make
     * ResolveTenant reject every legacy account with a 403 and hide the
     * rows from every scoped query. Assign them all to a default tenant
     * so existing installations keep working after the upgrade.
     *
     * Fresh (empty) installs have nothing to backfill, so no default
     * tenant is created there.
     */
    public function up(): void
    {
        if (! Schema::hasTable('tenants') || ! Schema::hasColumn('users', 'tenant_id')) {
            return;
        }

        if (! $this->hasRowsToBackfill()) {
            return;
        }

        $tenantId = $this->ensureDefaultTenant();

        foreach (self::TABLES as $tableName) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'tenant_id')) {
                continue;
            }

            DB::table($tableName)
                ->whereNull('tenant_id')
                ->update(['tenant_id' => $tenantId]);
        }

        DB::table('users')
            ->whereNull('tenant_id')
            ->where('role', '!=', 'platform_admin')
            ->update(['tenant_id' => $tenantId]);
    }

    /**
     * Nulls the default tenant's backfilled stamps only. The tenant row
     * itself is left in place: deleting it would cascade-delete every
     * row still referencing it.
     */
    public function down(): void
    {
        if (! Schema::hasTable('tenants') || ! Schema::hasColumn('users', 'tenant_id')) {
            return;
        }

        $tenant = DB::table('tenants')->where('slug', 'default')->first();

        if ($tenant === null) {
            return;
        }

        foreach (self::TABLES as $tableName) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'tenant_id')) {
                continue;
            }

            DB::table($tableName)
                ->where('tenant_id', $tenant->id)
                ->update(['tenant_id' => null]);
        }

        DB::table('users')
            ->where('tenant_id', $tenant->id)
            ->update(['tenant_id' => null]);
    }

    private function hasRowsToBackfill(): bool
    {
        if (DB::table('users')
            ->whereNull('tenant_id')
            ->where('role', '!=', 'platform_admin')
            ->exists()) {
            return true;
        }

        foreach (self::TABLES as $tableName) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'tenant_id')) {
                continue;
            }

            if (DB::table($tableName)->whereNull('tenant_id')->exists()) {
                return true;
            }
        }

        return false;
    }

    private function ensureDefaultTenant(): int
    {
        $existing = DB::table('tenants')
            ->where('slug', 'default')
            ->value('id');

        if ($existing !== null) {
            return (int) $existing;
        }

        $now = now();

        return (int) DB::table('tenants')->insertGetId([
            'name' => 'ClassEase Default',
            'slug' => 'default',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }
};
