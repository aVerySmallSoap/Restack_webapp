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
    return 'Informational'; // ZAP uses 'note', Wapiti uses 0 or other
}

// Maps severity strings/levels to a standard set
function mapWapitiSeverity(level: number): BasicVulnerability['severity'] {
    // ... (existing function unchanged)
    const s = String(level);
    if (s === '3') return 'High';
    if (s === '2') return 'Medium';
    if (s === '1') return 'Low';
    return 'Informational';
}

/*
 * Parses a Wapiti report into a list of BasicVulnerability objects
 * (This parser is for the old, basic-scan-only format)
 */
export function parseWapitiReport(report: any): BasicVulnerability[] {
    // ... (existing function unchanged)
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
 * (This parser is for the old, ZAP-only format and is no longer used by Scan.vue)
 */
export function parseZapReport(report: any): FullVulnerability[] {
    // ... (existing function unchanged)
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
            severity: mapSeverity(result.level), // Use new mapper
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

    // --- Process Wapiti Results ---
    try {
        // Get definitions for Wapiti vulns (descriptions, solutions)
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
                confidence: 'N/A', // Wapiti doesn't provide confidence
                method: item.properties?.method || 'N/A',
                endpoint: item.locations?.[0]?.physicalLocation?.artifactLocation?.uri || 'N/A',
                exploit: item.properties?.parameter || item.properties?.info || 'N/A',
                scanner: 'Wapiti',
                reference: Object.values(classification.ref || {}).join('\n') || 'N/A',
            });
        });
    } catch (e) {
        console.error('Failed to parse Wapiti results:', e);
    }

    // --- Process ZAP Results ---
    try {
        // Create a Map for quick rule lookup by ID
        const zapRules = new Map(report.data?.fullReport?.[1]?.tool?.driver?.rules.map((rule: any) => [rule.id, rule]) || []);
        const zapResults = report.data?.union?.[1] || [];

        zapResults.forEach((item: any) => {
            const rule = zapRules.get(item.ruleId);
            if (!rule) return; // Skip if rule definition not found

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
