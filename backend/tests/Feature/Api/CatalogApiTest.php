<?php

namespace Tests\Feature\Api;

use App\Models\ContentSource;
use App\Models\Domain;
use App\Models\DomainFamily;
use App\Models\Lesson;
use App\Models\Pathway;
use App\Models\PathwayWeek;
use App\Models\Project;
use App\Models\ProjectChecklistItem;
use App\Models\Quiz;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_domain_catalog_lists_only_published_domains_and_validates_filters(): void
    {
        $family = DomainFamily::factory()->create(['id' => 'digital']);
        Domain::factory()->for($family, 'family')->create([
            'id' => 'web',
            'name' => 'Développement web',
            'summary' => 'Créer des sites et applications.',
        ]);
        Domain::factory()->for($family, 'family')->create([
            'id' => 'draft-domain',
            'availability' => 'preparing',
        ]);

        $this->getJson('/api/v1/domains?family=digital&q=web&limit=10')
            ->assertOk()
            ->assertJsonPath('data.0.id', 'web')
            ->assertJsonPath('data.0.familyId', 'digital')
            ->assertJsonPath('data.0.availability', 'published')
            ->assertJsonPath('meta.limit', 10)
            ->assertJsonPath('meta.hasMore', false);

        $this->getJson('/api/v1/domains?limit=101')
            ->assertUnprocessable()
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('status', 422);

        $this->getJson('/api/v1/domains?cursor=not-a-valid-cursor')
            ->assertUnprocessable()
            ->assertJsonPath('status', 422);
    }

    public function test_domain_details_include_published_pathways_and_hide_unpublished_content(): void
    {
        $domain = Domain::factory()->create(['id' => 'web']);
        $visible = Pathway::factory()->for($domain)->create(['title' => 'Published pathway']);
        Pathway::factory()->for($domain)->create(['status' => 'draft']);

        $this->getJson('/api/v1/domains/web')
            ->assertOk()
            ->assertJsonPath('data.id', 'web')
            ->assertJsonPath('data.pathways.0.id', $visible->id)
            ->assertJsonPath('data.pathways.0.status', 'published')
            ->assertJsonCount(1, 'data.pathways');

        $this->getJson('/api/v1/domains/not-found')
            ->assertNotFound()
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('status', 404);
    }

    public function test_pathway_includes_published_lessons_projects_and_resources(): void
    {
        $domain = Domain::factory()->create(['id' => 'web']);
        $pathway = Pathway::factory()->for($domain)->create();
        $week = PathwayWeek::factory()->for($pathway)->create(['stable_key' => 'week-one', 'position' => 1]);
        $lesson = Lesson::factory()->for($week, 'week')->create([
            'stable_key' => 'first-site',
            'position' => 1,
        ]);
        $quiz = Quiz::factory()->for($lesson)->create();
        $question = QuizQuestion::factory()->for($quiz)->create(['explanation' => 'Private correction.']);
        QuizOption::factory()->for($question, 'question')->create([
            'label' => 'Correct answer',
            'is_correct' => true,
        ]);
        QuizOption::factory()->for($question, 'question')->create([
            'label' => 'Wrong answer',
            'is_correct' => false,
        ]);
        $project = Project::factory()->for($pathway)->create();
        ProjectChecklistItem::factory()->for($project, 'project')->create();
        $source = ContentSource::factory()->for(User::factory(), 'revisionAuthor')->create();
        Resource::factory()->for($pathway)->create([
            'lesson_id' => $lesson->id,
            'title' => 'Public reference',
            'source_record_id' => $source->id,
        ]);

        $this->getJson("/api/v1/pathways/{$pathway->id}")
            ->assertOk()
            ->assertJsonPath('data.domainId', 'web')
            ->assertJsonPath('data.weeks.0.id', 'week-one')
            ->assertJsonPath('data.weeks.0.lessons.0.id', 'first-site')
            ->assertJsonPath('data.weeks.0.lessons.0.quizzes.0.id', $quiz->id)
            ->assertJsonPath('data.projects.0.id', $project->id)
            ->assertJsonPath('data.resources.0.title', 'Public reference')
            ->assertJsonMissing(['is_correct' => true])
            ->assertJsonMissing(['correctOptionId' => $question->id]);
    }

    public function test_public_quiz_returns_prompts_and_options_without_answers_or_corrections(): void
    {
        $domain = Domain::factory()->create(['id' => 'web']);
        $pathway = Pathway::factory()->for($domain)->create();
        $week = PathwayWeek::factory()->for($pathway)->create();
        $lesson = Lesson::factory()->for($week, 'week')->create();
        $quiz = Quiz::factory()->for($lesson)->create();
        $question = QuizQuestion::factory()->for($quiz)->create([
            'prompt' => 'Which markup language is used?',
            'explanation' => 'The correct answer explanation is private.',
        ]);
        QuizOption::factory()->for($question, 'question')->create([
            'label' => 'HTML',
            'is_correct' => true,
        ]);
        QuizOption::factory()->for($question, 'question')->create([
            'label' => 'CSS',
            'is_correct' => false,
        ]);

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $quiz->id)
            ->assertJsonPath('data.lessonId', $lesson->id)
            ->assertJsonPath('data.questions.0.prompt', 'Which markup language is used?')
            ->assertJsonCount(2, 'data.questions.0.options')
            ->assertJsonMissing(['is_correct' => true])
            ->assertJsonMissing(['isCorrect' => true])
            ->assertJsonMissing(['explanation' => 'The correct answer explanation is private.'])
            ->assertJsonMissing(['points' => 1]);

        $this->getJson('/api/v1/quizzes/not-a-uuid')->assertNotFound();
    }
}
