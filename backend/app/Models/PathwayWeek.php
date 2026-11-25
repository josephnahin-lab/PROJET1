<?php

namespace App\Models;

use Database\Factories\PathwayWeekFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['pathway_id', 'stable_key', 'position', 'title', 'label'])]
class PathwayWeek extends Model
{
    /** @use HasFactory<PathwayWeekFactory> */
    use HasFactory, HasUuids;

    public function pathway(): BelongsTo
    {
        return $this->belongsTo(Pathway::class);
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class, 'week_id')->orderBy('position');
    }
}
