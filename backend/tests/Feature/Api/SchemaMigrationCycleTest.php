<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SchemaMigrationCycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_fresh_migrate_rollback_and_remigrate_work_on_sqlite(): void
    {
        $databasePath = tempnam(sys_get_temp_dir(), 'librescence-schema-');
        $this->assertIsString($databasePath);

        $connectionName = 'migration_cycle';
        $originalDefault = DB::getDefaultConnection();
        $connectionConfig = config('database.connections.sqlite');
        $connectionConfig['database'] = $databasePath;
        $connectionConfig['url'] = null;
        config(["database.connections.{$connectionName}" => $connectionConfig]);
        DB::setDefaultConnection($connectionName);
        DB::purge($connectionName);

        try {
            $this->assertSame(0, Artisan::call('migrate:fresh', [
                '--database' => $connectionName,
                '--force' => true,
            ]));
            $this->assertTrue(Schema::connection($connectionName)->hasTable('family_pathway_templates'));
            $this->assertTrue(Schema::connection($connectionName)->hasColumn('pathways', 'family_template_id'));

            $this->assertSame(0, Artisan::call('migrate:rollback', [
                '--database' => $connectionName,
                '--step' => 2,
                '--force' => true,
            ]));
            $this->assertFalse(Schema::connection($connectionName)->hasTable('portfolio_items'));
            $this->assertFalse(Schema::connection($connectionName)->hasTable('portfolio_attachments'));
            $this->assertFalse(Schema::connection($connectionName)->hasTable('family_pathway_templates'));
            $this->assertFalse(Schema::connection($connectionName)->hasColumn('pathways', 'family_template_id'));
            $this->assertFalse(Schema::connection($connectionName)->hasColumn('content_sources', 'revision_author_id'));

            $this->assertSame(0, Artisan::call('migrate', [
                '--database' => $connectionName,
                '--force' => true,
            ]));
            $this->assertTrue(Schema::connection($connectionName)->hasTable('portfolio_items'));
            $this->assertTrue(Schema::connection($connectionName)->hasTable('portfolio_attachments'));
            $this->assertTrue(Schema::connection($connectionName)->hasTable('family_pathway_templates'));
            $this->assertTrue(Schema::connection($connectionName)->hasColumn('pathways', 'family_template_id'));
        } finally {
            DB::disconnect($connectionName);
            DB::purge($connectionName);
            DB::setDefaultConnection($originalDefault);
            @unlink($databasePath);
        }
    }
}
