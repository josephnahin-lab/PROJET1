<?php

namespace App\Models;

use Database\Factories\DomainFamilyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['id', 'name', 'description', 'sort_order', 'status'])]
class DomainFamily extends Model
{
    /** @use HasFactory<DomainFamilyFactory> */
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class, 'family_id');
    }

    public function pathwayTemplates(): HasMany
    {
        return $this->hasMany(FamilyPathwayTemplate::class, 'family_id')->orderBy('version');
    }
}
