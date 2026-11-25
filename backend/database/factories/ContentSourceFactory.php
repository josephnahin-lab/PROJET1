<?php

namespace Database\Factories;

use App\Models\ContentSource;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ContentSource>
 */
class ContentSourceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'source_path' => 'script.js',
            'source_key' => fake()->unique()->slug(3),
            'extracted_at' => now(),
            'license_status' => 'unknown',
        ];
    }
}
