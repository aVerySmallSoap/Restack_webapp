<?php

namespace App\Services\Api;

use App\Transformers\AnalyticsTransformer;

class AnalyticsService
{
    public function __construct(
        private RestackApiClient $api
    ) {}

    // -------------------------------------------------------------------------
    // Targets
    // -------------------------------------------------------------------------

    /**
     * Fetch all unique target domains the backend has scan data for.
     *
     * Response shape: { domains: string[], count: int }
     */
    public function getTargets(): array
    {
        $response = $this->api->get('/v1/analytics/targets');
        return $this->api->unwrap($response);
    }

    /**
     * Alias for getTargets() — matches the controller's expected method name.
     *
     * @param int|null $userId  Reserved for future server-side user scoping;
     *                          the current backend ignores it on this endpoint.
     */
    public function getTargetDomains(?int $userId = null): array
    {
        return $this->getTargets();
    }

    // -------------------------------------------------------------------------
    // General analytics  (/v1/analytics/general)
    // -------------------------------------------------------------------------

    /**
     * Fetch the full analytics payload used by the dashboard.
     *
     * Expected backend response shape:
     *   {
     *     kpi: {
     *       target, total_scans, total_vulns, total_vulns_all_time,
     *       days_analyzed, stability_score, last_scan
     *     },
     *     charts: {
     *       history:      [{ date, Total, Critical }],
     *       distribution: [{ name, value }],
     *       types:        [{ name, total, critical, high, medium, low }],
     *       trend:        [{ date, value, regression }]
     *     }
     *   }
     *
     * NOTE: get_general_analytics() exists in formal_analytics.py but is not
     *       yet registered as a FastAPI route. Add this to main.py:
     *
     *         @app.get("/v1/analytics/general")
     *         async def get_analytics(
     *             target:  str = Query(None),
     *             start:   str = Query(None),
     *             end:     str = Query(None),
     *             user_id: int = Query(None),
     *         ):
     *             from app.modules.tasks.analytics.formal.formal_analytics import get_general_analytics
     *             return {"status": "success", "data": get_general_analytics(target, start, end, user_id)}
     *
     * @param string|null $targetDomain  Domain substring, or null / "all" for every target
     * @param string|null $startDate     YYYY-MM-DD
     * @param string|null $endDate       YYYY-MM-DD
     * @param int|null    $userId        Scope to a specific user; null = all users (admin)
     */
    public function getGeneralAnalytics(
        ?string $targetDomain = null,
        ?string $startDate    = null,
        ?string $endDate      = null,
        ?int    $userId       = null,
    ): array {
        $query = array_filter([
            'target'  => $targetDomain,
            'start'   => $startDate,
            'end'     => $endDate,
            'user_id' => $userId,
        ], fn ($v) => $v !== null);

        $response = $this->api->get('/v1/analytics/general', $query);
        $raw      = $this->api->unwrap($response);

        return AnalyticsTransformer::generalAnalytics($raw);
    }

    // -------------------------------------------------------------------------
    // Vulnerability list  (/v1/analytics/vulnerabilities)
    // -------------------------------------------------------------------------

    /**
     * Fetch a filtered list of raw vulnerability records for the data table.
     *
     * @param string|null $target  Domain substring (e.g. "example.com")
     * @param string|null $start   YYYY-MM-DD
     * @param string|null $end     YYYY-MM-DD
     * @param int|null    $userId  Scope results to a specific user
     * @param int         $limit   Max rows (backend default: 1000)
     */
    public function getVulnerabilities(
        ?string $target = null,
        ?string $start  = null,
        ?string $end    = null,
        ?int    $userId = null,
        int     $limit  = 1000,
    ): array {
        $query = array_filter([
            'target'  => $target,
            'start'   => $start,
            'end'     => $end,
            'user_id' => $userId,
            'limit'   => $limit,
        ], fn ($v) => $v !== null);

        $response = $this->api->get('/v1/analytics/vulnerabilities', $query);
        $raw      = $this->api->unwrap($response);

        return AnalyticsTransformer::vulnerabilityCollection(
            is_array($raw) ? $raw : []
        );
    }

    // -------------------------------------------------------------------------
    // Time-series  (/v1/analytics/timeseries)
    // -------------------------------------------------------------------------

    /**
     * Fetch time-series vulnerability counts for a given target.
     *
     * Pass $start + $end for an explicit range, or just $days for a rolling
     * window — the backend gives the date range priority when both are present.
     *
     * @param string      $target  Full target URL (required by the backend)
     * @param int         $days    Rolling window in days (default: 90)
     * @param string|null $start   YYYY-MM-DD
     * @param string|null $end     YYYY-MM-DD
     */
    public function getTimeSeries(
        string  $target,
        int     $days  = 90,
        ?string $start = null,
        ?string $end   = null,
    ): array {
        $query = array_filter([
            'target' => $target,
            'days'   => $days,
            'start'  => $start,
            'end'    => $end,
        ], fn ($v) => $v !== null);

        $response = $this->api->get('/v1/analytics/timeseries', $query);
        $raw      = $this->api->unwrap($response);

        return AnalyticsTransformer::timeSeriesCollection(
            is_array($raw) ? $raw : []
        );
    }
}
