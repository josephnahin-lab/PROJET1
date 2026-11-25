<?php

namespace App\Models;

use Database\Factories\LessonFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['week_id', 'stable_key', 'position', 'title', 'objective', 'explanation', 'activity', 'duration_minutes'])]
class Lesson extends Model
{
    /** @use HasFactory<LessonFactory> */
    use HasFactory, HasUuids;

    public function week(): BelongsTo
    {
        return $this->belongsTo(PathwayWeek::class, 'week_id');
    }

    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }

    public function resources(): HasMany
    {
        return $this->hasMany(Resource::class)->orderBy('position');
    }

    public function contentSources(): BelongsToMany
    {
        return $this->belongsToMany(ContentSource::class, 'lesson_content_sources');
    }
}
