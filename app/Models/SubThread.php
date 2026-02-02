<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SubThread extends Model
{
    protected $fillable = [
        'thread_id',
        'role',
        'content',
        'model',
        'provider',
        'tokens_used',
        'cost_usd',
    ];

    protected $casts = [
        'tokens_used' => 'integer',
        'cost_usd' => 'decimal:6',
    ];

    public function thread()
    {
        return $this->belongsTo(Thread::class);
    }

    public function memories(): BelongsToMany
    {
        return $this->belongsToMany(Memory::class, 'memory_thread_relationships')
                    ->withPivot('thread_id')
                    ->withTimestamps();
    }
}
