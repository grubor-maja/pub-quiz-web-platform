<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('quiz_teams', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quiz_id');
            $table->unsignedBigInteger('team_id');
            $table->timestamp('registered_at');
            $table->enum('status', ['pending', 'registered', 'cancelled'])->default('registered');
            $table->unsignedTinyInteger('final_position')->nullable()
                  ->comment('Final position in quiz (1, 2, 3 for top 3, null for others)');
            $table->timestamps();

            // Foreign keys
            $table->foreign('quiz_id')->references('id')->on('quizzes')->onDelete('cascade');
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('cascade');

            // Unique constraint - one team can register for quiz only once
            $table->unique(['quiz_id', 'team_id']);

            // Indexes for better performance
            $table->index(['quiz_id', 'status']);
            $table->index(['team_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_teams');
    }
};
