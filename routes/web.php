<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Chat routes
    Route::get('/chat', function () {
        $provider = config('ai-chat.default_provider');
        $providerConfig = config("ai-chat.{$provider}");

        return Inertia::render('Chat', [
            'aiConfig' => [
                'provider' => $provider,
                'apiKey' => $providerConfig['api_key'] ?? '',
                'model' => $providerConfig['model'] ?? '',
                'baseUrl' => $providerConfig['base_url'] ?? '',
                'allowOverride' => config('ai-chat.allow_user_override', true),
            ],
        ]);
    })->name('chat');

    // Thread API routes
    Route::prefix('api')->group(function () {
        Route::get('/threads', [\App\Http\Controllers\ThreadController::class, 'index']);
        Route::get('/threads/{id}', [\App\Http\Controllers\ThreadController::class, 'show']);
        Route::post('/threads', [\App\Http\Controllers\ThreadController::class, 'store']);
        Route::put('/threads/{id}', [\App\Http\Controllers\ThreadController::class, 'update']);
        Route::delete('/threads/{id}', [\App\Http\Controllers\ThreadController::class, 'destroy']);

        // Sub-thread API routes
        Route::get('/sub-threads', [\App\Http\Controllers\SubThreadController::class, 'index']);
        Route::post('/sub-threads', [\App\Http\Controllers\SubThreadController::class, 'store']);
        Route::delete('/sub-threads/{id}', [\App\Http\Controllers\SubThreadController::class, 'destroy']);
    });
});

// Tyro-Login handles authentication - Breeze auth routes disabled
// require __DIR__.'/auth.php';
