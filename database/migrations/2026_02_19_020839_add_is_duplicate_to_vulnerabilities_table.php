<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vulnerabilities', function (Blueprint $table) {
            if (!Schema::hasColumn('vulnerabilities', 'is_duplicate')) {
                $table->boolean('is_duplicate')->default(false)->after('state');
            }
        });
    }

    public function down(): void
    {
        Schema::table('vulnerabilities', function (Blueprint $table) {
            if (Schema::hasColumn('vulnerabilities', 'is_duplicate')) {
                $table->dropColumn('is_duplicate');
            }
        });
    }
};