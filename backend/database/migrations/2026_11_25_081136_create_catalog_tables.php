<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('domain_families', function (Blueprint $table): void {
            $table->string('id', 80)->primary();
            $table->string('name', 180);
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->string('status', 20)->default('preparing');
            $table->timestampsTz();
            $table->index(['status', 'sort_order']);
        });

        Schema::create('domains', function (Blueprint $table): void {
            $table->string('id', 100)->primary();
            $table->string('family_id', 80);
            $table->string('name', 180);
            $table->string('summary', 2000)->default('');
            $table->string('availability', 20)->default('preparing');
            $table->string('content_status', 20)->default('draft');
            $table->string('source_version', 100)->nullable();
            $table->timestampTz('published_at')->nullable();
            $table->timestampsTz();
            $table->foreign('family_id')->references('id')->on('domain_families')->restrictOnDelete();
            $table->index(['availability', 'id']);
        });

        Schema::create('content_sources', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->text('source_path');
            $table->string('source_key', 200)->nullable();
            $table->string('source_revision', 100)->nullable();
            $table->char('source_checksum', 64)->nullable();
            $table->timestampTz('extracted_at');
            $table->string('license_status', 30)->default('unknown');
            $table->text('attribution')->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->timestampTz('reviewed_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('pathways', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('domain_id', 100);
            $table->string('stable_key', 120);
            $table->string('slug', 120);
            $table->string('status', 20)->default('draft');
            $table->string('title', 180);
            $table->text('description')->nullable();
            $table->text('overview')->nullable();
            $table->string('difficulty', 60)->nullable();
            $table->text('prerequisites')->default('[]');
            $table->text('equipment')->default('[]');
            $table->string('weekly_time', 120)->nullable();
            $table->text('safety_note')->nullable();
            $table->jsonb('completion_policy')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->string('source_version', 100)->nullable();
            $table->timestampTz('published_at')->nullable();
            $table->timestampsTz();
            $table->foreign('domain_id')->references('id')->on('domains')->restrictOnDelete();
            $table->unique(['domain_id', 'stable_key', 'version']);
            $table->index(['status', 'domain_id']);
        });

        Schema::create('pathway_weeks', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('pathway_id');
            $table->string('stable_key', 100);
            $table->unsignedInteger('position');
            $table->string('title', 180);
            $table->string('label', 100)->nullable();
            $table->timestampsTz();
            $table->foreign('pathway_id')->references('id')->on('pathways')->restrictOnDelete();
            $table->unique(['pathway_id', 'stable_key']);
            $table->unique(['pathway_id', 'position']);
        });

        Schema::create('lessons', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('week_id');
            $table->string('stable_key', 120);
            $table->unsignedInteger('position');
            $table->string('title', 180);
            $table->string('objective', 1000)->default('');
            $table->text('explanation')->default('');
            $table->text('activity')->default('');
            $table->unsignedInteger('duration_minutes')->nullable();
            $table->timestampsTz();
            $table->foreign('week_id')->references('id')->on('pathway_weeks')->restrictOnDelete();
            $table->unique(['week_id', 'stable_key']);
            $table->unique(['week_id', 'position']);
        });

        Schema::create('quizzes', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('lesson_id');
            $table->string('stable_key', 120);
            $table->unsignedInteger('version')->default(1);
            $table->string('status', 20)->default('draft');
            $table->unsignedInteger('pass_score')->nullable();
            $table->timestampsTz();
            $table->foreign('lesson_id')->references('id')->on('lessons')->restrictOnDelete();
            $table->unique(['lesson_id', 'stable_key', 'version']);
        });

        Schema::create('quiz_questions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('quiz_id');
            $table->string('stable_key', 120);
            $table->unsignedInteger('position');
            $table->text('prompt');
            $table->text('explanation')->default('');
            $table->unsignedInteger('points')->default(1);
            $table->timestampsTz();
            $table->foreign('quiz_id')->references('id')->on('quizzes')->restrictOnDelete();
            $table->unique(['quiz_id', 'stable_key']);
            $table->unique(['quiz_id', 'position']);
        });

        Schema::create('quiz_options', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('question_id');
            $table->string('stable_key', 120);
            $table->unsignedInteger('position');
            $table->text('label');
            $table->boolean('is_correct');
            $table->timestampsTz();
            $table->foreign('question_id')->references('id')->on('quiz_questions')->restrictOnDelete();
            $table->unique(['question_id', 'stable_key']);
            $table->unique(['question_id', 'position']);
        });

        Schema::create('projects', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('pathway_id');
            $table->string('stable_key', 120);
            $table->string('title', 180);
            $table->text('instructions');
            $table->unsignedInteger('position');
            $table->string('status', 20)->default('draft');
            $table->uuid('source_record_id')->nullable();
            $table->timestampsTz();
            $table->foreign('pathway_id')->references('id')->on('pathways')->restrictOnDelete();
            $table->foreign('source_record_id')->references('id')->on('content_sources')->nullOnDelete();
            $table->unique(['pathway_id', 'stable_key']);
            $table->unique(['pathway_id', 'position']);
        });

        Schema::create('project_checklist_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->string('stable_key', 100);
            $table->unsignedInteger('position');
            $table->text('label');
            $table->timestampsTz();
            $table->foreign('project_id')->references('id')->on('projects')->restrictOnDelete();
            $table->unique(['project_id', 'stable_key']);
            $table->unique(['project_id', 'position']);
        });

        Schema::create('resources', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('stable_key', 120);
            $table->string('domain_id', 100)->nullable();
            $table->uuid('pathway_id')->nullable();
            $table->uuid('lesson_id')->nullable();
            $table->string('title', 180);
            $table->text('url');
            $table->string('provider', 160)->nullable();
            $table->string('language', 16)->nullable();
            $table->string('resource_kind', 20)->default('other');
            $table->text('access_note')->nullable();
            $table->string('status', 20)->default('draft');
            $table->string('verification_status', 20)->default('unverified');
            $table->timestampTz('verified_at')->nullable();
            $table->uuid('source_record_id');
            $table->unsignedInteger('position')->default(1);
            $table->timestampsTz();
            $table->foreign('domain_id')->references('id')->on('domains')->restrictOnDelete();
            $table->foreign('pathway_id')->references('id')->on('pathways')->restrictOnDelete();
            $table->foreign('lesson_id')->references('id')->on('lessons')->restrictOnDelete();
            $table->foreign('source_record_id')->references('id')->on('content_sources')->restrictOnDelete();
            $table->index(['status', 'verification_status', 'pathway_id']);
            $table->index(['status', 'verification_status', 'lesson_id']);
            $table->unique(['domain_id', 'stable_key']);
            $table->unique(['pathway_id', 'stable_key']);
            $table->unique(['lesson_id', 'stable_key']);
        });

        Schema::create('learner_profiles', function (Blueprint $table): void {
            $table->uuid('user_id')->primary();
            $table->string('display_name', 60)->nullable();
            $table->jsonb('avatar')->default('{}');
            $table->jsonb('interests')->default('[]');
            $table->string('theme', 10)->default('light');
            $table->string('resource_language', 2)->default('fr');
            $table->string('learning_mode', 10)->default('guided');
            $table->string('locale', 16)->default('fr');
            $table->timestampsTz();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE pathways ALTER COLUMN prerequisites DROP DEFAULT');
            DB::statement("ALTER TABLE pathways ALTER COLUMN prerequisites TYPE text[] USING '{}'::text[]");
            DB::statement("ALTER TABLE pathways ALTER COLUMN prerequisites SET DEFAULT '{}'::text[]");
            DB::statement('ALTER TABLE pathways ALTER COLUMN equipment DROP DEFAULT');
            DB::statement("ALTER TABLE pathways ALTER COLUMN equipment TYPE text[] USING '{}'::text[]");
            DB::statement("ALTER TABLE pathways ALTER COLUMN equipment SET DEFAULT '{}'::text[]");
            DB::statement("CREATE UNIQUE INDEX pathways_one_published_version ON pathways (domain_id, stable_key) WHERE status = 'published'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('learner_profiles');
        Schema::dropIfExists('resources');
        Schema::dropIfExists('project_checklist_items');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('quiz_options');
        Schema::dropIfExists('quiz_questions');
        Schema::dropIfExists('quizzes');
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('pathway_weeks');
        Schema::dropIfExists('pathways');
        Schema::dropIfExists('content_sources');
        Schema::dropIfExists('domains');
        Schema::dropIfExists('domain_families');
    }
};
