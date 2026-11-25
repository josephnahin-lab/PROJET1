<?php

namespace App\Models;

use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['pathway_id', 'stable_key', 'title', 'instructions', 'position', 'status', 'source_record_id'])]
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory, HasUuids;

    public function pathway(): BelongsTo
    {
        return $this->belongsTo(Pathway::class);
    }

    public function checklistItems(): HasMany
    {
        return $this->hasMany(ProjectChecklistItem::class)->orderBy('position');
    }
}
