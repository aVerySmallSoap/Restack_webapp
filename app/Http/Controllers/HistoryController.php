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

    public function show(string $id)
    {
        $report = Report::with(['vulnerabilities', 'techDiscoveries', 'scans'])->findOrFail($id);

        return Inertia::render('history/Show', [
            'report' => $report
        ]);
    }

    public function destroy(string $id)
    {
        $apiUrl = config('api.API_BASE_URL');
        try {
            $response = Http::delete("{$apiUrl}/v1/history/{$id}");

            if ($response->successful()) {
                return to_route('history.index');
            }

            return back()->with('error', 'Failed to delete report from analysis engine.');

        } catch (\Exception $e) {
            return back()->with('error', 'Could not connect to analysis engine.');
        }
    }

    private function formatScanType($type)
    {
        $t = strtolower($type);
        if (str_contains($t, 'wapiti')) return 'Basic';
        if (str_contains($t, 'full') || str_contains($t, 'zap')) return 'Full';
        return ucfirst($type);
    }
}
