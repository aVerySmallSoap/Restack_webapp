<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add missing columns to reports
        Schema::table('reports', function (Blueprint $table) {
            if (!Schema::hasColumn('reports', 'ai_summary_vulnerabilities')) {
                $table->text('ai_summary_vulnerabilities')->nullable();
            }
            if (!Schema::hasColumn('reports', 'ai_summary_tech')) {
                $table->text('ai_summary_tech')->nullable();
            }
            if (!Schema::hasColumn('reports', 'high_severity_high_confidence')) {
                $table->integer('high_severity_high_confidence')->default(0);
            }
            if (!Schema::hasColumn('reports', 'high_severity_low_confidence')) {
                $table->integer('high_severity_low_confidence')->default(0);
            }
            if (!Schema::hasColumn('reports', 'low_severity_high_confidence')) {
                $table->integer('low_severity_high_confidence')->default(0);
            }
            if (!Schema::hasColumn('reports', 'low_severity_low_confidence')) {
                $table->integer('low_severity_low_confidence')->default(0);
            }
            if (!Schema::hasColumn('reports', 'scanner_agreement_rate')) {
                $table->float('scanner_agreement_rate')->nullable();
            }
            if (!Schema::hasColumn('reports', 'confidence_rate')) {
                $table->float('confidence_rate')->nullable();
            }
            if (!Schema::hasColumn('reports', 'high_confidence_vulns')) {
                $table->integer('high_confidence_vulns')->default(0);
            }
            if (!Schema::hasColumn('reports', 'medium_confidence_vulns')) {
                $table->integer('medium_confidence_vulns')->default(0);
            }
            if (!Schema::hasColumn('reports', 'low_confidence_vulns')) {
                $table->integer('low_confidence_vulns')->default(0);
            }
        });

        // Add missing columns to scan
        Schema::table('scan', function (Blueprint $table) {
            if (!Schema::hasColumn('scan', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable();
            }
            if (!Schema::hasColumn('scan', 'is_automated')) {
                $table->boolean('is_automated')->default(false);
            }
        });

        // Add missing columns to vulnerabilities
        Schema::table('vulnerabilities', function (Blueprint $table) {
            if (!Schema::hasColumn('vulnerabilities', 'is_duplicate')) {
                $table->boolean('is_duplicate')->default(false);
            }
        });

        // Add missing columns to scheduled_scans
        Schema::table('scheduled_scans', function (Blueprint $table) {
            if (!Schema::hasColumn('scheduled_scans', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable();
            }
        });
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

        Schema::table('scan', function (Blueprint $table) {
            $table->dropColumn(['user_id', 'is_automated']);
        });

        Schema::table('vulnerabilities', function (Blueprint $table) {
            $table->dropColumn('is_duplicate');
        });

        Schema::table('scheduled_scans', function (Blueprint $table) {
            $table->dropColumn('user_id');
        });
    }
};
