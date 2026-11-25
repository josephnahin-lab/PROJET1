<?php

namespace App\Models;

use Database\Factories\PortfolioAttachmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['portfolio_item_id', 'storage_key', 'original_name', 'media_type', 'size_bytes', 'sha256', 'created_at'])]
class PortfolioAttachment extends Model
{
    /** @use HasFactory<PortfolioAttachmentFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    public $timestamps = false;

    protected $hidden = [
        'storage_key',
        'original_name',
        'sha256',
        'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'created_at' => 'immutable_datetime',
        ];
    }

    public function portfolioItem(): BelongsTo
    {
        return $this->belongsTo(PortfolioItem::class);
    }
}
