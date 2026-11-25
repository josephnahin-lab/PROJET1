<?php

namespace Database\Factories;

use App\Models\DomainFamily;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DomainFamily>
 */
class DomainFamilyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => fake()->unique()->slug(2),
            'name' => fake()->words(2, true),
            'description' => fake()->sentence(),
            'sort_order' => fake()->numberBetween(0, 10),
            'status' => 'published',
        ];
    }
}
