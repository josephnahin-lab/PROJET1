<?php

namespace Database\Factories;

use App\Models\Pathway;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'pathway_id' => Pathway::factory(),
            'stable_key' => fake()->unique()->slug(3),
            'title' => fake()->sentence(3),
            'instructions' => fake()->paragraph(),
            'position' => fake()->unique()->numberBetween(1, 1000),
            'status' => 'published',
        ];
    }
}
