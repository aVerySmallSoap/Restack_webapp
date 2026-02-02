<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class HistoryController extends Controller
{
    public function index()
    {
        $query = Report::with('scans');

        // SCOPING: If not admin, only show reports linked to the user's scans
        if (!auth()->user()->is_admin) {
            $query->whereHas('scans', function ($q) {
                $q->where('user_id', auth()->id());
            });
        }

        $history = $query->orderBy('scan_date', 'desc')
            ->get()
            ->map(function ($report) {
                $scan = $report->scans->first();
                return [
                    'id' => $report->id,
                    'target' => $scan->target_url ?? 'Unknown Target',
                    'scanType' => $this->formatScanType($report->scan_type),
                    'totalFindings' => $report->total_vulnerabilities,
                    'criticalHigh' => $report->critical_count,
                    'date' => $report->scan_date->toISOString(),
                    'duration' => $scan->scan_duration ?? 0,
                    'status' => 'Completed',
                    'owner' => $scan->user->name ?? 'Unknown',
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

    // Delete a report via the Python API to ensure full cleanup
    public function destroy(string $id)
    {
        try {
            // Call the Python API to handle deletion (DB + Files)
            // Using the port 25565 as specified
            $response = Http::delete("http://127.0.0.1:25565/v1/history/{$id}");

            if ($response->successful()) {
                return to_route('history.index');
            }

            // Fallback: If API fails, notify the user rather than force deleting locally
            return back()->with('error', 'Failed to delete report from analysis engine.');

        } catch (\Exception $e) {
            return back()->with('error', 'Could not connect to analysis engine.');
        }
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
