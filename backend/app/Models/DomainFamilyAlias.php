<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['alias', 'proposed_family_id', 'canonical_family_id', 'source_system', 'mapping_status', 'reviewed_by', 'reviewed_at', 'created_at'])]
class DomainFamilyAlias extends Model
{
    protected $primaryKey = 'alias';

    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return ['reviewed_at' => 'immutable_datetime', 'created_at' => 'immutable_datetime'];
    }

    public function proposedFamily(): BelongsTo
    {
        return $this->belongsTo(DomainFamily::class, 'proposed_family_id');
    }

    public function canonicalFamily(): BelongsTo
    {
        return $this->belongsTo(DomainFamily::class, 'canonical_family_id');
    }
}
