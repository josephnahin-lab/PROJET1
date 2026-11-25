<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Seeded career examples require an explicit deterministic UUID.
 */
#[Fillable(['id', 'pathway_id', 'position', 'label'])]
class PathwayCareerExample extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return ['position' => 'integer'];
    }

    public function pathway(): BelongsTo
    {
        return $this->belongsTo(Pathway::class);
    }
}
