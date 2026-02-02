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
        Schema::create('memories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('content');
            $table->string('category')->nullable(); // e.g., 'personal', 'preferences', 'facts', 'context'
            $table->json('metadata')->nullable(); // Additional info like importance score, entities, etc.
            $table->integer('access_count')->default(0); // How often this memory has been accessed
            $table->timestamp('last_accessed_at')->nullable(); // Last time this memory was recalled
            $table->boolean('is_active')->default(true); // Whether this memory is active for recall
            $table->timestamps();

            $table->index(['user_id', 'category']);
            $table->index('created_at');
            $table->index('access_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memories');
    }
};