<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Seeded alias observations require an explicit deterministic UUID.
 */
#[Fillable(['id', 'template_id', 'source_key', 'week_position', 'source_topic', 'canonical_domain_id', 'canonical_topic_id', 'source_id', 'topic_match'])]
class FamilyTemplateDomainTopicAliasSource extends Model
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

    public function canonicalDomain(): BelongsTo
    {
        return $this->belongsTo(Domain::class, 'canonical_domain_id');
    }

    public function canonicalTopic(): BelongsTo
    {
        return $this->belongsTo(FamilyTemplateDomainTopic::class, 'canonical_topic_id');
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(ContentSource::class, 'source_id');
    }
}
