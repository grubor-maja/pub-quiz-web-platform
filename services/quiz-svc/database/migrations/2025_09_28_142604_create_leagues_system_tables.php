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
        // Drop tables if they exist (with foreign key handling)
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('league_rounds');
        Schema::dropIfExists('league_teams');
        Schema::dropIfExists('leagues');
        Schema::enableForeignKeyConstraints();
        
        // Create leagues table
        Schema::create('leagues', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->string('name');
            $table->enum('season', ['Prolece', 'Leto', 'Jesen', 'Zima']);
            $table->integer('year');
            $table->integer('total_rounds');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
            
            $table->index(['organization_id', 'season', 'year']);
            $table->unique(['organization_id', 'name', 'season', 'year']);
        });
        
        // Create league_teams pivot table
        Schema::create('league_teams', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('league_id');
            $table->unsignedBigInteger('team_id');
            $table->integer('total_points')->default(0);
            $table->integer('matches_played')->default(0);
            $table->integer('wins')->default(0);
            $table->integer('draws')->default(0);
            $table->integer('losses')->default(0);
            $table->timestamps();
            
            $table->foreign('league_id')->references('id')->on('leagues')->onDelete('cascade');
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('cascade');
            $table->unique(['league_id', 'team_id']);
        });
        
        // Create league_rounds table
        Schema::create('league_rounds', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('league_id');
            $table->integer('round_number');
            $table->unsignedBigInteger('team_id');
            $table->integer('points');
            $table->integer('position')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('played_at')->nullable();
            $table->unsignedBigInteger('recorded_by');
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
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('league_rounds');
        Schema::dropIfExists('league_teams');
        Schema::dropIfExists('leagues');
        Schema::enableForeignKeyConstraints();
    }
};
