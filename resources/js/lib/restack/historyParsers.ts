/*
 * Defines the structure for the Basic Scan (Wapiti) Drawer prop
 */
import {FullVulnerability, BasicVulnerability} from '@/lib/restack/restack.types'

// Maps severity strings/levels from various scanners to a standard set
function mapSeverity(level: string | number): FullVulnerability['severity'] {
    const s = String(level).toLowerCase();
    if (s === 'critical') return 'Critical';
    if (s === 'error' || s === 'high' || s === '3') return 'High';
    if (s === 'warning' || s === 'medium' || s === '2') return 'Medium';
    if (s === 'low' || s === '1') return 'Low';
    return 'Informational';
}

// Maps severity strings/levels to a standard set
function mapWapitiSeverity(level: number): BasicVulnerability['severity'] {
    const s = String(level);
    if (s === '3') return 'High';
    if (s === '2') return 'Medium';
    if (s === '1') return 'Low';
    return 'Informational';
}

/*
 * Parses a Wapiti report into a list of BasicVulnerability objects
 */
export function parseWapitiReport(report: any): BasicVulnerability[] {
    const results: BasicVulnerability[] = [];
    const classifications = report.classifications || {};
    const vulnerabilities = report.vulnerabilities || {};

    for (const category in vulnerabilities) {
        const vulns = vulnerabilities[category];
        const classification = classifications[category] || {};

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
                // Ensure raw http_request is passed if available
                http_request: vuln.http_request,
                curl_command: vuln.curl_command
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
    const rules = new Map(run.tool.driver.rules.map((rule: any) => [rule.id, rule]));

    run.results.forEach((result: any, index: number) => {
        const rule = rules.get(result.ruleId);
        if (!rule) return;

        const location = result.locations?.[0]?.physicalLocation?.artifactLocation?.uri || 'N/A';
        const reference = rule.help.markdown?.split('\n')[0] || rule.help.markdown || '';

        results.push({
            id: `${result.ruleId}-${index}`,
            type: rule.name,
            description: rule.fullDescription.text,
            solution: rule.help.text,
            severity: mapSeverity(result.level),
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

/**
 * Parses a new-format Full Scan report (combined ZAP, Wapiti, etc.)
 * into a unified list of FullVulnerability objects.
 */
export function parseFullScanReport(report: any): FullVulnerability[] {
    const results: FullVulnerability[] = [];
    if (!report.data) return [];

    let idCounter = 0;

    // --- Process Wapiti Results (Union [0]) ---
    try {
        const wapitiClassifications = new Map(Object.entries(report.data?.fullReport?.[0]?.classifications || {}));
        const wapitiResults = report.data?.union?.[0] || [];

        wapitiResults.forEach((item: any) => {
            const classification: any = wapitiClassifications.get(item.ruleId) || {};
            results.push({
                id: `wapiti-${idCounter++}`,
                type: item.ruleId,
                description: classification.desc || item.message?.text || 'No description.',
                solution: classification.sol || 'See scanner documentation for solution.',
                severity: mapSeverity(item.level),
                confidence: 'N/A',
                method: item.properties?.method || 'N/A',
                endpoint: item.locations?.[0]?.physicalLocation?.artifactLocation?.uri || 'N/A',
                exploit: item.properties?.parameter || item.properties?.info || 'N/A',
                scanner: 'Wapiti',
                reference: Object.values(classification.ref || {}).join('\n') || 'N/A',
                // Updated: Map Technical Details from properties
                http_request: item.properties?.http_request,
                curl_command: item.properties?.curl_command,
                module: item.properties?.module
            });
        });
    } catch (e) {
        console.error('Failed to parse Wapiti results:', e);
    }

    // --- Process ZAP Results (Union [1]) ---
    try {
        const zapRules = new Map(report.data?.fullReport?.[1]?.tool?.driver?.rules.map((rule: any) => [rule.id, rule]) || []);
        const zapResults = report.data?.union?.[1] || [];

        zapResults.forEach((item: any) => {
            const rule = zapRules.get(item.ruleId);
            if (!rule) return;

            const reference = rule.help.markdown?.split('\n')[0] || rule.help.markdown || '';

            results.push({
                id: `zap-${item.properties.zapId || idCounter++}`,
                type: rule.name,
                description: rule.fullDescription?.text || item.message?.text,
                solution: rule.help?.text || 'See scanner documentation for solution.',
                severity: mapSeverity(item.level),
                confidence: item.properties?.confidence || 'Unknown',
                method: item.properties?.method || 'N/A',
                endpoint: item.locations?.[0]?.physicalLocation?.artifactLocation?.uri || 'N/A',
                exploit: item.properties?.evidence || 'N/A',
                scanner: 'ZAP',
                reference: reference,
            });
        });
    } catch (e) {
        console.error('Failed to parse ZAP results:', e);
    }

    return results;
}
