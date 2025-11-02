<script setup lang="ts">
import { h, ref, computed } from 'vue'
import {
  useVueTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  FlexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/vue-table'
import { toast } from 'vue-sonner'
import Navigation from '@/components/custom/Navigation.vue'
// VulnerabilityDetail is no longer needed
import FullScanDetailDrawer from '@/components/custom/FullScanDetailDrawer.vue'
import BasicScanDetailDrawer from '@/components/custom/BasicScanDetailDrawer.vue' // Import new drawer
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue'
import DataTablePagination from '@/components/custom/DataTablePagination.vue'
import Spinner from '@/components/custom/Spinner.vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
// Resizable components are no longer needed
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import SeverityPieChart from '@/components/custom/Charts/SeverityPieChart.vue'
import ScannerBarChart from '@/components/custom/Charts/ScannerBarChart.vue'

// --- Imports for Static Full Scan Data ---
import zapScanResult from '@/data/zap_active-scan.json'
import wapitiScanResult from '@/data/wapiti_basic.json'

// ---------- MOCK DATA (BASIC) ----------
const mockBasicScanData = {
    "scan_time": 14.78,
    "plugins": [
        { "JQuery": { "version": ["1.12.4"] } },
        { "Nginx": { "string": ["1.18.0 (Ubuntu)"] } },
        { "HttpServer": { "string": ["Ubuntu"] } },
        { "Script": { "string": ["text/javascript"] } }
    ],
    "classifications": {
        "Backup file": { "desc": "It may be possible to find backup files...", "sol": "The webadmin must manually delete...", "ref": {}, "wstg": [] },
        "Weak credentials": { "desc": "The web application is using either default credentials...", "sol": "Do not ship or deploy with any default credentials...", "ref": {}, "wstg": [] },
        "CRLF Injection": { "desc": "The term CRLF refers to Carriage Return...", "sol": "Check the submitted parameters...", "ref": {}, "wstg": [] },
        "Content Security Policy Configuration": {
            "desc": "Content Security Policy (CSP) is an added layer of security...",
            "sol": "Configuring Content Security Policy involves adding the Content-Security-Policy HTTP header...",
            "ref": { "Mozilla: Content Security Policy (CSP)": "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP" },
            "wstg": ["WSTG-CONF-12"]
        },
        "Cross Site Request Forgery": { "desc": "Cross-Site Request Forgery (CSRF) is an attack...", "sol": "Check if your framework has built-in CSRF protection...", "ref": {}, "wstg": [] },
        "Potentially dangerous file": { "desc": "A file with potential vulnerabilities has been found...", "sol": "Make sure the script is up-to-date...", "ref": {}, "wstg": [] },
        "Command execution": { "desc": "This attack consists in executing system commands...", "sol": "Prefer working without user input...", "ref": {}, "wstg": [] },
        "Path Traversal": { "desc": "This attack is known as Path or Directory Traversal...", "sol": "Prefer working without user input...", "ref": {}, "wstg": [] },
        "Fingerprint web application framework": { "desc": "The version of a web application framework can be identified...", "sol": "This is only for informational purposes.", "ref": {}, "wstg": [] },
        "Fingerprint web server": { "desc": "The version of a web server can be identified...", "sol": "This is only for informational purposes.", "ref": {}, "wstg": [] },
        "Htaccess Bypass": { "desc": "Htaccess files are used to restrict access...", "sol": "Make sure every HTTP method is forbidden...", "ref": {}, "wstg": [] },
        "HTML Injection": { "desc": "HTML injection is a type of injection vulnerability...", "sol": "Avoid Raw HTML Rendering...", "ref": {}, "wstg": [] },
        "Clickjacking Protection": {
            "desc": "Clickjacking is a technique that tricks a user into clicking something different...",
            "sol": "Implement X-Frame-Options or Content Security Policy (CSP) frame-ancestors directive.",
            "ref": { "OWASP: Clickjacking": "https.owasp.org/..." },
            "wstg": ["OSHP-X-Frame-Options"]
        },
        "HTTP Strict Transport Security (HSTS)": { "desc": "HSTS is a web security policy mechanism...", "sol": "Implement the HTTP Strict Transport Security header...", "ref": {}, "wstg": [] },
        "MIME Type Confusion": {
            "desc": "X-Content-Type-Options header is not set. This can lead to MIME-sniffing attacks.",
            "sol": "Set the X-Content-Type-Options header to 'nosniff'.",
            "ref": {},
            "wstg": ["OSHP-X-Content-Type-Options"]
        },
        "HttpOnly Flag cookie": { "desc": "HttpOnly is an additional flag...", "sol": "While creation of the cookie...", "ref": {}, "wstg": [] },
        "Unencrypted Channels": { "desc": "Sensitive data must be protected...", "sol": "Use HTTPS for the whole web site...", "ref": {}, "wstg": [] },
        "LDAP Injection": { "desc": "LDAP Injection is an attack used to exploit...", "sol": "To protect against XPATH injection...", "ref": {}, "wstg": [] },
        "Log4Shell": { "desc": "Apache Log4j2 <=2.14.1 JNDI features...", "sol": "From log4j 2.15.0, this behavior...", "ref": {}, "wstg": [] },
        "Open Redirect": { "desc": "Unvalidated redirects and forwards are possible...", "sol": "Force all redirects to first go through a page...", "ref": {}, "wstg": [] },
        "Reflected Cross Site Scripting": { "desc": "Cross-site scripting (XSS) is a type...", "sol": "The best way to protect a web application...", "ref": {}, "wstg": [] },
        "Secure Flag cookie": { "desc": "The secure flag is an option...", "sol": "When generating the cookie...", "ref": {}, "wstg": [] },
        "Spring4Shell": { "desc": "A Spring MVC or Spring WebFlux application...", "sol": "Users of affected versions should apply...", "ref": {}, "wstg": [] },
        "SQL Injection": { "desc": "SQL injection vulnerabilities allow an attacker...", "sol": "To protect against SQL injection...", "ref": {}, "wstg": [] },
        "TLS/SSL misconfigurations": { "desc": "The TLS protocol aims primarily...", "sol": "To protect against SSL/TLS vulnerabilities...", "ref": {}, "wstg": [] },
        "Server Side Request Forgery": { "desc": "The target application may have functionality...", "sol": "Every URI received by the web application...", "ref": {}, "wstg": [] },
        "Stored HTML Injection": { "desc": "HTML injection is a type of injection vulnerability...", "sol": "Avoid Raw HTML Rendering...", "ref": {}, "wstg": [] },
        "Stored Cross Site Scripting": { "desc": "Cross-site scripting (XSS) is a type...", "sol": "The best way to protect a web application...", "ref": {}, "wstg": [] },
        "Subdomain takeover": { "desc": "A DNS CNAME record points to...", "sol": "Prevent dangling DNS entries...", "ref": {}, "wstg": [] },
        "Blind SQL Injection": { "desc": "Blind SQL injection is a technique...", "sol": "To protect against SQL injection...", "ref": {}, "wstg": [] },
        "Unrestricted File Upload": { "desc": "File upload vulnerabilities are when...", "sol": "Check the file extension...", "ref": {}, "wstg": [] },
        "Vulnerable software": { "desc": "The detected software in its installed version...", "sol": "Update the software to its latest version...", "ref": {}, "wstg": [] },
    },
    "vulnerabilities": {
        "Backup file": [],
        "Weak credentials": [],
        "CRLF Injection": [],
        "Content Security Policy Configuration": [
            { "method": "GET", "path": "/", "info": "CSP is not set", "level": 1, "parameter": "", "module": "csp" }
        ],
        "Cross Site Request Forgery": [],
        "Potentially dangerous file": [],
        "Command execution": [],
        "Path Traversal": [],
        "Fingerprint web application framework": [],
        "Fingerprint web server": [],
        "Htaccess Bypass": [],
        "HTML Injection": [],
        "Clickjacking Protection": [
            { "method": "GET", "path": "/", "info": "X-Frame-Options is not set", "level": 1, "parameter": "", "module": "http_headers" }
        ],
        "HTTP Strict Transport Security (HSTS)": [],
        "MIME Type Confusion": [
            { "method": "GET", "path": "/", "info": "X-Content-Type-Options is not set", "level": 1, "parameter": "", "module": "http_headers" }
        ],
        "HttpOnly Flag cookie": [],
        "Unencrypted Channels": [],
        "LDAP Injection": [],
        "Log4Shell": [],
        "Open Redirect": [],
        "Reflected Cross Site Scripting": [],
        "Secure Flag cookie": [],
        "Spring4Shell": [],
        "SQL Injection": [],
        "TLS/SSL misconfigurations": [],
        "Server Side Request Forgery": [],
        "Stored HTML Injection": [],
        "Stored Cross Site Scripting": [],
        "Subdomain takeover": [],
        "Blind SQL Injection": [],
        "Unrestricted File Upload": [],
        "Vulnerable software": []
    },
    "infos": {
        "target": "http://www.itsecgames.com/",
        "date": "Wed, 15 Oct 2025 18:14:03 +0000",
        "version": "Wapiti 3.2.4",
        "crawled_pages_nbr": 7
    }
}

// --- Types for Full Scan Data ---
interface FullVulnerability {
  id: string
  type: string
  severity: string
  scanner: string
  confidence: string
  method: string
  endpoint: string
  exploit: string
  description: string
  solution: string
  reference: string
}

interface RiskPriority {
  type: string
  risk: string
  endpoint: string
}

interface Technology {
    name: string
    version: string
    vulnerable: boolean
    cve: string
    fix: string
}

// --- Types for Basic Scan Data ---
interface BasicVulnerability {
    level: number
    method: string
    path: string
    info: string
    module: string
    category: string
    description: string
    solution: string
    references: Record<string, string>
    wstg: string[]
    severity: string // Added for chart consistency
}

interface BasicTechnology {
    pluginName: string
    [key: string]: any // for dynamic keys like 'version', 'string'
}

// ---------- State ----------
const url = ref('http://www.itsecgames.com/')
const scanning = ref(false)
const progress = ref(0)
const errorMsg = ref('')
const activeScanType = ref('basic')

// Full Scan Options
const useZap = ref(true)
const useSearchVuln = ref(true)

// ----- Separated Data States -----
const basicScanData = ref(null) // Holds results for Basic Scan
const fullScanData = ref(null) // Holds results for Full Scan

// ----- Drawer States -----
const basicDrawerOpen = ref(false)
const fullDrawerOpen = ref(false)
const selectedBasicVuln = ref<BasicVulnerability | null>(null)
const selectedFullVuln = ref<FullVulnerability | null>(null)


// ---------- Computed: Basic Scan ----------

// Helper for basic scan severity text
function getBasicSeverityText(level: number) {
    if (level >= 3) return 'High'
    if (level === 2) return 'Medium'
    return 'Informational' // Use "Informational" for the pie chart
}

const allBasicVulnerabilities = computed((): BasicVulnerability[] => {
    if (!basicScanData.value) return []
    return basicScanData.value.categories.flatMap((cat: any) =>
        cat.vulns.map((vuln: any) => ({
            ...vuln,
            category: cat.name,
            description: cat.desc,
            solution: cat.solution,
            references: cat.refs,
            wstg: cat.wstg,
            severity: getBasicSeverityText(vuln.level), // Add severity string
        }))
    ).sort((a: any, b: any) => b.level - a.level)
})

// Computed for Basic Scan Summary Card
const basicSummaryData = computed(() => {
  if (!basicScanData.value) return null
  const meta = basicScanData.value.scanMeta

  const highCount = allBasicVulnerabilities.value.filter(v => v.level === 3).length
  const mediumCount = allBasicVulnerabilities.value.filter(v => v.level === 2).length

  return {
    site: meta.target,
    tools: [meta.version.split(' ')[0] || 'Wapiti', 'WhatWeb'],
    duration: meta.scan_time,
    totalVulns: meta.totalVulns,
    criticalHighVulns: highCount + mediumCount,
    topRisk: allBasicVulnerabilities.value[0]?.category || 'N/A'
  }
})

// Computed for Basic Scan Risk Priorities
const basicRiskPriorities = computed((): RiskPriority[] => {
  if (!basicScanData.value) return []
  return allBasicVulnerabilities.value
    .filter(v => v.level >= 2) // High and Medium
    .slice(0, 5)
    .map(v => ({
      type: v.category,
      risk: v.severity,
      endpoint: v.path,
    }))
})

// Get all unique keys from the 'plugins' data for dynamic columns
const whatWebColumns = computed(() => {
    if (!basicScanData.value?.whatWebPlugins) return []
    const keys = new Set<string>()
    for (const plugin of basicScanData.value.whatWebPlugins) {
        const pluginObj = plugin[Object.keys(plugin)[0]]
        Object.keys(pluginObj).forEach(key => keys.add(key))
    }
    return Array.from(keys)
})

// Flatten the basic tech data for tanstack-table
const flattenedBasicTechData = computed((): BasicTechnology[] => {
    if (!basicScanData.value?.whatWebPlugins) return []

    return basicScanData.value.whatWebPlugins.map((plugin: any) => {
        const pluginName = Object.keys(plugin)[0]
        const details = plugin[pluginName]
        const flatData: BasicTechnology = { pluginName }

        whatWebColumns.value.forEach(key => {
            const value = details[key]
            flatData[key] = Array.isArray(value) ? value.join(', ') : value
        })
        return flatData
    })
})

// ---------- Helpers ----------
function resetState() {
    basicScanData.value = null
    fullScanData.value = null
    progress.value = 0
    errorMsg.value = ''
    selectedBasicVuln.value = null
    selectedFullVuln.value = null
    basicDrawerOpen.value = false // Reset new drawer
    fullDrawerOpen.value = false
}

// ----- Basic Scan: Show Detail in Drawer -----
function showBasicVulnDetail(vuln: BasicVulnerability) {
    selectedBasicVuln.value = vuln
    basicDrawerOpen.value = true // Open the basic drawer
}

// ----- Full Scan: Show Detail in Drawer -----
function showFullVulnDetail(vuln: FullVulnerability) {
    selectedFullVuln.value = vuln
    fullDrawerOpen.value = true // Open the full drawer
}

// Helper for severity badges
function getSeverityBadge(level: number | string) {
    if (typeof level === 'string') {
        switch (level?.toLowerCase()) {
            case 'critical': return 'destructive'
            case 'high': return 'destructive'
            case 'medium': return 'default'
            default: return 'secondary' // Catches 'Info'
        }
    }
    // Number (from basic scan)
    if (level >= 3) return 'destructive'
    if (level === 2) return 'default'
    return 'secondary'
}

// --- Helper Functions for Full Scan Parsing ---
function mapZapSeverity(risk?: string, level?: string): string {
  const r = risk?.toLowerCase() || ''
  const l = level?.toLowerCase() || ''
  if (l === 'error' || r === 'high' || r === 'critical') return 'Critical'
  if (l === 'warning' || r === 'medium') return 'High'
  if (r === 'low') return 'Medium'
  if (l === 'note' || r === 'informational') return 'Low'
  return 'Informational'
}

function extractZapReference(markdown?: string): string {
  if (!markdown) return 'N/A'
  const match = markdown.match(/\[.*?\]\((.*?)\)/)
  return match ? match[1] : 'N/A'
}

function mapWapitiSeverity(level: number): string {
  if (level >= 3) return 'Critical'
  if (level === 2) return 'High'
  if (level === 1) return 'Medium'
  return 'Low'
}

// --- Main Full Scan Parser ---
function parseFullScanResponse(targetUrl: string) {
    const allVulnerabilities: FullVulnerability[] = []

    // 1. Parse ZAP Scan
    const zapRun = zapScanResult?.data?.runs?.[0]
    const zapScannerName = zapRun?.tool.driver.name || 'ZAP'
    const zapRuleMap = new Map<string, any>()
    for (const rule of (zapRun?.tool.driver.rules || []))
        zapRuleMap.set(rule.id, rule)

    const zapResults = zapRun?.results || []
    const uniqueZapFindings = new Map<string, any>()
    for (const res of zapResults) {
        if (!res.locations || res.locations.length === 0) continue
        const key = `${res.ruleId}::${res.locations[0]?.physicalLocation?.artifactLocation?.uri}`
        if (!uniqueZapFindings.has(key))
            uniqueZapFindings.set(key, res)
    }

    uniqueZapFindings.forEach((res: any) => {
        const rule = zapRuleMap.get(res.ruleId)
        allVulnerabilities.push({
          id: `zap-${res.ruleId}-${res.locations?.[0]?.physicalLocation?.artifactLocation?.uri}`,
          type: rule?.name || 'Unknown Vulnerability',
          severity: mapZapSeverity(rule?.properties?.risk, res.level),
          scanner: zapScannerName,
          confidence: res.properties.confidence || 'Unknown',
          method: res.properties.method || 'N/A',
          endpoint: res.locations?.[0]?.physicalLocation?.artifactLocation?.uri || 'N/A',
          exploit: res.properties.evidence || 'N/A',
          description: res.message.text || rule?.fullDescription?.text || 'No description provided.',
          solution: rule?.help?.text || 'No solution provided.',
          reference: extractZapReference(rule?.help?.markdown),
        })
    })

    // 2. Parse Wapiti Scan
    const wapitiVulns = wapitiScanResult?.vulnerabilities || {}
    const wapitiClassifications = wapitiScanResult?.classifications || {}
    for (const vulnType in wapitiVulns) {
        const findings = wapitiVulns[vulnType as keyof typeof wapitiVulns]
        const classification = wapitiClassifications[vulnType as keyof typeof wapitiClassifications]
        for (const [index, finding] of findings.entries()) {
            allVulnerabilities.push({
                id: `wapiti-${vulnType}-${index}`,
                type: vulnType,
                severity: mapWapitiSeverity(finding.level),
                scanner: 'Wapiti',
                confidence: 'N/A',
                method: finding.method || 'N/A',
                endpoint: finding.path || 'N/A',
                exploit: finding.parameter || finding.info,
                description: classification?.desc || finding.info,
                solution: classification?.sol || 'No solution provided.',
                reference: classification?.ref ? Object.values(classification.ref)[0] as string : 'N/A',
            })
        }
    }

    // 3. Parse Technologies
    const technologies: Technology[] = []
    const processedTechs = new Map<string, string>()
    const allPlugins = [
        ...(wapitiScanResult.plugins || []),
        ...(zapScanResult.plugins || []).flat()
    ].filter(p => p && Object.keys(p).length > 0);

    for (const plugin of allPlugins) {
        const name = Object.keys(plugin)[0]
        if (processedTechs.has(name)) continue

        const details = plugin[name]
        const version = details.version?.join(', ') || details.string?.join(', ') || 'N/A'

        technologies.push({
            name,
            version,
            vulnerable: false,
            cve: 'N/A',
            fix: 'N/A'
        })
        processedTechs.set(name, version)
    }

    // 4. Generate Summary
    const criticalCount = allVulnerabilities.filter(v => v.severity === 'Critical' || v.severity === 'High').length
    const site = targetUrl || wapitiScanResult?.infos?.target || 'http://target.web'

    // 5. Generate Risk Priorities
    const risks: RiskPriority[] = allVulnerabilities
        .filter(v => v.severity === 'Critical' || v.severity === 'High')
        .sort((a, b) => {
            if (a.severity === 'Critical' && b.severity !== 'Critical') return -1
            if (a.severity !== 'Critical' && b.severity === 'Critical') return 1
            return 0
        })
        .slice(0, 5)
        .map(v => ({
            type: v.type,
            risk: v.severity,
            endpoint: v.endpoint,
        }))

    // 6. Return final structure
    return {
        site,
        tools: [zapScannerName, 'Wapiti'],
        duration: Math.round(zapScanResult?.scan_time || 0) + Math.round(wapitiScanResult?.scan_time || 0),
        totalVulns: allVulnerabilities.length,
        criticalVulns: criticalCount,
        risks,
        vulnerabilities: allVulnerabilities,
        technologies,
    }
}

// --- Basic Scan: Main Parser ---
function parseBasicApiResponse(data: any, targetUrl?: string) {
    if (!data || !data.infos) return
    const scanMeta = {
        target: targetUrl || data.infos.target || '',
        scan_time: Math.round(data.scan_time || 0),
        date: data.infos.date || '',
        version: data.infos.version || '',
        crawled_pages_nbr: data.infos.crawled_pages_nbr || 0,
        totalCategories: Object.keys(data.vulnerabilities).length,
        totalVulns: Object.values(data.vulnerabilities).reduce((sum: number, arr: any[]) => sum + arr.length, 0),
    }
    const categories = Object.keys(data.vulnerabilities).map((catName) => {
        const classification = data.classifications[catName] || {}
        const vulns = data.vulnerabilities[catName] || []
        return {
            name: catName,
            desc: classification.desc || 'No description available.',
            solution: classification.sol || 'No solution provided.',
            refs: classification.ref || {},
            wstg: classification.wstg || [],
            vulns: vulns,
        }
    })
    const whatWebPlugins = Array.isArray(data.plugins) ? data.plugins : []
    basicScanData.value = {
        scanMeta,
        categories,
        whatWebPlugins
    }
}

// ----- Mock Scan Progress Timer -----
let progressInterval: ReturnType<typeof setInterval> | null = null

function startMockProgress(totalDuration: number) {
    progress.value = 0
    if (progressInterval) clearInterval(progressInterval)
    const increment = 10
    const intervalTime = totalDuration * (increment / 100)
    progressInterval = setInterval(() => {
        progress.value += increment
        if (progress.value >= 100) {
            if (progressInterval) clearInterval(progressInterval)
        }
    }, intervalTime)
}

function stopMockProgress() {
    if (progressInterval) clearInterval(progressInterval)
    progress.value = 100
}

// ---------- API Calls ----------
function onBasicScan() {
    if (!url.value) return
    resetState()
    scanning.value = true
    errorMsg.value = ''
    const scanDuration = 1500
    startMockProgress(scanDuration)
    toast.info('Starting basic mock scan...')
    setTimeout(() => {
        parseBasicApiResponse(mockBasicScanData, url.value)
        scanning.value = false
        stopMockProgress()
        toast.success('Basic mock scan completed!')
    }, scanDuration)
}

function onFullScan() {
    if (!url.value) return
    resetState()
    scanning.value = true
    errorMsg.value = ''
    toast.info('Starting full mock scan...', {
        description: `ZAP: ${useZap.value}, SearchVuln: ${useSearchVuln.value}`
    })
    const scanDuration = 3000
    startMockProgress(scanDuration)
    setTimeout(() => {
        try {
            fullScanData.value = parseFullScanResponse(url.value)
            scanning.value = false
            stopMockProgress()
            toast.success('Full mock scan completed successfully!')
        }
        catch (err) {
            console.error('Failed to parse full scan data:', err)
            scanning.value = false
            stopMockProgress()
            errorMsg.value = 'Failed to parse scan data. Check console.'
            toast.error(errorMsg.value, { description: (err as Error).message })
        }
    }, scanDuration)
}

function onClear() {
    url.value = ''
    resetState()
    toast.info('Results have been cleared.')
}

function handleScanSubmit() {
    if (activeScanType.value === 'basic') {
        onBasicScan()
    } else {
        onFullScan()
    }
}

// ----------
// --- Basic Scan: Vulnerabilities Table Config ---
// ----------
const basicSorting = ref<SortingState>([{ id: 'level', desc: true }])
const basicGlobalFilter = ref('')
const basicVulnerabilityColumns: ColumnDef<BasicVulnerability>[] = [
  {
    accessorKey: 'category',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Category' }),
    cell: ({ row }) => h('div', { class: 'max-w-[200px] truncate' }, row.getValue('category')),
  },
  {
    accessorKey: 'level',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Level' }),
    cell: ({ row }) => {
      const level = row.getValue('level') as number
      return h(Badge, { variant: getSeverityBadge(level), class: 'w-16 justify-center' }, () => getBasicSeverityText(level))
    },
  },
  {
    accessorKey: 'module',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Module' }),
  },
  {
    accessorKey: 'info',
    header: 'Info',
    cell: ({ row }) => h('div', { class: 'truncate w-32', title: row.getValue('info') }, row.getValue('info')),
  },
  {
    accessorKey: 'path',
    header: 'Path',
    cell: ({ row }) => h('div', { class: 'truncate w-32', title: row.getValue('path') }, row.getValue('path')),
  },
  {
    accessorKey: 'method',
    header: 'Method',
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => h(Button, {
      variant: 'ghost',
      size: 'sm',
      onClick: () => showBasicVulnDetail(row.original),
    }, () => 'Details'),
  },
]

const basicVulnerabilitiesTable = useVueTable({
  get data() { return allBasicVulnerabilities.value },
  get columns() { return basicVulnerabilityColumns },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: (updaterOrValue) => basicSorting.value = typeof updaterOrValue === 'function' ? updaterOrValue(basicSorting.value) : updaterOrValue,
  onGlobalFilterChange: (updaterOrValue) => basicGlobalFilter.value = typeof updaterOrValue === 'function' ? updaterOrValue(basicGlobalFilter.value) : updaterOrValue,
  state: {
    get sorting() { return basicSorting.value },
    get globalFilter() { return basicGlobalFilter.value },
  },
})

// ----------
// --- Basic Scan: Technologies Table Config ---
// ----------
const basicTechSorting = ref<SortingState>([])
const basicTechGlobalFilter = ref('')
const basicTechColumns = computed((): ColumnDef<BasicTechnology>[] => {
    const columns: ColumnDef<BasicTechnology>[] = [
        {
            accessorKey: 'pluginName',
            header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Plugin' }),
            cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('pluginName')),
        }
    ]
    whatWebColumns.value.forEach(key => {
        columns.push({
            accessorKey: key,
            header: ({ column }) => h(DataTableColumnHeader, { column, title: key }),
            cell: ({ row }) => row.getValue(key) || '-',
        })
    })
    return columns
})

const basicTechTable = useVueTable({
  get data() { return flattenedBasicTechData.value },
  get columns() { return basicTechColumns.value },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: (updaterOrValue) => basicTechSorting.value = typeof updaterOrValue === 'function' ? updaterOrValue(basicTechSorting.value) : updaterOrValue,
  onGlobalFilterChange: (updaterOrValue) => basicTechGlobalFilter.value = typeof updaterOrValue === 'function' ? updaterOrValue(basicTechGlobalFilter.value) : updaterOrValue,
  state: {
    get sorting() { return basicTechSorting.value },
    get globalFilter() { return basicTechGlobalFilter.value },
  },
})

// ----------
// --- Basic Scan: Risk Priorities Table Config ---
// ----------
const basicRiskPrioritySorting = ref<SortingState>([])
const basicRiskPriorityColumns: ColumnDef<RiskPriority>[] = [
  {
    accessorKey: 'type',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }),
    cell: ({ row }) => h('div', { class: 'font-medium max-w-[200px] truncate' }, row.getValue('type')),
  },
  {
    accessorKey: 'risk',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Risk' }),
    cell: ({ row }) => {
      const risk = row.getValue('risk') as string
      return h(Badge, { variant: getSeverityBadge(risk) }, () => risk)
    },
  },
  {
    accessorKey: 'endpoint',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Endpoint' }),
    cell: ({ row }) => h('div', { class: 'max-w-[150px] truncate' }, row.getValue('endpoint')),
  },
]

const basicRiskPriorityTable = useVueTable({
  get data() { return basicRiskPriorities.value },
  get columns() { return basicRiskPriorityColumns },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: (updaterOrValue) => basicRiskPrioritySorting.value = typeof updaterOrValue === 'function' ? updaterOrValue(basicRiskPrioritySorting.value) : updaterOrValue,
  state: {
    get sorting() { return basicRiskPrioritySorting.value },
  },
})

// ----------
// --- Full Scan: Risk Priorities Table Config ---
// ----------
const riskPrioritySorting = ref<SortingState>([])
const riskPriorityColumns: ColumnDef<RiskPriority>[] = [
  {
    accessorKey: 'type',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }),
    cell: ({ row }) => h('div', { class: 'font-medium max-w-[200px] truncate' }, row.getValue('type')),
  },
  {
    accessorKey: 'risk',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Risk' }),
    cell: ({ row }) => {
      const risk = row.getValue('risk') as string
      return h(Badge, { variant: getSeverityBadge(risk) }, () => risk)
    },
  },
  {
    accessorKey: 'endpoint',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Endpoint' }),
    cell: ({ row }) => h('div', { class: 'max-w-[150px] truncate' }, row.getValue('endpoint')),
  },
]

const riskPriorityTable = useVueTable({
  get data() { return fullScanData.value?.risks || [] },
  get columns() { return riskPriorityColumns },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: (updaterOrValue) => riskPrioritySorting.value = typeof updaterOrValue === 'function' ? updaterOrValue(riskPrioritySorting.value) : updaterOrValue,
  state: {
    get sorting() { return riskPrioritySorting.value },
  },
})

// ----------
// --- Full Scan: Vulnerabilities Table Config ---
// ----------
const fullVulnerabilitySorting = ref<SortingState>([{ id: 'severity', desc: true }])
const fullVulnerabilityGlobalFilter = ref('')
const fullVulnerabilityColumns: ColumnDef<FullVulnerability>[] = [
  {
    accessorKey: 'type',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }),
    cell: ({ row }) => h('div', { class: 'font-medium max-w-[200px] truncate' }, row.getValue('type')),
  },
  {
    accessorKey: 'severity',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Severity' }),
    cell: ({ row }) => {
      const severity = row.getValue('severity') as string
      return h(Badge, { variant: getSeverityBadge(severity) }, () => severity)
    },
  },
  {
    accessorKey: 'scanner',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Scanner' }),
  },
  {
    accessorKey: 'confidence',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Confidence' }),
  },
  {
    accessorKey: 'endpoint',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Endpoint' }),
    cell: ({ row }) => h('div', { class: 'max-w-[150px] truncate' }, row.getValue('endpoint')),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => h(Button, {
      variant: 'ghost',
      size: 'sm',
      onClick: () => showFullVulnDetail(row.original),
    }, () => 'Details'),
  },
]

const fullVulnerabilitiesTable = useVueTable({
  get data() { return fullScanData.value?.vulnerabilities || [] },
  get columns() { return fullVulnerabilityColumns },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: (updaterOrValue) => fullVulnerabilitySorting.value = typeof updaterOrValue === 'function' ? updaterOrValue(fullVulnerabilitySorting.value) : updaterOrValue,
  onGlobalFilterChange: (updaterOrValue) => fullVulnerabilityGlobalFilter.value = typeof updaterOrValue === 'function' ? updaterOrValue(fullVulnerabilityGlobalFilter.value) : updaterOrValue,
  state: {
    get sorting() { return fullVulnerabilitySorting.value },
    get globalFilter() { return fullVulnerabilityGlobalFilter.value },
  },
})

// ----------
// --- Full Scan: Technologies Table Config ---
// ----------
const fullTechSorting = ref<SortingState>([])
const fullTechGlobalFilter = ref('')
const fullTechColumns: ColumnDef<Technology>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Technology' }),
  },
  {
    accessorKey: 'version',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Version' }),
  },
  {
    accessorKey: 'vulnerable',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Vulnerable' }),
    cell: ({ row }) => {
      const isVulnerable = row.getValue('vulnerable')
      return h(Badge, { variant: isVulnerable ? 'destructive' : 'secondary' }, () => isVulnerable ? 'YES' : 'NO')
    },
  },
  {
    accessorKey: 'cve',
    header: 'CVE',
  },
  {
    accessorKey: 'fix',
    header: 'Fix',
  },
]

const fullTechTable = useVueTable({
  get data() { return fullScanData.value?.technologies || [] },
  get columns() { return fullTechColumns },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: (updaterOrValue) => fullTechSorting.value = typeof updaterOrValue === 'function' ? updaterOrValue(fullTechSorting.value) : updaterOrValue,
  onGlobalFilterChange: (updaterOrValue) => fullTechGlobalFilter.value = typeof updaterOrValue === 'function' ? updaterOrValue(fullTechGlobalFilter.value) : updaterOrValue,
  state: {
    get sorting() { return fullTechSorting.value },
    get globalFilter() { return fullTechGlobalFilter.value },
  },
})

</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">

            <div>
                <h1 class="font-bold px-2 text-4xl">New Scan</h1>
                <div class="p-1.5">
                    <span>Run scans to probe websites for vulnerabilities.</span>
                </div>
            </div>

            <Tabs v-model="activeScanType" default-value="basic" class="w-full" @update:model-value="resetState">
                <TabsList class="grid w-full grid-cols-2 md:w-[400px]">
                    <TabsTrigger value="basic">Basic Scan</TabsTrigger>
                    <TabsTrigger value="full">Full Scan</TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                    <form @submit.prevent="handleScanSubmit">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Scan</CardTitle>
                                <CardContent class="pt-4 px-0 pb-0">
                                  <span class="text-sm text-muted-foreground">
                                    Runs a preconfigured Wapiti and WhatWeb scan. Quick, but may not find all issues.
                                  </span>
                                </CardContent>
                            </CardHeader>
                            <CardContent class="flex flex-col gap-4 md:flex-row md:items-start pt-6">
                                <Input v-model="url" placeholder="Enter site URL (e.g., http://example.com)" class="w-full md:w-80" />
                                <div class="flex gap-2">
                                    <Button type="submit" :disabled="scanning">
                                        <svg v-if="scanning" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {{ scanning ? 'Scanning...' : 'Run Scan' }}
                                    </Button>
                                    <Button variant="secondary" type="button" @click="onClear" :disabled="scanning || (!basicScanData && !fullScanData)">
                                        Clear
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </TabsContent>

                <TabsContent value="full">
                    <form @submit.prevent="handleScanSubmit">
                        <Card>
                            <CardHeader>
                                <CardTitle>Full Scan</CardTitle>
                                <CardContent class="pt-4 px-0 pb-0">
                                  <span class="text-sm text-muted-foreground">
                                    A comprehensive scan using Wapiti, ZAP, WhatWeb, and SearchVuln. Takes longer but is more accurate.
                                  </span>
                                </CardContent>
                            </CardHeader>
                            <CardContent class="flex flex-col gap-4 pt-6">
                                <div class="flex flex-col gap-4 md:flex-row md:items-start">
                                    <Input v-model="url" placeholder="Enter site URL (e.g., http://example.com)" class="w-full md:w-80" />
                                    <div class="flex gap-2">
                                        <Button type="submit" :disabled="scanning">
                                            <svg v-if="scanning" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {{ scanning ? 'Scanning...' : 'Run Scan' }}
                                        </Button>
                                        <Button variant="secondary" type="button" @click="onClear" :disabled="scanning || (!basicScanData && !fullScanData)">
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                                <Separator />
                                <div class="flex flex-col md:flex-row gap-4 items-center space-x-2">
                                    <div class="flex items-center space-x-2">
                                        <Switch id="zap-switch" v-model:checked="useZap" />
                                        <Label for="zap-switch">Enable ZAP Active Scan</Label>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <Switch id="searchvuln-switch" v-model:checked="useSearchVuln" />
                                        <Label for="searchvuln-switch">Enable SearchVuln (Tech Scan)</Label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </TabsContent>
            </Tabs>

            <div v-if="scanning" class="mt-4 flex-1 flex flex-col items-center justify-center">
              <Card class="w-full max-w-md">
                <CardHeader>
                  <CardTitle class="text-center">Scanning in progress...</CardTitle>
                  <CardDescription class="text-center truncate p-2">
                    Scanning {{ url }}
                  </CardDescription>
                </CardHeader>
                <CardContent class="flex flex-col items-center justify-center gap-6 p-6">
                  <Spinner class="h-16 w-16" />
                  <Progress v-model="progress" class="w-full" />
                  <span class="text-sm text-muted-foreground">Mock scan... please wait.</span>
                </CardContent>
              </Card>
            </div>

            <div v-if="errorMsg && !scanning" class="text-red-600 text-center font-bold p-2">
                {{ errorMsg }}
            </div>

            <div v-if="basicScanData && !scanning && activeScanType === 'basic' && basicSummaryData" class="space-y-4 animate-fadein mt-4">

              <Card>
                <CardHeader>
                  <CardTitle class="text-2xl">Basic Scan Report</CardTitle>
                  <CardDescription class="pt-2">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-1 text-sm">
                      <div class="truncate"><strong>Target:</strong> {{ basicSummaryData.site }}</div>
                      <div class="truncate"><strong>Tools:</strong> {{ basicSummaryData.tools.join(', ') }}</div>
                      <div><strong>Duration:</strong> {{ basicSummaryData.duration }} seconds</div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent class="pt-6">
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="p-4 border rounded-lg">
                      <h3 class="text-sm font-medium text-muted-foreground">Total Findings</h3>
                      <p class="text-3xl font-bold">{{ basicSummaryData.totalVulns }}</p>
                    </div>
                    <div class="p-4 border rounded-lg">
                      <h3 class="text-sm font-medium text-muted-foreground">High/Medium</h3>
                      <p class="text-3xl font-bold text-destructive">{{ basicSummaryData.criticalHighVulns }}</p>
                    </div>
                    <div class="p-4 border rounded-lg">
                      <h3 class="text-sm font-medium text-muted-foreground">Technologies</h3>
                      <p class="text-3xl font-bold">{{ basicScanData.whatWebPlugins.length }}</p>
                    </div>
                    <div class="p-4 border rounded-lg">
                      <h3 class="text-sm font-medium text-muted-foreground">Top Risk</h3>
                      <p class="text-2xl md:text-3xl font-bold">{{ basicSummaryData.topRisk }}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Priorities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow v-for="headerGroup in basicRiskPriorityTable.getHeaderGroups()" :key="headerGroup.id">
                          <TableHead v-for="header in headerGroup.headers" :key="header.id">
                            <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow v-if="!basicRiskPriorityTable.getRowModel().rows.length">
                          <TableCell :colSpan="basicRiskPriorityColumns.length" class="h-24 text-center">
                            No high or medium risks found.
                          </TableCell>
                        </TableRow>
                        <TableRow v-for="row in basicRiskPriorityTable.getRowModel().rows" :key="row.id">
                          <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                            <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Severity Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SeverityPieChart :vulnerabilities="allBasicVulnerabilities" />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Vulnerabilities Detected</CardTitle>
                </CardHeader>
                <CardContent class="space-y-2">
                  <Input
                    placeholder="Filter vulnerabilities..."
                    :model-value="basicGlobalFilter"
                    @update:modelValue="basicGlobalFilter = $event"
                    class="h-8"
                  />
                  <div class="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow v-for="headerGroup in basicVulnerabilitiesTable.getHeaderGroups()" :key="headerGroup.id">
                          <TableHead v-for="header in headerGroup.headers" :key="header.id">
                            <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow v-if="!basicVulnerabilitiesTable.getRowModel().rows.length">
                          <TableCell :colSpan="basicVulnerabilityColumns.length" class="h-24 text-center">
                            No results.
                          </TableCell>
                        </TableRow>
                        <TableRow
                          v-for="row in basicVulnerabilitiesTable.getRowModel().rows"
                          :key="row.id"
                          class="cursor-pointer"
                          @click="showBasicVulnDetail(row.original)"
                        >
                          <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                            <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <DataTablePagination :table="basicVulnerabilitiesTable" />
                </CardContent>
              </Card>


              <Card v-if="basicTechTable.getRowModel().rows.length" class="flex-1 flex flex-col min-h-0">
                <CardHeader>
                  <CardTitle>Technologies &amp; Services</CardTitle>
                </CardHeader>
                <CardContent class="flex-1 overflow-y-auto space-y-2">
                  <Input
                    placeholder="Filter technologies..."
                    :model-value="basicTechGlobalFilter"
                    @update:modelValue="basicTechGlobalFilter = $event"
                    class="h-8"
                  />
                  <div class="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow v-for="headerGroup in basicTechTable.getHeaderGroups()" :key="headerGroup.id">
                          <TableHead v-for="header in headerGroup.headers" :key="header.id">
                            <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow v-for="row in basicTechTable.getRowModel().rows" :key="row.id">
                          <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                            <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <DataTablePagination :table="basicTechTable" />
                </CardContent>
              </Card>

            </div>

            <div v-if="fullScanData && !scanning && activeScanType === 'full'" class="space-y-4 animate-fadein mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle class="text-2xl">Full Scan Report</CardTitle>
                        <CardDescription class="pt-2">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-1 text-sm">
                                <div class="truncate"><strong>Target:</strong> {{ fullScanData.site }}</div>
                                <div class="truncate"><strong>Tools:</strong> {{ fullScanData.tools.join(', ') }}</div>
                                <div><strong>Duration:</strong> {{ fullScanData.duration }} seconds</div>
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent class="pt-6">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="p-4 border rounded-lg">
                                <h3 class="text-sm font-medium text-muted-foreground">Total Vulns</h3>
                                <p class="text-3xl font-bold">{{ fullScanData.totalVulns }}</p>
                            </div>
                            <div class="p-4 border rounded-lg">
                                <h3 class="text-sm font-medium text-muted-foreground">Critical/High</h3>
                                <p class="text-3xl font-bold text-destructive">{{ fullScanData.criticalVulns }}</p>
                            </div>
                            <div class="p-4 border rounded-lg">
                                <h3 class="text-sm font-medium text-muted-foreground">Technologies</h3>
                                <p class="text-3xl font-bold">{{ fullScanData.technologies.length }}</p>
                            </div>
                            <div class="p-4 border rounded-lg">
                                <h3 class="text-sm font-medium text-muted-foreground">Top Risk</h3>
                                <p class="text-2xl md:text-3xl font-bold">{{ fullScanData.risks[0]?.type || 'N/A' }}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Risk Priorities</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                  <TableRow v-for="headerGroup in riskPriorityTable.getHeaderGroups()" :key="headerGroup.id">
                                    <TableHead v-for="header in headerGroup.headers" :key="header.id">
                                      <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow v-if="!riskPriorityTable.getRowModel().rows.length">
                                    <TableCell :colSpan="riskPriorityColumns.length" class="h-24 text-center">
                                      No high or critical risks found.
                                    </TableCell>
                                  </TableRow>
                                  <TableRow v-for="row in riskPriorityTable.getRowModel().rows" :key="row.id">
                                    <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                      <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Severity Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SeverityPieChart :vulnerabilities="fullScanData.vulnerabilities" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Findings by Scanner</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScannerBarChart :vulnerabilities="fullScanData.vulnerabilities" />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Vulnerabilities Detected</CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-2">
                        <Input
                          placeholder="Filter vulnerabilities..."
                          :model-value="fullVulnerabilityGlobalFilter"
                          @update:modelValue="fullVulnerabilityGlobalFilter = $event"
                          class="h-8"
                        />
                        <div class="border rounded-md">
                            <Table>
                                <TableHeader>
                                  <TableRow v-for="headerGroup in fullVulnerabilitiesTable.getHeaderGroups()" :key="headerGroup.id">
                                    <TableHead v-for="header in headerGroup.headers" :key="header.id">
                                      <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow v-if="!fullVulnerabilitiesTable.getRowModel().rows.length">
                                    <TableCell :colSpan="fullVulnerabilityColumns.length" class="h-24 text-center">
                                      No results.
                                    </TableCell>
                                  </TableRow>
                                  <TableRow v-for="row in fullVulnerabilitiesTable.getRowModel().rows" :key="row.id">
                                    <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                      <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                        <DataTablePagination :table="fullVulnerabilitiesTable" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Technologies</CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-2">
                        <Input
                          placeholder="Filter technologies..."
                          :model-value="fullTechGlobalFilter"
                          @update:modelValue="fullTechGlobalFilter = $event"
                          class="h-8"
                        />
                        <div class="border rounded-md">
                            <Table>
                                <TableHeader>
                                  <TableRow v-for="headerGroup in fullTechTable.getHeaderGroups()" :key="headerGroup.id">
                                    <TableHead v-for="header in headerGroup.headers" :key="header.id">
                                      <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow v-if="!fullTechTable.getRowModel().rows.length">
                                    <TableCell :colSpan="fullTechColumns.length" class="h-24 text-center">
                                      No technologies detected.
                                    </TableCell>
                                  </TableRow>
                                  <TableRow v-for="row in fullTechTable.getRowModel().rows" :key="row.id">
                                    <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                      <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                        <DataTablePagination :table="fullTechTable" />
                    </CardContent>
                </Card>
            </div>

            <BasicScanDetailDrawer v-if="selectedBasicVuln" :vuln="selectedBasicVuln" :open="basicDrawerOpen" @update:open="basicDrawerOpen = $event" />
   <FullScanDetailDrawer v-if="selectedFullVuln" :vuln="selectedFullVuln" :open="fullDrawerOpen" @update:open="fullDrawerOpen = $event" />

        </div>
    </Navigation>
</template>

<style scoped>
.animate-fadein {
    animation: fadein 0.5s;
}
@keyframes fadein {
    from { opacity: 0; transform: translateY(10px);}
    to { opacity: 1; transform: translateY(0);}
}

/* Add sticky header style for table */
th {
    position: sticky;
    top: 0;
    z-index: 1;
}
</style>
