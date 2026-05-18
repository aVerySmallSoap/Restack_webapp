<script setup lang="ts">
import { h, ref, computed } from 'vue'
import {
    useVueTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    FlexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
} from '@tanstack/vue-table'
import {
    ChevronDown, ChevronRight, Download, FileSpreadsheet, FileText,
    ShieldCheck, ShieldAlert, ShieldX, Globe, Lock, AlertTriangle, CheckCircle2
} from 'lucide-vue-next'
import Navigation from '@/components/custom/Navigation.vue'
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue'
import DataTablePagination from '@/components/custom/DataTablePagination.vue'
import FacetedFilter from '@/components/custom/FacetedFilter.vue'
import SeverityPieChart from '@/components/custom/Charts/SeverityPieChart.vue'
import ScannerBarChart from '@/components/custom/Charts/ScannerBarChart.vue'
import ScanAISummary from '@/components/custom/Scan/ScanAISummary.vue'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getSeverityColor } from '@/lib/colors'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SampleVuln {
    id: string
    type: string
    severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational'
    scanner: string
    confidence: string
    method: string
    endpoint: string
    description: string
    solution: string
    evidence: string
    reference: string
}

interface Technology {
    name: string
    version: string
    category: string
    vulnerable: boolean
    cve?: string
}

interface CrawledUrl {
    url: string
    status: number
    method: string
    contentType: string
    notes: string
}

interface SslFinding {
    check: string
    status: 'pass' | 'warn' | 'fail'
    detail: string
}

// ─── Hardcoded sample data ─────────────────────────────────────────────────────

const scanMeta = {
    id: 'rpt-20260325-0042',
    target: 'dnsc.edu.ph',
    scanType: 'Full Scan',
    scanDate: '2026-03-25T02:34:00.000Z',
    tools: ['Wapiti', 'ZAP', 'Nuclei', 'WhatWeb'],
    country: 'Philippines',
    ip: '202.90.136.12',
    duration: 847,
    totalVulns: 12,
    criticalCount: 1,
}

const sampleVulns: SampleVuln[] = [
    {
        id: 'v1', type: 'SQL Injection', severity: 'Critical', scanner: 'Wapiti',
        confidence: 'High', method: 'POST', endpoint: '/admin/login.php',
        description: 'SQL injection allows an attacker to alter SQL queries executed by the backend database. Successful exploitation can lead to full database read/write access, authentication bypass, or remote code execution depending on the DBMS configuration.',
        solution: 'Use parameterized queries or prepared statements exclusively. Never concatenate user input directly into SQL strings. Apply least-privilege DB accounts.',
        evidence: "POST /admin/login.php\nusername=admin'+OR+'1'%3D'1&password=test\n\nResponse: HTTP 200 Welcome, admin",
        reference: 'https://owasp.org/Top10/A03_2021-Injection/',
    },
    {
        id: 'v2', type: 'Weak SSL/TLS Configuration', severity: 'High', scanner: 'Nuclei',
        confidence: 'High', method: 'GET', endpoint: '/',
        description: 'The server supports TLS 1.0 and TLS 1.1, both deprecated protocols vulnerable to BEAST, POODLE, and DROWN attacks. Additionally, weak cipher suites (RC4, DES-CBC3) are advertised in the ServerHello.',
        solution: 'Disable TLS 1.0 and TLS 1.1 in your web server configuration. Configure TLS 1.2 minimum with ECDHE cipher suites. Use tools like testssl.sh to verify. Reference: Mozilla SSL Configuration Generator.',
        evidence: 'Supported protocols: TLSv1.0, TLSv1.1, TLSv1.2\nWeak ciphers: TLS_RSA_WITH_RC4_128_SHA, TLS_RSA_WITH_3DES_EDE_CBC_SHA',
        reference: 'https://ssl-config.mozilla.org/',
    },
    {
        id: 'v3', type: 'SSL Certificate Misconfiguration', severity: 'High', scanner: 'Nuclei',
        confidence: 'High', method: 'GET', endpoint: '/',
        description: 'The SSL certificate chain served by the host is incomplete. The intermediate CA certificate is missing, causing chain validation failures in strict clients. Some browsers and API clients may reject the connection entirely.',
        solution: 'Configure your web server to serve the full certificate chain including all intermediate CA certificates. Download the intermediate bundle from your CA and append it to your certificate file.',
        evidence: 'Certificate chain depth: 0 (leaf only)\nIssuer: CN=Sectigo RSA Domain Validation Secure Server CA\nChain: INCOMPLETE — intermediate CA certificate not served',
        reference: 'https://support.mozilla.org/en-US/kb/certificate-chain',
    },
    {
        id: 'v4', type: 'Expired SSL Certificate', severity: 'High', scanner: 'Nuclei',
        confidence: 'High', method: 'GET', endpoint: '/portal',
        description: 'The SSL certificate used on the /portal endpoint has expired. Browsers will display a security warning and refuse to load the page without user override. Expired certificates can be exploited in MITM scenarios.',
        solution: 'Renew the SSL certificate immediately. Consider automating renewal using Let\'s Encrypt with certbot (certbot renew --quiet) scheduled via cron.',
        evidence: 'Subject: CN=dnsc.edu.ph\nNotBefore: Feb 14 00:00:00 2025 GMT\nNotAfter:  Feb 14 00:00:00 2026 GMT ← EXPIRED',
        reference: 'https://letsencrypt.org/docs/faq/',
    },
    {
        id: 'v5', type: 'Cross-Site Scripting (Reflected)', severity: 'High', scanner: 'ZAP',
        confidence: 'Medium', method: 'GET', endpoint: '/search?q=',
        description: 'User input from the q= parameter is reflected in the HTML response without output encoding. An attacker can craft a malicious URL containing JavaScript that executes in the victim\'s browser context.',
        solution: 'Encode all user-controlled output using context-aware escaping (HTML entity encoding for HTML context, JS escaping for script context). Implement a strict Content-Security-Policy header.',
        evidence: "GET /search?q=<script>alert(document.cookie)<\/script>\nResponse body: <p>Results for: <script>alert(document.cookie)<\/script></p>",
        reference: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
    },
    {
        id: 'v6', type: 'Self-Signed SSL Certificate', severity: 'Medium', scanner: 'Nuclei',
        confidence: 'High', method: 'GET', endpoint: '/api',
        description: 'The /api endpoint uses a self-signed certificate not issued by a trusted CA. API clients will receive certificate validation errors and may fail silently or expose data by disabling cert validation.',
        solution: 'Replace the self-signed certificate with one from a trusted CA. For internal APIs, set up an internal CA and distribute its root certificate to all clients.',
        evidence: 'Subject: CN=dnsc.edu.ph\nIssuer:  CN=dnsc.edu.ph (SELF-SIGNED)\nSANs: dnsc.edu.ph',
        reference: 'https://owasp.org/www-community/vulnerabilities/Improper_Certificate_Validation',
    },
    {
        id: 'v7', type: 'Missing CSRF Protection', severity: 'Medium', scanner: 'Wapiti',
        confidence: 'Medium', method: 'POST', endpoint: '/contact',
        description: 'The form at /contact does not include a CSRF token. An attacker can trick an authenticated user into submitting a forged cross-origin request, potentially sending spam messages or modifying user data.',
        solution: 'Add CSRF tokens to all state-changing forms. In Laravel, use the @csrf Blade directive. Verify the token server-side on every POST/PUT/DELETE request.',
        evidence: 'POST /contact HTTP/1.1\nContent-Type: application/x-www-form-urlencoded\n\nname=test&email=x@x.com&message=spam\n\nNo X-CSRF-Token or _token field present in request.',
        reference: 'https://owasp.org/www-community/attacks/csrf',
    },
    {
        id: 'v8', type: 'Open Redirect', severity: 'Medium', scanner: 'ZAP',
        confidence: 'Medium', method: 'GET', endpoint: '/redirect?url=',
        description: 'The ?url= parameter accepts arbitrary external URLs and redirects the user without validation. Attackers can abuse this to redirect users to phishing pages while the initial link appears to be from the legitimate domain.',
        solution: 'Validate redirect URLs against a strict allowlist of trusted domains. Avoid using user-supplied input for redirect destinations entirely where possible.',
        evidence: 'GET /redirect?url=https://evil.example.com HTTP/1.1\nHTTP/1.1 302 Found\nLocation: https://evil.example.com',
        reference: 'https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html',
    },
    {
        id: 'v9', type: 'Server Version Disclosure', severity: 'Low', scanner: 'Wapiti',
        confidence: 'High', method: 'GET', endpoint: '/',
        description: 'HTTP response headers expose the exact web server and PHP versions. This information aids attackers in identifying known CVEs applicable to the running software versions.',
        solution: 'Set ServerTokens Prod and ServerSignature Off in Apache config. Remove the X-Powered-By header in PHP with expose_php = Off in php.ini.',
        evidence: 'Server: Apache/2.4.51 (Ubuntu)\nX-Powered-By: PHP/8.1.2',
        reference: 'https://owasp.org/www-project-web-security-testing-guide/',
    },
    {
        id: 'v10', type: 'Missing Security Headers', severity: 'Low', scanner: 'ZAP',
        confidence: 'High', method: 'GET', endpoint: '/',
        description: 'Several recommended HTTP security headers are absent: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy. Their absence enables clickjacking, MIME-sniffing, and data leakage.',
        solution: 'Add all missing headers globally via middleware. In Laravel, create a middleware that appends headers to every response.',
        evidence: 'Missing headers:\n- Content-Security-Policy\n- X-Frame-Options\n- X-Content-Type-Options\n- Referrer-Policy',
        reference: 'https://owasp.org/www-project-secure-headers/',
    },
    {
        id: 'v11', type: 'Directory Listing Enabled', severity: 'Low', scanner: 'Wapiti',
        confidence: 'High', method: 'GET', endpoint: '/uploads/',
        description: 'Directory listing is enabled on /uploads/, allowing unauthenticated users to browse and download all uploaded files. Sensitive documents, user uploads, or configuration files may be exposed.',
        solution: 'Disable directory listing: add "Options -Indexes" to your Apache VirtualHost or .htaccess. Confirm with a direct GET request to the directory.',
        evidence: 'GET /uploads/ HTTP/1.1\nHTTP/1.1 200 OK\n\nIndex of /uploads/\n  thesis_draft_final.pdf\n  student_list_2026.xlsx',
        reference: 'https://owasp.org/www-community/attacks/Forced_browsing',
    },
    {
        id: 'v12', type: 'Cookie Without Secure Flag', severity: 'Informational', scanner: 'ZAP',
        confidence: 'High', method: 'GET', endpoint: '/',
        description: 'The session cookie is set without the Secure attribute. If a user visits the site over plain HTTP (e.g., via a redirect), the cookie may be transmitted in cleartext and intercepted.',
        solution: 'Set the Secure flag on all cookies intended for HTTPS-only transmission. In Laravel, set SESSION_SECURE_COOKIE=true in your .env file.',
        evidence: "Set-Cookie: laravel_session=eyJ...; path=/; httponly\n\nMissing 'Secure' flag.",
        reference: 'https://owasp.org/www-community/controls/SecureCookieAttribute',
    },
]

// Technologies (WhatWeb / Wappalyzer output — fixed in week 3)
const technologies: Technology[] = [
    { name: 'Laravel', version: '10.x', category: 'Framework', vulnerable: false },
    { name: 'Vue.js', version: '3.4.0', category: 'JavaScript Framework', vulnerable: false },
    { name: 'PHP', version: '8.1.2', category: 'Programming Language', vulnerable: true, cve: 'CVE-2024-1874' },
    { name: 'Apache', version: '2.4.51', category: 'Web Server', vulnerable: true, cve: 'CVE-2021-41773' },
    { name: 'MySQL', version: '8.0.32', category: 'Database', vulnerable: false },
    { name: 'Bootstrap', version: '5.3.0', category: 'CSS Framework', vulnerable: false },
    { name: 'jQuery', version: '3.6.4', category: 'JavaScript Library', vulnerable: false },
    { name: 'Nginx', version: 'N/A', category: 'Web Server (Proxy)', vulnerable: false },
]

// Crawled URLs (Site map — week 3)
const crawledUrls: CrawledUrl[] = [
    { url: 'https://dnsc.edu.ph/', status: 200, method: 'GET', contentType: 'text/html', notes: '' },
    { url: 'https://dnsc.edu.ph/about', status: 200, method: 'GET', contentType: 'text/html', notes: '' },
    { url: 'https://dnsc.edu.ph/contact', status: 200, method: 'GET', contentType: 'text/html', notes: 'Form — no CSRF token' },
    { url: 'https://dnsc.edu.ph/search', status: 200, method: 'GET', contentType: 'text/html', notes: 'Reflected XSS detected' },
    { url: 'https://dnsc.edu.ph/admin', status: 302, method: 'GET', contentType: 'text/html', notes: 'Redirects to /admin/login' },
    { url: 'https://dnsc.edu.ph/admin/login.php', status: 200, method: 'GET', contentType: 'text/html', notes: 'Login form — SQLi detected' },
    { url: 'https://dnsc.edu.ph/portal', status: 200, method: 'GET', contentType: 'text/html', notes: 'Expired SSL cert' },
    { url: 'https://dnsc.edu.ph/api', status: 200, method: 'GET', contentType: 'application/json', notes: 'Self-signed cert; exposed API' },
    { url: 'https://dnsc.edu.ph/api/v1/users', status: 401, method: 'GET', contentType: 'application/json', notes: 'Exposed endpoint — requires auth' },
    { url: 'https://dnsc.edu.ph/uploads/', status: 200, method: 'GET', contentType: 'text/html', notes: 'Directory listing enabled' },
    { url: 'https://dnsc.edu.ph/redirect', status: 302, method: 'GET', contentType: 'text/html', notes: 'Open redirect via ?url= param' },
    { url: 'https://dnsc.edu.ph/robots.txt', status: 200, method: 'GET', contentType: 'text/plain', notes: 'Disallow: /admin, /backup' },
    { url: 'https://dnsc.edu.ph/backup', status: 403, method: 'GET', contentType: 'text/html', notes: 'Forbidden — referenced in robots.txt' },
    { url: 'https://dnsc.edu.ph/sitemap.xml', status: 200, method: 'GET', contentType: 'application/xml', notes: '38 URLs indexed' },
]

// SSL findings (week 4)
const sslFindings: SslFinding[] = [
    { check: 'TLS Version', status: 'fail', detail: 'TLS 1.0 and TLS 1.1 are enabled — deprecated and vulnerable to BEAST/POODLE attacks.' },
    { check: 'TLS 1.2 Support', status: 'pass', detail: 'TLS 1.2 is supported with strong cipher suites.' },
    { check: 'TLS 1.3 Support', status: 'warn', detail: 'TLS 1.3 is not enabled. Strongly recommended for improved performance and security.' },
    { check: 'Certificate Expiry', status: 'fail', detail: 'Certificate on /portal expired Feb 14 2026. Immediate renewal required.' },
    { check: 'Certificate Chain', status: 'fail', detail: 'Incomplete chain on main domain — intermediate CA certificate not served.' },
    { check: 'Self-Signed Certificate', status: 'fail', detail: '/api endpoint uses a self-signed certificate not trusted by any public CA.' },
    { check: 'Cipher Suites', status: 'fail', detail: 'Weak ciphers enabled: TLS_RSA_WITH_RC4_128_SHA, TLS_RSA_WITH_3DES_EDE_CBC_SHA.' },
    { check: 'HSTS Header', status: 'warn', detail: 'Strict-Transport-Security header is missing. Browsers may allow HTTP downgrade.' },
    { check: 'Certificate SANs', status: 'pass', detail: 'Subject Alternative Names include: dnsc.edu.ph, www.dnsc.edu.ph.' },
    { check: 'OCSP Stapling', status: 'warn', detail: 'OCSP Stapling is not configured. Revocation checks add latency for clients.' },
]

const certDetails = {
    subject: 'CN=dnsc.edu.ph, O=Davao Del Norte State College, C=PH',
    issuer: 'CN=Sectigo RSA Domain Validation Secure Server CA, O=Sectigo Limited',
    notBefore: '2025-02-14',
    notAfter: '2026-02-14',
    serialNumber: '4A:2C:19:FF:00:3B:A1:88:DC:44:9F:22:B7:C1:0E:5A',
    signatureAlgorithm: 'sha256WithRSAEncryption',
    keySize: '2048-bit RSA',
    sans: ['dnsc.edu.ph', 'www.dnsc.edu.ph'],
}

const aiSummary = {
    summary: {
        vulnerabilities: `## Executive Summary\n\nThe full scan of **dnsc.edu.ph** identified **12 vulnerabilities** across multiple severity levels. Immediate remediation is required for the SQL Injection finding and all SSL/TLS issues.\n\n### Critical: SQL Injection\n- Found on the admin login endpoint\n- Allows complete database access and authentication bypass\n- **Priority: Fix immediately**\n\n### SSL/TLS Issues (4 findings)\nFour SSL-related findings were detected: weak TLS 1.0/1.1 support, an expired certificate on /portal, an incomplete certificate chain on the main domain, and a self-signed certificate on the /api endpoint.\n\n### Recommendations\n1. Patch SQL Injection with parameterized queries\n2. Renew expired certificate on /portal\n3. Fix incomplete certificate chain\n4. Disable TLS 1.0 and TLS 1.1\n5. Replace self-signed cert on /api`,
        tech: `## Detected Technology Stack\n\n- **Laravel 10.x** — PHP web framework\n- **Vue.js 3.4.0** — Frontend framework\n- **Apache 2.4.51** — Web server (outdated, CVE-2021-41773 applicable)\n- **PHP 8.1.2** — Runtime (CVE-2024-1874 applicable)\n- **MySQL 8.0.32** — Database (current)\n\n### Risk Notes\nTwo components have known CVEs: Apache 2.4.51 and PHP 8.1.2. Updating both is strongly recommended.`,
    }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getSeverityStyle(severity: string) {
    return { backgroundColor: getSeverityColor(severity), color: '#ffffff', border: 'none' }
}

function mapSeverityToNumber(sev: string) {
    const m: Record<string, number> = { critical: 5, high: 4, medium: 3, low: 2, informational: 1 }
    return m[sev?.toLowerCase()] ?? 0
}

function statusColor(code: number) {
    if (code >= 200 && code < 300) return 'text-green-600'
    if (code >= 300 && code < 400) return 'text-blue-600'
    if (code >= 400 && code < 500) return 'text-yellow-600'
    return 'text-destructive'
}

function sslStatusIcon(status: SslFinding['status']) {
    if (status === 'pass') return { component: CheckCircle2, class: 'text-green-600' }
    if (status === 'warn') return { component: AlertTriangle, class: 'text-yellow-500' }
    return { component: ShieldX, class: 'text-destructive' }
}

// ─── Vuln table with expandable rows ──────────────────────────────────────────

const expandedRows = ref<Set<string>>(new Set())
const globalFilter = ref('')
const columnFilters = ref<ColumnFiltersState>([])

function toggleRow(id: string) {
    const next = new Set(expandedRows.value)
    next.has(id) ? next.delete(id) : next.add(id)
    expandedRows.value = next
}

const severityOptions = [
    { label: 'Critical', value: 'Critical' },
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
    { label: 'Informational', value: 'Informational' },
]
const scannerOptions = [
    { label: 'Wapiti', value: 'Wapiti' },
    { label: 'ZAP', value: 'ZAP' },
    { label: 'Nuclei', value: 'Nuclei' },
]

const columns: ColumnDef<SampleVuln>[] = [
    {
        id: 'expand',
        header: '',
        cell: ({ row }) => h(Button, {
            variant: 'ghost', size: 'sm',
            class: 'h-6 w-6 p-0',
            onClick: () => toggleRow(row.original.id),
        }, () => h(expandedRows.value.has(row.original.id) ? ChevronDown : ChevronRight, { class: 'h-4 w-4' })),
    },
    {
        accessorKey: 'severity',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Severity' }),
        cell: ({ row }) => h(Badge, { style: getSeverityStyle(row.getValue('severity')), class: 'whitespace-nowrap' }, () => row.getValue('severity')),
        sortingFn: (a, b) => mapSeverityToNumber(b.original.severity) - mapSeverityToNumber(a.original.severity),
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
        accessorKey: 'type',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Vulnerability' }),
        cell: ({ row }) => h('span', { class: 'font-medium' }, row.getValue('type')),
    },
    {
        accessorKey: 'scanner',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Scanner' }),
        cell: ({ row }) => h(Badge, { variant: 'outline' }, () => row.getValue('scanner')),
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
        accessorKey: 'method',
        header: 'Method',
        cell: ({ row }) => h('code', { class: 'text-xs bg-muted px-1.5 py-0.5 rounded' }, row.getValue('method')),
    },
    {
        accessorKey: 'endpoint',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Endpoint' }),
        cell: ({ row }) => h('code', { class: 'text-xs font-mono text-muted-foreground max-w-[200px] block truncate' }, row.getValue('endpoint')),
    },
    {
        accessorKey: 'confidence',
        header: 'Confidence',
        cell: ({ row }) => h('span', { class: 'text-sm text-muted-foreground' }, row.getValue('confidence')),
    },
]

const table = useVueTable({
    get data() { return sampleVulns },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { sorting: [{ id: 'severity', desc: false }], pagination: { pageSize: 15 } },
    state: {
        get globalFilter() { return globalFilter.value },
        get columnFilters() { return columnFilters.value },
    },
    onGlobalFilterChange: (u) => (globalFilter.value = typeof u === 'function' ? u(globalFilter.value) : u),
    onColumnFiltersChange: (u) => (columnFilters.value = typeof u === 'function' ? u(columnFilters.value) : u),
})

const isFiltered = computed(() => columnFilters.value.length > 0)
function resetFilters() { table.resetColumnFilters() }

// SSL summary counts
const sslSummary = computed(() => ({
    fail: sslFindings.filter(f => f.status === 'fail').length,
    warn: sslFindings.filter(f => f.status === 'warn').length,
    pass: sslFindings.filter(f => f.status === 'pass').length,
}))

// Tech counts
const vulnerableTechCount = technologies.filter(t => t.vulnerable).length
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-6 p-4 pt-0">

            <!-- Page header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 class="font-bold px-2 text-4xl">Scan Report</h1>
                    <div class="flex gap-4 px-2 mt-1 text-sm text-muted-foreground">
                        <span><strong class="text-foreground">ID:</strong> {{ scanMeta.id }}</span>
                        <span><strong class="text-foreground">Date:</strong> {{ new Date(scanMeta.scanDate).toLocaleString() }}</span>
                    </div>
                </div>
                <div class="flex gap-2 px-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <Button variant="outline">
                                <Download class="mr-2 h-4 w-4" /> Export Report
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem><FileText class="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem>
                            <DropdownMenuItem><FileSpreadsheet class="mr-2 h-4 w-4" /> Export as Excel</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <!-- Summary card -->
            <Card>
                <CardHeader>
                    <CardTitle class="text-2xl">Full Scan Report</CardTitle>
                    <CardDescription class="pt-2">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-1 text-sm">
                            <div><strong>Target:</strong> {{ scanMeta.target }}</div>
                            <div><strong>Tools:</strong> {{ scanMeta.tools.join(', ') }}</div>
                            <div><strong>Location:</strong> {{ scanMeta.country }}</div>
                            <div><strong>IP:</strong> {{ scanMeta.ip }}</div>
                        </div>
                    </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent class="pt-6">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="rounded-lg border p-4">
                            <h3 class="text-sm font-medium text-muted-foreground">Total Findings</h3>
                            <p class="text-3xl font-bold">{{ sampleVulns.length }}</p>
                        </div>
                        <div class="rounded-lg border p-4">
                            <h3 class="text-sm font-medium text-muted-foreground">Critical / High</h3>
                            <p class="text-3xl font-bold text-destructive">
                                {{ sampleVulns.filter(v => ['Critical','High'].includes(v.severity)).length }}
                            </p>
                        </div>
                        <div class="rounded-lg border p-4">
                            <h3 class="text-sm font-medium text-muted-foreground">Technologies</h3>
                            <p class="text-3xl font-bold">{{ technologies.length }}</p>
                        </div>
                        <div class="rounded-lg border p-4">
                            <h3 class="text-sm font-medium text-muted-foreground">Top Vulnerability</h3>
                            <p class="text-lg font-bold leading-tight mt-1">SQL Injection</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- AI Summary -->
            <ScanAISummary :summary="aiSummary" />

            <!-- Charts -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SeverityPieChart :vulnerabilities="sampleVulns as any" />
                <ScannerBarChart :vulnerabilities="sampleVulns as any" scan-type="Full Scan" />
            </div>

            <!-- Main tabs: Vulnerabilities / Technologies / Site Map / SSL Analysis -->
            <Tabs default-value="vulns">
                <TabsList class="mb-2">
                    <TabsTrigger value="vulns">Vulnerabilities</TabsTrigger>
                    <TabsTrigger value="tech">
                        Technologies
                        <Badge v-if="vulnerableTechCount > 0" variant="destructive" class="ml-2 text-xs px-1.5 py-0">{{ vulnerableTechCount }}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="sitemap">Site Map</TabsTrigger>
                    <TabsTrigger value="ssl">
                        SSL Analysis
                        <Badge v-if="sslSummary.fail > 0" variant="destructive" class="ml-2 text-xs px-1.5 py-0">{{ sslSummary.fail }}</Badge>
                    </TabsTrigger>
                </TabsList>

                <!-- ── Vulnerabilities tab ── -->
                <TabsContent value="vulns">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vulnerabilities Detected</CardTitle>
                            <CardDescription>Click any row to expand full details — description, solution, and evidence.</CardDescription>
                        </CardHeader>
                        <Separator />
                        <CardContent class="pt-4 space-y-4">
                            <div class="flex flex-wrap items-center gap-2">
                                <Input
                                    placeholder="Search vulnerabilities..."
                                    v-model="globalFilter"
                                    class="h-8 w-[200px] lg:w-[260px]"
                                />
                                <FacetedFilter
                                    v-if="table.getColumn('severity')"
                                    :column="table.getColumn('severity')"
                                    title="Severity"
                                    :options="severityOptions"
                                />
                                <FacetedFilter
                                    v-if="table.getColumn('scanner')"
                                    :column="table.getColumn('scanner')"
                                    title="Scanner"
                                    :options="scannerOptions"
                                />
                                <Button v-if="isFiltered" variant="ghost" @click="resetFilters" class="h-8 px-2">
                                    Reset
                                </Button>
                            </div>

                            <div class="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow v-for="hg in table.getHeaderGroups()" :key="hg.id">
                                            <TableHead v-for="h in hg.headers" :key="h.id">
                                                <FlexRender :render="h.column.columnDef.header" :props="h.getContext()" />
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <template v-if="table.getRowModel().rows.length">
                                            <template v-for="row in table.getRowModel().rows" :key="row.id">
                                                <!-- Main row -->
                                                <TableRow
                                                    class="cursor-pointer hover:bg-muted/50"
                                                    :class="{ 'bg-muted/30': expandedRows.has(row.original.id) }"
                                                    @click="toggleRow(row.original.id)"
                                                >
                                                    <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="py-3">
                                                        <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                                    </TableCell>
                                                </TableRow>

                                                <!-- Expanded detail row -->
                                                <TableRow v-if="expandedRows.has(row.original.id)" class="hover:bg-transparent">
                                                    <TableCell :colSpan="columns.length" class="px-6 pb-5 pt-0 bg-muted/20">
                                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                                            <div class="space-y-1">
                                                                <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</p>
                                                                <p class="text-sm leading-relaxed">{{ row.original.description }}</p>
                                                            </div>
                                                            <div class="space-y-1">
                                                                <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Solution</p>
                                                                <p class="text-sm leading-relaxed">{{ row.original.solution }}</p>
                                                            </div>
                                                            <div class="space-y-1">
                                                                <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Evidence</p>
                                                                <pre class="text-xs bg-background border rounded-md p-3 font-mono whitespace-pre-wrap break-all leading-relaxed">{{ row.original.evidence }}</pre>
                                                                <a
                                                                    v-if="row.original.reference"
                                                                    :href="row.original.reference"
                                                                    target="_blank"
                                                                    class="text-xs text-blue-600 hover:underline mt-1 block truncate"
                                                                >
                                                                    {{ row.original.reference }}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </template>
                                        </template>
                                        <template v-else>
                                            <TableRow>
                                                <TableCell :colSpan="columns.length" class="h-24 text-center text-muted-foreground">
                                                    No results found.
                                                </TableCell>
                                            </TableRow>
                                        </template>
                                    </TableBody>
                                </Table>
                            </div>
                            <DataTablePagination :table="table" />
                        </CardContent>
                    </Card>
                </TabsContent>

                <!-- ── Technologies tab ── -->
                <TabsContent value="tech">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detected Technologies</CardTitle>
                            <CardDescription>
                                Fingerprinted via WhatWeb and Wappalyzer database.
                                <span v-if="vulnerableTechCount > 0" class="text-destructive font-medium">
                                    {{ vulnerableTechCount }} component(s) have known CVEs.
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <Separator />
                        <CardContent class="pt-4">
                            <div class="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Technology</TableHead>
                                            <TableHead>Version</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>CVE</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow v-for="tech in technologies" :key="tech.name">
                                            <TableCell class="font-medium">{{ tech.name }}</TableCell>
                                            <TableCell>
                                                <code class="text-xs bg-muted px-1.5 py-0.5 rounded">{{ tech.version }}</code>
                                            </TableCell>
                                            <TableCell class="text-sm text-muted-foreground">{{ tech.category }}</TableCell>
                                            <TableCell>
                                                <Badge :variant="tech.vulnerable ? 'destructive' : 'secondary'">
                                                    {{ tech.vulnerable ? 'Vulnerable' : 'OK' }}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span v-if="tech.cve" class="text-xs text-destructive font-mono">{{ tech.cve }}</span>
                                                <span v-else class="text-xs text-muted-foreground">—</span>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <!-- ── Site Map tab ── -->
                <TabsContent value="sitemap">
                    <Card>
                        <CardHeader>
                            <CardTitle>Crawled URLs</CardTitle>
                            <CardDescription>
                                {{ crawledUrls.length }} URLs discovered during web crawl of {{ scanMeta.target }}.
                                Stale, exposed, and flagged endpoints are highlighted.
                            </CardDescription>
                        </CardHeader>
                        <Separator />
                        <CardContent class="pt-4">
                            <div class="rounded-md border overflow-x-auto">
                                <Table class="min-w-[700px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>URL</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Content-Type</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow v-for="u in crawledUrls" :key="u.url">
                                            <TableCell>
                                                <code class="text-xs font-mono text-muted-foreground">{{ u.url }}</code>
                                            </TableCell>
                                            <TableCell>
                                                <code class="text-xs bg-muted px-1.5 py-0.5 rounded">{{ u.method }}</code>
                                            </TableCell>
                                            <TableCell>
                                                <span :class="['font-mono text-sm font-medium', statusColor(u.status)]">
                                                    {{ u.status }}
                                                </span>
                                            </TableCell>
                                            <TableCell class="text-xs text-muted-foreground">{{ u.contentType }}</TableCell>
                                            <TableCell>
                                                <span v-if="u.notes" class="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-900">
                                                    {{ u.notes }}
                                                </span>
                                                <span v-else class="text-muted-foreground text-xs">—</span>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <!-- ── SSL Analysis tab ── -->
                <TabsContent value="ssl">
                    <div class="space-y-4">

                        <!-- Certificate details -->
                        <Card>
                            <CardHeader>
                                <div class="flex items-center gap-2">
                                    <Lock class="h-5 w-5 text-muted-foreground" />
                                    <CardTitle>Certificate Details</CardTitle>
                                </div>
                                <CardDescription>Primary certificate for {{ scanMeta.target }}</CardDescription>
                            </CardHeader>
                            <Separator />
                            <CardContent class="pt-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                                    <div class="flex gap-2">
                                        <span class="text-muted-foreground min-w-[160px]">Subject</span>
                                        <span class="font-mono text-xs break-all">{{ certDetails.subject }}</span>
                                    </div>
                                    <div class="flex gap-2">
                                        <span class="text-muted-foreground min-w-[160px]">Issuer</span>
                                        <span class="font-mono text-xs break-all">{{ certDetails.issuer }}</span>
                                    </div>
                                    <div class="flex gap-2">
                                        <span class="text-muted-foreground min-w-[160px]">Valid From</span>
                                        <span>{{ certDetails.notBefore }}</span>
                                    </div>
                                    <div class="flex gap-2">
                                        <span class="text-muted-foreground min-w-[160px]">Valid Until</span>
                                        <span class="text-destructive font-medium">{{ certDetails.notAfter }} ← EXPIRED on /portal</span>
                                    </div>
                                    <div class="flex gap-2">
                                        <span class="text-muted-foreground min-w-[160px]">Serial Number</span>
                                        <code class="text-xs font-mono">{{ certDetails.serialNumber }}</code>
                                    </div>
                                    <div class="flex gap-2">
                                        <span class="text-muted-foreground min-w-[160px]">Signature Algorithm</span>
                                        <span>{{ certDetails.signatureAlgorithm }}</span>
                                    </div>
                                    <div class="flex gap-2">
                                        <span class="text-muted-foreground min-w-[160px]">Key Size</span>
                                        <span>{{ certDetails.keySize }}</span>
                                    </div>
                                    <div class="flex gap-2">
                                        <span class="text-muted-foreground min-w-[160px]">SANs</span>
                                        <div class="flex flex-wrap gap-1">
                                            <code v-for="san in certDetails.sans" :key="san" class="text-xs bg-muted px-1.5 py-0.5 rounded">{{ san }}</code>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <!-- SSL checks summary -->
                        <div class="grid grid-cols-3 gap-4">
                            <div class="rounded-lg border p-4 flex items-center gap-3">
                                <ShieldX class="h-8 w-8 text-destructive flex-shrink-0" />
                                <div>
                                    <p class="text-2xl font-bold text-destructive">{{ sslSummary.fail }}</p>
                                    <p class="text-sm text-muted-foreground">Critical issues</p>
                                </div>
                            </div>
                            <div class="rounded-lg border p-4 flex items-center gap-3">
                                <AlertTriangle class="h-8 w-8 text-yellow-500 flex-shrink-0" />
                                <div>
                                    <p class="text-2xl font-bold text-yellow-600">{{ sslSummary.warn }}</p>
                                    <p class="text-sm text-muted-foreground">Warnings</p>
                                </div>
                            </div>
                            <div class="rounded-lg border p-4 flex items-center gap-3">
                                <ShieldCheck class="h-8 w-8 text-green-600 flex-shrink-0" />
                                <div>
                                    <p class="text-2xl font-bold text-green-600">{{ sslSummary.pass }}</p>
                                    <p class="text-sm text-muted-foreground">Passed</p>
                                </div>
                            </div>
                        </div>

                        <!-- SSL checks table -->
                        <Card>
                            <CardHeader>
                                <CardTitle>SSL / TLS Checks</CardTitle>
                                <CardDescription>Enumerated configuration and certificate analysis</CardDescription>
                            </CardHeader>
                            <Separator />
                            <CardContent class="pt-4">
                                <div class="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead class="w-10"></TableHead>
                                                <TableHead>Check</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Detail</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow v-for="finding in sslFindings" :key="finding.check">
                                                <TableCell>
                                                    <component
                                                        :is="sslStatusIcon(finding.status).component"
                                                        :class="['h-4 w-4', sslStatusIcon(finding.status).class]"
                                                    />
                                                </TableCell>
                                                <TableCell class="font-medium">{{ finding.check }}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        :variant="finding.status === 'pass' ? 'secondary' : finding.status === 'warn' ? 'outline' : 'destructive'"
                                                        class="capitalize"
                                                    >
                                                        {{ finding.status === 'pass' ? 'Pass' : finding.status === 'warn' ? 'Warning' : 'Fail' }}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell class="text-sm text-muted-foreground">{{ finding.detail }}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </TabsContent>

            </Tabs>

        </div>
    </Navigation>
</template>
