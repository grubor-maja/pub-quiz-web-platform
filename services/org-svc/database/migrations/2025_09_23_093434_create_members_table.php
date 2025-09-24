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
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')
              ->constrained('organizations')
              ->cascadeOnDelete();
            $table->unsignedBigInteger('user_id'); // id korisnika iz gateway DB-a
            $table->string('role'); // 'ADMIN' | 'MEMBER'
            $table->timestamps();

            $table->unique(['organization_id','user_id']);
            $table->index(['user_id','role']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
