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
        Schema::create('league_rounds', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('league_id');
            $table->integer('round_number');
            $table->unsignedBigInteger('team_id');
            $table->integer('points');
            $table->integer('position')->nullable(); // pozicija u tom kolu
            $table->text('notes')->nullable();
            $table->timestamp('played_at')->nullable();
            $table->unsignedBigInteger('recorded_by'); // ko je uneo rezultat
            $table->timestamps();
            
            $table->foreign('league_id')->references('id')->on('leagues')->onDelete('cascade');
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('cascade');
            $table->index(['league_id', 'round_number']);
            $table->unique(['league_id', 'round_number', 'team_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('league_rounds');
    }
};
