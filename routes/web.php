<?php
/** @noinspection PhpMultipleClassDeclarationsInspection */

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HistoryController;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use function Termwind\render;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return Inertia::render('Welcome');
})->name('home');

/*
|--------------------------------------------------------------------------
|  PUBLIC ROUTES
|--------------------------------------------------------------------------
*/

//Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
//
//Route::get('register', [RegisteredUserController::class, 'create'])
//    ->name('register');
//
//Route::post('register', [RegisteredUserController::class, 'store']);
//
//Route::get('/auth/google', function () {
//    return Socialite::driver('google')->redirect();
//})->name('auth.google');
//
//Route::get('/auth/google/callback', function () {
//    $googleUser = Socialite::driver('google')->user();
//
//    $user = User::where('email', $googleUser->email)->first();
//
//    if ($user) {
//        $user->update([
//            'google_id' => $googleUser->id,
//            'avatar' => $googleUser->avatar,
//        ]);
//    } else {
//        $user = User::create([
//            'name' => $googleUser->name,
//            'email' => $googleUser->email,
//            'google_id' => $googleUser->id,
//            'avatar' => $googleUser->avatar,
//            'password' => Hash::make(Str::random(24)),
//            'email_verified_at' => now(),
//        ]);
//    }
//
//    Auth::login($user);
//
//    return redirect('/dashboard');
//});

//Route::get('/logout', function () {
//    Auth::logout();
//    return redirect('/')->withHeaders([
//        'Cache-Control' => 'no-cache, no-store, must-revalidate',
//        'Pragma' => 'no-cache',
//        'Expires' => '0',
//    ]);
//});

/*
|--------------------------------------------------------------------------
|  PROTECTED ROUTES
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:web', 'verified'])->group(function () {
    // -- Scanning --
    Route::get('/scan', function () {
        return Inertia::render('Scan');
    });

// -- Metrics --
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');


    // -- Admin User Management --

    Route::middleware(['auth:sanctum', 'verified'])->group(function () {
        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    });
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('admin.users.destroy');

    Route::get('/history', [HistoryController::class, 'index'])->name('history.index');
    Route::get('/history/{id}', [HistoryController::class, 'show'])->name('history.show');
    Route::delete('/history/{id}', [HistoryController::class, 'destroy'])->name('history.destroy');

// -- Settings --
//    Route::get('/settings/scanner', function(){
//        return Inertia::render('settings/Scanner');
//    });
//
//    Route::get('/settings/export', function(){
//        return Inertia::render('settings/Export');
//    });

// -- Scan Preview --
    Route::post('/scan/preview', function (Request $request) {
        $url = $request->input('url');
        if (!filter_var($url, FILTER_VALIDATE_URL)) return response()->json(['error' => 'Invalid URL'], 400);

        try {
            // Fetch with short timeout to prevent hanging
            $html = Http::timeout(3)->get($url)->body();

            // Basic extraction (robust production apps might use a DOM parser)
            $title = preg_match('/<title>(.*?)<\/title>/i', $html, $m) ? $m[1] : null;
            $desc = preg_match('/<meta[^>]+name="description"[^>]+content="([^"]+)"/i', $html, $m) ? $m[1] : null;
            $image = preg_match('/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i', $html, $m) ? $m[1] : null;

            return response()->json(['title' => $title, 'description' => $desc, 'image' => $image]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Preview unavailable'], 422);
        }
    });

    Route::get('/scheduled', function(){
        return Inertia::render('scan/ScheduledScan');
    });

    Route::get('/domain-dashboard', function(){
        return Inertia::render('DomainDashboard');
    });

// -- Documentation --
//    Route::get('/docs/get-started', function(){
//        return Inertia::render('docs/GetStarted');
//    })->name('docs.get-started');
//
//    Route::get('/docs/introduction', function(){
//        return Inertia::render('docs/Introduction');
//    })->name('docs.introduction');
//
//    Route::get('/docs/changelog', function(){
//        return Inertia::render('docs/Changelog');
//    })->name('docs.changelog');
});



require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
