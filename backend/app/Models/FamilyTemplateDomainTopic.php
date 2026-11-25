<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Seeded canonical topic override requires an explicit deterministic UUID.
 */
#[Fillable(['id', 'template_id', 'stable_key', 'domain_id', 'week_position', 'topic', 'source_id'])]
class FamilyTemplateDomainTopic extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return ['week_position' => 'integer'];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(FamilyPathwayTemplate::class, 'template_id');
    }

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(ContentSource::class, 'source_id');
    }
}
