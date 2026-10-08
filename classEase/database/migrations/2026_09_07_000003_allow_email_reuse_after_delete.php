<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Email uniqueness is enforced in app validation against NON-deleted rows only,
        // so soft-deleted teachers/students/users no longer block reusing the email.
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropUnique('teachers_email_unique');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropUnique('students_email_unique');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_email_unique');
        });

        // Free emails held by already-deleted logins (created before user force-delete).
        DB::table('users')->whereNotNull('deleted_at')->delete();
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->unique('email');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->unique('email');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unique('email');
        });
    }
};
