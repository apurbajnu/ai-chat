<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
