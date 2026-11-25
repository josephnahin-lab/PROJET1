<?php

namespace Database\Factories;

use App\Models\LearnerProgress;
use App\Models\Pathway;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LearnerProgress>
 */
class LearnerProgressFactory extends Factory
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
            'pathway_id' => Pathway::factory(),
            'status' => 'in_progress',
            'plan' => 'four_weeks',
            'started_at' => now(),
        ];
    }
}
