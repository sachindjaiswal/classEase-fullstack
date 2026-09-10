<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scores', function (Blueprint $table) {
            if (! Schema::hasColumn('scores', 'semester')) {
                $table->string('semester')->default('current')->after('exam_type');
            }
        });

        Schema::table('scores', function (Blueprint $table) {
            $table->unique(['student_id', 'subject_id', 'exam_type', 'semester']);
        });

        Schema::table('scores', function (Blueprint $table) {
            if (Schema::hasIndex('scores', ['student_id', 'subject_id', 'exam_type'])) {
                $table->dropUnique(['student_id', 'subject_id', 'exam_type']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('scores', function (Blueprint $table) {
            if (Schema::hasIndex('scores', ['student_id', 'subject_id', 'exam_type', 'semester'])) {
                $table->dropUnique(['student_id', 'subject_id', 'exam_type', 'semester']);
            }

            $table->unique(['student_id', 'subject_id', 'exam_type']);
        });

        Schema::table('scores', function (Blueprint $table) {
            if (Schema::hasColumn('scores', 'semester')) {
                $table->dropColumn('semester');
            }
        });
    }
};
