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
        Schema::create('memory_thread_relationships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memory_id')->constrained()->onDelete('cascade');
            $table->foreignId('thread_id')->constrained()->onDelete('cascade');
            $table->foreignId('sub_thread_id')->nullable()->constrained()->onDelete('cascade'); // Specific message that triggered this memory
            $table->timestamps();

            $table->index(['thread_id', 'memory_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memory_thread_relationships');
    }
};