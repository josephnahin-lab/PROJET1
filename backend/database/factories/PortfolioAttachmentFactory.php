<?php

namespace Database\Factories;

use App\Models\PortfolioAttachment;
use App\Models\PortfolioItem;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PortfolioAttachment>
 */
class PortfolioAttachmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'portfolio_item_id' => PortfolioItem::factory(),
            'storage_key' => 'portfolio/'.Str::uuid(),
            'original_name' => 'portfolio.pdf',
            'media_type' => 'application/pdf',
            'size_bytes' => 1024,
            'sha256' => hash('sha256', 'portfolio file'),
            'created_at' => now(),
        ];
    }
}
