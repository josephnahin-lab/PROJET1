<?php

namespace Database\Factories;

use App\Models\QuizOption;
use App\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizOption>
 */
class QuizOptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'question_id' => QuizQuestion::factory(),
            'stable_key' => fake()->unique()->slug(3),
            'position' => fake()->unique()->numberBetween(1, 1000),
            'label' => fake()->sentence(),
            'is_correct' => false,
        ];
    }
}
