<?php

namespace App\Transformers;

class AnalyticsTransformer
{
    // -------------------------------------------------------------------------
    // General analytics  (/v1/analytics/general)
    // -------------------------------------------------------------------------

    /**
     * Normalise the full dashboard payload returned by get_general_analytics().
     *
     * Guarantees every key the frontend expects is present, so Vue/React
     * components can destructure without defensive null-checks everywhere.
     */

    private static function safeFloat(mixed $val, float $default = 0.0): float
    {
        $f = (float) ($val ?? $default);
        return is_finite($f) ? $f : $default;
    }

    private static function safeInt(mixed $val, int $default = 0): int
    {
        $f = (float) ($val ?? $default);
        return is_finite($f) ? (int) $f : $default;
    }

    public static function generalAnalytics(array $raw): array
    {
        return [
            'kpi'    => self::kpi($raw['kpi'] ?? []),
            'charts' => self::charts($raw['charts'] ?? []),
        ];
    }

    private static function kpi(array $raw): array
    {
        return [
            'target'               => $raw['target']               ?? 'All Targets',
            'total_scans'          => self::safeInt($raw['total_scans']),
            'total_vulns'          => self::safeInt($raw['total_vulns']),
            'total_vulns_all_time' => self::safeInt($raw['total_vulns_all_time']),
            'days_analyzed'        => self::safeInt($raw['days_analyzed'], 30),
            'stability_score'      => self::safeInt($raw['stability_score']),
            'last_scan'            => $raw['last_scan'] ?? null,
        ];
    }

    private static function charts(array $raw): array
    {
        return [
            'history' => array_map(
                fn ($p) => [
                    'date'     => $p['date']     ?? null,
                    'Total'    => self::safeInt($p['Total']),
                    'Critical' => self::safeInt($p['Critical']),
                ],
                $raw['history'] ?? []
            ),
            'distribution' => array_map(
                fn ($p) => [
                    'name'  => $p['name']  ?? 'unknown',
                    'value' => self::safeInt($p['value']),
                ],
                $raw['distribution'] ?? []
            ),
            'types' => array_map(
                fn ($p) => [
                    'name'     => $p['name']     ?? 'Unknown',
                    'total'    => self::safeInt($p['total']),
                    'critical' => self::safeInt($p['critical']),
                    'high'     => self::safeInt($p['high']),
                    'medium'   => self::safeInt($p['medium']),
                    'low'      => self::safeInt($p['low']),
                ],
                $raw['types'] ?? []
            ),
            'trend' => array_map(
                fn ($p) => [
                    'date'       => $p['date']       ?? null,
                    'value'      => self::safeFloat($p['value']),
                    'regression' => self::safeFloat($p['regression']),
                ],
                $raw['trend'] ?? []
            ),
        ];
    }

    // -------------------------------------------------------------------------
    // Vulnerability list  (/v1/analytics/vulnerabilities)
    // -------------------------------------------------------------------------

    /**
     * Canonical shape for a single vulnerability row in the analytics table.
     *
     * Backend fields: severity, type, endpoint, scanner, date, target
     */
    public static function vulnerability(array $raw): array
    {
        return [
            'severity' => self::normalizeSeverity($raw['severity'] ?? 'informational'),
            'type'     => $raw['type']     ?? 'Unknown',
            'endpoint' => $raw['endpoint'] ?? '',
            'scanner'  => ucfirst(strtolower($raw['scanner'] ?? 'unknown')),
            'date'     => $raw['date']     ?? null,
            'target'   => $raw['target']   ?? '',
        ];
    }

    public static function vulnerabilityCollection(array $items): array
    {
        return array_values(array_map([self::class, 'vulnerability'], $items));
    }

    // -------------------------------------------------------------------------
    // Time-series  (/v1/analytics/timeseries)
    // -------------------------------------------------------------------------

    /**
     * Canonical shape for a single time-series data point.
     *
     * Backend fields: date, count, critical_count, total_vulnerabilities, scan_type
     */
    public static function timeSeriesPoint(array $raw): array
    {
        return [
            'date'                  => $raw['date']       ?? null,
            'count'                 => (int) ($raw['count']                ?? 0),
            'critical_count'        => (int) ($raw['critical_count']       ?? 0),
            'total_vulnerabilities' => (int) ($raw['total_vulnerabilities'] ?? $raw['count'] ?? 0),
            'scan_type'             => $raw['scan_type']  ?? null,
        ];
    }

    public static function timeSeriesCollection(array $items): array
    {
        return array_values(array_map([self::class, 'timeSeriesPoint'], $items));
    }

    // -------------------------------------------------------------------------
    // Shared helpers
    // -------------------------------------------------------------------------

    /**
     * Mirrors VulnerabilityTransformer::normalizeSeverity() so the analytics
     * table uses the same severity labels as the scan detail view.
     *
     * Keeping it here avoids a cross-transformer dependency, but if
     * VulnerabilityTransformer::normalizeSeverity() is made public you can
     * delegate to it instead.
     */
    public static function normalizeSeverity(string $raw): string
    {
        return match (strtolower($raw)) {
            'error', 'critical'   => 'Critical',
            'high'                => 'High',
            'warning', 'medium'   => 'Medium',
            'note', 'low'         => 'Low',
            default               => 'Informational',
        };
    }
}
