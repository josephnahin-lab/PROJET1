<?php

namespace Tests\Feature\Api;

use App\Jobs\PurgePortfolioAttachment;
use App\Models\Domain;
use App\Models\PortfolioAttachment;
use App\Models\PortfolioAttachmentPurge;
use App\Models\PortfolioItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class PortfolioApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_private_portfolio_routes_require_a_cookie_session_and_reject_bearer_tokens(): void
    {
        $paths = [
            ['GET', '/api/v1/me/portfolio'],
            ['POST', '/api/v1/me/portfolio'],
            ['PATCH', '/api/v1/me/portfolio/'.Str::uuid()],
            ['DELETE', '/api/v1/me/portfolio/'.Str::uuid()],
            ['POST', '/api/v1/me/portfolio/'.Str::uuid().'/attachments'],
            ['DELETE', '/api/v1/me/portfolio/'.Str::uuid().'/attachments/'.Str::uuid()],
            ['GET', '/api/v1/me/portfolio/'.Str::uuid().'/attachments/'.Str::uuid().'/content'],
        ];

        foreach ($paths as [$method, $uri]) {
            $this->json($method, $uri)
                ->assertUnauthorized()
                ->assertHeader('Content-Type', 'application/problem+json');
        }

        $this->withHeader('Authorization', 'Bearer not-a-session-token')
            ->getJson('/api/v1/me/portfolio')
            ->assertUnauthorized()
            ->assertHeader('Content-Type', 'application/problem+json');
    }

    public function test_portfolio_crud_returns_exact_private_payload_and_rejects_cross_account_access(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $created = $this->createItem($owner, [
            'title' => 'Projet personnel',
            'description' => 'Une réalisation privée.',
            'skills' => 'Laravel',
            'projectDate' => '2026-11-25',
            'url' => 'https://example.test/project',
        ])
            ->assertCreated()
            ->assertExactJsonStructure(['data' => [
                'id',
                'title',
                'description',
                'domainId',
                'projectDate',
                'skills',
                'difficulties',
                'learnings',
                'url',
                'visibility',
                'createdAt',
                'updatedAt',
                'attachments',
            ]])
            ->assertJsonPath('data.visibility', 'private')
            ->assertJsonMissingPath('data.user_id')
            ->assertJsonMissingPath('data.downloadUrl');

        $itemId = $created->json('data.id');
        $this->assertDatabaseHas('portfolio_items', [
            'id' => $itemId,
            'user_id' => $owner->id,
            'visibility' => 'private',
        ]);

        $this->actingAs($owner)
            ->patchJson('/api/v1/me/portfolio/'.$itemId, [
                'title' => 'Projet mis à jour',
                'url' => null,
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Projet mis à jour')
            ->assertJsonPath('data.url', null);

        $this->actingAs($otherUser)
            ->patchJson('/api/v1/me/portfolio/'.$itemId, ['title' => 'Accès interdit'])
            ->assertNotFound();

        $this->assertDatabaseHas('portfolio_items', [
            'id' => $itemId,
            'user_id' => $owner->id,
            'title' => 'Projet mis à jour',
        ]);
    }

    public function test_portfolio_list_is_cursor_paginated_and_scoped_to_the_session_account(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $items = PortfolioItem::factory()->count(3)->for($owner)->create();
        $foreignItem = PortfolioItem::factory()->for($otherUser)->create();

        $firstPage = $this->actingAs($owner)
            ->getJson('/api/v1/me/portfolio?limit=2')
            ->assertOk()
            ->assertJsonPath('meta.limit', 2)
            ->assertJsonPath('meta.hasMore', true);

        $this->assertCount(2, $firstPage->json('data'));
        $this->assertNotContains($foreignItem->id, array_column($firstPage->json('data'), 'id'));

        $secondPage = $this->actingAs($owner)
            ->getJson('/api/v1/me/portfolio?limit=2&cursor='.urlencode($firstPage->json('meta.nextCursor')))
            ->assertOk()
            ->assertJsonPath('meta.hasMore', false);

        $ids = [
            ...array_column($firstPage->json('data'), 'id'),
            ...array_column($secondPage->json('data'), 'id'),
        ];
        $this->assertEqualsCanonicalizing($items->modelKeys(), $ids);
    }

    public function test_json_mutations_reject_other_media_types_before_parsing_and_never_accept_user_id(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->call('POST', '/api/v1/me/portfolio', [], [], [], [
                'CONTENT_TYPE' => 'text/plain',
                'HTTP_ACCEPT' => 'application/json',
            ], '{"title":"ignored","description":"ignored"}')
            ->assertStatus(415)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('code', 'UNSUPPORTED_MEDIA_TYPE');

        $this->createItem($user, [
            'title' => 'Tentative',
            'description' => 'Ne pas accepter un propriétaire client.',
            'user_id' => (string) Str::uuid(),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['user_id']);

        $this->actingAs($user)
            ->withHeader('Idempotency-Key', '')
            ->postJson('/api/v1/me/portfolio', [
                'title' => 'Missing idempotency key',
                'description' => 'La clé contractuelle est requise.',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['Idempotency-Key']);

        $this->assertDatabaseCount('portfolio_items', 0);

        $this->actingAs($user)
            ->patchJson('/api/v1/me/portfolio/'.Str::uuid(), [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['request']);
    }

    public function test_portfolio_references_must_be_published_and_urls_must_use_https(): void
    {
        $user = User::factory()->create();
        $publishedDomain = Domain::factory()->create();
        $unpublishedDomain = Domain::factory()->create(['availability' => 'preparing']);

        $this->createItem($user, [
            'title' => 'Projet',
            'description' => 'Description',
            'domainId' => $publishedDomain->id,
        ])
            ->assertCreated()
            ->assertJsonPath('data.domainId', $publishedDomain->id);

        $this->createItem($user, [
            'title' => 'Projet non publié',
            'description' => 'Description',
            'domainId' => $unpublishedDomain->id,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['domainId']);

        $this->createItem($user, [
            'title' => 'Lien non sécurisé',
            'description' => 'Description',
            'url' => 'http://example.test',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['url']);
    }

    public function test_upload_stores_verified_pdf_privately_and_streams_only_to_the_owner(): void
    {
        Storage::fake('portfolio-private');
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $item = PortfolioItem::factory()->for($owner)->create();
        $otherItem = PortfolioItem::factory()->for($owner)->create();
        $content = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n";
        $file = UploadedFile::fake()->createWithContent('../private report.pdf', $content);

        $uploaded = $this->uploadFile($owner, $item->id, $file, ['sha256' => hash('sha256', $content)])
            ->assertCreated()
            ->assertExactJsonStructure(['data' => ['id', 'name', 'mediaType', 'sizeBytes', 'createdAt']])
            ->assertJsonPath('data.name', 'private report.pdf')
            ->assertJsonPath('data.mediaType', 'application/pdf')
            ->assertJsonMissingPath('data.storage_key')
            ->assertJsonMissingPath('data.original_name')
            ->assertJsonMissingPath('data.downloadUrl');

        $attachment = PortfolioAttachment::query()->findOrFail($uploaded->json('data.id'));
        $this->assertStringStartsWith('portfolio/'.$item->id.'/', $attachment->storage_key);
        $this->assertDatabaseHas('portfolio_attachments', [
            'id' => $attachment->id,
            'sha256' => hash('sha256', $content),
            'size_bytes' => strlen($content),
        ]);
        Storage::disk('portfolio-private')->assertExists($attachment->storage_key);
        Storage::disk('public')->assertMissing($attachment->storage_key);

        $contentResponse = $this->actingAs($owner)
            ->withHeader('Origin', 'http://localhost:3000')
            ->get('/api/v1/me/portfolio/'.$item->id.'/attachments/'.$attachment->id.'/content')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('Content-Disposition')
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
            ->assertStreamedContent($content);

        $cacheControlDirectives = array_map('trim', explode(',', strtolower((string) $contentResponse->headers->get('Cache-Control'))));
        $this->assertEqualsCanonicalizing(['private', 'no-store'], $cacheControlDirectives);

        $exposedHeaders = strtolower((string) $contentResponse->headers->get('Access-Control-Expose-Headers'));
        $this->assertStringContainsString('content-disposition', $exposedHeaders);

        $this->actingAs($otherUser)
            ->get('/api/v1/me/portfolio/'.$item->id.'/attachments/'.$attachment->id.'/content')
            ->assertNotFound();

        $this->actingAs($owner)
            ->get('/api/v1/me/portfolio/'.$otherItem->id.'/attachments/'.$attachment->id.'/content')
            ->assertNotFound();
    }

    public function test_upload_rejects_mime_extension_mismatch_hash_mismatch_and_duplicate_media(): void
    {
        Storage::fake('portfolio-private');
        $user = User::factory()->create();
        $item = PortfolioItem::factory()->for($user)->create();
        $pdf = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n";

        $this->uploadFile($user, $item->id, UploadedFile::fake()->createWithContent('wrong.png', $pdf))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);

        $this->uploadFile($user, $item->id, UploadedFile::fake()->createWithContent('first.pdf', $pdf), [
            'sha256' => str_repeat('0', 64),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sha256']);

        $this->uploadFile($user, $item->id, UploadedFile::fake()->createWithContent('first.pdf', $pdf))
            ->assertCreated();

        $this->uploadFile($user, $item->id, UploadedFile::fake()->createWithContent('second.pdf', $pdf))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);
    }

    public function test_upload_rejects_json_media_type_before_reading_the_file(): void
    {
        $user = User::factory()->create();
        $item = PortfolioItem::factory()->for($user)->create();

        $this->actingAs($user)
            ->postJson('/api/v1/me/portfolio/'.$item->id.'/attachments', ['file' => 'not-a-file'])
            ->assertStatus(415)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('code', 'UNSUPPORTED_MEDIA_TYPE');
    }

    public function test_only_one_image_is_allowed_and_image_size_limits_return_413(): void
    {
        Storage::fake('portfolio-private');
        $user = User::factory()->create();
        $item = PortfolioItem::factory()->for($user)->create();

        $this->uploadFile($user, $item->id, UploadedFile::fake()->image('first.png', 1, 1))
            ->assertCreated()
            ->assertJsonPath('data.mediaType', 'image/png');

        $this->uploadFile($user, $item->id, UploadedFile::fake()->image('second.jpeg', 1, 1))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);

        $otherItem = PortfolioItem::factory()->for($user)->create();
        $oversizedImage = UploadedFile::fake()->image('large.png', 1, 1)->size(2049);

        $this->uploadFile($user, $otherItem->id, $oversizedImage)
            ->assertStatus(413)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('code', 'PAYLOAD_TOO_LARGE');

        $oversizedPdf = UploadedFile::fake()->create('large.pdf', 5121, 'application/pdf');
        $this->uploadFile($user, $otherItem->id, $oversizedPdf)
            ->assertStatus(413)
            ->assertJsonPath('code', 'PAYLOAD_TOO_LARGE');
    }

    public function test_deleted_attachment_is_inaccessible_until_its_durable_purge_completes(): void
    {
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

        $this->actingAs($user)
            ->delete('/api/v1/me/portfolio/'.$item->id.'/attachments/'.$attachment->id)
            ->assertNoContent();

        $this->assertNotNull($attachment->fresh()->deleted_at);
        $purge = PortfolioAttachmentPurge::query()->firstOrFail();
        Queue::assertPushed(
            PurgePortfolioAttachment::class,
            fn (PurgePortfolioAttachment $job): bool => $job->purgeId === $purge->id
                && PortfolioAttachmentPurge::query()->whereKey($job->purgeId)->exists(),
        );

        $this->actingAs($user)
            ->get('/api/v1/me/portfolio/'.$item->id.'/attachments/'.$attachment->id.'/content')
            ->assertNotFound();

        (new PurgePortfolioAttachment($purge->id))->handle();

        Storage::disk('portfolio-private')->assertMissing($attachment->storage_key);
        $this->assertDatabaseMissing('portfolio_attachments', ['id' => $attachment->id]);
        $this->assertDatabaseMissing('portfolio_attachment_purges', ['id' => $purge->id]);
    }

    public function test_deleting_an_item_retires_access_and_purges_all_attachments(): void
    {
        Storage::fake('portfolio-private');
        Queue::fake([PurgePortfolioAttachment::class]);
        $user = User::factory()->create();
        $item = PortfolioItem::factory()->for($user)->create();
        $content = "%PDF-1.4\n%%EOF\n";
        $attachments = PortfolioAttachment::factory()->count(2)->for($item)->sequence(
            ['media_type' => 'application/pdf', 'original_name' => 'one.pdf'],
            ['media_type' => 'image/png', 'original_name' => 'two.png', 'size_bytes' => 1024],
        )->create();

        foreach ($attachments as $attachment) {
            Storage::disk('portfolio-private')->put($attachment->storage_key, $content);
        }

        $this->actingAs($user)
            ->delete('/api/v1/me/portfolio/'.$item->id)
            ->assertNoContent();

        $this->assertSoftDeleted('portfolio_items', ['id' => $item->id]);
        $this->assertSoftDeleted('portfolio_attachments', ['portfolio_item_id' => $item->id]);
        $this->assertDatabaseCount('portfolio_attachment_purges', 2);

        $this->actingAs($user)
            ->getJson('/api/v1/me/portfolio/'.$item->id.'/attachments/not-a-valid-id/content')
            ->assertNotFound();

        foreach (PortfolioAttachmentPurge::query()->get() as $purge) {
            (new PurgePortfolioAttachment($purge->id))->handle();
        }

        $this->assertDatabaseMissing('portfolio_items', ['id' => $item->id]);
        $this->assertDatabaseCount('portfolio_attachments', 0);
        $this->assertDatabaseCount('portfolio_attachment_purges', 0);
    }

    public function test_content_stream_fails_closed_when_stored_bytes_do_not_match_metadata(): void
    {
        Storage::fake('portfolio-private');
        $user = User::factory()->create();
        $item = PortfolioItem::factory()->for($user)->create();
        $attachment = PortfolioAttachment::factory()->for($item)->create([
            'storage_key' => 'portfolio/'.$item->id.'/'.Str::uuid(),
            'sha256' => hash('sha256', 'expected bytes'),
        ]);
        Storage::disk('portfolio-private')->put($attachment->storage_key, 'different bytes');

        $this->actingAs($user)
            ->get('/api/v1/me/portfolio/'.$item->id.'/attachments/'.$attachment->id.'/content')
            ->assertNotFound();
    }

    public function test_upload_rate_limit_is_per_account_and_returns_retry_after(): void
    {
        Storage::fake('portfolio-private');
        $user = User::factory()->create();
        $pdf = "%PDF-1.4\n%%EOF\n";

        for ($upload = 0; $upload < 10; $upload++) {
            $item = PortfolioItem::factory()->for($user)->create();
            $this->uploadFile($user, $item->id, UploadedFile::fake()->createWithContent('report.pdf', $pdf))
                ->assertCreated();
        }

        $item = PortfolioItem::factory()->for($user)->create();
        $this->uploadFile($user, $item->id, UploadedFile::fake()->createWithContent('report.pdf', $pdf))
            ->assertStatus(429)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertHeader('Retry-After');
    }

    public function test_portfolio_private_disk_is_separate_and_not_url_servable(): void
    {
        $this->assertSame(storage_path('app/private'), config('filesystems.disks.portfolio-private.root'));
        $this->assertFalse(config('filesystems.disks.portfolio-private.serve'));
        $this->assertSame('private', config('filesystems.disks.portfolio-private.visibility'));
        $this->assertSame(storage_path('app/private'), config('filesystems.disks.local.root'));
        $this->assertTrue(config('filesystems.disks.local.serve'));
    }

    /**
     * @param  array<string, mixed>  $fields
     */
    private function uploadFile(User $user, string $itemId, UploadedFile $file, array $fields = []): TestResponse
    {
        return $this->actingAs($user)->call(
            'POST',
            '/api/v1/me/portfolio/'.$itemId.'/attachments',
            $fields,
            [],
            ['file' => $file],
            [
                'CONTENT_TYPE' => 'multipart/form-data',
                'HTTP_ACCEPT' => 'application/json',
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function createItem(User $user, array $payload): TestResponse
    {
        return $this->actingAs($user)
            ->withHeader('Idempotency-Key', 'portfolio-test-key-0001')
            ->postJson('/api/v1/me/portfolio', $payload);
    }
}
