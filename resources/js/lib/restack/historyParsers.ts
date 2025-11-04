/*
 * Defines the structure for the Basic Scan (Wapiti) Drawer prop
 */
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
 * Defines the structure for the Full Scan (ZAP) Drawer prop
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
    scanner: 'ZAP';
    reference: string;
}

// Maps severity strings/levels to a standard set
function mapWapitiSeverity(level: number): BasicVulnerability['severity'] {
    const s = String(level);
    if (s === '3') return 'High';
    if (s === '2') return 'Medium';
    if (s === '1') return 'Low';
    return 'Informational';
}

function mapZapSeverity(level: string): FullVulnerability['severity'] {
    const s = String(level).toLowerCase();
    if (s === 'error' || s === 'high') return 'High'; // ZAP uses 'error' for High
    if (s === 'warning' || s === 'medium') return 'Medium'; // ZAP uses 'warning'
    if (s === 'low') return 'Low';
    if (s === 'critical') return 'Critical';
    return 'Informational'; // ZAP uses 'note'
}

/*
 * Parses a Wapiti report into a list of BasicVulnerability objects
 */
export function parseWapitiReport(report: any): BasicVulnerability[] {
    const results: BasicVulnerability[] = [];
    const classifications = report.classifications || {};
    const vulnerabilities = report.vulnerabilities || {};

    // Iterate over each vulnerability category found in the report
    for (const category in vulnerabilities) {
        const vulns = vulnerabilities[category];
        const classification = classifications[category] || {};

        // Create a unified object for each specific vulnerability instance
        vulns.forEach((vuln: any) => {
            results.push({
                category: category,
                level: vuln.level,
                method: vuln.method,
                path: vuln.path,
                info: vuln.info,
                module: vuln.module,
                description: classification.desc || 'No description provided.',
                solution: classification.sol || 'No solution provided.',
                references: classification.ref || {},
                wstg: classification.wstg || [],
                severity: mapWapitiSeverity(vuln.level),
            });
        });
    }
    return results;
}

/*
 * Parses a ZAP (SARIF-like) report into a list of FullVulnerability objects
 */
export function parseZapReport(report: any): FullVulnerability[] {
    const results: FullVulnerability[] = [];
    if (!report.data || !report.data.runs || report.data.runs.length === 0) {
        return [];
    }

    const run = report.data.runs[0];

    // Create a Map for quick rule lookup by ID
    const rules = new Map(run.tool.driver.rules.map((rule: any) => [rule.id, rule]));

    run.results.forEach((result: any, index: number) => {
        const rule = rules.get(result.ruleId);
        if (!rule) return; // Skip if rule definition not found

        // Use the first location found
        const location = result.locations?.[0]?.physicalLocation?.artifactLocation?.uri || 'N/A';
        // Use the first markdown link as the primary reference
        const reference = rule.help.markdown?.split('\n')[0] || rule.help.markdown || '';

        results.push({
            id: `${result.ruleId}-${index}`, // Create a unique ID
            type: rule.name,
            description: rule.fullDescription.text,
            solution: rule.help.text,
            severity: mapZapSeverity(result.level),
            confidence: result.properties.confidence || 'Unknown',
            method: result.properties.method || 'N/A',
            endpoint: location,
            exploit: result.properties.evidence || 'N/A',
            scanner: 'ZAP',
            reference: reference,
        });
    });

    return results;
}
