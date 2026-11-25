<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DomainController;
use App\Http\Controllers\Api\V1\LearnerController;
use App\Http\Controllers\Api\V1\PathwayController;
use App\Http\Controllers\Api\V1\PortfolioController;
use App\Http\Controllers\Api\V1\QuizController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Responses\ProblemResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;

Route::prefix('v1')->group(function (): void {
    Route::get('auth/csrf-cookie', [CsrfCookieController::class, 'show'])
        ->middleware(['web', 'throttle:csrf-bootstrap'])
        ->name('api.v1.auth.csrf-cookie');

    Route::post('auth/register', [AuthController::class, 'register'])
        ->middleware(['web', 'throttle:register'])
        ->name('api.v1.auth.register');

    Route::post('auth/login', [AuthController::class, 'login'])
        ->middleware(['web', 'throttle:login'])
        ->name('api.v1.auth.login');

    Route::post('auth/logout', [AuthController::class, 'logout'])
        ->middleware(['web', 'reject-bearer', 'auth:sanctum', 'throttle:logout'])
        ->name('api.v1.auth.logout');

    Route::get('me', [AuthController::class, 'current'])
        ->middleware(['reject-bearer', 'auth:sanctum', 'throttle:profileRead'])
        ->name('api.v1.me');

    Route::middleware(['web', 'reject-bearer', 'auth:sanctum'])->group(function (): void {
        Route::middleware('throttle:profileRead')->group(function (): void {
            Route::get('me/profile', [LearnerController::class, 'showProfile'])
                ->name('api.v1.me.profile.show');
            Route::get('me/progress', [LearnerController::class, 'showProgress'])
                ->name('api.v1.me.progress.show');
            Route::get('me/notes', [LearnerController::class, 'listNotes'])
                ->name('api.v1.me.notes.index');
            Route::get('me/saved-resources', [LearnerController::class, 'listSavedResources'])
                ->name('api.v1.me.saved-resources.index');
            Route::get('me/weekly-goal', [LearnerController::class, 'showWeeklyGoal'])
                ->name('api.v1.me.weekly-goal.show');
            Route::get('me/portfolio', [PortfolioController::class, 'index'])
                ->name('api.v1.me.portfolio.index');
            Route::get('me/portfolio/{itemId}/attachments/{attachmentId}/content', [PortfolioController::class, 'content'])
                ->name('api.v1.me.portfolio.attachments.content');
        });

        Route::middleware('throttle:accountWrite')->group(function (): void {
            Route::patch('me/profile', [LearnerController::class, 'updateProfile'])
                ->name('api.v1.me.profile.update');
            Route::put('me/progress', [LearnerController::class, 'replaceProgress'])
                ->name('api.v1.me.progress.replace');
            Route::put('me/lesson-progress', [LearnerController::class, 'markLessonProgress'])
                ->name('api.v1.me.lesson-progress.update');
            Route::put('me/project-progress/{projectId}', [LearnerController::class, 'updateProjectProgress'])
                ->name('api.v1.me.project-progress.update');
            Route::post('me/notes', [LearnerController::class, 'storeNote'])
                ->name('api.v1.me.notes.store');
            Route::delete('me/notes/{noteId}', [LearnerController::class, 'deleteNote'])
                ->name('api.v1.me.notes.destroy');
            Route::post('me/saved-resources', [LearnerController::class, 'storeSavedResource'])
                ->name('api.v1.me.saved-resources.store');
            Route::delete('me/saved-resources/{resourceId}', [LearnerController::class, 'deleteSavedResource'])
                ->name('api.v1.me.saved-resources.destroy');
            Route::put('me/weekly-goal', [LearnerController::class, 'updateWeeklyGoal'])
                ->name('api.v1.me.weekly-goal.update');
            Route::post('me/portfolio', [PortfolioController::class, 'store'])
                ->name('api.v1.me.portfolio.store');
            Route::patch('me/portfolio/{itemId}', [PortfolioController::class, 'update'])
                ->name('api.v1.me.portfolio.update');
            Route::delete('me/portfolio/{itemId}', [PortfolioController::class, 'destroy'])
                ->name('api.v1.me.portfolio.destroy');
            Route::delete('me/portfolio/{itemId}/attachments/{attachmentId}', [PortfolioController::class, 'deleteAttachment'])
                ->name('api.v1.me.portfolio.attachments.destroy');
        });

        Route::post('me/portfolio/{itemId}/attachments', [PortfolioController::class, 'upload'])
            ->middleware('throttle:portfolioUpload')
            ->name('api.v1.me.portfolio.attachments.store');
    });

    Route::get('domains', [DomainController::class, 'index'])
        ->middleware('throttle:domain-list')
        ->name('api.v1.domains.index');

    Route::get('search', SearchController::class)
        ->middleware('throttle:domain-list')
        ->name('api.v1.search');

    Route::get('domains/{domainId}', [DomainController::class, 'show'])
        ->middleware('throttle:domain-read')
        ->name('api.v1.domains.show');

    Route::get('pathways/{pathwayId}', [PathwayController::class, 'show'])
        ->middleware('throttle:pathway-read')
        ->name('api.v1.pathways.show');

    Route::get('quizzes/{quizId}', [QuizController::class, 'show'])
        ->middleware('throttle:quiz-read')
        ->name('api.v1.quizzes.show');

    Route::post('quizzes/{quizId}/sessions', static fn (): JsonResponse => ProblemResponse::featureDisabled('guest_quiz_session'))
        ->name('api.v1.quizzes.sessions.disabled');

    Route::post('quizzes/{quizId}/attempts', static fn (): JsonResponse => ProblemResponse::featureDisabled('quiz_attempt_persistence'))
        ->middleware(['reject-bearer', 'auth:sanctum'])
        ->name('api.v1.quizzes.attempts.disabled');

    Route::get('me/quiz-attempts', static fn (): JsonResponse => ProblemResponse::featureDisabled('quiz_attempt_history'))
        ->middleware(['reject-bearer', 'auth:sanctum'])
        ->name('api.v1.me.quiz-attempts.disabled');

    Route::post('contacts', static fn (): JsonResponse => ProblemResponse::featureDisabled('contact_storage'))
        ->name('api.v1.contacts.disabled');

    Route::post('me/imports/guest-state', static function (Request $request): JsonResponse {
        $mediaType = strtolower(trim(explode(';', $request->header('Content-Type', ''), 2)[0]));

        if ($mediaType !== 'application/json') {
            return ProblemResponse::make(
                415,
                'Unsupported Media Type',
                'Cette opération accepte uniquement le type de média application/json.',
                ['code' => 'UNSUPPORTED_MEDIA_TYPE'],
            );
        }

        $quizResults = $request->input('state.quizResults');

        if (is_array($quizResults) && $quizResults !== []) {
            return ProblemResponse::featureDisabled('imported_quiz_results');
        }

        return response()->json([
            'type' => 'about:blank',
            'title' => 'Not Implemented',
            'status' => 501,
            'code' => 'NOT_IMPLEMENTED',
            'traceId' => (string) Str::uuid(),
        ], 501, ['Content-Type' => 'application/problem+json']);
    })
        ->middleware(['reject-bearer', 'auth:sanctum'])
        ->name('api.v1.me.imports.guest-state');

    Route::middleware(['reject-bearer', 'auth:sanctum', 'can:support_contact'])->group(function (): void {
        Route::get('admin/contacts', static fn (): JsonResponse => ProblemResponse::featureDisabled('contact_storage'))
            ->name('api.v1.admin.contacts.disabled');

        Route::patch('admin/contacts/{contactId}', static fn (): JsonResponse => ProblemResponse::featureDisabled('contact_storage'))
            ->name('api.v1.admin.contacts.update.disabled');
    });
});
