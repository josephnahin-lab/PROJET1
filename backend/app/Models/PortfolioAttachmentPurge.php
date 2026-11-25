<?php

namespace App\Models;

use Database\Factories\PortfolioAttachmentPurgeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['attachment_id', 'storage_key', 'created_at'])]
class PortfolioAttachmentPurge extends Model
{
    /** @use HasFactory<PortfolioAttachmentPurgeFactory> */
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $hidden = [
        'storage_key',
        'attachment_id',
    ];
}
