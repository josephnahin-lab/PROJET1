<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizQuestion>
 */
class QuizQuestionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'stable_key' => fake()->unique()->slug(3),
            'position' => fake()->unique()->numberBetween(1, 1000),
            'prompt' => fake()->sentence(),
            'explanation' => fake()->paragraph(),
            'points' => 1,
        ];
    }
}
