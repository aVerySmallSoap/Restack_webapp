import type { Vulnerability, ScanResult, Technology } from '@/lib/restack/restack.types'

// --- Helpers ---

// Robust mapping that handles both numbers and strings to match History logic
function mapBasicSeverity(level: number | string | undefined): string {
    const s = String(level);
    if (s === '3' || s === 'High' || s === 'Critical') return 'High';
    if (s === '2' || s === 'Medium') return 'Medium';
    if (s === '1' || s === 'Low') return 'Low';
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

    let pluginData: any[] = [];

    if (rawPlugins?.fingerprinted) {
        if (Array.isArray(rawPlugins.fingerprinted)) {
            pluginData = rawPlugins.fingerprinted.flat();
        } else if (rawPlugins.fingerprinted.data) {
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
            if (Array.isArray(value)) version = value.length > 0 ? value.join(', ') : '-';
            else if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) version = '-';
            else if (typeof value === 'object' && value?.version) version = value.version;
            else if (typeof value === 'string') version = value;

            technologies.push({ name: key, version, vulnerable: false, cve: 'N/A', fix: 'N/A' });
        }
    });

    return { technologies, country, ip };
}

// --- Parsers ---

export function parseBasicScan(data: any, targetUrl: string): ScanResult {
    const allVulns: Vulnerability[] = [];
    const runs = data.data?.runs || [];

    if (runs.length === 0) {
        return buildScanResult([], [], targetUrl, 'Basic Scan', 'Unknown', 'Unknown');
    }

    const run = runs[0];
    const rules = run.tool?.driver?.rules || [];
    const results = run.results || [];
    const rulesMap = new Map();

    rules.forEach((rule: any) => rulesMap.set(rule.id, rule));

    results.forEach((result: any, index: number) => {
        const ruleId = result.ruleId;
        const rule = rulesMap.get(ruleId);

        // FIX: Prioritize raw numeric level from properties if available (Matches History logic)
        let severity = 'Informational';
        const rawLevel = result.properties?.level;

        if (rawLevel !== undefined) {
            severity = mapBasicSeverity(rawLevel);
        } else if (result.level) {
            // Fallback to SARIF level mapping
            switch (result.level.toLowerCase()) {
                case 'error': severity = 'High'; break;
                case 'warning': severity = 'Medium'; break;
                case 'note': severity = 'Low'; break;
                default: severity = 'Informational';
            }
        }

        let reference = '';
        if (rule?.help?.markdown) {
            reference = typeof rule.help.markdown === 'object'
                ? JSON.stringify(rule.help.markdown)
                : rule.help.markdown;
        }

        const endpoint = result.locations?.[0]?.physicalLocation?.artifactLocation?.uri || targetUrl;

        allVulns.push({
            id: `basic-${index}`,
            type: ruleId || 'Unknown',
            // Explicitly set category/name to help Drawer title resolution
            name: ruleId,
            category: ruleId,
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

    const { technologies, country, ip } = processPlugins(data.plugins || {});
    return buildScanResult(allVulns, technologies, targetUrl, 'Basic Scan', country, ip);
}

export function parseFullScan(data: any, targetUrl: string): ScanResult {
    const allVulns: Vulnerability[] = [];
    const union = data.data?.union || [];
    const rulesList = data.data?.rules || [];

    const getRule = (id: string) => {
        for (const ruleObj of rulesList) {
            if (ruleObj[id]) return ruleObj[id];
        }
        return null;
    };

    const flatFindings = union.flat();

    flatFindings.forEach((finding: any, idx: number) => {
        const ruleId = finding.ruleId;
        const rule = getRule(ruleId);

        const effectiveRule = rule || {
            name: ruleId,
            fullDescription: { text: finding.message?.text || '' },
            help: { text: '', markdown: '' }
        };

        const ruleName = effectiveRule.name || ruleId;

        let severity = 'Informational';
        if (finding.level) severity = mapFullSeverity(finding.level);
        else if (finding.properties?.severity) severity = mapFullSeverity(finding.properties.severity);
        else if (finding.properties?.analytics?.severity) severity = mapFullSeverity(finding.properties.analytics.severity);

        let reference = '';
        if (effectiveRule.help?.markdown) {
            reference = typeof effectiveRule.help.markdown === 'string'
                ? effectiveRule.help.markdown
                : Object.entries(effectiveRule.help.markdown).map(([k, v]) => `${k}: ${v}`).join('\n');
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

    const { technologies, country, ip } = processPlugins(data.plugins || {});

    const result = buildScanResult(allVulns, technologies, targetUrl, 'Full Scan', country, ip);

    if (data.summary?.stats) {
        result.summaryStats = {
            scannerAgreementRate: data.summary?.stats?.scanner_agreement_rate || null,
            confidenceRate: data.summary?.stats?.confidence_rate || null,
            highConfidenceVulns: data.summary.stats.high_confidence_vulns || 0,
            mediumConfidenceVulns: data.summary.stats.medium_confidence_vulns || 0,
            lowConfidenceVulns: data.summary.stats.low_confidence_vulns || 0
        };
    }

    return result;
}

function buildScanResult(
    vulns: Vulnerability[],
    technologies: Technology[],
    target: string,
    type: string,
    country: string = 'Unknown',
    ip: string = 'Unknown'
): ScanResult {
    vulns.sort((a, b) => mapSeverityToNumber(b.severity) - mapSeverityToNumber(a.severity));

    const criticalHighVulns = vulns.filter(v =>
        ['Critical', 'High', 'Medium'].includes(v.severity)
    ).length;

    const priorities = vulns.slice(0, 5);
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
