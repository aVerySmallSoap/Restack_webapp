<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Only create if it doesn't exist
        if (!Schema::hasTable('active_scans')) {
            Schema::create('active_scans', function (Blueprint $table) {
                $table->string('session_id')->primary();
                $table->string('target');
                $table->string('step');
                $table->string('start_time');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('active_scans');
    }
};
