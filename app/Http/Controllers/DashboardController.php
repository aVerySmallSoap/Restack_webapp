<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Vulnerability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Database\Eloquent\Builder;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->input('start', now()->subDays(30)->startOfDay());
        $endDate = $request->input('end', now()->endOfDay());
        $user = auth()->user();

        // 1. Define the Scope
        // This closure applies the user_id filter if the user is NOT an admin
        $scope = function (Builder $query) use ($user) {
            if (!$user->is_admin) {
                // Assuming Vulnerability -> belongsTo Report -> hasMany Scans -> belongsTo User
                // We filter items where the related Report has a Scan owned by the User
                $query->whereHas('scans', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            }
        };

        // Scope for Vulnerabilities (which don't have direct 'scans' relation usually, but belong to Report)
        $vulnScope = function (Builder $query) use ($user) {
            if (!$user->is_admin) {
                $query->whereHas('report.scans', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            }
        };

        // 2. Fetch Reports (With Scope)
        $reportsQuery = Report::query()
            ->whereBetween('scan_date', [$startDate, $endDate])
            ->tap($scope); // Apply filter

        // 3. Calculate Stats (With Scope)
        $stats = [
            'totalScans' => $reportsQuery->count(),
            'totalVulns' => $reportsQuery->sum('total_vulnerabilities'),
            'criticalVulns' => Vulnerability::whereBetween('scan_date', [$startDate, $endDate])
                ->whereIn('severity', ['Critical', 'High'])
                ->tap($vulnScope) // Apply filter
                ->count(),
            'highVulns' => Vulnerability::whereBetween('scan_date', [$startDate, $endDate])
                ->where('severity', 'Medium')
                ->tap($vulnScope) // Apply filter
                ->count(),
        ];

        // 4. Scan History Table (With Scope)
        $recentScans = Report::with('scans.user')
            ->whereBetween('scan_date', [$startDate, $endDate])
            ->tap($scope) // Apply filter
            ->orderBy('scan_date', 'desc')
            ->take(10)
            ->get()
            ->map(function ($report) {
                $scan = $report->scans->first();
                return [
                    'id' => $report->id,
                    'target' => $scan->target_url ?? 'Unknown Target',
                    'scanType' => ucfirst($report->scan_type),
                    'totalFindings' => $report->total_vulnerabilities,
                    'criticalHigh' => $report->critical_count,
                    'date' => $report->scan_date->toISOString(),
                    'status' => 'Completed',
                    'owner' => $scan?->user?->name // Optional: Show owner in table
                ];
            });

        // 5. Chart: Severity Distribution (With Scope)
        $severityStats = Vulnerability::select('severity', DB::raw('count(*) as count'))
            ->whereBetween('scan_date', [$startDate, $endDate])
            ->tap($vulnScope) // Apply filter
            ->groupBy('severity')
            ->get()
            ->map(function ($item) {
                return [
                    'severity' => ucfirst($item->severity),
                    'count' => $item->count
                ];
            });

        // 6. Chart: Vulnerabilities Over Time (With Scope)
        $timelineStats = Vulnerability::select(
            DB::raw("TO_CHAR(scan_date, 'YYYY-MM-DD') as raw_date"),
            DB::raw("SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical"),
            DB::raw("SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high"),
            DB::raw("SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as medium"),
            DB::raw("SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low")
        )
            ->whereBetween('scan_date', [$startDate, $endDate])
            ->tap($vulnScope) // Apply filter
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
            'filters' => ['start' => $startDate, 'end' => $endDate]
        ]);
    }
}
