<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Thread extends Model
{
    protected $fillable = [
        'title',
        'first_message',
    ];

    public function subThreads()
    {
        return $this->hasMany(SubThread::class)->orderBy('created_at', 'asc');
    }

    public function messageCount()
    {
        return $this->subThreads()->count();
    }

    public function memories(): BelongsToMany
    {
        return $this->belongsToMany(Memory::class, 'memory_thread_relationships')
                    ->withPivot('sub_thread_id')
                    ->withTimestamps();
    }
}
