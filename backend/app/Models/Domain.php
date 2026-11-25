<?php

namespace App\Models;

use Database\Factories\DomainFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['id', 'family_id', 'name', 'summary', 'availability', 'content_status', 'source_version', 'published_at'])]
class Domain extends Model
{
    /** @use HasFactory<DomainFactory> */
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return ['published_at' => 'immutable_datetime'];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(DomainFamily::class, 'family_id');
    }

    public function pathways(): HasMany
    {
        return $this->hasMany(Pathway::class);
    }

    public function contentSources(): BelongsToMany
    {
        return $this->belongsToMany(ContentSource::class, 'domain_content_sources');
    }
}
