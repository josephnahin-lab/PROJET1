<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Raw resource occurrence; its UUID must be supplied by the importer.
 */
#[Fillable(['id', 'source_record_id', 'position', 'title', 'url', 'language', 'provider', 'resource_checksum'])]
class SourceDomainResource extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    public function sourceRecord(): BelongsTo
    {
        return $this->belongsTo(SourceDomainRecord::class, 'source_record_id');
    }
}
