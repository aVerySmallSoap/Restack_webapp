<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scan', function (Blueprint $table) {
            // Add created_at and updated_at columns (nullable for existing records)
            if (!Schema::hasColumn('scan', 'created_at')) {
                $table->timestamps();
            }
        });
    }

    public function down(): void
    {
        Schema::table('scan', function (Blueprint $table) {
            $table->dropTimestamps();
        });
    }
};
