import type { ScanResult, Vulnerability, Technology, Severity, ScanReport, DiscoveryContext } from '@/lib/types/scan'

// ── Helpers ──────────────────────────────────────────────────────────────────

function ucfirst(s: string): string {
    if (!s) return ''
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function normalizeSeverity(raw: string | undefined): Severity {
    switch ((raw ?? '').toLowerCase()) {
        case 'critical':
        case 'error':
            return 'Critical'
        case 'high':
            return 'High'
        case 'warning':
        case 'medium':
            return 'Medium'
        case 'note':
        case 'low':
            return 'Low'
        default:
            return 'Informational'
    }
}

function normalizeHttp(raw: any): string | null {
    if (!raw) return null
    if (typeof raw === 'string') return raw
    if (typeof raw === 'object') {
        const method = (raw.method ?? 'GET').toUpperCase()
        const url = raw.url ?? ''
        const headers = (raw.headers ?? []).map((h: any) => `${h.name}: ${h.value}`).join('\n')
        const body = raw.postData?.text ?? ''
        return `${method} ${url}\n${headers}${body ? '\n\n' + body : ''}`
    }
    return null
}

function normalizeVulnerability(v: any, idx: number): Vulnerability {
    const blob = v.blob ?? {}
    return {
        id: v.id ? String(v.id) : `v-${idx}`,
        type: v.vulnerability_type ?? v.type ?? 'Unknown',
        severity: normalizeSeverity(v.severity),
        confidence: ucfirst(v.confidence ?? 'unknown'),
        scanner: ucfirst(v.scanner ?? 'unknown'),
        method: (v.method ?? 'GET').toUpperCase(),
        endpoint: v.endpoint ?? '',
        description: v.description ?? '',
        solution: v.remediation_effort ?? v.solution ?? '',
        reference: '',
        http_request: normalizeHttp(v.http_request),
        curl_command: blob.curl_command ?? blob['curl-command'] ?? null,
        wstg: blob.wstg ?? [],
        exploit: blob.evidence ?? null,
        scan_date: v.scan_date ?? null,
    }
}

function normalizeTechnology(t: any): Technology {
    const version = t.version
    return {
        id: t.id ? String(t.id) : '',
        name: t.name ?? '',
        version: Array.isArray(version)
            ? version.filter(Boolean).map(String)
            : (version ? [String(version)] : null),
        source: t.source ?? '',
        categories: Array.isArray(t.categories) ? t.categories.filter(Boolean) : null,
    }
}

function normalizeReport(r: any): ScanReport | null {
    if (!r) return null
    return {
        id: String(r.id ?? ''),
        total_vulnerabilities: Number(r.total_vulnerabilities ?? 0),
        critical_count: Number(r.critical_count ?? 0),
        ai_summary_vulnerabilities: r.ai_summary_vulnerabilities ?? null,
        ai_summary_tech: r.ai_summary_tech ?? null,
        scanner_agreement_rate: r.scanner_agreement_rate != null ? Number(r.scanner_agreement_rate) : null,
        confidence_rate: r.confidence_rate != null ? Number(r.confidence_rate) : null,
        high_confidence_vulns: Number(r.high_confidence_vulns ?? 0),
        medium_confidence_vulns: Number(r.medium_confidence_vulns ?? 0),
        low_confidence_vulns: Number(r.low_confidence_vulns ?? 0),
        matrix: {
            high_severity_high_confidence: Number(r.high_severity_high_confidence ?? 0),
            high_severity_low_confidence: Number(r.high_severity_low_confidence ?? 0),
            low_severity_high_confidence: Number(r.low_severity_high_confidence ?? 0),
            low_severity_low_confidence: Number(r.low_severity_low_confidence ?? 0),
        },
    }
}

function normalizeDiscovery(ctx: any): DiscoveryContext | null {
    if (!ctx) return null
    return {
        site_map: ctx.site_map ?? {},
        endpoints: Array.isArray(ctx.endpoints) ? ctx.endpoints : [],
        out_of_scope: Array.isArray(ctx.out_of_scope) ? ctx.out_of_scope : [],
        ports: Array.isArray(ctx.ports) ? ctx.ports.map(Number).filter(Number.isFinite) : [],
        domains: ctx.domains ?? null,
        ssl_certs: ctx.ssl_certs ?? null,
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Converts a raw Python API response ({ status, data }) into a canonical ScanResult.
 * Works for both /v1/scan/result/{id} and anything already unwrapped.
 */
export function parseScanResult(response: any): ScanResult {
    // Handle both { status, data } and bare data
    const data = response?.data ?? response ?? {}

    return {
        id: String(data.id ?? ''),
        target: data.target_url ?? data.target ?? '',
        scan_type: data.scan_type ?? 'FULL',
        scan_date: data.scan_date ?? '',
        is_automated: Boolean(data.is_automated),
        report: normalizeReport(data.report),
        discovery_context: normalizeDiscovery(data.discovery_context),
        vulnerabilities: (data.vulnerabilities ?? []).map(normalizeVulnerability),
        technologies: (data.technologies ?? []).map(normalizeTechnology),
    }
}

// Backward-compat aliases — old imports still work
export const parseFullScan = parseScanResult
export const parseBasicScan = parseScanResult
