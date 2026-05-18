<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Vulnerability;
use App\Models\Scan;
use App\Services\Api\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class DashboardController extends Controller
{
    private function sanitizeFloats(mixed $data): mixed
    {
        if (is_array($data)) {
            return array_map([$this, 'sanitizeFloats'], $data);
        }
        if (is_float($data) && !is_finite($data)) {
            return 0;
        }
        return $data;
    }

    public function index(Request $request)
    {
        $user      = auth()->user();
        $target    = $request->input('target');
        $startDate = $request->input('start', now()->subDays(30)->format('Y-m-d'));
        $endDate   = $request->input('end', now()->format('Y-m-d'));

        $analyticsService = app(AnalyticsService::class);

        $analytics = $analyticsService->getGeneralAnalytics(
            targetDomain: $target,
            startDate:    $startDate,
            endDate:      $endDate,
            userId:       $user->is_admin ? null : $user->id,
        );

        // API returns { domains: string[], count: int } — unwrap to a flat array
        $domainsRaw = $analyticsService->getTargetDomains(
            userId: $user->is_admin ? null : $user->id
        );
        $domains = $domainsRaw['domains'] ?? (array_is_list($domainsRaw ?? []) ? $domainsRaw : []);

        return Inertia::render('Dashboard', $this->sanitizeFloats([
            // Keys must match what Dashboard.vue destructures from props.stats
            // The new backend already returns snake_case that matches analytics['kpi']
            'stats'                     => $analytics['kpi'],

            // New API doesn't expose a recent-scans list yet; pass an empty array
            // so the Vue prop is always defined. The KPI last_scan comes from stats.
            'recentScans'               => [],

            'vulnerabilityTimeline'     => $analytics['charts']['history'],
            'vulnerabilityDistribution' => $analytics['charts']['distribution'],
            'topVulnerabilityTypes'     => $analytics['charts']['types'],
            'trendAnalysis'             => $analytics['charts']['trend'],
            'availableDomains'          => $domains,

            // Vue DateRangePicker + watchers expect keys 'start', 'end', 'target'
            // compact('startDate','endDate','target') would produce the WRONG keys
            'filters'                   => [
                'start'  => $startDate,
                'end'    => $endDate,
                'target' => $target,
            ],
        ]));
    }
}
