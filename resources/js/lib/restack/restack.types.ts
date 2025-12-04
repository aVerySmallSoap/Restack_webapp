export interface Vulnerability {
    id: string;
    type: string;
    severity: string;
    scanner: string;
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
        assessment: string;
        keyFindings: string[];
        recommendations: string[];
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
    scanner: 'ZAP' | 'Wapiti' | 'WhatWeb' | 'Unknown';
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
}

export interface ScheduledScan {
    id: string
    url: string
    codename: string
    jobType: string
    configuration: Record<string, number | string>
}
