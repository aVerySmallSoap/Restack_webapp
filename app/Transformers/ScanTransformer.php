<?php

namespace App\Transformers;

class ScanTransformer
{
    public static function transform(array $raw): array
    {
        $report = $raw['report'] ?? null;
        $vulns  = VulnerabilityTransformer::collection($raw['vulnerabilities'] ?? []);
        $techs  = TechnologyTransformer::collection($raw['technologies'] ?? []);

        return [
            // Identity
            'id'          => (string) ($raw['id'] ?? ''),
            'session_id'  => (string) ($raw['id'] ?? ''),

            // Target info
            'target'      => $raw['target_url'] ?? '',
            'scan_type'   => $raw['scan_type'] ?? 'FULL',
            'scan_date'   => $raw['scan_date'] ?? null,
            'is_automated'=> $raw['is_automated'] ?? false,

            // Report meta
            'report' => $report ? [
                'id'                       => (string) $report['id'],
                'total_vulnerabilities'    => (int) $report['total_vulnerabilities'],
                'critical_count'           => (int) $report['critical_count'],
                'ai_summary_vulnerabilities' => $report['ai_summary_vulnerabilities'],
                'ai_summary_tech'          => $report['ai_summary_tech'],
                'scanner_agreement_rate'   => $report['scanner_agreement_rate'],
                'confidence_rate'          => $report['confidence_rate'],
                'high_confidence_vulns'    => (int) $report['high_confidence_vulns'],
                'medium_confidence_vulns'  => (int) $report['medium_confidence_vulns'],
                'low_confidence_vulns'     => (int) $report['low_confidence_vulns'],
                // Priority matrix
                'matrix' => [
                    'high_severity_high_confidence' => (int) $report['high_severity_high_confidence'],
                    'high_severity_low_confidence'  => (int) $report['high_severity_low_confidence'],
                    'low_severity_high_confidence'  => (int) $report['low_severity_high_confidence'],
                    'low_severity_low_confidence'   => (int) $report['low_severity_low_confidence'],
                ],
            ] : null,

            // Discovery
            'discovery_context' => self::transformDiscovery($raw['discovery_context'] ?? null),

            // Findings
            'vulnerabilities' => $vulns,
            'technologies'    => $techs,
        ];
    }

    private static function transformDiscovery(?array $raw): ?array
    {
        if (!$raw) return null;

        // ssl_certs is double-encoded: a JSON string inside a JSON string
        $ssl = $raw['ssl_certs'] ?? null;
        if (is_string($ssl)) {
            $decoded = json_decode($ssl, true);
            $ssl = $decoded ?? $ssl; // keep original string if decode fails
        }

        return [
            'site_map'     => $raw['site_map'] ?? [],
            'endpoints'    => $raw['endpoints'] ?? [],
            'out_of_scope' => $raw['out_of_scope'] ?? [],
            'ports'        => array_map('intval', $raw['ports'] ?? []),
            'domains'      => $raw['domains'] ?? null,
            'ssl_certs'    => $ssl,
        ];
    }


}
