<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Reports Table
        Schema::create('reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->dateTime('scan_date');
            $table->string('scanner', 50);
            $table->string('scan_type', 50);
            $table->string('path'); // Path to report file
            $table->integer('total_vulnerabilities');
            $table->integer('critical_count');
            // Timestamps are standard in Laravel, but your Python model doesn't strictly imply them.
            // Add them if you want Laravel to manage created_at/updated_at.
            $table->timestamps();
        });

        // 2. Tech Discovery Table
        Schema::create('tech_discovery', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('report_id');
            // Python defines this as String(50) despite the name suggesting datetime
            $table->string('scan_date', 50);
            $table->json('data');
            $table->timestamps();

            $table->foreign('report_id')->references('id')->on('reports')->onDelete('cascade');
        });

        // 3. Scan Table
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

        // 4. Vulnerabilities Table
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

        // 5. Scheduled Scans Table
        Schema::create('scheduled_scans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('url');
            $table->string('codename')->unique();
            $table->string('job_type');
            $table->json('configuration');
            $table->timestamps();
        });
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
