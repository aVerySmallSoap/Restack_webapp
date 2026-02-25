<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scan', function (Blueprint $table) {
            if (!Schema::hasColumn('scan', 'is_automated')) {
                $table->boolean('is_automated')->default(false)->after('user_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('scan', function (Blueprint $table) {
            $table->dropColumn('is_automated');
        });
    }
};
