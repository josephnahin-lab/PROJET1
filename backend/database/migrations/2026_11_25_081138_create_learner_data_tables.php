<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learner_progress', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('pathway_id');
            $table->string('status', 20);
            $table->string('plan', 20);
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampTz('last_activity_at')->nullable();
            $table->timestampsTz();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('pathway_id')->references('id')->on('pathways')->restrictOnDelete();
            $table->unique(['user_id', 'pathway_id']);
            $table->index(['pathway_id', 'status']);
        });

        Schema::create('lesson_progress', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('lesson_id');
            $table->string('status', 20);
            $table->timestampTz('completed_at')->nullable();
            $table->timestampTz('updated_at');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('lesson_id')->references('id')->on('lessons')->restrictOnDelete();
            $table->unique(['user_id', 'lesson_id']);
            $table->index(['lesson_id', 'status']);
        });

        Schema::create('learner_project_progress', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('project_id');
            $table->string('status', 20);
            $table->text('checked_item_ids')->default('[]');
            $table->string('url', 500)->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampTz('updated_at');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('project_id')->references('id')->on('projects')->restrictOnDelete();
            $table->unique(['user_id', 'project_id']);
            $table->index(['project_id', 'status']);
        });

        Schema::create('learner_notes', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('lesson_id');
            $table->text('body');
            $table->timestampsTz();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('lesson_id')->references('id')->on('lessons')->restrictOnDelete();
            $table->unique(['user_id', 'lesson_id']);
            $table->index(['user_id', 'created_at', 'id']);
        });

        Schema::create('saved_resources', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('resource_id')->nullable();
            $table->string('url', 1000);
            $table->string('title', 180);
            $table->string('source', 100)->nullable();
            $table->timestampTz('created_at');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('resource_id')->references('id')->on('resources')->nullOnDelete();
            $table->unique(['user_id', 'url']);
            $table->index(['user_id', 'created_at', 'id']);
        });

        Schema::create('weekly_goals', function (Blueprint $table): void {
            $table->uuid('user_id')->primary();
            $table->unsignedSmallInteger('target_days')->default(3);
            $table->timestampTz('updated_at');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('active_days', function (Blueprint $table): void {
            $table->uuid('user_id');
            $table->date('activity_date');
            $table->string('activity_source', 20);
            $table->timestampTz('created_at');
            $table->primary(['user_id', 'activity_date']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['user_id', 'activity_date']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE learner_project_progress ALTER COLUMN checked_item_ids DROP DEFAULT');
            DB::statement("ALTER TABLE learner_project_progress ALTER COLUMN checked_item_ids TYPE text[] USING '{}'::text[]");
            DB::statement("ALTER TABLE learner_project_progress ALTER COLUMN checked_item_ids SET DEFAULT '{}'::text[]");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('active_days');
        Schema::dropIfExists('weekly_goals');
        Schema::dropIfExists('saved_resources');
        Schema::dropIfExists('learner_notes');
        Schema::dropIfExists('learner_project_progress');
        Schema::dropIfExists('lesson_progress');
        Schema::dropIfExists('learner_progress');
    }
};
