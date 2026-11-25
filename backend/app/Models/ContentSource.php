<?php

namespace App\Models;

use Database\Factories\ContentSourceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use InvalidArgumentException;

#[Fillable(['source_path', 'source_key', 'source_revision', 'source_checksum', 'extracted_at', 'revision_author_id', 'license_status', 'attribution', 'reviewed_by', 'reviewed_at', 'notes'])]
class ContentSource extends Model
{
    /** @use HasFactory<ContentSourceFactory> */
    use HasFactory, HasUuids;

    public $timestamps = false;

    /**
     * Create an imported source with its contract UUIDv5, without making `id` mass assignable.
     *
     * @param  array<string, mixed>  $attributes
     */
    public static function createFromSeed(string $canonicalSourceKey, int $version, array $attributes): self
    {
        if (in_array($attributes['license_status'] ?? 'unknown', ['approved', 'rejected'], true)
            || ($attributes['reviewed_by'] ?? null) !== null
            || ($attributes['reviewed_at'] ?? null) !== null) {
            throw new InvalidArgumentException('Seeded content sources cannot be reviewed or approved.');
        }

        $source = new self;
        $source->fill($attributes);
        $source->setAttribute('id', ContentSeedUuid::root('content_source', $canonicalSourceKey, $version));
        $source->save();

        return $source;
    }

    public function revisionAuthor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revision_author_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function sourceDomainRecords(): HasMany
    {
        return $this->hasMany(SourceDomainRecord::class);
    }
}
