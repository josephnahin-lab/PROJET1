<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Seeded template skill requires an explicit deterministic UUID.
 */
#[Fillable(['id', 'template_id', 'position', 'label'])]
class FamilyTemplateSkill extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return ['position' => 'integer'];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(FamilyPathwayTemplate::class, 'template_id');
    }
}
