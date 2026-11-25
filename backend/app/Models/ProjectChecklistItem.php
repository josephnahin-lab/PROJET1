<?php

namespace App\Models;

use Database\Factories\ProjectChecklistItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['project_id', 'stable_key', 'position', 'label'])]
class ProjectChecklistItem extends Model
{
    /** @use HasFactory<ProjectChecklistItemFactory> */
    use HasFactory, HasUuids;

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
