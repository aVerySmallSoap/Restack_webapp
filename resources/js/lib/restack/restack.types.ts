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


