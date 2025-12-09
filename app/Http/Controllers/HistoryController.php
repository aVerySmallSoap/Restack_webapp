<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HistoryController extends Controller
{
    public function index()
    {
        // Fetch reports, sort by newest, and format for the frontend
        $history = Report::with('scans')
            ->orderBy('scan_date', 'desc')
            ->get()
            ->map(function ($report) {
                // Get the first associated scan, if available
                $scan = $report->scans->first();

                return [
                    'id' => $report->id,
                    'target' => $scan->target_url ?? 'Unknown Target',
                    'scanType' => $this->formatScanType($report->scan_type),
                    'totalFindings' => $report->total_vulnerabilities,
                    'criticalHigh' => $report->critical_count,
                    'date' => $report->scan_date->toISOString(),
                    'duration' => $scan->scan_duration ?? 0, // Added duration
                    'status' => 'Completed',
                ];
            });

        return Inertia::render('History', [
            'history' => $history,
        ]);
    }

    // Show a single report details
    public function show(string $id)
    {
        // Eager load all relationships to avoid N+1 queries
        $report = Report::with(['vulnerabilities', 'techDiscoveries', 'scans'])->findOrFail($id);

        return Inertia::render('history/Show', [
            'report' => $report
        ]);
    }

    // Delete a report
    public function destroy(string $id)
    {
        Report::findOrFail($id)->delete();
        return to_route('history.index');
    }

    // Helper to make scan types look nice (e.g., "wapiti scan" -> "Basic")
    private function formatScanType($type)
    {
        $t = strtolower($type);
        if (str_contains($t, 'wapiti')) return 'Basic';
        if (str_contains($t, 'full') || str_contains($t, 'zap')) return 'Full';
        return ucfirst($type);
    }
}
