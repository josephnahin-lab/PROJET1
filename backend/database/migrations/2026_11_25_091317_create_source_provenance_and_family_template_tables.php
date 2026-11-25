<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table): void {
            $table->enum('code', ['content_editor', 'content_approver', 'support_contact', 'system_admin'])->primary();
            $table->text('description');
        });

        Schema::create('user_role_assignments', function (Blueprint $table): void {
            $table->uuid('user_id');
            $table->string('role_code', 40);
            $table->uuid('granted_by');
            $table->timestampTz('granted_at');
            $table->timestampTz('revoked_at')->nullable();
            $table->primary(['user_id', 'role_code', 'granted_at'], 'user_role_assignment_primary');
            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
            $table->foreign('role_code')->references('code')->on('roles')->restrictOnDelete();
            $table->foreign('granted_by')->references('id')->on('users')->restrictOnDelete();
            $table->index(['user_id', 'role_code', 'revoked_at'], 'user_role_assignment_active_idx');
        });

        Schema::table('content_sources', function (Blueprint $table): void {
            $table->uuid('revision_author_id')->after('extracted_at');
            $table->foreign('revision_author_id')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
        });

        Schema::create('pathway_skills', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('pathway_id');
            $table->unsignedInteger('position');
            $table->string('label', 240);
            $table->unique(['pathway_id', 'position']);
            $table->foreign('pathway_id')->references('id')->on('pathways')->restrictOnDelete();
        });

        Schema::create('pathway_career_examples', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('pathway_id');
            $table->unsignedInteger('position');
            $table->string('label', 240);
            $table->unique(['pathway_id', 'position']);
            $table->foreign('pathway_id')->references('id')->on('pathways')->restrictOnDelete();
        });

        Schema::create('domain_content_sources', function (Blueprint $table): void {
            $table->string('domain_id', 100);
            $table->uuid('content_source_id');
            $table->primary(['domain_id', 'content_source_id']);
            $table->foreign('domain_id')->references('id')->on('domains')->restrictOnDelete();
            $table->foreign('content_source_id')->references('id')->on('content_sources')->restrictOnDelete();
        });

        Schema::create('pathway_content_sources', function (Blueprint $table): void {
            $table->uuid('pathway_id');
            $table->uuid('content_source_id');
            $table->primary(['pathway_id', 'content_source_id']);
            $table->foreign('pathway_id')->references('id')->on('pathways')->restrictOnDelete();
            $table->foreign('content_source_id')->references('id')->on('content_sources')->restrictOnDelete();
        });

        Schema::create('lesson_content_sources', function (Blueprint $table): void {
            $table->uuid('lesson_id');
            $table->uuid('content_source_id');
            $table->primary(['lesson_id', 'content_source_id']);
            $table->foreign('lesson_id')->references('id')->on('lessons')->restrictOnDelete();
            $table->foreign('content_source_id')->references('id')->on('content_sources')->restrictOnDelete();
        });

        Schema::create('quiz_content_sources', function (Blueprint $table): void {
            $table->uuid('quiz_id');
            $table->uuid('content_source_id');
            $table->primary(['quiz_id', 'content_source_id']);
            $table->foreign('quiz_id')->references('id')->on('quizzes')->restrictOnDelete();
            $table->foreign('content_source_id')->references('id')->on('content_sources')->restrictOnDelete();
        });

        Schema::create('content_audit_events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('actor_id');
            $table->string('entity_type', 80);
            $table->string('entity_id', 120);
            $table->string('entity_revision_key', 200);
            $table->string('action', 80);
            $table->char('before_checksum', 64)->nullable();
            $table->char('after_checksum', 64)->nullable();
            $table->timestampTz('created_at');
            $table->foreign('actor_id')->references('id')->on('users')->restrictOnDelete();
            $table->index(
                ['entity_type', 'entity_id', 'entity_revision_key', 'created_at'],
                'content_audit_entity_revision_created_idx',
            );
        });

        Schema::create('content_audit_event_sources', function (Blueprint $table): void {
            $table->uuid('audit_event_id');
            $table->uuid('content_source_id');
            $table->primary(['audit_event_id', 'content_source_id']);
            $table->foreign('audit_event_id')->references('id')->on('content_audit_events')->restrictOnDelete();
            $table->foreign('content_source_id')->references('id')->on('content_sources')->restrictOnDelete();
        });

        Schema::create('domain_id_aliases', function (Blueprint $table): void {
            $table->string('alias', 100)->primary();
            $table->string('domain_id', 100);
            $table->string('source_system', 80);
            $table->string('source_revision', 100);
            $table->enum('mapping_status', ['source_verified', 'proposed', 'approved', 'rejected']);
            $table->uuid('reviewed_by')->nullable();
            $table->timestampTz('reviewed_at')->nullable();
            $table->timestampTz('created_at');
            $table->foreign('domain_id')->references('id')->on('domains')->restrictOnDelete();
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
            $table->index('mapping_status');
        });

        Schema::create('domain_id_alias_sources', function (Blueprint $table): void {
            $table->string('source_system', 80);
            $table->string('source_revision', 100);
            $table->string('source_key', 100);
            $table->string('source_target', 100);
            $table->string('canonical_domain_id', 100);
            $table->uuid('source_id');
            $table->enum('resolution_kind', ['resolvable', 'identity']);
            $table->primary(['source_system', 'source_revision', 'source_key']);
            $table->foreign('canonical_domain_id')->references('id')->on('domains')->restrictOnDelete();
            $table->foreign('source_id')->references('id')->on('content_sources')->restrictOnDelete();
        });

        Schema::create('domain_family_aliases', function (Blueprint $table): void {
            $table->string('alias', 80)->primary();
            $table->string('proposed_family_id', 80)->nullable();
            $table->string('canonical_family_id', 80)->nullable();
            $table->string('source_system', 80);
            $table->enum('mapping_status', ['proposed', 'approved', 'rejected'])->default('proposed');
            $table->uuid('reviewed_by')->nullable();
            $table->timestampTz('reviewed_at')->nullable();
            $table->timestampTz('created_at');
            $table->foreign('proposed_family_id')->references('id')->on('domain_families')->restrictOnDelete();
            $table->foreign('canonical_family_id')->references('id')->on('domain_families')->restrictOnDelete();
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
            $table->index('mapping_status');
        });

        Schema::create('source_domain_id_inventory', function (Blueprint $table): void {
            $table->string('source_system', 80);
            $table->string('source_domain_id', 100);
            $table->string('canonical_domain_id', 100)->nullable();
            $table->enum('resolution', ['canonical', 'alias', 'quarantined_family', 'unresolved']);
            $table->primary(['source_system', 'source_domain_id']);
            $table->foreign('canonical_domain_id')->references('id')->on('domains')->restrictOnDelete();
            $table->index('resolution');
        });

        Schema::create('source_domain_records', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('content_source_id');
            $table->string('source_system', 80);
            $table->string('source_record_key', 240);
            $table->unsignedInteger('source_position');
            $table->string('source_domain_id', 100);
            $table->string('raw_family_id', 80);
            $table->string('canonical_family_id', 80)->nullable();
            $table->enum('family_resolution', ['active_raw', 'approved_alias', 'quarantined', 'unresolved']);
            $table->string('canonical_domain_id', 100)->nullable();
            $table->string('raw_name', 180);
            $table->text('raw_description')->nullable();
            $table->string('raw_status', 40)->nullable();
            $table->char('record_checksum', 64);
            $table->timestampTz('created_at');
            $table->unique(['content_source_id', 'source_record_key'], 'source_domain_record_source_key_unique');
            $table->foreign('content_source_id')->references('id')->on('content_sources')->restrictOnDelete();
            $table->foreign('canonical_family_id')->references('id')->on('domain_families')->restrictOnDelete();
            $table->foreign('canonical_domain_id')->references('id')->on('domains')->restrictOnDelete();
            $table->foreign(['source_system', 'source_domain_id'])
                ->references(['source_system', 'source_domain_id'])
                ->on('source_domain_id_inventory')
                ->restrictOnDelete();
            $table->index('raw_family_id');
            $table->index('canonical_domain_id');
        });

        Schema::create('source_domain_resources', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('source_record_id');
            $table->unsignedInteger('position');
            $table->string('title', 180);
            $table->text('url');
            $table->string('language', 80)->nullable();
            $table->string('provider', 160)->nullable();
            $table->char('resource_checksum', 64);
            $table->unique(['source_record_id', 'position']);
            $table->foreign('source_record_id')->references('id')->on('source_domain_records')->restrictOnDelete();
        });

        Schema::create('runtime_domain_inventory', function (Blueprint $table): void {
            $table->string('domain_id', 100)->primary();
            $table->string('family_id', 80);
            $table->enum('runtime_kind', ['web', 'specialty', 'generic_template']);
            $table->string('source_revision', 100);
            $table->timestampTz('created_at');
            $table->foreign('domain_id')->references('id')->on('domains')->restrictOnDelete();
            $table->foreign('family_id')->references('id')->on('domain_families')->restrictOnDelete();
            $table->index(['family_id', 'runtime_kind']);
        });

        Schema::create('runtime_domain_inventory_sources', function (Blueprint $table): void {
            $table->string('runtime_domain_id', 100);
            $table->uuid('source_record_id');
            $table->string('raw_family_id', 80);
            $table->string('raw_domain_id', 100);
            $table->string('applied_alias', 100)->nullable();
            $table->string('source_revision', 100);
            $table->primary(['runtime_domain_id', 'source_record_id']);
            $table->foreign('runtime_domain_id')->references('domain_id')->on('runtime_domain_inventory')->restrictOnDelete();
            $table->foreign('source_record_id')->references('id')->on('source_domain_records')->restrictOnDelete();
            $table->foreign('applied_alias')->references('alias')->on('domain_id_aliases')->restrictOnDelete();
        });

        Schema::create('family_pathway_templates', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('family_id', 80);
            $table->string('stable_key', 120);
            $table->unsignedInteger('version');
            $table->enum('status', ['draft', 'in_review', 'approved', 'published', 'archived'])->default('draft');
            $table->text('project_text_template');
            $table->text('project_topics_suffix_template');
            $table->string('source_version', 100);
            $table->timestampsTz();
            $table->foreign('family_id')->references('id')->on('domain_families')->restrictOnDelete();
            $table->unique(['family_id', 'stable_key', 'version'], 'family_template_family_key_version_unique');
            $table->unique(['id', 'version'], 'family_template_id_version_unique');
            $table->index(['family_id', 'status']);
        });

        Schema::create('family_pathway_template_content_sources', function (Blueprint $table): void {
            $table->uuid('family_template_id');
            $table->uuid('content_source_id');
            $table->primary(
                ['family_template_id', 'content_source_id'],
                'family_template_content_source_primary',
            );
            $table->foreign('family_template_id')
                ->references('id')
                ->on('family_pathway_templates')
                ->restrictOnDelete();
            $table->foreign('content_source_id')
                ->references('id')
                ->on('content_sources')
                ->restrictOnDelete();
        });

        Schema::create('family_template_skills', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('template_id');
            $table->unsignedInteger('position');
            $table->string('label', 240);
            $table->unique(['template_id', 'position']);
            $table->foreign('template_id')->references('id')->on('family_pathway_templates')->restrictOnDelete();
        });

        Schema::create('family_template_career_examples', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('template_id');
            $table->unsignedInteger('position');
            $table->string('label', 240);
            $table->unique(['template_id', 'position']);
            $table->foreign('template_id')->references('id')->on('family_pathway_templates')->restrictOnDelete();
        });

        Schema::create('family_template_weeks', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('template_id');
            $table->string('stable_key', 100);
            $table->unsignedInteger('position');
            $table->text('title');
            $table->text('explanation');
            $table->text('exercise');
            $table->text('quiz_prompt');
            $table->unsignedSmallInteger('source_answer_index');
            $table->unsignedInteger('correct_option_position');
            $table->text('feedback');
            $table->unique(['template_id', 'stable_key']);
            $table->unique(['template_id', 'position']);
            $table->foreign('template_id')->references('id')->on('family_pathway_templates')->restrictOnDelete();
        });

        Schema::create('family_template_quiz_options', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('template_week_id');
            $table->string('stable_key', 100);
            $table->unsignedInteger('position');
            $table->text('label');
            $table->unique(['template_week_id', 'stable_key']);
            $table->unique(['template_week_id', 'position']);
            $table->foreign('template_week_id')->references('id')->on('family_template_weeks')->restrictOnDelete();
        });

        Schema::create('family_template_stages', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('template_week_id');
            $table->string('stable_key', 100);
            $table->unsignedInteger('position');
            $table->text('stage_title_template');
            $table->text('objective_template');
            $table->text('exercise_template');
            $table->text('quiz_prompt_template');
            $table->unique(['template_week_id', 'stable_key']);
            $table->unique(['template_week_id', 'position']);
            $table->foreign('template_week_id')->references('id')->on('family_template_weeks')->restrictOnDelete();
        });

        Schema::create('family_template_domain_topics', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('template_id');
            $table->string('stable_key', 180);
            $table->string('domain_id', 100);
            $table->unsignedInteger('week_position');
            $table->text('topic');
            $table->uuid('source_id');
            $table->unique(['template_id', 'stable_key']);
            $table->unique(['template_id', 'domain_id', 'week_position'], 'family_template_domain_week_unique');
            $table->unique(
                ['id', 'template_id', 'domain_id', 'week_position'],
                'family_template_topic_identity_unique',
            );
            $table->foreign('template_id')->references('id')->on('family_pathway_templates')->restrictOnDelete();
            $table->foreign('domain_id')->references('id')->on('domains')->restrictOnDelete();
            $table->foreign('source_id')->references('id')->on('content_sources')->restrictOnDelete();
        });

        Schema::create('family_template_domain_topic_alias_sources', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('template_id');
            $table->string('source_key', 100);
            $table->unsignedInteger('week_position');
            $table->text('source_topic');
            $table->string('canonical_domain_id', 100);
            $table->uuid('canonical_topic_id');
            $table->uuid('source_id');
            $table->enum('topic_match', ['identical', 'review_required']);
            $table->unique(['template_id', 'source_key', 'week_position'], 'family_template_alias_source_week_unique');
            $table->foreign('template_id')->references('id')->on('family_pathway_templates')->restrictOnDelete();
            $table->foreign('canonical_domain_id')->references('id')->on('domains')->restrictOnDelete();
            $table->foreign(['canonical_topic_id', 'template_id', 'canonical_domain_id', 'week_position'])
                ->references(['id', 'template_id', 'domain_id', 'week_position'])
                ->on('family_template_domain_topics')
                ->restrictOnDelete();
            $table->foreign('source_id')->references('id')->on('content_sources')->restrictOnDelete();
        });

        Schema::table('pathways', function (Blueprint $table): void {
            $table->string('eyebrow', 180)->nullable();
            $table->uuid('family_template_id')->nullable();
            $table->unsignedInteger('family_template_version')->nullable();
            $table->char('generation_key', 64)->nullable()->unique();
            $table->char('generation_checksum', 64)->nullable();
            $table->foreign(['family_template_id', 'family_template_version'], 'pathways_family_template_version_fk')
                ->references(['id', 'version'])
                ->on('family_pathway_templates')
                ->restrictOnDelete();
        });

        Schema::create('pathway_generation_topics', function (Blueprint $table): void {
            $table->uuid('pathway_id');
            $table->unsignedInteger('week_position');
            $table->text('topic');
            $table->enum('topic_source', ['domain_override', 'template_title']);
            $table->uuid('source_id');
            $table->primary(['pathway_id', 'week_position']);
            $table->foreign('pathway_id')->references('id')->on('pathways')->restrictOnDelete();
            $table->foreign('source_id')->references('id')->on('content_sources')->restrictOnDelete();
        });

        $this->addPortableCheckConstraints();
        $this->addApprovedAliasGuards();
    }

    public function down(): void
    {
        $this->dropApprovedAliasGuards();
        $this->dropPortableCheckConstraints();

        Schema::dropIfExists('pathway_generation_topics');

        Schema::table('pathways', function (Blueprint $table): void {
            if (DB::getDriverName() === 'sqlite') {
                $table->dropForeign(['family_template_id', 'family_template_version']);
            } else {
                $table->dropForeign('pathways_family_template_version_fk');
            }

            $table->dropUnique(['generation_key']);
            $table->dropColumn([
                'eyebrow',
                'family_template_id',
                'family_template_version',
                'generation_key',
                'generation_checksum',
            ]);
        });

        foreach ([
            'family_template_domain_topic_alias_sources',
            'family_template_domain_topics',
            'family_template_stages',
            'family_template_quiz_options',
            'family_template_weeks',
            'family_template_career_examples',
            'family_template_skills',
            'family_pathway_template_content_sources',
            'family_pathway_templates',
            'pathway_career_examples',
            'pathway_skills',
            'runtime_domain_inventory_sources',
            'runtime_domain_inventory',
            'source_domain_resources',
            'source_domain_records',
            'source_domain_id_inventory',
            'domain_family_aliases',
            'domain_id_alias_sources',
            'domain_id_aliases',
            'content_audit_event_sources',
            'content_audit_events',
            'quiz_content_sources',
            'lesson_content_sources',
            'pathway_content_sources',
            'domain_content_sources',
        ] as $table) {
            Schema::dropIfExists($table);
        }

        Schema::table('content_sources', function (Blueprint $table): void {
            $table->dropForeign(['revision_author_id']);
            $table->dropColumn('revision_author_id');
        });

        Schema::dropIfExists('user_role_assignments');
        Schema::dropIfExists('roles');
    }

    /**
     * @return list<array{table: string, name: string, expression: string, columns: list<string>}>
     */
    private function checkConstraints(): array
    {
        return [
            [
                'table' => 'domain_families',
                'name' => 'domain_families_status_check',
                'expression' => "status IN ('published', 'preparing', 'archived')",
                'columns' => ['status'],
            ],
            [
                'table' => 'domains',
                'name' => 'domains_availability_check',
                'expression' => "availability IN ('published', 'preparing', 'archived')",
                'columns' => ['availability'],
            ],
            [
                'table' => 'domains',
                'name' => 'domains_content_status_check',
                'expression' => "content_status IN ('draft', 'in_review', 'approved', 'published', 'archived')",
                'columns' => ['content_status'],
            ],
            [
                'table' => 'domains',
                'name' => 'domains_publication_state_check',
                'expression' => "availability <> 'published' OR content_status = 'published'",
                'columns' => ['availability', 'content_status'],
            ],
            [
                'table' => 'content_sources',
                'name' => 'content_sources_license_review_check',
                'expression' => "(license_status IN ('unknown', 'review_required') AND reviewed_by IS NULL AND reviewed_at IS NULL) OR (license_status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND reviewed_by <> revision_author_id)",
                'columns' => ['license_status', 'reviewed_by', 'reviewed_at', 'revision_author_id'],
            ],
            [
                'table' => 'pathways',
                'name' => 'pathways_status_check',
                'expression' => "status IN ('draft', 'in_review', 'published', 'archived')",
                'columns' => ['status'],
            ],
            [
                'table' => 'pathways',
                'name' => 'pathways_version_positive_check',
                'expression' => 'version > 0',
                'columns' => ['version'],
            ],
            [
                'table' => 'pathways',
                'name' => 'pathways_published_at_required_check',
                'expression' => "status <> 'published' OR published_at IS NOT NULL",
                'columns' => ['status', 'published_at'],
            ],
            [
                'table' => 'pathways',
                'name' => 'pathways_template_generation_pair_check',
                'expression' => '(family_template_id IS NULL AND family_template_version IS NULL AND generation_key IS NULL AND generation_checksum IS NULL) OR (family_template_id IS NOT NULL AND family_template_version IS NOT NULL AND generation_key IS NOT NULL AND generation_checksum IS NOT NULL)',
                'columns' => ['family_template_id', 'family_template_version', 'generation_key', 'generation_checksum'],
            ],
            [
                'table' => 'pathways',
                'name' => 'pathways_family_template_version_positive_check',
                'expression' => 'family_template_version IS NULL OR family_template_version > 0',
                'columns' => ['family_template_version'],
            ],
            [
                'table' => 'pathway_weeks',
                'name' => 'pathway_weeks_position_positive_check',
                'expression' => 'position > 0',
                'columns' => ['position'],
            ],
            [
                'table' => 'lessons',
                'name' => 'lessons_position_positive_check',
                'expression' => 'position > 0',
                'columns' => ['position'],
            ],
            [
                'table' => 'lessons',
                'name' => 'lessons_duration_positive_check',
                'expression' => 'duration_minutes IS NULL OR duration_minutes > 0',
                'columns' => ['duration_minutes'],
            ],
            [
                'table' => 'quizzes',
                'name' => 'quizzes_status_check',
                'expression' => "status IN ('draft', 'published', 'archived')",
                'columns' => ['status'],
            ],
            [
                'table' => 'quizzes',
                'name' => 'quizzes_version_positive_check',
                'expression' => 'version > 0',
                'columns' => ['version'],
            ],
            [
                'table' => 'quizzes',
                'name' => 'quizzes_pass_score_nonnegative_check',
                'expression' => 'pass_score IS NULL OR pass_score >= 0',
                'columns' => ['pass_score'],
            ],
            [
                'table' => 'quiz_questions',
                'name' => 'quiz_questions_position_positive_check',
                'expression' => 'position > 0',
                'columns' => ['position'],
            ],
            [
                'table' => 'quiz_questions',
                'name' => 'quiz_questions_points_positive_check',
                'expression' => 'points > 0',
                'columns' => ['points'],
            ],
            [
                'table' => 'quiz_options',
                'name' => 'quiz_options_position_positive_check',
                'expression' => 'position > 0',
                'columns' => ['position'],
            ],
            [
                'table' => 'projects',
                'name' => 'projects_status_check',
                'expression' => "status IN ('draft', 'published', 'archived')",
                'columns' => ['status'],
            ],
            [
                'table' => 'projects',
                'name' => 'projects_position_positive_check',
                'expression' => 'position > 0',
                'columns' => ['position'],
            ],
            [
                'table' => 'project_checklist_items',
                'name' => 'project_checklist_position_positive_check',
                'expression' => 'position > 0',
                'columns' => ['position'],
            ],
            [
                'table' => 'resources',
                'name' => 'resources_status_check',
                'expression' => "status IN ('draft', 'published', 'archived')",
                'columns' => ['status'],
            ],
            [
                'table' => 'resources',
                'name' => 'resources_verification_status_check',
                'expression' => "verification_status IN ('unverified', 'verified', 'unavailable')",
                'columns' => ['verification_status'],
            ],
            [
                'table' => 'resources',
                'name' => 'resources_publication_verification_check',
                'expression' => "status <> 'published' OR verification_status = 'verified'",
                'columns' => ['status', 'verification_status'],
            ],
            [
                'table' => 'resources',
                'name' => 'resources_kind_check',
                'expression' => "resource_kind IN ('article', 'course', 'video', 'search', 'document', 'other')",
                'columns' => ['resource_kind'],
            ],
            [
                'table' => 'resources',
                'name' => 'resources_parent_required_check',
                'expression' => 'domain_id IS NOT NULL OR pathway_id IS NOT NULL OR lesson_id IS NOT NULL',
                'columns' => ['domain_id', 'pathway_id', 'lesson_id'],
            ],
            [
                'table' => 'resources',
                'name' => 'resources_position_positive_check',
                'expression' => 'position > 0',
                'columns' => ['position'],
            ],
            [
                'table' => 'user_role_assignments',
                'name' => 'user_role_revocation_after_grant_check',
                'expression' => 'revoked_at IS NULL OR revoked_at >= granted_at',
                'columns' => ['revoked_at', 'granted_at'],
            ],
            [
                'table' => 'domain_id_aliases',
                'name' => 'domain_id_alias_not_identity_check',
                'expression' => 'alias <> domain_id',
                'columns' => ['alias', 'domain_id'],
            ],
            [
                'table' => 'domain_id_aliases',
                'name' => 'domain_id_alias_review_state_check',
                'expression' => "(mapping_status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL) OR (mapping_status IN ('source_verified', 'proposed') AND reviewed_by IS NULL AND reviewed_at IS NULL)",
                'columns' => ['mapping_status', 'reviewed_by', 'reviewed_at'],
            ],
            [
                'table' => 'domain_id_alias_sources',
                'name' => 'domain_id_alias_source_resolution_check',
                'expression' => "(resolution_kind = 'identity' AND source_key = source_target) OR (resolution_kind = 'resolvable' AND source_key <> source_target)",
                'columns' => ['resolution_kind', 'source_key', 'source_target'],
            ],
            [
                'table' => 'domain_id_alias_sources',
                'name' => 'domain_id_alias_source_target_check',
                'expression' => 'canonical_domain_id = source_target',
                'columns' => ['canonical_domain_id', 'source_target'],
            ],
            [
                'table' => 'domain_family_aliases',
                'name' => 'domain_family_alias_review_state_check',
                'expression' => "(mapping_status = 'proposed' AND canonical_family_id IS NULL AND reviewed_by IS NULL AND reviewed_at IS NULL) OR (mapping_status = 'approved' AND canonical_family_id IS NOT NULL AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL) OR (mapping_status = 'rejected' AND canonical_family_id IS NULL AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)",
                'columns' => ['mapping_status', 'canonical_family_id', 'reviewed_by', 'reviewed_at'],
            ],
            [
                'table' => 'source_domain_id_inventory',
                'name' => 'source_domain_inventory_resolution_check',
                'expression' => "(resolution IN ('canonical', 'alias') AND canonical_domain_id IS NOT NULL) OR (resolution IN ('quarantined_family', 'unresolved') AND canonical_domain_id IS NULL)",
                'columns' => ['resolution', 'canonical_domain_id'],
            ],
            [
                'table' => 'source_domain_records',
                'name' => 'source_domain_record_position_positive_check',
                'expression' => 'source_position > 0',
                'columns' => ['source_position'],
            ],
            [
                'table' => 'source_domain_records',
                'name' => 'source_domain_record_family_state_check',
                'expression' => "(family_resolution = 'quarantined' AND canonical_family_id IS NULL AND canonical_domain_id IS NULL) OR (family_resolution <> 'quarantined' AND (family_resolution NOT IN ('active_raw', 'approved_alias') OR (canonical_family_id IS NOT NULL AND canonical_domain_id IS NOT NULL)))",
                'columns' => ['family_resolution', 'canonical_family_id', 'canonical_domain_id'],
            ],
            [
                'table' => 'source_domain_resources',
                'name' => 'source_domain_resource_position_positive_check',
                'expression' => 'position > 0',
                'columns' => ['position'],
            ],
            [
                'table' => 'family_pathway_templates',
                'name' => 'family_template_version_positive_check',
                'expression' => 'version > 0',
                'columns' => ['version'],
            ],
            [
                'table' => 'family_template_skills',
                'name' => 'family_template_skill_position_positive_check',
                'expression' => 'position > 0',
                'columns' => ['position'],
            ],
            [
                'table' => 'family_template_career_examples',
                'name' => 'family_template_career_position_positive_check',
                'expression' => 'position > 0',
                'columns' => ['position'],
            ],
            [
                'table' => 'family_template_weeks',
                'name' => 'family_template_week_position_check',
                'expression' => 'position BETWEEN 1 AND 4',
                'columns' => ['position'],
            ],
            [
                'table' => 'family_template_weeks',
                'name' => 'family_template_week_answer_index_check',
                'expression' => 'source_answer_index BETWEEN 0 AND 2',
                'columns' => ['source_answer_index'],
            ],
            [
                'table' => 'family_template_weeks',
                'name' => 'family_template_week_correct_option_check',
                'expression' => 'correct_option_position = source_answer_index + 1',
                'columns' => ['correct_option_position', 'source_answer_index'],
            ],
            [
                'table' => 'family_template_quiz_options',
                'name' => 'family_template_option_position_check',
                'expression' => 'position BETWEEN 1 AND 3',
                'columns' => ['position'],
            ],
            [
                'table' => 'family_template_stages',
                'name' => 'family_template_stage_position_check',
                'expression' => 'position BETWEEN 1 AND 3',
                'columns' => ['position'],
            ],
            [
                'table' => 'family_template_domain_topics',
                'name' => 'family_template_topic_week_position_check',
                'expression' => 'week_position BETWEEN 1 AND 4',
                'columns' => ['week_position'],
            ],
            [
                'table' => 'family_template_domain_topic_alias_sources',
                'name' => 'family_template_alias_week_position_check',
                'expression' => 'week_position BETWEEN 1 AND 4',
                'columns' => ['week_position'],
            ],
            [
                'table' => 'pathway_skills',
                'name' => 'pathway_skill_position_positive_check',
                'expression' => 'position > 0',
                'columns' => ['position'],
            ],
            [
                'table' => 'pathway_career_examples',
                'name' => 'pathway_career_position_positive_check',
                'expression' => 'position > 0',
                'columns' => ['position'],
            ],
            [
                'table' => 'pathway_generation_topics',
                'name' => 'pathway_generation_week_position_check',
                'expression' => 'week_position BETWEEN 1 AND 4',
                'columns' => ['week_position'],
            ],
        ];
    }

    private function addPortableCheckConstraints(): void
    {
        $driver = DB::getDriverName();

        if (! in_array($driver, ['pgsql', 'sqlite'], true)) {
            throw new RuntimeException("Unsupported database driver for content CHECK constraints [{$driver}].");
        }

        foreach ($this->checkConstraints() as $check) {
            if ($driver === 'pgsql') {
                DB::statement(sprintf(
                    'ALTER TABLE "%s" ADD CONSTRAINT "%s" CHECK (%s)',
                    $check['table'],
                    $check['name'],
                    $check['expression'],
                ));

                continue;
            }

            $expression = $check['expression'];

            foreach ($check['columns'] as $column) {
                $expression = preg_replace(
                    '/(?<![A-Za-z0-9_.])'.preg_quote($column, '/').'(?![A-Za-z0-9_])/',
                    'NEW.'.$column,
                    $expression,
                );
            }

            foreach (['INSERT', 'UPDATE'] as $operation) {
                $trigger = $check['name'].'_'.strtolower($operation);

                DB::statement(sprintf(
                    'CREATE TRIGGER "%s" BEFORE %s ON "%s" FOR EACH ROW WHEN NOT (%s) BEGIN SELECT RAISE(ABORT, \'CHECK constraint failed: %s\'); END',
                    $trigger,
                    $operation,
                    $check['table'],
                    $expression,
                    $check['name'],
                ));
            }
        }
    }

    private function dropPortableCheckConstraints(): void
    {
        $driver = DB::getDriverName();

        foreach ($this->checkConstraints() as $check) {
            if ($driver === 'pgsql') {
                DB::statement(sprintf(
                    'ALTER TABLE "%s" DROP CONSTRAINT IF EXISTS "%s"',
                    $check['table'],
                    $check['name'],
                ));

                continue;
            }

            if ($driver === 'sqlite') {
                foreach (['insert', 'update'] as $operation) {
                    DB::statement(sprintf(
                        'DROP TRIGGER IF EXISTS "%s_%s"',
                        $check['name'],
                        $operation,
                    ));
                }

                continue;
            }

            throw new RuntimeException("Unsupported database driver for content CHECK constraints [{$driver}].");
        }
    }

    private function addApprovedAliasGuards(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared(<<<'SQL'
                CREATE OR REPLACE FUNCTION enforce_approved_family_alias_record()
                RETURNS TRIGGER AS $$
                DECLARE
                    mapped_family_id varchar(80);
                BEGIN
                    IF NEW.family_resolution = 'approved_alias' THEN
                        SELECT canonical_family_id
                        INTO mapped_family_id
                        FROM domain_family_aliases
                        WHERE alias = NEW.raw_family_id
                          AND mapping_status = 'approved'
                        FOR UPDATE;

                        IF NOT FOUND OR mapped_family_id IS DISTINCT FROM NEW.canonical_family_id THEN
                            RAISE EXCEPTION 'CHECK constraint failed: approved family alias and target are required';
                        END IF;
                    END IF;

                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql
            SQL);

            DB::unprepared(<<<'SQL'
                CREATE TRIGGER source_domain_records_approved_alias_guard
                BEFORE INSERT OR UPDATE ON source_domain_records
                FOR EACH ROW
                EXECUTE FUNCTION enforce_approved_family_alias_record()
            SQL);

            DB::unprepared(<<<'SQL'
                CREATE OR REPLACE FUNCTION prevent_referenced_family_alias_invalidation()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM source_domain_records
                        WHERE raw_family_id = OLD.alias
                          AND family_resolution = 'approved_alias'
                          AND (
                              TG_OP = 'DELETE'
                              OR NEW.alias IS DISTINCT FROM OLD.alias
                              OR NEW.mapping_status <> 'approved'
                              OR NEW.canonical_family_id IS DISTINCT FROM source_domain_records.canonical_family_id
                          )
                    ) THEN
                        RAISE EXCEPTION 'CHECK constraint failed: approved family alias is referenced by canonical records';
                    END IF;

                    IF TG_OP = 'DELETE' THEN
                        RETURN OLD;
                    END IF;

                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql
            SQL);

            DB::unprepared(<<<'SQL'
                CREATE TRIGGER domain_family_alias_update_guard
                BEFORE UPDATE OR DELETE ON domain_family_aliases
                FOR EACH ROW
                EXECUTE FUNCTION prevent_referenced_family_alias_invalidation()
            SQL);

            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            DB::statement(<<<'SQL'
                CREATE TRIGGER source_domain_records_approved_alias_insert
                BEFORE INSERT ON source_domain_records
                FOR EACH ROW
                WHEN NEW.family_resolution = 'approved_alias'
                  AND NOT EXISTS (
                    SELECT 1
                    FROM domain_family_aliases
                    WHERE alias = NEW.raw_family_id
                      AND mapping_status = 'approved'
                      AND canonical_family_id = NEW.canonical_family_id
                  )
                BEGIN
                    SELECT RAISE(ABORT, 'CHECK constraint failed: approved family alias and target are required');
                END
            SQL);

            DB::statement(<<<'SQL'
                CREATE TRIGGER source_domain_records_approved_alias_update
                BEFORE UPDATE ON source_domain_records
                FOR EACH ROW
                WHEN NEW.family_resolution = 'approved_alias'
                  AND NOT EXISTS (
                    SELECT 1
                    FROM domain_family_aliases
                    WHERE alias = NEW.raw_family_id
                      AND mapping_status = 'approved'
                      AND canonical_family_id = NEW.canonical_family_id
                  )
                BEGIN
                    SELECT RAISE(ABORT, 'CHECK constraint failed: approved family alias and target are required');
                END
            SQL);

            DB::statement(<<<'SQL'
                CREATE TRIGGER domain_family_alias_update_guard
                BEFORE UPDATE ON domain_family_aliases
                FOR EACH ROW
                WHEN EXISTS (
                    SELECT 1
                    FROM source_domain_records
                    WHERE raw_family_id = OLD.alias
                      AND family_resolution = 'approved_alias'
                      AND (
                          NEW.alias <> OLD.alias
                          OR NEW.mapping_status <> 'approved'
                          OR NEW.canonical_family_id IS NOT canonical_family_id
                      )
                )
                BEGIN
                    SELECT RAISE(ABORT, 'CHECK constraint failed: approved family alias is referenced by canonical records');
                END
            SQL);

            DB::statement(<<<'SQL'
                CREATE TRIGGER domain_family_alias_delete_guard
                BEFORE DELETE ON domain_family_aliases
                FOR EACH ROW
                WHEN EXISTS (
                    SELECT 1
                    FROM source_domain_records
                    WHERE raw_family_id = OLD.alias
                      AND family_resolution = 'approved_alias'
                )
                BEGIN
                    SELECT RAISE(ABORT, 'CHECK constraint failed: approved family alias is referenced by canonical records');
                END
            SQL);

            return;
        }

        throw new RuntimeException('Approved family alias guards require PostgreSQL or SQLite.');
    }

    private function dropApprovedAliasGuards(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP TRIGGER IF EXISTS source_domain_records_approved_alias_guard ON source_domain_records');
            DB::statement('DROP FUNCTION IF EXISTS enforce_approved_family_alias_record()');
            DB::statement('DROP TRIGGER IF EXISTS domain_family_alias_update_guard ON domain_family_aliases');
            DB::statement('DROP FUNCTION IF EXISTS prevent_referenced_family_alias_invalidation()');

            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('DROP TRIGGER IF EXISTS source_domain_records_approved_alias_insert');
            DB::statement('DROP TRIGGER IF EXISTS source_domain_records_approved_alias_update');
            DB::statement('DROP TRIGGER IF EXISTS domain_family_alias_update_guard');
            DB::statement('DROP TRIGGER IF EXISTS domain_family_alias_delete_guard');

            return;
        }

        throw new RuntimeException('Approved family alias guards require PostgreSQL or SQLite.');
    }
};
