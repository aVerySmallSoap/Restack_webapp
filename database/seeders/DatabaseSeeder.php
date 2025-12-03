<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create the default administrator
        User::factory()->create([
            'name' => 'Administrator',
            'email' => 'admin@restack.io',
            // If your User model casts password to 'hashed', use plain text here.
            // Otherwise, wrap in Hash::make('password').
            // Based on your User.php context, 'hashed' cast is present.
            'password' => 'password',
            'is_admin' => true,
        ]);
    }
}
