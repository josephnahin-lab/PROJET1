<?php

namespace Database\Factories;

use App\Models\Pathway;
use App\Models\PathwayWeek;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PathwayWeek>
 */
class PathwayWeekFactory extends Factory
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
            'stable_key' => 'week-'.fake()->unique()->numberBetween(1, 1000),
            'position' => fake()->unique()->numberBetween(1, 1000),
            'title' => fake()->sentence(3),
            'label' => null,
        ];
    }
}
