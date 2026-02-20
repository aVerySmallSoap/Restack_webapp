<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('reports')) {
            Schema::create('reports', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->dateTime('scan_date');
                $table->string('scanner', 50);
                $table->string('scan_type', 50);
                $table->integer('total_vulnerabilities');
                $table->integer('critical_count');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('tech_discovery')) {
            Schema::create('tech_discovery', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('report_id');
                $table->string('scan_date', 50);
                $table->json('data');
                $table->timestamps();

                $table->foreign('report_id')->references('id')->on('reports')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('scan')) {
            Schema::create('scan', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('report_id');
                $table->dateTime('scan_date');
                $table->string('scanner', 50);
                $table->string('scan_type', 50);
                $table->float('scan_duration');
                $table->integer('crawl_depth');
                $table->string('target_url');
                $table->json('data');
                $table->timestamps();

                $table->foreign('report_id')->references('id')->on('reports')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('vulnerabilities')) {
            Schema::create('vulnerabilities', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('report_id');
                $table->dateTime('scan_date');
                $table->string('scanner', 50);
                $table->string('vulnerability_type', 100);
                $table->string('severity', 50);
                $table->string('confidence', 25);
                $table->json('http_request')->nullable();
                $table->text('description');
                $table->string('endpoint');
                $table->text('remediation_effort');
                $table->string('method');
                $table->string('state');
                $table->json('data');
                $table->timestamps();

                $table->foreign('report_id')->references('id')->on('reports')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('scheduled_scans')) {
            Schema::create('scheduled_scans', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('url');
                $table->string('codename')->unique();
                $table->string('job_type');
                $table->json('configuration');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_scans');
        Schema::dropIfExists('vulnerabilities');
        Schema::dropIfExists('scan');
        Schema::dropIfExists('tech_discovery');
        Schema::dropIfExists('reports');
    }
};
