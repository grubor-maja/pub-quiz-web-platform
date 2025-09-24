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
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->string('venue'); 

            $table->date('date');   
            $table->time('time');   

            $table->unsignedInteger('min_team_size')->default(1);
            $table->unsignedInteger('max_team_size')->default(6);

            $table->decimal('fee', 8, 2)->nullable(); 
            $table->string('contact_phone')->nullable();

            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->index(['organization_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};
