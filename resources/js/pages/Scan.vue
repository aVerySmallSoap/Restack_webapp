<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import Navigation from '@/components/custom/Navigation.vue'
import VulnerabilityDetail from '@/components/custom/VulnerabilityDetail.vue'
import FullScanDetailDrawer from '@/components/custom/FullScanDetailDrawer.vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import SeverityPieChart from '@/components/custom/Charts/SeverityPieChart.vue'
import ScannerBarChart from '@/components/custom/Charts/ScannerBarChart.vue'

// ---------- MOCK DATA (BASIC) ----------
const mockBasicScanData = {
    "scan_time": 14.78, // Added for summary
    "plugins": [ // Added for WhatWeb table
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
// ---------- MOCK DATA (FULL) ----------
const mockFullScanData = {
    site: 'http://sample.web',
    tools: ['Wapiti', 'ZAP', 'WhatWeb', 'SearchVuln'],
    duration: 224,
    totalVulns: 15,
    criticalVulns: 4,
    risks: [
        { type: 'Cross Site Scripting', risk: 'Critical', endpoint: '/payments' },
        { type: 'SQLInjection', risk: 'Critical', endpoint: '/login' },
    ],
    vulnerabilities: [
        { id: 1, type: 'XXS', severity: 'Medium', scanner: 'ZAP', confidence: 'Medium', method: 'POST', endpoint: '/login', exploit: '/login', description: 'Reflected XSS in /login', solution: 'Sanitize inputs', reference: 'https://owasp.org/www-community/attacks/xss/' },
        { id: 2, type: 'SQLInjection', severity: 'Critical', scanner: 'Wapiti', confidence: 'High', method: 'GET', endpoint: '/payments', exploit: '/payments', description: 'SQL Injection in /payments', solution: 'Use parameterized queries', reference: 'https://owasp.org/www-community/attacks/SQL_Injection' },
    ],
    technologies: [
        { name: 'PHP', version: '8.1.2', vulnerable: true, cve: 'CVE-2023-12345', fix: 'Update' },
        { name: 'Nginx', version: '1.18.0', vulnerable: true, cve: 'CVE-2023-67890', fix: 'Update' },
    ],
}


// ---------- State ----------
const url = ref('http://www.itsecgames.com/')
const scanning = ref(false)
const progress = ref(0) // Used for skeleton loader
const errorMsg = ref('')
const activeScanType = ref('basic')

// Full Scan Options
const useZap = ref(true)
const useSearchVuln = ref(true)

// ----- NEW: Separated Data States -----
const basicScanData = ref(null) // Holds results for Basic Scan
const fullScanData = ref(null) // Holds results for Full Scan

// Basic Scan Detail Panel
const selectedBasicVuln = ref(null)

// Full Scan Detail Drawer
const drawerOpen = ref(false)
const selectedFullVuln = ref(null)


// ---------- Computed: Basic Scan ----------
const allBasicVulnerabilities = computed(() => {
    if (!basicScanData.value) return []
    return basicScanData.value.categories.flatMap(cat =>
        cat.vulns.map(vuln => ({
            ...vuln,
            category: cat.name,
            description: cat.desc,
            solution: cat.solution,
            references: cat.refs,
            wstg: cat.wstg,
        }))
    ).sort((a, b) => b.level - a.level)
})

const whatWebColumns = computed(() => {
    if (!basicScanData.value?.whatWebPlugins) return []
    const keys = new Set<string>()
    for (const plugin of basicScanData.value.whatWebPlugins) {
        const pluginObj = plugin[Object.keys(plugin)[0]]
        Object.keys(pluginObj).forEach(key => keys.add(key))
    }
    return Array.from(keys)
})

// ---------- Helpers ----------
function resetState() {
    basicScanData.value = null
    fullScanData.value = null
    progress.value = 0
    errorMsg.value = ''
    selectedBasicVuln.value = null
    selectedFullVuln.value = null
    drawerOpen.value = false
}

function parseBasicApiResponse(data) {
    if (!data || !data.infos) return

    const scanMeta = {
        target: data.infos.target || '',
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

    // Set the basic scan data
    basicScanData.value = {
        scanMeta,
        categories,
        whatWebPlugins
    }
}

// ----- Basic Scan: Show Detail in Panel -----
function showBasicVulnDetail(vuln) {
    selectedBasicVuln.value = vuln
}

// ----- Full Scan: Show Detail in Drawer -----
function showFullVulnDetail(vuln) {
    selectedFullVuln.value = vuln
    drawerOpen.value = true
}

// ---------- API Calls ----------
function onBasicScan() {
    if (!url.value) return
    resetState()
    scanning.value = true
    errorMsg.value = ''

    toast.info('Starting basic mock scan...')
    setTimeout(() => {
        mockBasicScanData.infos.target = url.value // Update target
        parseBasicApiResponse(mockBasicScanData)
        scanning.value = false
        progress.value = 100
        toast.success('Basic mock scan completed!')
    }, 1500)

    /* --- REAL FETCH (Basic) ---
    fetch('http://127.0.0.1:25565/api/v1/wapiti/scan', { ... })
      .then(res => res.json())
      .then(data => {
        parseBasicApiResponse(data)
        scanning.value = false
        toast.success('Scan completed successfully!')
      })
      .catch(err => { ... })
    */
}

function onFullScan() {
    if (!url.value) return
    resetState()
    scanning.value = true
    errorMsg.value = ''

    toast.info('Starting full mock scan...', {
        description: `ZAP: ${useZap.value}, SearchVuln: ${useSearchVuln.value}`
    })

    setTimeout(() => {
        // parse the SARIF here.
        mockFullScanData.site = url.value // Update target
        fullScanData.value = mockFullScanData

        scanning.value = false
        progress.value = 100
        toast.success('Full mock scan completed successfully!')
    }, 3000)

    /* --- REAL FETCH (Full) ---
    fetch('http://127.0.0.1:25565/api/v1/full-scan', { // <-- ASSUMED ENDPOINT
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ url: url.value, use_zap: useZap.value, use_searchvuln: useSearchVuln.value }),
    })
      .then(res => res.json())
      .then(sarifOrAggregatedJson => {
        // TODO: Need a new parser here for the SARIF/Full data
        // e.g., fullScanData.value = parseFullScanResponse(sarifOrAggregatedJson)

        // For now, we'll just use the mock data structure
        mockFullScanData.site = url.value
        fullScanData.value = mockFullScanData // Replace with parsed data

        scanning.value = false
        toast.success('Scan completed successfully!')
      })
      .catch((err) => {
        scanning.value = false
        errorMsg.value = 'Scan failed. Please try again.'
        toast.error(errorMsg.value, { description: err.message })
      })
    */
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

// Helper for severity badges
function getSeverityBadge(level: number | string) {
    if (typeof level === 'string') {
        switch (level?.toLowerCase()) {
            case 'critical': return 'destructive'
            case 'high': return 'destructive'
            case 'medium': return 'default'
            default: return 'secondary'
        }
    }
    // Number (from basic scan)
    if (level >= 3) return 'destructive'
    if (level === 2) return 'default'
    return 'secondary'
}

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

            <div v-if="scanning" class="mt-4 flex-1">
                <ResizablePanelGroup direction="horizontal" class="h-full max-h-[70vh] w-full rounded-lg border">
                    <ResizablePanel :default-size="30">
                        <div class="flex h-full flex-col items-center justify-center p-6 gap-4">
                            <Skeleton class="h-[200px] w-full" />
                            <Skeleton class="h-[300px] w-full" />
                        </div>
                    </ResizablePanel>
                    <ResizableHandle with-handle />
                    <ResizablePanel :default-size="70">
                        <div class="flex h-full items-center justify-center p-6">
                            <Skeleton class="h-full w-full" />
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            <div v-if="errorMsg && !scanning" class="text-red-600 text-center font-bold p-2">
                {{ errorMsg }}
            </div>

            <div v-if="basicScanData && !scanning && activeScanType === 'basic'" class="animate-fadein mt-4 flex-1">
                <ResizablePanelGroup direction="horizontal" class="h-full max-h-[70vh] w-full rounded-lg border">

                    <ResizablePanel :default-size="30" :min-size="25">
                        <div class="flex h-full flex-col p-4 gap-4">

                            <VulnerabilityDetail
                                v-if="selectedBasicVuln"
                                :vuln="selectedBasicVuln"
                                @close="selectedBasicVuln = null"
                                class="flex-1"
                            />

                            <template v-else>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Scan Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent class="text-sm space-y-1">
                                        <div><strong>Target:</strong> {{ basicScanData.scanMeta.target }}</div>
                                        <div><strong>Scan Time:</strong> {{ basicScanData.scanMeta.scan_time }}s</div>
                                        <div><strong>Date:</strong> {{ basicScanData.scanMeta.date }}</div>
                                        <div><strong>Pages Crawled:</strong> {{ basicScanData.scanMeta.crawled_pages_nbr }}</div>
                                        <div class_ ="truncate"><strong>Scanners:</strong> {{ basicScanData.scanMeta.version }}</div>
                                        <div><strong>Categories:</strong> {{ basicScanData.scanMeta.totalCategories }}</div>
                                        <div><strong>Findings:</strong> {{ basicScanData.scanMeta.totalVulns }}</div>
                                    </CardContent>
                                </Card>

                                <Card v-if="basicScanData.whatWebPlugins.length" class="flex-1 flex flex-col min-h-0">
                                    <CardHeader>
                                        <CardTitle>Technologies &amp; Services</CardTitle>
                                    </CardHeader>
                                    <CardContent class="flex-1 overflow-y-auto">
                                        <Table>
                                            <TableHeader class="sticky top-0 bg-background">
                                                <TableRow>
                                                    <TableHead>Plugin</TableHead>
                                                    <TableHead v-for="col in whatWebColumns" :key="col">{{ col }}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <TableRow v-for="(plugin, idx) in basicScanData.whatWebPlugins" :key="idx">
                                                    <TableCell>{{ Object.keys(plugin)[0] }}</TableCell>
                                                    <TableCell v-for="col in whatWebColumns" :key="col">
                                                        <template v-if="plugin[Object.keys(plugin)[0]][col]">
                              <span v-if="Array.isArray(plugin[Object.keys(plugin)[0]][col])">
                                {{ plugin[Object.keys(plugin)[0]][col].join(', ') }}
                              </span>
                                                            <span v-else>
                                {{ plugin[Object.keys(plugin)[0]][col] }}
                              </span>
                                                        </template>
                                                        <template v-else>-</template>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </template>

                        </div>
                    </ResizablePanel>

                    <ResizableHandle with-handle />

                    <ResizablePanel :default-size="70" :min-size="30">
                        <Card class="h-full flex flex-col border-0 shadow-none rounded-none">
                            <CardHeader>
                                <CardTitle>Vulnerabilities</CardTitle>
                            </CardHeader>
                            <CardContent class="flex-1 overflow-y-auto p-0">
                                <Table v-if="allBasicVulnerabilities.length">
                                    <TableHeader class="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Level</TableHead>
                                            <TableHead>Module</TableHead>
                                            <TableHead>Info</TableHead>
                                            <TableHead>Path</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow v-for="(vuln, idx) in allBasicVulnerabilities" :key="idx" class="cursor-pointer" @click="showBasicVulnDetail(vuln)">
                                            <TableCell>{{ vuln.category }}</TableCell>
                                            <TableCell>
                                                <Badge :variant="getSeverityBadge(vuln.level)" class="w-16 justify-center">
                                                    {{ vuln.level === 3 ? 'High' : vuln.level === 2 ? 'Medium' : 'Info' }}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{{ vuln.module }}</TableCell>
                                            <TableCell><div class="truncate w-32" :title="vuln.info">{{ vuln.info }}</div></TableCell>
                                            <TableCell><div class="truncate w-32" :title="vuln.path">{{ vuln.path }}</div></TableCell>
                                            <TableCell>{{ vuln.method }}</TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="ghost" @click.stop="showBasicVulnDetail(vuln)">Details</Button>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                                <div v-else class="p-6 text-muted-foreground">
                                    No vulnerabilities found.
                                </div>
                            </CardContent>
                        </Card>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            <div v-if="fullScanData && !scanning && activeScanType === 'full'" class="space-y-4 animate-fadein mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle class="text-2xl">Full Scan Report</CardTitle>
                        <CardDescription class="pt-2">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-1 text-sm">
                                <div><strong>Target:</strong> {{ fullScanData.site }}</div>
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
                                <h3 class="text-sm font-medium text-muted-foreground">Critical</h3>
                                <p class="text-3xl font-bold text-destructive">{{ fullScanData.criticalVulns }}</p>
                            </div>
                            <div class="p-4 border rounded-lg">
                                <h3 class="text-sm font-medium text-muted-foreground">Technologies</h3>
                                <p class="text-3xl font-bold">{{ fullScanData.technologies.length }}</p>
                            </div>
                            <div class="p-4 border rounded-lg">
                                <h3 class="text-sm font-medium text-muted-foreground">Top Risk</h3>
                                <p class="text-3xl font-bold truncate">{{ fullScanData.risks[0]?.type || 'N/A' }}</p>
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
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Risk</TableHead>
                                        <TableHead>Endpoint</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow v-for="(risk, i) in fullScanData.risks" :key="i">
                                        <TableCell>{{ risk.type }}</TableCell>
                                        <TableCell>
                                            <Badge :variant="getSeverityBadge(risk.risk)">{{ risk.risk }}</Badge>
                                        </TableCell>
                                        <TableCell>{{ risk.endpoint }}</TableCell>
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
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Scanner</TableHead>
                                    <TableHead>Confidence</TableHead>
                                    <TableHead>Endpoint</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow v-for="vuln in fullScanData.vulnerabilities" :key="vuln.id">
                                    <TableCell>{{ vuln.type }}</TableCell>
                                    <TableCell>
                                        <Badge :variant="getSeverityBadge(vuln.severity)">{{ vuln.severity }}</Badge>
                                    </TableCell>
                                    <TableCell>{{ vuln.scanner }}</TableCell>
                                    <TableCell>{{ vuln.confidence }}</TableCell>
                                    <TableCell>{{ vuln.endpoint }}</TableCell>
                                    <TableCell>
                                        <Button size="sm" variant="ghost" @click="showFullVulnDetail(vuln)">Details</Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Technologies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Technology</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Vulnerable</TableHead>
                                    <TableHead>CVE</TableHead>
                                    <TableHead>Fix</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow v-for="(tech, idx) in fullScanData.technologies" :key="idx">
                                    <TableCell>{{ tech.name }}</TableCell>
                                    <TableCell>{{ tech.version }}</TableCell>
                                    <TableCell>
                                        <Badge v-if="tech.vulnerable" variant="destructive">YES</Badge>
                                        <Badge v-else variant="secondary">NO</Badge>
                                    </TableCell>
                                    <TableCell>{{ tech.cve }}</TableCell>
                                    <TableCell>{{ tech.fix }}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <FullScanDetailDrawer v-if="selectedFullVuln" :vuln="selectedFullVuln" :open="drawerOpen" @update:open="drawerOpen = $event" />

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
