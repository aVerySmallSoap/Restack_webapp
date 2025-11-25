<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Vulnerability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // 1. Handle Date Filtering
        // Default to last 30 days if no date provided
        $startDate = $request->input('start', now()->subDays(30)->startOfDay());
        $endDate = $request->input('end', now()->endOfDay());

        // 2. Fetch Reports in Range
        $reportsQuery = Report::query()
            ->whereBetween('scan_date', [$startDate, $endDate]);

        // 3. Calculate Stats
        $stats = [
            'totalScans' => $reportsQuery->count(),
            // Summing columns from the report table is faster than counting raw vulns
            'totalVulns' => $reportsQuery->sum('total_vulnerabilities'),
            'criticalVulns' => Vulnerability::whereBetween('scan_date', [$startDate, $endDate])
                ->whereIn('severity', ['Critical', 'High']) // Adjust based on your scanner strings
                ->count(),
            'highVulns' => Vulnerability::whereBetween('scan_date', [$startDate, $endDate])
                ->where('severity', 'Medium')
                ->count(),
        ];

        // 4. Scan History Table (Recent Scans)
        $recentScans = Report::with('scans') // Eager load 'scan' relationship to get target_url
        ->whereBetween('scan_date', [$startDate, $endDate])
            ->orderBy('scan_date', 'desc')
            ->take(10)
            ->get()
            ->map(function ($report) {
                // Get the target URL from the child 'scan' table
                $target = $report->scans->first()?->target_url ?? 'Unknown Target';

                return [
                    'id' => $report->id,
                    'target' => $target,
                    'scanType' => ucfirst($report->scan_type), // Capitalize 'wapiti scan' -> 'Wapiti scan'
                    'totalFindings' => $report->total_vulnerabilities,
                    'criticalHigh' => $report->critical_count,
                    'date' => $report->scan_date->toISOString(),
                    'status' => 'Completed', // Assuming presence in DB means complete
                ];
            });

        // 5. Chart: Severity Distribution (Donut)
        $severityStats = Vulnerability::select('severity', DB::raw('count(*) as count'))
            ->whereBetween('scan_date', [$startDate, $endDate])
            ->groupBy('severity')
            ->get()
            ->map(function ($item) {
                return [
                    'severity' => ucfirst($item->severity), // Ensure 'high' becomes 'High'
                    'count' => $item->count
                ];
            });

        // 6. Chart: Vulnerabilities Over Time (Line)
        // Grouping by Day for Postgres
        $timelineStats = Vulnerability::select(
            DB::raw("TO_CHAR(scan_date, 'YYYY-MM-DD') as raw_date"),
            DB::raw("SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical"),
            DB::raw("SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high"),
            DB::raw("SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as medium"),
            DB::raw("SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low")
        )
            ->whereBetween('scan_date', [$startDate, $endDate])
            ->groupBy(DB::raw("TO_CHAR(scan_date, 'YYYY-MM-DD')"))
            ->orderBy('raw_date', 'asc')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->raw_date,
                    'critical' => (int) $item->critical,
                    'high' => (int) $item->high,
                    'medium' => (int) $item->medium,
                    'low' => (int) $item->low,
                ];
            });

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentScans' => $recentScans,
            'vulnerabilityDistribution' => $severityStats,
            'vulnerabilityTimeline' => $timelineStats,
            'filters' => [
                'start' => $startDate,
                'end' => $endDate,
            ]
        ]);
    }
}
