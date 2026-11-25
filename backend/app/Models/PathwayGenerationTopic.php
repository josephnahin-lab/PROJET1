<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Materialized topic; the composite key has no generated UUID.
 */
#[Fillable(['pathway_id', 'week_position', 'topic', 'topic_source', 'source_id'])]
class PathwayGenerationTopic extends Model
{
    protected $primaryKey = null;

    public $incrementing = false;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['week_position' => 'integer'];
    }

    public function pathway(): BelongsTo
    {
        return $this->belongsTo(Pathway::class);
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(ContentSource::class, 'source_id');
    }
}
