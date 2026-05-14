import type { Vulnerability, ScanResult, Technology, SiteMapData } from '@/lib/restack/restack.types'

// ── Severity helpers ──────────────────────────────────────────────────────────

function mapBasicSeverity(level: number | string | undefined): string {
    const s = String(level)
    if (s === '3' || s === 'High' || s === 'Critical') return 'High'
    if (s === '2' || s === 'Medium') return 'Medium'
    if (s === '1' || s === 'Low') return 'Low'
    return 'Informational'
}

function mapFullSeverity(level: string): string {
    switch (level?.toLowerCase()) {
        case 'error':
        case 'critical': return 'Critical'
        case 'warning':
        case 'high': return 'High'
        case 'medium': return 'Medium'
        case 'note':
        case 'low': return 'Low'
        case 'info':
        case 'informational':
        default: return 'Informational'
    }
}

function severityToNumber(sev: string) {
    switch (sev?.toLowerCase()) {
        case 'critical': return 4
        case 'high': return 3
        case 'medium': return 2
        case 'low': return 1
        default: return 0
    }
}

// ── Safe JSON parsing helpers ────────────────────────────────────────────────

function safeJsonParse<T = any>(val: any): T | null {
    if (val == null) return null
    if (typeof val === 'object') return val as T
    if (typeof val === 'string') {
        try { return JSON.parse(val) as T } catch { return null }
    }
    return null
}

function normalizeStringArray(val: any): string[] {
    if (!val) return []
    if (Array.isArray(val)) return val.filter(Boolean).map(String)
    return [String(val)]
}

function normalizeNumberArray(val: any): number[] {
    if (!val) return []
    if (Array.isArray(val)) return val.map((x) => Number(x)).filter((n) => Number.isFinite(n))
    const n = Number(val)
    return Number.isFinite(n) ? [n] : []
}

// ── Technology processing (legacy / optional) ────────────────────────────────

const EXCLUDED_TECH = ['Country', 'IP', 'HTML5', 'HTTPServer', 'Allow']

function processPlugins(rawPlugins: any): {
    technologies: Technology[]
    country: string
    ip: string
} {
    const technologies: Technology[] = []
    let country = 'Unknown'
    let ip = 'Unknown'

    let pluginData: any[] = []

    if (rawPlugins?.fingerprinted) {
        if (Array.isArray(rawPlugins.fingerprinted)) {
            pluginData = rawPlugins.fingerprinted.flat()
        } else if (rawPlugins.fingerprinted.data) {
            pluginData = Array.isArray(rawPlugins.fingerprinted.data)
                ? rawPlugins.fingerprinted.data.flat()
                : []
        }
    }

    pluginData.forEach((item: any) => {
        if (!item || typeof item !== 'object') return
        const key = Object.keys(item)[0]
        const value = item[key]

        if (key === 'Country') {
            country = Array.isArray(value) ? value.join(', ') : (value || 'Unknown')
        } else if (key === 'IP') {
            ip = Array.isArray(value) ? value.join(', ') : (value || 'Unknown')
        } else if (!EXCLUDED_TECH.includes(key)) {
            let version = '-'
            if (Array.isArray(value)) version = value.length > 0 ? value.join(', ') : '-'
            else if (typeof value === 'object' && value?.version) version = value.version
            else if (typeof value === 'string' && value) version = value

            technologies.push({ name: key, version, vulnerable: false, cve: 'N/A', fix: 'N/A' })
        }
    })

    return { technologies, country, ip }
}

// ── NEW: Tech extraction from API scan payload ───────────────────────────────

function extractTechnologiesFromApi(scanData: any): Technology[] {
    const tech = scanData?.technologies
    if (!Array.isArray(tech)) return []

    return tech.map((t: any) => {
        const name = t?.name ?? t?.blob?.name ?? 'Unknown'
        const versionRaw = t?.version ?? t?.blob?.version ?? ''
        const version =
            Array.isArray(versionRaw) ? (versionRaw.filter(Boolean).join(', ') || '-') :
                (typeof versionRaw === 'string' ? (versionRaw || '-') : '-')

        return { name: String(name), version, vulnerable: false, cve: 'N/A', fix: 'N/A' }
    })
}

// ── Discovery extraction (site map + ssl) ─────────────────────────────────────

/**
 * The API returns `discovery` as a JSON string (from Redis).
 * Inside that JSON, `ssl_certs` is ALSO typically a JSON string.
 */
function extractDiscovery(rawDiscovery: any): any | null {
    return safeJsonParse(rawDiscovery)
}

function extractSiteMapFromDiscovery(rawDiscovery: any): SiteMapData | null {
    const d = extractDiscovery(rawDiscovery)
    if (!d) return null

    const siteMap = (d.site_map ?? d.siteMap ?? {}) as Record<string, any>
    const endpoints = normalizeStringArray(d.endpoints)
    const outOfScope = normalizeStringArray(d.out_of_scope ?? d.outOfScope)
    const ports = normalizeNumberArray(d.ports)

    // If everything empty, treat as missing
    const hasAny =
        (siteMap && Object.keys(siteMap).length > 0) ||
        endpoints.length > 0 ||
        outOfScope.length > 0 ||
        ports.length > 0

    if (!hasAny) return null

    return { siteMap, endpoints, outOfScope, ports }
}

function extractSslFromDiscovery(rawDiscovery: any): string | Record<string, any> | null {
    const d = extractDiscovery(rawDiscovery)
    if (!d) return null

    // `ssl_certs` is often JSON string. Sometimes could already be object.
    const ssl = d.ssl_certs ?? d.sslData ?? d.ssl_data ?? null
    if (!ssl) return null
    return ssl
}

// ── Vulnerability normalization from API scan payload ─────────────────────────

function normalizeApiVulns(scanData: any, targetUrl: string): Vulnerability[] {
    const vulns = scanData?.vulnerabilities
    if (!Array.isArray(vulns) || vulns.length === 0) return []

    return vulns.map((v: any, idx: number): Vulnerability => {
        const scannerRaw = v?.scanner ?? 'Unknown'
        const scanner = String(scannerRaw).toUpperCase() === 'ZAP'
            ? 'ZAP'
            : String(scannerRaw).toLowerCase() === 'wapiti'
                ? 'Wapiti'
                : String(scannerRaw).toLowerCase() === 'nuclei'
                    ? 'Nuclei'
                    : String(scannerRaw)

        const severity = mapFullSeverity(String(v?.severity ?? v?.data?.properties?.severity ?? 'informational'))

        const endpoint =
            v?.endpoint ??
            v?.data?.location ??
            targetUrl

        const method =
            v?.method ??
            v?.data?.properties?.method ??
            'GET'

        const confidence =
            v?.confidence ??
            v?.data?.properties?.confidence ??
            v?.data?.properties?.analytics?.confidence ??
            'Unknown'

        const type =
            v?.vulnerability_type ??
            v?.data?.rule_id ??
            v?.type ??
            'Unknown'

        const description =
            v?.description ??
            v?.data?.message_text ??
            ''

        const solution =
            v?.remediation_effort ??
            v?.solution ??
            ''

        // references: your API often embeds them in message_text; keep blank for now
        const reference = ''

        const exploit =
            v?.data?.properties?.evidence ??
            v?.data?.properties?.detail?.response?.body ??
            ''

        return {
            id: v?.id ? String(v.id) : `api-${idx}`,
            type: String(type),
            severity,
            scanner,
            confidence: String(confidence),
            method: String(method),
            endpoint: String(endpoint),
            description: String(description),
            solution: String(solution),
            reference,
            exploit: exploit ? String(exploit) : '',
            http_request: v?.http_request ?? v?.data?.properties?.http_request ?? '',
            curl_command: v?.data?.properties?.curl_command ?? v?.data?.properties?.['curl-command'] ?? '',
            module: v?.data?.properties?.module ?? '',
            wstg: v?.data?.properties?.wstg ?? [],
        }
    })
}

// ── Public parsers ────────────────────────────────────────────────────────────

/**
 * NOTE:
 * Your current backend response shape is:
 *   { status: 'success', data: <scanData>, discovery: <json-string>, attack: <...> }
 *
 * So `data` passed into parseFullScan/parseBasicScan should be the *whole response*.
 */
export function parseBasicScan(response: any, targetUrl: string): ScanResult {
    const scanData = response?.data ?? response ?? {}

    // If you still have old SARIF-based quick scan somewhere, keep the old path.
    // But for your API rewrite shape, quick/basic is likely the same "Scan" model.
    const allVulns = normalizeApiVulns(scanData, targetUrl)

    // Technologies: prefer API `technologies`, fallback to plugins if present
    const technologies = extractTechnologiesFromApi(scanData)
    const fallback = processPlugins(scanData?.plugins ?? {})
    const finalTech = technologies.length ? technologies : fallback.technologies

    const siteMap = extractSiteMapFromDiscovery(response?.discovery)
    const sslData = extractSslFromDiscovery(response?.discovery)

    return buildScanResult(
        allVulns,
        finalTech,
        targetUrl,
        'Basic Scan',
        fallback.country,
        fallback.ip,
        null,
        null,
        siteMap,
        sslData,
    )
}

export function parseFullScan(response: any, targetUrl: string): ScanResult {
    const scanData = response?.data ?? response ?? {}
    const allVulns = normalizeApiVulns(scanData, targetUrl)

    const technologies = extractTechnologiesFromApi(scanData)
    const fallback = processPlugins(scanData?.plugins ?? {})
    const finalTech = technologies.length ? technologies : fallback.technologies

    const aiSummary =
        scanData?.report
            ? {
                summary: {
                    vulnerabilities: scanData.report.ai_summary_vulnerabilities ?? '',
                    tech: scanData.report.ai_summary_tech ?? '',
                },
            }
            : null

    // Optional: keep matrix null unless you expose it in API scanData
    const matrix = null

    const siteMap = extractSiteMapFromDiscovery(response?.discovery)
    const sslData = extractSslFromDiscovery(response?.discovery)

    const result = buildScanResult(
        allVulns,
        finalTech,
        targetUrl,
        'Full Scan',
        fallback.country,
        fallback.ip,
        aiSummary,
        matrix,
        siteMap,
        sslData,
    )

    // Summary stats from report fields if present
    if (scanData?.report) {
        result.summaryStats = {
            scannerAgreementRate: scanData.report.scanner_agreement_rate != null ? String(scanData.report.scanner_agreement_rate) : null,
            confidenceRate: scanData.report.confidence_rate != null ? String(scanData.report.confidence_rate) : null,
            highConfidenceVulns: Number(scanData.report.high_confidence_vulns ?? 0),
            mediumConfidenceVulns: Number(scanData.report.medium_confidence_vulns ?? 0),
            lowConfidenceVulns: Number(scanData.report.low_confidence_vulns ?? 0),
        }
    }

    return result
}

// ── Build final result ────────────────────────────────────────────────────────

function buildScanResult(
    vulns: Vulnerability[],
    technologies: Technology[],
    target: string,
    type: string,
    country: string = 'Unknown',
    ip: string = 'Unknown',
    aiSummary: any = null,
    matrix: any = null,
    siteMap: SiteMapData | null = null,
    sslData: string | Record<string, any> | null = null,
): ScanResult {
    vulns.sort((a, b) => severityToNumber(b.severity) - severityToNumber(a.severity))

    const criticalHighVulns = vulns.filter(v =>
        ['Critical', 'High', 'Medium'].includes(v.severity),
    ).length

    const priorities = vulns.slice(0, 5)

    const scanners = new Set(vulns.map(v => v.scanner))
    if (type === 'Full Scan') {
        scanners.add('Nuclei')
        scanners.add('ZAP')
        scanners.add('Wapiti')
    } else if (type === 'Basic Scan') {
        scanners.add('Wapiti')
    }
    const tools = Array.from(scanners).filter(Boolean)

    return {
        target: target || 'Unknown',
        scanType: type || 'Scan',
        tools,
        date: new Date().toISOString(),
        totalVulns: vulns.length,
        criticalHighVulns,
        priorities,
        vulnerabilities: vulns,
        technologies,
        country: country || 'Unknown',
        ip: ip || 'Unknown',
        aiSummary,
        matrix,
        siteMap,
        sslData,
    }
}
