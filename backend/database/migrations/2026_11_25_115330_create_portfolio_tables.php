<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('portfolio_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('domain_id', 100)->nullable();
            $table->string('title', 100);
            $table->string('description', 3000);
            $table->string('skills', 500)->nullable();
            $table->string('difficulties', 1500)->nullable();
            $table->string('learnings', 1500)->nullable();
            $table->date('project_date')->nullable();
            $table->text('url')->nullable();
            $table->string('visibility', 20)->default('private');
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('domain_id')->references('id')->on('domains')->nullOnDelete();
            $table->index(['user_id', 'deleted_at', 'created_at', 'id'], 'portfolio_items_owner_page_index');
        });

        Schema::create('portfolio_attachments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('portfolio_item_id');
            $table->string('storage_key', 255)->unique();
            $table->string('original_name', 160);
            $table->string('media_type', 32);
            $table->unsignedBigInteger('size_bytes');
            $table->char('sha256', 64);
            $table->timestampTz('created_at');
            $table->softDeletesTz();
            $table->foreign('portfolio_item_id')->references('id')->on('portfolio_items')->cascadeOnDelete();
            $table->index(['portfolio_item_id', 'deleted_at', 'created_at', 'id'], 'portfolio_attachments_active_page_index');
        });

        Schema::create('portfolio_attachment_purges', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('attachment_id');
            $table->string('storage_key', 255)->unique();
            $table->timestampTz('created_at');
            $table->index(['attachment_id', 'created_at'], 'portfolio_attachment_purges_attachment_index');
        });

        $driver = DB::getDriverName();

        if (! in_array($driver, ['pgsql', 'sqlite'], true)) {
            throw new RuntimeException("Unsupported database driver for portfolio CHECK constraints [{$driver}].");
        }

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE portfolio_items ADD CONSTRAINT portfolio_items_private_visibility_check CHECK (visibility = 'private')");
            DB::statement("ALTER TABLE portfolio_attachments ADD CONSTRAINT portfolio_attachments_size_media_check CHECK ((media_type = 'application/pdf' AND size_bytes BETWEEN 1 AND 5242880) OR (media_type IN ('image/jpeg', 'image/png', 'image/webp') AND size_bytes BETWEEN 1 AND 2097152))");
        } else {
            DB::statement("CREATE TRIGGER portfolio_items_private_visibility_check_insert BEFORE INSERT ON portfolio_items FOR EACH ROW WHEN NOT (NEW.visibility = 'private') BEGIN SELECT RAISE(ABORT, 'CHECK constraint failed: portfolio_items_private_visibility_check'); END");
            DB::statement("CREATE TRIGGER portfolio_items_private_visibility_check_update BEFORE UPDATE ON portfolio_items FOR EACH ROW WHEN NOT (NEW.visibility = 'private') BEGIN SELECT RAISE(ABORT, 'CHECK constraint failed: portfolio_items_private_visibility_check'); END");
            DB::statement("CREATE TRIGGER portfolio_attachments_size_media_check_insert BEFORE INSERT ON portfolio_attachments FOR EACH ROW WHEN NOT ((NEW.media_type = 'application/pdf' AND NEW.size_bytes BETWEEN 1 AND 5242880) OR (NEW.media_type IN ('image/jpeg', 'image/png', 'image/webp') AND NEW.size_bytes BETWEEN 1 AND 2097152)) BEGIN SELECT RAISE(ABORT, 'CHECK constraint failed: portfolio_attachments_size_media_check'); END");
            DB::statement("CREATE TRIGGER portfolio_attachments_size_media_check_update BEFORE UPDATE ON portfolio_attachments FOR EACH ROW WHEN NOT ((NEW.media_type = 'application/pdf' AND NEW.size_bytes BETWEEN 1 AND 5242880) OR (NEW.media_type IN ('image/jpeg', 'image/png', 'image/webp') AND NEW.size_bytes BETWEEN 1 AND 2097152)) BEGIN SELECT RAISE(ABORT, 'CHECK constraint failed: portfolio_attachments_size_media_check'); END");
        }

        DB::statement("CREATE UNIQUE INDEX portfolio_attachments_active_pdf_unique ON portfolio_attachments (portfolio_item_id) WHERE deleted_at IS NULL AND media_type = 'application/pdf'");
        DB::statement("CREATE UNIQUE INDEX portfolio_attachments_active_image_unique ON portfolio_attachments (portfolio_item_id) WHERE deleted_at IS NULL AND media_type IN ('image/jpeg', 'image/png', 'image/webp')");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('DROP TRIGGER IF EXISTS portfolio_items_private_visibility_check_insert');
            DB::statement('DROP TRIGGER IF EXISTS portfolio_items_private_visibility_check_update');
            DB::statement('DROP TRIGGER IF EXISTS portfolio_attachments_size_media_check_insert');
            DB::statement('DROP TRIGGER IF EXISTS portfolio_attachments_size_media_check_update');
        }

        Schema::dropIfExists('portfolio_attachment_purges');
        Schema::dropIfExists('portfolio_attachments');
        Schema::dropIfExists('portfolio_items');
    }
};
