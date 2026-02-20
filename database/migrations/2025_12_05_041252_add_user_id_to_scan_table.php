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
        if (!Schema::hasColumn('scan', 'user_id')) {
        
            Schema::table('scan', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id')->nullable()->after('id');

                // $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });

            $adminUser = User::where('is_admin', true)->first() ?? User::find(1);

            if ($adminUser) {
                DB::table('scan')
                    ->whereNull('user_id')
                    ->update(['user_id' => $adminUser->id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('scan', function (Blueprint $table) {
            $table->dropColumn('user_id');
        });
    }
};
