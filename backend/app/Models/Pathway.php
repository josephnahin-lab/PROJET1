<?php

namespace App\Models;

use App\Casts\PostgresTextArray;
use Database\Factories\PathwayFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['domain_id', 'stable_key', 'slug', 'status', 'title', 'eyebrow', 'description', 'overview', 'difficulty', 'prerequisites', 'equipment', 'weekly_time', 'safety_note', 'completion_policy', 'family_template_id', 'family_template_version', 'generation_key', 'generation_checksum', 'version', 'source_version', 'published_at'])]
class Pathway extends Model
{
    /** @use HasFactory<PathwayFactory> */
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'prerequisites' => PostgresTextArray::class,
            'equipment' => PostgresTextArray::class,
            'completion_policy' => 'array',
            'family_template_version' => 'integer',
            'published_at' => 'immutable_datetime',
        ];
    }

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function weeks(): HasMany
    {
        return $this->hasMany(PathwayWeek::class)->orderBy('position');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class)->orderBy('position');
    }

    public function resources(): HasMany
    {
        return $this->hasMany(Resource::class)->orderBy('position');
    }

    public function familyTemplate(): BelongsTo
    {
        return $this->belongsTo(FamilyPathwayTemplate::class, 'family_template_id');
    }

    public function contentSources(): BelongsToMany
    {
        return $this->belongsToMany(ContentSource::class, 'pathway_content_sources');
    }

    public function generationTopics(): HasMany
    {
        return $this->hasMany(PathwayGenerationTopic::class)->orderBy('week_position');
    }

    public function skills(): HasMany
    {
        return $this->hasMany(PathwaySkill::class)->orderBy('position');
    }

    public function careerExamples(): HasMany
    {
        return $this->hasMany(PathwayCareerExample::class)->orderBy('position');
    }
}
