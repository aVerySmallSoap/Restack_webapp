<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('reports')) {
            Schema::table('reports', function (Blueprint $table) {
                // AI Summary fields
                $table->longText('ai_summary_vulnerabilities')->nullable()->after('critical_count');
                $table->longText('ai_summary_tech')->nullable()->after('ai_summary_vulnerabilities');

                // Priority Matrix quadrants
                $table->integer('high_severity_high_confidence')->default(0)->after('ai_summary_tech');
                $table->integer('high_severity_low_confidence')->default(0)->after('high_severity_high_confidence');
                $table->integer('low_severity_high_confidence')->default(0)->after('high_severity_low_confidence');
                $table->integer('low_severity_low_confidence')->default(0)->after('low_severity_high_confidence');

                // Summary Statistics
                $table->decimal('scanner_agreement_rate', 5, 2)->nullable()->after('low_severity_low_confidence');
                $table->decimal('confidence_rate', 5, 2)->nullable()->after('scanner_agreement_rate');
                $table->integer('high_confidence_vulns')->default(0)->after('confidence_rate');
                $table->integer('medium_confidence_vulns')->default(0)->after('high_confidence_vulns');
                $table->integer('low_confidence_vulns')->default(0)->after('medium_confidence_vulns');
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
