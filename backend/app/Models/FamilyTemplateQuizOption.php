<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Seeded quiz option requires an explicit deterministic UUID.
 */
#[Fillable(['id', 'template_week_id', 'stable_key', 'position', 'label'])]
class FamilyTemplateQuizOption extends Model
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
