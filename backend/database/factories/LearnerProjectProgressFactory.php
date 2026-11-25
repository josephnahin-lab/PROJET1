<?php

namespace Database\Factories;

use App\Models\LearnerProjectProgress;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LearnerProjectProgress>
 */
class LearnerProjectProgressFactory extends Factory
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
            'project_id' => Project::factory(),
            'status' => 'in_progress',
            'checked_item_ids' => [],
            'updated_at' => now(),
        ];
    }
}
