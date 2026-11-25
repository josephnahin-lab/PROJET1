<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Pathway;
use App\Models\PathwayWeek;
use App\Models\Project;
use App\Models\ProjectChecklistItem;
use App\Models\Quiz;
use App\Models\Resource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;

class PathwayController extends Controller
{
    public function show(string $pathwayId): JsonResponse
    {
        $pathway = Pathway::query()
            ->whereKey($pathwayId)
            ->where('status', 'published')
            ->whereHas('domain', static fn (Builder $query): Builder => $query
                ->where('availability', 'published')
                ->whereHas('family', static fn (Builder $family): Builder => $family->where('status', 'published')))
            ->with([
                'weeks.lessons.quizzes' => static function (Relation $relation): void {
                    $relation->where('status', 'published')
                        ->whereHas('questions')
                        ->withCount('questions')
                        ->with(['questions' => static function (Relation $questions): void {
                            $questions->orderBy('position')
                                ->with(['options' => static function (Relation $options): void {
                                    $options->orderBy('position')
                                        ->select(['id', 'question_id', 'label', 'position']);
                                }]);
                        }]);
                },
                'weeks.lessons.resources' => static function (Relation $relation): void {
                    $relation->where('status', 'published')
                        ->where('verification_status', '!=', 'unavailable')
                        ->orderBy('position');
                },
                'projects' => static function (Relation $relation): void {
                    $relation->where('status', 'published')
                        ->orderBy('position')
                        ->with(['checklistItems' => static function (Relation $items): void {
                            $items->orderBy('position');
                        }]);
                },
                'resources' => static function (Relation $relation): void {
                    $relation->where('status', 'published')
                        ->where('verification_status', '!=', 'unavailable')
                        ->orderBy('position');
                },
            ])
            ->firstOrFail();

        return response()->json(['data' => $this->pathwayPayload($pathway)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function pathwayPayload(Pathway $pathway): array
    {
        return array_filter([
            'id' => $pathway->id,
            'domainId' => $pathway->domain_id,
            'title' => $pathway->title,
            'description' => $pathway->description,
            'overview' => $pathway->overview,
            'version' => $pathway->version,
            'status' => 'published',
            'difficulty' => $pathway->difficulty,
            'prerequisites' => $pathway->prerequisites,
            'equipment' => $pathway->equipment,
            'weeklyTime' => $pathway->weekly_time,
            'safetyNote' => $pathway->safety_note,
            'weeks' => $pathway->weeks->map(fn (PathwayWeek $week): array => $this->weekPayload($week))->all(),
            'projects' => $pathway->projects->map(fn (Project $project): array => $this->projectPayload($project))->all(),
            'completionPolicy' => $pathway->completion_policy,
            'resources' => $pathway->resources->map(fn (Resource $resource): array => $this->resourcePayload($resource))->all(),
        ], static fn (mixed $value): bool => $value !== null);
    }

    /**
     * @return array<string, mixed>
     */
    private function weekPayload(PathwayWeek $week): array
    {
        return array_filter([
            'id' => $week->stable_key,
            'position' => $week->position,
            'title' => $week->title,
            'label' => $week->label,
            'lessons' => $week->lessons->map(fn (Lesson $lesson): array => $this->lessonPayload($lesson))->all(),
        ], static fn (mixed $value): bool => $value !== null);
    }

    /**
     * @return array<string, mixed>
     */
    private function lessonPayload(Lesson $lesson): array
    {
        return array_filter([
            'id' => $lesson->stable_key,
            'position' => $lesson->position,
            'title' => $lesson->title,
            'objective' => $lesson->objective,
            'explanation' => $lesson->explanation,
            'activity' => $lesson->activity,
            'durationMinutes' => $lesson->duration_minutes,
            'resourceIds' => $lesson->resources->pluck('id')->all(),
            'quizzes' => $lesson->quizzes->map(static fn (Quiz $quiz): array => [
                'id' => $quiz->id,
                'questionCount' => $quiz->questions_count,
            ])->all(),
        ], static fn (mixed $value): bool => $value !== null);
    }

    /**
     * @return array<string, mixed>
     */
    private function projectPayload(Project $project): array
    {
        return [
            'id' => $project->id,
            'title' => $project->title,
            'instructions' => $project->instructions,
            'checklist' => $project->checklistItems
                ->map(static fn (ProjectChecklistItem $item): array => [
                    'stableKey' => $item->stable_key,
                    'position' => $item->position,
                    'label' => $item->label,
                ])->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function resourcePayload(Resource $resource): array
    {
        return array_filter([
            'id' => $resource->id,
            'title' => $resource->title,
            'url' => $resource->url,
            'provider' => $resource->provider,
            'language' => $resource->language,
            'kind' => $resource->resource_kind,
            'accessNote' => $resource->access_note,
            'verificationStatus' => $resource->verification_status,
        ], static fn (mixed $value): bool => $value !== null);
    }
}
