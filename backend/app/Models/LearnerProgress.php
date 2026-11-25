<?php

namespace App\Models;

use Database\Factories\LearnerProgressFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'pathway_id', 'status', 'plan', 'started_at', 'completed_at', 'last_activity_at'])]
class LearnerProgress extends Model
{
    /** @use HasFactory<LearnerProgressFactory> */
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'started_at' => 'immutable_datetime',
            'completed_at' => 'immutable_datetime',
            'last_activity_at' => 'immutable_datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pathway(): BelongsTo
    {
        return $this->belongsTo(Pathway::class);
    }
}
