<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
