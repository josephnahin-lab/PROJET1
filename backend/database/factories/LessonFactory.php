<?php

namespace Database\Factories;

use App\Models\Lesson;
use App\Models\PathwayWeek;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lesson>
 */
class LessonFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'week_id' => PathwayWeek::factory(),
            'stable_key' => fake()->unique()->slug(3),
            'position' => fake()->unique()->numberBetween(1, 1000),
            'title' => fake()->sentence(3),
            'objective' => fake()->sentence(),
            'explanation' => fake()->paragraph(),
            'activity' => fake()->paragraph(),
            'duration_minutes' => 30,
        ];
    }
}
