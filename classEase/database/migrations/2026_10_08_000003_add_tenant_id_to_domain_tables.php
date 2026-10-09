<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Every domain table belongs to exactly one tenant (school).
     * Nullable so rows can exist before a tenant is assigned during a
     * seed/backfill; the application always fills it from the tenant
     * context.
     *
     * @var list<string>
     */
    private const TABLES = [
        'users',
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

    public function up(): void
    {
        foreach (self::TABLES as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('tenant_id')
                    ->nullable()
                    ->constrained('tenants')
                    ->cascadeOnDelete();

                $table->index('tenant_id');
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropConstrainedForeignId('tenant_id');
            });
        }
    }
};
