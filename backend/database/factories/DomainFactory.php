<?php

namespace Database\Factories;

use App\Models\Domain;
use App\Models\DomainFamily;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Domain>
 */
class DomainFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => fake()->unique()->slug(2),
            'family_id' => DomainFamily::factory(),
            'name' => fake()->words(2, true),
            'summary' => fake()->sentence(),
            'availability' => 'published',
            'content_status' => 'published',
            'published_at' => now(),
        ];
    }
}
