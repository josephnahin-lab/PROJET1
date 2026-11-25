<?php

namespace Tests\Feature\Api;

use App\Jobs\PurgePortfolioAttachment;
use App\Models\PortfolioAttachment;
use App\Models\PortfolioAttachmentPurge;
use App\Models\PortfolioItem;
use App\Models\User;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class PortfolioPurgeReliabilityTest extends TestCase
{
    use DatabaseMigrations;

    public function test_purge_dispatch_waits_for_commit_and_outbox_is_visible_to_the_job(): void
    {
        $this->assertSame(storage_path('app/private'), config('filesystems.disks.portfolio-private.root'));
        $this->assertFalse(config('filesystems.disks.portfolio-private.serve'));
        $this->assertSame(storage_path('app/private'), config('filesystems.disks.local.root'));
        $this->assertTrue(config('filesystems.disks.local.serve'));

        Storage::fake('portfolio-private');
        Queue::fake([PurgePortfolioAttachment::class]);
        $user = User::factory()->create();
        $item = PortfolioItem::factory()->for($user)->create();
        $content = "%PDF-1.4\n%%EOF\n";
        $attachment = PortfolioAttachment::factory()->for($item)->create([
            'storage_key' => 'portfolio/'.$item->id.'/'.Str::uuid(),
            'original_name' => 'private.pdf',
            'sha256' => hash('sha256', $content),
        ]);
        Storage::disk('portfolio-private')->put($attachment->storage_key, $content);

        DB::beginTransaction();

        try {
            $this->actingAs($user)
                ->delete('/api/v1/me/portfolio/'.$item->id.'/attachments/'.$attachment->id)
                ->assertNoContent();

            $purge = PortfolioAttachmentPurge::query()->firstOrFail();
            Queue::assertNothingPushed();
            $this->assertSoftDeleted('portfolio_attachments', ['id' => $attachment->id]);
            $this->assertDatabaseHas('portfolio_attachment_purges', ['id' => $purge->id]);

            DB::commit();
        } catch (\Throwable $exception) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            throw $exception;
        }

        Queue::assertPushed(
            PurgePortfolioAttachment::class,
            fn (PurgePortfolioAttachment $job): bool => $job->purgeId === $purge->id
                && PortfolioAttachmentPurge::query()->whereKey($job->purgeId)->exists(),
        );

        (new PurgePortfolioAttachment($purge->id))->handle();

        Storage::disk('portfolio-private')->assertMissing($attachment->storage_key);
        $this->assertDatabaseMissing('portfolio_attachments', ['id' => $attachment->id]);
        $this->assertDatabaseMissing('portfolio_attachment_purges', ['id' => $purge->id]);
    }

    public function test_transient_storage_delete_failure_keeps_outbox_and_rethrows_a_safe_retry_error(): void
    {
        $user = User::factory()->create();
        $item = PortfolioItem::factory()->for($user)->create();
        $attachment = PortfolioAttachment::factory()->for($item)->create([
            'storage_key' => 'portfolio/'.$item->id.'/'.Str::uuid(),
        ]);
        $attachment->delete();
        $purge = PortfolioAttachmentPurge::factory()->create([
            'attachment_id' => $attachment->id,
            'storage_key' => $attachment->storage_key,
        ]);
        $disk = Mockery::mock(FilesystemAdapter::class);
        $disk->shouldReceive('exists')->once()->with($attachment->storage_key)->andReturn(true);
        $disk->shouldReceive('delete')->once()->with($attachment->storage_key)->andThrow(new RuntimeException('private path detail'));
        Storage::shouldReceive('disk')->once()->with('portfolio-private')->andReturn($disk);

        try {
            (new PurgePortfolioAttachment($purge->id))->handle();
            $this->fail('A failed private-storage deletion must be retried.');
        } catch (RuntimeException $exception) {
            $this->assertSame('La purge du fichier privé sera réessayée.', $exception->getMessage());
            $this->assertStringNotContainsString($attachment->storage_key, $exception->getMessage());
        }

        $this->assertSoftDeleted('portfolio_attachments', ['id' => $attachment->id]);
        $this->assertDatabaseHas('portfolio_attachment_purges', ['id' => $purge->id]);
        $this->assertSame(0, (new PurgePortfolioAttachment($purge->id))->tries);
    }
}
