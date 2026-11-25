<?php

namespace Database\Factories;

use App\Models\ContentSource;
use App\Models\Pathway;
use App\Models\Resource;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<resource>
 */
class ResourceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'stable_key' => fake()->unique()->slug(3),
            'pathway_id' => Pathway::factory(),
            'title' => fake()->sentence(3),
            'url' => fake()->url(),
            'resource_kind' => 'article',
            'status' => 'published',
            'verification_status' => 'verified',
            'source_record_id' => ContentSource::factory(),
            'position' => 1,
        ];
    }
}
