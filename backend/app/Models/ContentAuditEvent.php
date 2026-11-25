<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['actor_id', 'entity_type', 'entity_id', 'entity_revision_key', 'action', 'before_checksum', 'after_checksum', 'created_at'])]
class ContentAuditEvent extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['created_at' => 'immutable_datetime'];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function contentSources(): BelongsToMany
    {
        return $this->belongsToMany(ContentSource::class, 'content_audit_event_sources', 'audit_event_id');
    }
}
