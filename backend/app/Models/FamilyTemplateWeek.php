<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Versioned template week; importers must assign its contract UUIDv5.
 */
#[Fillable(['id', 'template_id', 'stable_key', 'position', 'title', 'explanation', 'exercise', 'quiz_prompt', 'source_answer_index', 'correct_option_position', 'feedback'])]
class FamilyTemplateWeek extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'source_answer_index' => 'integer',
            'correct_option_position' => 'integer',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(FamilyPathwayTemplate::class, 'template_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(FamilyTemplateQuizOption::class, 'template_week_id')->orderBy('position');
    }

    public function stages(): HasMany
    {
        return $this->hasMany(FamilyTemplateStage::class, 'template_week_id')->orderBy('position');
    }
}
