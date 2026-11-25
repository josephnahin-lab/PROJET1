<?php

namespace App\Models;

use App\Casts\PostgresTextArray;
use Database\Factories\LearnerProjectProgressFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'project_id', 'status', 'checked_item_ids', 'url', 'completed_at', 'updated_at'])]
class LearnerProjectProgress extends Model
{
    /** @use HasFactory<LearnerProjectProgressFactory> */
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'checked_item_ids' => PostgresTextArray::class,
            'completed_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
