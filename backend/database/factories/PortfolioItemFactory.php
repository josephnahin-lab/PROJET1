<?php

namespace Database\Factories;

use App\Models\PortfolioItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PortfolioItem>
 */
class PortfolioItemFactory extends Factory
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
            'domain_id' => null,
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'skills' => null,
            'difficulties' => null,
            'learnings' => null,
            'project_date' => null,
            'url' => null,
            'visibility' => 'private',
        ];
    }
}
