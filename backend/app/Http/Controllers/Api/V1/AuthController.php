<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Responses\ProblemResponse;
use App\Models\LearnerProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $payload = $this->normalizeEmail($request->json()->all());
        $this->rejectUnexpectedKeys($payload, ['email', 'password', 'locale']);

        $validator = Validator::make($payload, [
            'email' => ['required', 'string', 'email', 'max:254'],
            'password' => ['required', 'string', 'min:12', 'max:128'],
            'locale' => ['sometimes', 'string', 'max:16'],
        ]);
        $validator->after(static function ($validator) use ($payload): void {
            if ($validator->errors()->has('email') || ! is_string($payload['email'] ?? null)) {
                return;
            }

            if (User::withTrashed()->whereRaw('LOWER(email) = ?', [$payload['email']])->exists()) {
                $validator->errors()->add('email', __('validation.unique', ['attribute' => 'email']));
            }
        });
        $data = $validator->validate();

        $user = DB::transaction(function () use ($data): User {
            $user = User::create([
                'email' => $data['email'],
                'password' => $data['password'],
            ]);

            LearnerProfile::create([
                'user_id' => $user->id,
                'locale' => $data['locale'] ?? 'fr',
            ]);

            Auth::guard('web')->login($user);
            request()->session()->regenerate();

            return $user;
        });

        return $this->sessionResponse($user, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $payload = $this->normalizeEmail($request->json()->all());
        $this->rejectUnexpectedKeys($payload, ['email', 'password']);

        $credentials = Validator::make($payload, [
            'email' => ['required', 'string', 'email', 'max:254'],
            'password' => ['required', 'string', 'min:1', 'max:128'],
        ])->validate();

        $user = User::query()->whereRaw('LOWER(email) = ?', [$credentials['email']])->first();

        if ($user === null || ! Hash::check($credentials['password'], $user->password) || $user->status !== 'active') {
            return ProblemResponse::make(401, 'Unauthorized', 'Les identifiants fournis sont invalides.');
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return $this->sessionResponse($user, 200);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(status: 204);
    }

    public function current(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json(['data' => $this->userPayload($user)]);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function normalizeEmail(array $payload): array
    {
        $email = $payload['email'] ?? null;

        if (is_string($email)) {
            $payload['email'] = Str::lower(trim($email));
        }

        return $payload;
    }

    /**
     * @param  list<string>  $allowed
     */
    private function rejectUnexpectedKeys(array $payload, array $allowed): void
    {
        $unexpected = array_diff(array_keys($payload), $allowed);

        if ($unexpected !== []) {
            throw ValidationException::withMessages([
                'request' => 'La requête contient des propriétés non autorisées.',
            ]);
        }
    }

    private function sessionResponse(User $user, int $status): JsonResponse
    {
        return response()->json([
            'data' => [
                'user' => $this->userPayload($user),
                'csrfRequired' => true,
            ],
        ], $status);
    }

    /**
     * @return array{id: string, email: string, emailVerified: bool, status: string}
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'emailVerified' => $user->email_verified_at !== null,
            'status' => $user->status,
        ];
    }
}
