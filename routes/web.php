<?php
/** @noinspection PhpMultipleClassDeclarationsInspection */

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

// -- Login --
Route::get('/signin', function () {
    return Inertia::render('LoginForm');
});

Route::get('/reg', function () {
    return Inertia::render('RegisterForm');
});


// -- Scanning --
Route::get('/quickscan', function () {
    return Inertia::render('QuickScan');
});

Route::get('/fullscan', function () {
    return Inertia::render('FullScan');
});

// -- Metrics --
Route::get('/dashboard', function(){
    return Inertia::render('Dashboard');
});

Route::get('/history', function(){
    return Inertia::render('History');
});

Route::get('/history/{id}', function($id){
    $client = new Client([
        'base_uri' => 'localhost:25565'
    ]);
    $response = $client->get('/api/v1/wapiti/report/'.$id);
    $details = $client->get('/api/v1/report/'.$id);
    return Inertia::render('HistoryItemCards', ["report" => $response->getBody()->getContents(), "details" => $details->getBody()->getContents()]);
});

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
