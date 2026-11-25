<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\ProjectChecklistItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProjectChecklistItem>
 */
class ProjectChecklistItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'stable_key' => fake()->unique()->slug(2),
            'position' => fake()->unique()->numberBetween(1, 1000),
            'label' => fake()->sentence(),
        ];
    }
}
