<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\User;

return new class extends Migration
{
    public function up(): void
    {
        // SCENARIO 1: Table does not exist (Create it fresh)
        if (!Schema::hasTable('scheduled_scans')) {
            Schema::create('scheduled_scans', function (Blueprint $table) {
                $table->uuid('id')->primary();
                // Create with user_id immediately
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('url');
                $table->string('codename')->unique();
                $table->string('job_type');
                $table->json('configuration');
                $table->timestamps();
            });
        }
        // SCENARIO 2: Table exists from Python (Update it)
        else {
            Schema::table('scheduled_scans', function (Blueprint $table) {
                // Add user_id if it's missing
                if (!Schema::hasColumn('scheduled_scans', 'user_id')) {
                    // Create as nullable first to prevent errors with existing data
                    $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
                }

                // Add timestamps if they are missing
                if (!Schema::hasColumn('scheduled_scans', 'created_at')) {
                    $table->timestamps();
                }
            });

            // Backfill: Assign any orphan schedules to the Admin
            $adminUser = User::where('is_admin', true)->first() ?? User::find(1);
            if ($adminUser) {
                DB::table('scheduled_scans')
                    ->whereNull('user_id')
                    ->update(['user_id' => $adminUser->id]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_scans');
    }
};
