<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Seeded stage requires an explicit deterministic UUID.
 */
#[Fillable(['id', 'template_week_id', 'stable_key', 'position', 'stage_title_template', 'objective_template', 'exercise_template', 'quiz_prompt_template'])]
class FamilyTemplateStage extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return ['position' => 'integer'];
    }

    public function week(): BelongsTo
    {
        return $this->belongsTo(FamilyTemplateWeek::class, 'template_week_id');
    }
}
