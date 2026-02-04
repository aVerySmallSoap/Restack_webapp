<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Vulnerability;
use App\Models\Scan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // 1. INPUTS
        $startDate = $request->input('start', now()->subDays(30)->startOfDay());
        $endDate = $request->input('end', now()->endOfDay());
        $target = $request->input('target'); // <--- Capture the target
        $user = auth()->user();

        // 2. SCOPES & FILTERS

        // Filter: Restrict data to current User (Security)
        $userScope = function (Builder $query) use ($user) {
            if (!$user->is_admin) {
                $query->whereHas('scans', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            }
        };

        // Filter: Restrict data to specific Target (Logic Fix)
        $targetScope = function (Builder $query) use ($target) {
            if ($target && $target !== 'all') {
                $query->whereHas('scans', function ($q) use ($target) {
                    $q->where('target_url', $target);
                });
            }
        };

        // Combined Scope for Vulnerabilities (which link via Report -> Scans)
        $vulnScope = function (Builder $query) use ($user, $target) {
            $query->whereHas('report.scans', function ($q) use ($user, $target) {
                // Apply User Security
                if (!$user->is_admin) {
                    $q->where('user_id', $user->id);
                }
                // Apply Target Filter
                if ($target && $target !== 'all') {
                    $q->where('target_url', $target);
                }
            });
        };

        // 3. BASE QUERY (Reports)
        $reportsQuery = Report::query()
            ->whereBetween('scan_date', [$startDate, $endDate])
            ->tap($userScope)
            ->tap($targetScope); // <--- Apply Target Filter

        // 4. STATS CALCULATION
        $stats = [
            'totalScans' => $reportsQuery->count(),
            'totalVulns' => $reportsQuery->sum('total_vulnerabilities'),
            'criticalVulns' => Vulnerability::whereBetween('scan_date', [$startDate, $endDate])
                ->where('severity', 'Critical')->tap($vulnScope)->count(),
            'highVulns' => Vulnerability::whereBetween('scan_date', [$startDate, $endDate])
                ->where('severity', 'High')->tap($vulnScope)->count(),
            'stabilityScore' => 100 // Calculated later
        ];

        // 5. SCAN HISTORY TABLE
        $recentScans = Report::with('scans.user')
            ->whereBetween('scan_date', [$startDate, $endDate])
            ->tap($userScope)
            ->tap($targetScope) // <--- Apply Target Filter
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
                    'owner' => $scan?->user?->name
                ];
            });

        // 6. CHART: SEVERITY DISTRIBUTION
        $severityStats = Vulnerability::select('severity', DB::raw('count(*) as count'))
            ->whereBetween('scan_date', [$startDate, $endDate])
            ->tap($vulnScope) // <--- Apply Target Filter
            ->groupBy('severity')
            ->get()
            ->map(function ($item) {
                return ['name' => ucfirst($item->severity), 'value' => $item->count];
            });

        // 7. CHART: TOP 5 VULNERABILITY TYPES
        $topTypes = Vulnerability::select('vulnerability_type', 'severity', DB::raw('count(*) as count'))
            ->whereBetween('scan_date', [$startDate, $endDate])
            ->tap($vulnScope) // <--- Apply Target Filter
            ->groupBy('vulnerability_type', 'severity')
            ->orderByDesc('count')
            ->take(5)
            ->get()
            ->map(function ($item) {
                $color = match(strtolower($item->severity)) {
                    'critical' => '#ef4444',
                    'high' => '#f97316',
                    'medium' => '#eab308',
                    default => '#3b82f6',
                };
                return [
                    'name' => ucfirst(str_replace(['_', '-'], ' ', $item->vulnerability_type)),
                    'count' => $item->count,
                    'color' => $color
                ];
            });

        // 8. CHART: TIMELINE & TREND
        $rawTimeline = Vulnerability::select(
            DB::raw("TO_CHAR(scan_date, 'YYYY-MM-DD') as raw_date"),
            DB::raw("COUNT(*) as total"),
            DB::raw("SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical"),
            DB::raw("SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high"),
            DB::raw("SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as medium"),
            DB::raw("SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low")
        )
            ->whereBetween('scan_date', [$startDate, $endDate])
            ->tap($vulnScope) // <--- Apply Target Filter
            ->groupBy(DB::raw("TO_CHAR(scan_date, 'YYYY-MM-DD')"))
            ->orderBy('raw_date', 'asc')
            ->get();

        $timelineStats = $rawTimeline->map(function ($item) {
            return [
                'date' => $item->raw_date,
                'timestamp' => Carbon::parse($item->raw_date)->timestamp,
                'Total' => (int) $item->total,
                'Critical' => (int) $item->critical,
                'High' => (int) $item->high,
                'Medium' => (int) $item->medium,
                'Low' => (int) $item->low,
            ];
        });

        // 9. MATH: TREND & STABILITY
        $trendStats = [];
        $stabilityScore = 100;

        if ($rawTimeline->count() > 1) {
            $x = range(0, $rawTimeline->count() - 1);
            $y = $rawTimeline->pluck('total')->toArray();
            $n = count($x);
            $sumX = array_sum($x);
            $sumY = array_sum($y);
            $sumXY = 0; $sumXX = 0;
            for ($i = 0; $i < $n; $i++) {
                $sumXY += ($x[$i] * $y[$i]);
                $sumXX += ($x[$i] * $x[$i]);
            }
            $denominator = ($n * $sumXX) - ($sumX * $sumX);
            $slope = $denominator != 0 ? (($n * $sumXY) - ($sumX * $sumY)) / $denominator : 0;
            $intercept = ($sumY - ($slope * $sumX)) / $n;

            $trendStats = $rawTimeline->map(function ($item, $key) use ($slope, $intercept) {
                return [
                    'date' => $item->raw_date,
                    'value' => (int) $item->total,
                    'regression' => round(($slope * $key) + $intercept, 2)
                ];
            });

            $mean = array_sum($y) / $n;
            $variance = 0;
            foreach ($y as $val) $variance += pow($val - $mean, 2);
            $stdDev = sqrt($variance / $n);
            $cv = $mean > 0 ? ($stdDev / $mean) : 0;
            $stabilityScore = max(0, round(100 - ($cv * 100)));
        } elseif ($rawTimeline->count() === 1) {
            $trendStats = [[
                'date' => $rawTimeline[0]->raw_date,
                'value' => (int) $rawTimeline[0]->total,
                'regression' => (int) $rawTimeline[0]->total
            ]];
        }
        $stats['stabilityScore'] = $stabilityScore;

        // 10. AVAILABLE DOMAINS
        $availableDomains = Scan::query()
            ->when(!$user->is_admin, function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->distinct()
            ->pluck('target_url')
            ->toArray();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentScans' => $recentScans,
            'vulnerabilityDistribution' => $severityStats,
            'vulnerabilityTimeline' => $timelineStats,
            'topVulnerabilityTypes' => $topTypes,
            'trendAnalysis' => $trendStats,
            'availableDomains' => $availableDomains,
            'filters' => ['start' => $startDate, 'end' => $endDate, 'target' => $target]
        ]);
    }
}
