<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Use raw SQL to modify ENUM column to add 'pending' status
        DB::statement("ALTER TABLE quiz_teams MODIFY COLUMN status ENUM('pending', 'registered', 'cancelled') NOT NULL DEFAULT 'registered'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original ENUM values
        DB::statement("ALTER TABLE quiz_teams MODIFY COLUMN status ENUM('registered', 'cancelled') NOT NULL DEFAULT 'registered'");
    }
};
