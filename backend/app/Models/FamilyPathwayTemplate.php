<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Versioned family template; importers must assign its contract UUIDv5.
 */
#[Fillable(['id', 'family_id', 'stable_key', 'version', 'status', 'project_text_template', 'project_topics_suffix_template', 'source_version'])]
class FamilyPathwayTemplate extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return ['version' => 'integer'];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(DomainFamily::class, 'family_id');
    }

    public function contentSources(): BelongsToMany
    {
        return $this->belongsToMany(
            ContentSource::class,
            'family_pathway_template_content_sources',
            'family_template_id',
            'content_source_id',
        );
    }

    public function weeks(): HasMany
    {
        return $this->hasMany(FamilyTemplateWeek::class, 'template_id')->orderBy('position');
    }

    public function skills(): HasMany
    {
        return $this->hasMany(FamilyTemplateSkill::class, 'template_id')->orderBy('position');
    }

    public function careerExamples(): HasMany
    {
        return $this->hasMany(FamilyTemplateCareerExample::class, 'template_id')->orderBy('position');
    }

    public function domainTopics(): HasMany
    {
        return $this->hasMany(FamilyTemplateDomainTopic::class, 'template_id');
    }

    public function domainTopicAliasSources(): HasMany
    {
        return $this->hasMany(FamilyTemplateDomainTopicAliasSource::class, 'template_id');
    }
}
