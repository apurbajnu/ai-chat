<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Memory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'content',
        'category',
        'metadata',
        'access_count',
        'last_accessed_at',
        'is_active',
    ];

    protected $casts = [
        'metadata' => 'array',
        'last_accessed_at' => 'datetime',
        'is_active' => 'boolean',
        'access_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function threads()
    {
        return $this->belongsToMany(Thread::class, 'memory_thread_relationships')
                    ->withPivot('sub_thread_id')
                    ->withTimestamps();
    }

    public function subThreads()
    {
        return $this->belongsToMany(SubThread::class, 'memory_thread_relationships')
                    ->withPivot('thread_id')
                    ->withTimestamps();
    }

    public function tags(): MorphToMany
    {
        return $this->morphToMany(MemoryTag::class, 'taggable', 'memory_taggables');
    }

    /**
     * Increment the access count and update the last accessed timestamp
     */
    public function incrementAccessCount(): void
    {
        $this->increment('access_count');
        $this->update(['last_accessed_at' => now()]);
    }
}