<?php

namespace Database\Factories;

use App\Models\LearnerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LearnerProfile>
 */
class LearnerProfileFactory extends Factory
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
            'avatar' => [],
            'interests' => [],
            'theme' => 'light',
            'resource_language' => 'fr',
            'learning_mode' => 'guided',
            'locale' => 'fr',
        ];
    }
}
