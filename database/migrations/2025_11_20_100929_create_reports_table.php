<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // FIX: Changed to Schema::hasTable() instead of !Schema::hasTable()
        if (Schema::hasTable('reports')) {  // ← FIXED!
            Schema::table('reports', function (Blueprint $table) {
                // Check each column before add ing to prevent duplicate column errors
                if (!Schema::hasColumn('reports', 'ai_summary_vulnerabilities')) {
                    $table->text('ai_summary_vulnerabilities')->nullable()->after('critical_count');
                }
                if (!Schema::hasColumn('reports', 'ai_summary_tech')) {
                    $table->text('ai_summary_tech')->nullable()->after('ai_summary_vulnerabilities');
                }

                // Priority Matrix quadrants
                if (!Schema::hasColumn('reports', 'high_severity_high_confidence')) {
                    $table->integer('high_severity_high_confidence')->default(0)->after('ai_summary_tech');
                }
                if (!Schema::hasColumn('reports', 'high_severity_low_confidence')) {
                    $table->integer('high_severity_low_confidence')->default(0)->after('high_severity_high_confidence');
                }
                if (!Schema::hasColumn('reports', 'low_severity_high_confidence')) {
                    $table->integer('low_severity_high_confidence')->default(0)->after('high_severity_low_confidence');
                }
                if (!Schema::hasColumn('reports', 'low_severity_low_confidence')) {
                    $table->integer('low_severity_low_confidence')->default(0)->after('low_severity_high_confidence');
                }

                // Summary Statistics
                if (!Schema::hasColumn('reports', 'scanner_agreement_rate')) {
                    $table->float('scanner_agreement_rate')->nullable()->after('low_severity_low_confidence');
                }
                if (!Schema::hasColumn('reports', 'confidence_rate')) {
                    $table->float('confidence_rate')->nullable()->after('scanner_agreement_rate');
                }
                if (!Schema::hasColumn('reports', 'high_confidence_vulns')) {
                    $table->integer('high_confidence_vulns')->default(0)->after('confidence_rate');
                }
                if (!Schema::hasColumn('reports', 'medium_confidence_vulns')) {
                    $table->integer('medium_confidence_vulns')->default(0)->after('high_confidence_vulns');
                }
                if (!Schema::hasColumn('reports', 'low_confidence_vulns')) {
                    $table->integer('low_confidence_vulns')->default(0)->after('medium_confidence_vulns');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn([
                'ai_summary_vulnerabilities',
                'ai_summary_tech',
                'high_severity_high_confidence',
                'high_severity_low_confidence',
                'low_severity_high_confidence',
                'low_severity_low_confidence',
                'scanner_agreement_rate',
                'confidence_rate',
                'high_confidence_vulns',
                'medium_confidence_vulns',
                'low_confidence_vulns',
            ]);
        });
    }
};
