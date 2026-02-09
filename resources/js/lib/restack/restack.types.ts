export interface Vulnerability {
    id: string;
    type: string;
    severity: string;
    // Updated scanner to include Nuclei
    scanner: 'ZAP' | 'Wapiti' | 'WhatWeb' | 'Nuclei' | 'Unknown' | string;
    confidence: string;
    method: string;
    endpoint: string;
    description: string;
    solution: string;
    reference: string;
    exploit?: string;
    http_request?: string;
    curl_command?: string;
    module?: string;
    wstg?: string[];
}

export interface Technology {
    name: string;
    version: string;
    vulnerable: boolean;
    cve: string;
    fix: string;
}

export interface ScanResult {
    target: string;
    scanType: string;
    tools: string[];
    date: string;
    totalVulns: number;
    criticalHighVulns: number;
    priorities: Vulnerability[];
    vulnerabilities: Vulnerability[];
    technologies: Technology[];
    country: string;
    ip: string;
    aiSummary: {
        summary: {
            vulnerabilities: string;
            tech: string;
        }
    } | null;
    matrix?: {
        matrix: {
            high_severity_high_confidence: any[];
            high_severity_low_confidence: any[];
            low_severity_high_confidence: any[];
            low_severity_low_confidence: any[];
        };
        quadrant_counts: {
            high_severity_high_confidence: number;
            high_severity_low_confidence: number;
            low_severity_high_confidence: number;
            low_severity_low_confidence: number;
        };
    } | null;
    summaryStats?: {
        scannerAgreementRate: string | null;
        confidenceRate: string | null;
        highConfidenceVulns: number;
        mediumConfidenceVulns: number;
        lowConfidenceVulns: number;
    };
}

export interface BasicVulnerability {
    level: number;
    method: string;
    path: string;
    info: string;
    module: string;
    category: string;
    description: string;
    solution: string;
    references: Record<string, string>;
    wstg: string[];
    severity: 'High' | 'Medium' | 'Low' | 'Informational';
}

/*
 * Defines the structure for the Full Scan (ZAP, Wapiti, etc.) Drawer prop
 */
export interface FullVulnerability {
    id: string;
    type: string; // Category name
    description: string;
    solution: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
    confidence: string;
    method: string;
    endpoint: string;
    exploit: string; // Evidence
    scanner: 'ZAP' | 'Wapiti' | 'WhatWeb' | 'Nuclei' | 'Unknown';
    reference: string;
}

export interface ScanHistory {
    id: string
    target: string
    scanType: string
    totalFindings: number
    criticalHigh: number
    date: string
    status: string
    owner?: string
    duration?: number
    isAutomated?: boolean
}
export interface ScheduledScan {
    id: string
    user_id: string
    url: string
    codename: string
    job_type: 'interval' | 'cron'  // Changed from scheduler_type
    configuration: {  // Changed from scheduler_config
        // For interval type
        weeks?: number
        days?: number
        hours?: number
        minutes?: number
        seconds?: number
        // For cron type
        second?: string
        minute?: string
        hour?: string
        day?: string
        month?: string
        year?: string
    }
    created_at?: string
    updated_at?: string
    user?: {
        id: string
        name: string
        email: string
    }
}

export interface DescriptiveStatsResponse {
    meta: {
        mode: 'snapshot' | 'time-series';
        filter: string;
        report_count: number;
        total_findings: number;
    };
    findings_per_scan?: {
        mean: number;
        median: number;
        std_dev: number;
        q1: number;
        q3: number;
        iqr: number;
        min: number;
        max: number;
        coefficient_of_variation: number;
    };
    severity_distribution?: Record<string, number>;
    prevalence?: Record<string, number>;

    severity_type_distribution?: Array<{
        type: string;
        Critical: number;
        High: number;
        Medium: number;
        Low: number;
        Informational: number;
        total: number;
    }>;

    selected_target?: {
        total_vulns: number;
        rank_percentile: number;
    };
    message?: string;
}

export interface TimeSeriesPoint {
    date: string;
    count: number;
}

export interface RawVulnerability {
    severity: string;
    type: string;
    endpoint: string;
    scanner: string;
    date: string;
    target: string;
}
