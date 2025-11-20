<?php
/** @noinspection PhpMultipleClassDeclarationsInspection */

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HistoryController;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use function Termwind\render;

//Route::get('/', function () {
//    $client = new Client([
//        'base_uri' => '192.168.100.99:5000'
//    ]);
//    $response = $client->get('/v1/wapiti/report');
//    return Inertia::render('test', ["vulnerabilities" => $response->getBody()->getContents(), "sidebar" => 1]);
////    return Inertia::render('Welcome');
//})->name('home');

Route::get('/test', function () {
    return Inertia::render('quickiescan');
})->name('home');

// -- Login --
Route::get('/signin', function () {
    return Inertia::render('LoginForm');
});

Route::get('/reg', function () {
    return Inertia::render('RegisterForm');
});


// -- Scanning --
Route::get('/scan', function () {
    return Inertia::render('Scan');
});

Route::get('/fullscan', function () {
    return Inertia::render('FullScan');
});

// -- Metrics --
Route::get('/dashboard', function(){
    return Inertia::render('Dashboard');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

Route::get('/history', [HistoryController::class, 'index'])->name('history.index');
Route::get('/history/{id}', [HistoryController::class, 'show'])->name('history.show');
Route::delete('/history/{id}', [HistoryController::class, 'destroy'])->name('history.destroy');

// -- Settings --
Route::get('/settings/scanner', function(){
    return Inertia::render('settings/Scanner');
});

Route::get('/settings/export', function(){
    return Inertia::render('settings/Export');
});

// -- Documentation --
Route::get('/docs/get-started', function(){
    return Inertia::render('docs/GetStarted');
});
Route::get('/docs/introduction', function(){
    return Inertia::render('docs/Introduction');
});
Route::get('/docs/changelog', function(){
    return Inertia::render('docs/Changelog');
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
