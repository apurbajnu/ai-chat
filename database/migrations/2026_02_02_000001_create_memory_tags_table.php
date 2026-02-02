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
        Schema::create('memory_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('color')->nullable(); // For UI purposes
            $table->timestamps();

            $table->unique('name');
        });

        Schema::create('memory_taggables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memory_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('taggable_id');
            $table->string('taggable_type'); // Polymorphic relation to allow tagging different types
            $table->timestamps();

            $table->index(['taggable_id', 'taggable_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memory_taggables');
        Schema::dropIfExists('memory_tags');
    }
};