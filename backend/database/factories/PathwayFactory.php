<?php

namespace Database\Factories;

use App\Models\Domain;
use App\Models\Pathway;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pathway>
 */
class PathwayFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'domain_id' => Domain::factory(),
            'stable_key' => fake()->unique()->slug(3),
            'slug' => fake()->unique()->slug(3),
            'status' => 'published',
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'overview' => fake()->paragraph(),
            'prerequisites' => [],
            'equipment' => [],
            'version' => 1,
            'published_at' => now(),
        ];
    }
}
