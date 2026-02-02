<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class MemoryTag extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'color',
    ];

    protected $casts = [
        'color' => 'string',
    ];

    public function memories(): MorphToMany
    {
        return $this->morphedByMany(Memory::class, 'taggable', 'memory_taggables');
    }
}