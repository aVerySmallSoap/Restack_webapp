export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational'

export interface Vulnerability {
    id: string
    type: string
    severity: Severity
    confidence: string
    scanner: string
    method: string
    endpoint: string
    description: string
    solution: string
    reference: string
    http_request?: string | null
    curl_command?: string | null
    wstg?: string[]
    exploit?: string | null
    scan_date?: string | null
}

export interface Technology {
    id: string
    name: string
    version: string[] | null
    source: string
    categories: string[] | null
}

export interface ScanReport {
    id: string
    total_vulnerabilities: number
    critical_count: number
    ai_summary_vulnerabilities?: string | null
    ai_summary_tech?: string | null
    scanner_agreement_rate?: number | null
    confidence_rate?: number | null
    high_confidence_vulns: number
    medium_confidence_vulns: number
    low_confidence_vulns: number
    matrix: {
        high_severity_high_confidence: number
        high_severity_low_confidence: number
        low_severity_high_confidence: number
        low_severity_low_confidence: number
    }
}

export interface DiscoveryContext {
    site_map: Record<string, any>
    endpoints: string[]
    out_of_scope: string[]
    ports: number[]
    domains?: Record<string, any> | null
    ssl_certs?: string | Record<string, any> | null
}

export interface ScanResult {
    id: string
    target: string
    scan_type: string
    scan_date: string
    is_automated: boolean
    report: ScanReport | null
    discovery_context: DiscoveryContext | null
    vulnerabilities: Vulnerability[]
    technologies: Technology[]
}

export interface ScanHistoryItem {
    id: string
    target: string
    scanType: string
    totalFindings: number
    criticalHigh: number
    date: string
    status: string
    isAutomated: boolean
}
