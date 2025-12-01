import type { Vulnerability, ScanResult, Technology } from '@/lib/restack/restack.types'

// --- Helpers ---

function mapBasicSeverity(level: number): string {
    if (level >= 3) return 'High';
    if (level === 2) return 'Medium';
    if (level === 1) return 'Low';
    return 'Informational';
}

function mapFullSeverity(level: string): string {
    switch (level?.toLowerCase()) {
        case 'error':
        case 'critical': return 'Critical';
        case 'warning':
        case 'high': return 'High';
        case 'medium': return 'Medium';
        case 'note':
        case 'low': return 'Low';
        default: return 'Informational';
    }
}

function mapSeverityToNumber(sev: string) {
    switch (sev?.toLowerCase()) {
        case 'critical': return 4;
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 0;
    }
}

// --- Technology Processing ---

function processPlugins(rawPlugins: any): { technologies: Technology[], country: string, ip: string } {
    const technologies: Technology[] = [];
    let country = 'Unknown';
    let ip = 'Unknown';

    // Handle both old format (fingerprinted.data) and new format (fingerprinted array or object)
    let pluginData: any[] = [];

    if (rawPlugins?.fingerprinted) {
        if (Array.isArray(rawPlugins.fingerprinted)) {
            // New format: plugins.fingerprinted is directly an array
            pluginData = rawPlugins.fingerprinted.flat();
        } else if (rawPlugins.fingerprinted.data) {
            // Old format: plugins.fingerprinted.data
            pluginData = Array.isArray(rawPlugins.fingerprinted.data)
                ? rawPlugins.fingerprinted.data.flat()
                : [];
        }
    }

    const excludedTech = ['Country', 'IP', 'HTML5', 'HTTPServer'];

    pluginData.forEach((item: any) => {
        if (!item || typeof item !== 'object') return;

        const key = Object.keys(item)[0];
        const value = item[key];

        if (key === 'Country') {
            country = Array.isArray(value) ? value.join(', ') : (value || 'Unknown');
        } else if (key === 'IP') {
            ip = Array.isArray(value) ? value.join(', ') : (value || 'Unknown');
        } else if (!excludedTech.includes(key)) {
            let version = '-';

            if (Array.isArray(value)) {
                version = value.length > 0 ? value.join(', ') : '-';
            } else if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
                // Empty object like {HTML5: {}}
                version = '-';
            } else if (typeof value === 'object' && value?.version) {
                version = value.version;
            } else if (typeof value === 'string') {
                version = value;
            }

            technologies.push({
                name: key,
                version,
                vulnerable: false,
                cve: 'N/A',
                fix: 'N/A'
            });
        }
    });

    return { technologies, country, ip };
}

// --- Parsers ---

/**
 * Parses the "Basic Scan" (Wapiti SARIF format)
 * Structure: { data: { runs: [{ tool: {...}, results: [...] }] }, plugins: {...} }
 */
export function parseBasicScan(data: any, targetUrl: string): ScanResult {
    const allVulns: Vulnerability[] = [];

    // Extract SARIF data
    const runs = data.data?.runs || [];
    if (runs.length === 0) {
        return buildScanResult([], [], targetUrl, 'Basic Scan', 'Unknown', 'Unknown');
    }

    const run = runs[0];
    const rules = run.tool?.driver?.rules || [];
    const results = run.results || [];

    // Create a map of rules by ID for quick lookup
    const rulesMap = new Map();
    rules.forEach((rule: any) => {
        rulesMap.set(rule.id, rule);
    });

    // Process each result
    results.forEach((result: any, index: number) => {
        const ruleId = result.ruleId;
        const rule = rulesMap.get(ruleId);

        // Determine severity from level
        let severity = 'Informational';
        if (result.level) {
            switch (result.level.toLowerCase()) {
                case 'error': severity = 'High'; break;
                case 'warning': severity = 'Medium'; break;
                case 'note': severity = 'Low'; break;
                default: severity = 'Informational';
            }
        }

        // Extract reference
        let reference = '';
        if (rule?.help?.markdown) {
            if (typeof rule.help.markdown === 'object') {
                reference = JSON.stringify(rule.help.markdown);
            } else {
                reference = rule.help.markdown;
            }
        }

        // Extract endpoint/URI
        const endpoint = result.locations?.[0]?.physicalLocation?.artifactLocation?.uri || targetUrl;

        allVulns.push({
            id: `basic-${index}`,
            type: ruleId || 'Unknown',
            severity,
            scanner: 'Wapiti',
            confidence: 'Medium',
            method: result.properties?.method || 'GET',
            endpoint: endpoint,
            description: rule?.fullDescription?.text || result.message?.text || '',
            solution: rule?.help?.text || '',
            reference,
            exploit: '',
            http_request: result.properties?.http_request || '',
            curl_command: result.properties?.curl_command || '',
            module: result.properties?.module || '',
            wstg: result.properties?.wstg || rule?.properties?.tags || []
        });
    });

    // Process technologies from plugins
    const { technologies, country, ip } = processPlugins(data.plugins || {});

    return buildScanResult(allVulns, technologies, targetUrl, 'Basic Scan', country, ip);
}

/**
 * Parses the "Full Scan" (Aggregated JSON format)
 * Structure: { data: { union: [...], rules: [...] }, summary: {...} }
 */
export function parseFullScan(data: any, targetUrl: string): ScanResult {
    const allVulns: Vulnerability[] = [];
    const union = data.data?.union || [];
    const rulesList = data.data?.rules || [];

    // Helper to find rule metadata from the list-of-objects structure
    const getRule = (id: string) => {
        for (const ruleObj of rulesList) {
            if (ruleObj[id]) return ruleObj[id];
        }
        return null;
    };

    // Flatten the union array
    const flatFindings = union.flat();

    flatFindings.forEach((finding: any, idx: number) => {
        const ruleId = finding.ruleId;
        const rule = getRule(ruleId);

        // Fallback if rule not found
        const effectiveRule = rule || {
            name: ruleId,
            fullDescription: { text: finding.message?.text || '' },
            help: { text: '', markdown: '' }
        };

        const ruleName = effectiveRule.name || ruleId;

        // Determine severity
        let severity = 'Informational';
        if (finding.level) {
            severity = mapFullSeverity(finding.level);
        } else if (finding.properties?.severity) {
            severity = mapFullSeverity(finding.properties.severity);
        } else if (finding.properties?.analytics?.severity) {
            severity = mapFullSeverity(finding.properties.analytics.severity);
        }

        // Extract reference
        let reference = '';
        if (effectiveRule.help?.markdown) {
            if (typeof effectiveRule.help.markdown === 'string') {
                reference = effectiveRule.help.markdown;
            } else if (typeof effectiveRule.help.markdown === 'object') {
                reference = Object.entries(effectiveRule.help.markdown)
                    .map(([key, val]) => `${key}: ${val}`)
                    .join('\n');
            }
        }

        allVulns.push({
            id: `full-${idx}`,
            type: ruleName,
            severity,
            scanner: finding.properties?.zapId ? 'ZAP' : 'Wapiti',
            confidence: finding.properties?.confidence || 'Unknown',
            method: finding.properties?.method || 'GET',
            endpoint: finding.locations?.[0]?.physicalLocation?.artifactLocation?.uri || targetUrl,
            description: effectiveRule.fullDescription?.text || finding.message?.text || '',
            solution: effectiveRule.help?.text || '',
            reference,
            exploit: finding.properties?.evidence || '',
            http_request: finding.properties?.http_request || '',
            curl_command: finding.properties?.curl_command || '',
            module: finding.properties?.module || '',
            wstg: effectiveRule.properties?.tags || []
        });
    });

    // Process technologies
    const { technologies, country, ip } = processPlugins(data.plugins || {});

    // Extract scanner agreement rate from summary if available
    const scannerAgreementRate = data.summary?.stats?.scanner_agreement_rate || null;
    const confidenceRate = data.summary?.stats?.confidence_rate || null;

    const result = buildScanResult(allVulns, technologies, targetUrl, 'Full Scan', country, ip);

    // Add summary stats
    if (data.summary?.stats) {
        result.summaryStats = {
            scannerAgreementRate,
            confidenceRate,
            highConfidenceVulns: data.summary.stats.high_confidence_vulns || 0,
            mediumConfidenceVulns: data.summary.stats.medium_confidence_vulns || 0,
            lowConfidenceVulns: data.summary.stats.low_confidence_vulns || 0
        };
    }

    return result;
}

// Common builder to calculate stats
function buildScanResult(
    vulns: Vulnerability[],
    technologies: Technology[],
    target: string,
    type: string,
    country: string = 'Unknown',
    ip: string = 'Unknown'
): ScanResult {
    // Sort by severity
    vulns.sort((a, b) => mapSeverityToNumber(b.severity) - mapSeverityToNumber(a.severity));

    const criticalHighVulns = vulns.filter(v =>
        ['Critical', 'High', 'Medium'].includes(v.severity)
    ).length;

    const priorities = vulns.slice(0, 5); // Top 5
    const scanners = [...new Set(vulns.map(v => v.scanner))];
    const tools = scanners.length > 0 ? scanners : ['Wapiti'];

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
        aiSummary: null
    };
}
