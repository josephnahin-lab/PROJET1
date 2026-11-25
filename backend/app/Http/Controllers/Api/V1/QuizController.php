<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;

class QuizController extends Controller
{
    public function show(string $quizId): JsonResponse
    {
        $quiz = Quiz::query()
            ->whereKey($quizId)
            ->where('status', 'published')
            ->whereHas('lesson.week.pathway', static fn (Builder $query): Builder => $query
                ->where('status', 'published')
                ->whereHas('domain', static fn (Builder $domain): Builder => $domain
                    ->where('availability', 'published')
                    ->whereHas('family', static fn (Builder $family): Builder => $family->where('status', 'published'))))
            ->whereHas('questions')
            ->with(['questions' => static function (Relation $questions): void {
                $questions->orderBy('position')
                    ->with(['options' => static function (Relation $options): void {
                        $options->orderBy('position')
                            ->select(['id', 'question_id', 'label', 'position']);
                    }]);
            }])
            ->firstOrFail();

        return response()->json([
            'data' => [
                'id' => $quiz->id,
                'lessonId' => $quiz->lesson_id,
                'version' => $quiz->version,
                'questions' => $quiz->questions->map(static fn ($question): array => [
                    'id' => $question->id,
                    'prompt' => $question->prompt,
                    'options' => $question->options->map(static fn ($option): array => [
                        'id' => $option->id,
                        'label' => $option->label,
                    ])->all(),
                ])->all(),
            ],
        ]);
    }
}
