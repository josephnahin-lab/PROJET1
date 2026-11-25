<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WeeklyGoal;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WeeklyGoal>
 */
class WeeklyGoalFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'target_days' => 3,
            'updated_at' => now(),
        ];
    }
}
