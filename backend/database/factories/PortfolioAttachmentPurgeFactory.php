<?php

namespace Database\Factories;

use App\Models\PortfolioAttachmentPurge;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PortfolioAttachmentPurge>
 */
class PortfolioAttachmentPurgeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'attachment_id' => (string) Str::uuid(),
            'storage_key' => 'portfolio/'.Str::uuid(),
            'created_at' => now(),
        ];
    }
}
