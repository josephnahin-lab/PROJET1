<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Raw source occurrence; its UUID must be supplied by the importer.
 */
#[Fillable(['id', 'content_source_id', 'source_system', 'source_record_key', 'source_position', 'source_domain_id', 'raw_family_id', 'canonical_family_id', 'family_resolution', 'canonical_domain_id', 'raw_name', 'raw_description', 'raw_status', 'record_checksum', 'created_at'])]
class SourceDomainRecord extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    public function contentSource(): BelongsTo
    {
        return $this->belongsTo(ContentSource::class);
    }

    public function rawResources(): HasMany
    {
        return $this->hasMany(SourceDomainResource::class, 'source_record_id')->orderBy('position');
    }
}
