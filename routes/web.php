<?php

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $client = new Client([
        'base_uri' => '192.168.100.99:5000'
    ]);
    $response = $client->get('/v1/wapiti/report');
    return Inertia::render('test', ["vulnerabilities" => $response->getBody()->getContents()]);
//    return Inertia::render('Welcome');
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
