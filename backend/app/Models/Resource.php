<?php

namespace App\Models;

use Database\Factories\ResourceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['stable_key', 'domain_id', 'pathway_id', 'lesson_id', 'title', 'url', 'provider', 'language', 'resource_kind', 'access_note', 'status', 'verification_status', 'verified_at', 'source_record_id', 'position'])]
class Resource extends Model
{
    /** @use HasFactory<ResourceFactory> */
    use HasFactory, HasUuids;

    public function pathway(): BelongsTo
    {
        return $this->belongsTo(Pathway::class);
    }

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(ContentSource::class, 'source_record_id');
    }
}
