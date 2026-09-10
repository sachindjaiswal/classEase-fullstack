<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->foreignId('class_id')
                ->constrained('classes')
                ->cascadeOnDelete();

            $table->date('date');

            $table->enum('status', ['present', 'absent', 'late'])
                ->default('present');

            $table->foreignId('marked_by')
                ->nullable()
                ->constrained('teachers')
                ->nullOnDelete();

            $table->text('remarks')->nullable();

            $table->unique(['student_id', 'date']);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
