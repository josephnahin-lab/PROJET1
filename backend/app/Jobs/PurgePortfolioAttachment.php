<?php

namespace App\Jobs;

use App\Models\PortfolioAttachment;
use App\Models\PortfolioAttachmentPurge;
use App\Models\PortfolioItem;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class PurgePortfolioAttachment implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $tries = 0;

    public int|array $backoff = [30, 120, 600];

    public int $timeout = 30;

    public function __construct(public string $purgeId) {}

    public function handle(): void
    {
        $purge = PortfolioAttachmentPurge::query()->find($this->purgeId);

        if ($purge === null) {
            return;
        }

        $disk = Storage::disk('portfolio-private');

        try {
            if ($disk->exists($purge->storage_key) && ! $disk->delete($purge->storage_key)) {
                throw new RuntimeException('La purge du fichier privé sera réessayée.');
            }
        } catch (Throwable) {
            throw new RuntimeException('La purge du fichier privé sera réessayée.');
        }

        DB::transaction(function () use ($purge): void {
            $lockedPurge = PortfolioAttachmentPurge::query()
                ->whereKey($purge->id)
                ->lockForUpdate()
                ->first();

            if ($lockedPurge === null) {
                return;
            }

            $attachment = PortfolioAttachment::withTrashed()
                ->whereKey($lockedPurge->attachment_id)
                ->first();

            if (
                $attachment !== null
                && ($attachment->storage_key !== $lockedPurge->storage_key || $attachment->deleted_at === null)
            ) {
                throw new RuntimeException('Les métadonnées du fichier privé ne correspondent pas à la purge.');
            }

            $portfolioItemId = $attachment?->portfolio_item_id;
            $attachment?->forceDelete();
            $lockedPurge->delete();

            if ($portfolioItemId !== null) {
                $deletedItem = PortfolioItem::withTrashed()
                    ->whereKey($portfolioItemId)
                    ->whereNotNull('deleted_at')
                    ->first();

                $hasRemainingAttachments = PortfolioAttachment::withTrashed()
                    ->where('portfolio_item_id', $portfolioItemId)
                    ->exists();

                if ($deletedItem !== null && ! $hasRemainingAttachments) {
                    $deletedItem->forceDelete();
                }
            }
        });
    }
}
