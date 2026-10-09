<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add the platform_admin (super-admin) role.
     *
     * Platform admins belong to no tenant — they create and manage
     * tenants and their admin accounts.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', [
                'student',
                'teacher',
                'admin',
                'platform_admin',
            ])->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', [
                'student',
                'teacher',
                'admin',
            ])->change();
        });
    }
};
