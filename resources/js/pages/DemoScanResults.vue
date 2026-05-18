<script setup lang="ts">
import { ref, computed } from 'vue'
import Navigation from '@/components/custom/Navigation.vue'
import SeverityPieChart from '@/components/custom/Charts/SeverityPieChart.vue'
import ScannerBarChart from '@/components/custom/Charts/ScannerBarChart.vue'
import ScanAISummary from '@/components/custom/Scan/ScanAISummary.vue'
import {
    FlexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    useVueTable,
    type ColumnDef,
    type ColumnFiltersState,
} from '@tanstack/vue-table'
import { h, computed as vComputed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, FileText, FileSpreadsheet } from 'lucide-vue-next'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue'
import DataTablePagination from '@/components/custom/DataTablePagination.vue'
import FacetedFilter from '@/components/custom/FacetedFilter.vue'
import { getSeverityColor } from '@/lib/colors'
import type { Vulnerability } from '@/lib/restack/restack.types'

// ─── Hardcoded sample data ────────────────────────────────────────────────────

const scanMeta = {
    target: 'dnsc.edu.ph',
    scanType: 'Full Scan',
    tools: ['Wapiti', 'ZAP', 'Nuclei'],
    country: 'Philippines',
    ip: '202.90.136.12',
    duration: 847,
}

const sampleVulnerabilities: Vulnerability[] = [
    {
        id: '1', type: 'SQL Injection', severity: 'Critical', scanner: 'Wapiti',
        confidence: 'High', method: 'POST', endpoint: '/admin/login.php',
        description: 'SQL injection allows an attacker to alter SQL queries sent to the database. Successful exploitation can lead to data exfiltration, modification, or deletion.',
        solution: 'Use parameterized queries or prepared statements. Never concatenate user input directly into SQL strings.',
        reference: '{"OWASP A03:2021":"https://owasp.org/Top10/A03_2021-Injection/"}',
        exploit: "username=admin' OR '1'='1",
        http_request: "POST /admin/login.php HTTP/1.1\nHost: dnsc.edu.ph\n\nusername=admin'+OR+'1'%3D'1&password=test",
        curl_command: "curl -X POST https://dnsc.edu.ph/admin/login.php -d \"username=admin' OR '1'='1&password=test\"",
        wstg: ['WSTG-INPV-05'],
    },
    {
        id: '2', type: 'Weak SSL/TLS Configuration', severity: 'High', scanner: 'Nuclei',
        confidence: 'High', method: 'GET', endpoint: '/',
        description: 'The server supports TLS 1.0 and TLS 1.1 which are deprecated and vulnerable to known attacks such as BEAST and POODLE. Additionally, weak cipher suites (RC4, DES) are enabled.',
        solution: 'Disable TLS 1.0 and TLS 1.1. Configure the server to use TLS 1.2 or 1.3 only with strong cipher suites. Use tools like ssl-enum-ciphers to verify the configuration.',
        reference: '{"NIST SP 800-52r2":"https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-52r2.pdf"}',
        exploit: 'TLS 1.0 enabled; Cipher: TLS_RSA_WITH_RC4_128_SHA',
        wstg: ['WSTG-CRYP-01'],
    },
    {
        id: '3', type: 'SSL Certificate Misconfiguration', severity: 'High', scanner: 'Nuclei',
        confidence: 'High', method: 'GET', endpoint: '/',
        description: 'The SSL certificate presented by the server has issues: the certificate chain is incomplete, the intermediate CA certificate is missing. This may cause trust errors in some browsers.',
        solution: 'Configure the web server to serve the full certificate chain including intermediate CA certificates. Obtain a correctly issued certificate from a trusted CA.',
        reference: '{"Mozilla SSL Config":"https://ssl-config.mozilla.org/"}',
        exploit: 'Certificate chain: depth=0 CN=dnsc.edu.ph (leaf only, no intermediate)',
        wstg: ['WSTG-CRYP-01'],
    },
    {
        id: '4', type: 'Cross-Site Scripting (Reflected)', severity: 'High', scanner: 'ZAP',
        confidence: 'Medium', method: 'GET', endpoint: '/search?q=',
        description: 'Reflected XSS occurs when user input is immediately included in the page response without proper encoding. An attacker can craft a malicious URL to execute scripts in a victim\'s browser.',
        solution: 'Encode all user-controlled output using context-aware escaping. Implement a Content Security Policy (CSP) header to restrict script execution.',
        reference: '{"OWASP XSS Prevention":"https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html"}',
        exploit: '<script>alert(1)<\/script>',
        wstg: ['WSTG-INPV-01'],
    },
    {
        id: '5', type: 'Expired SSL Certificate', severity: 'High', scanner: 'Nuclei',
        confidence: 'High', method: 'GET', endpoint: '/portal',
        description: 'The SSL certificate for the /portal subdirectory has expired. Expired certificates cannot be trusted and may expose users to man-in-the-middle attacks. Browsers will display security warnings.',
        solution: 'Renew the SSL certificate immediately. Set up automated certificate renewal using Let\'s Encrypt with certbot or a similar ACME client.',
        reference: '{"Let\'s Encrypt":"https://letsencrypt.org/docs/"}',
        exploit: 'Certificate expired: NotAfter: Feb 14 00:00:00 2026 GMT',
        wstg: ['WSTG-CRYP-01'],
    },
    {
        id: '6', type: 'Missing CSRF Protection', severity: 'Medium', scanner: 'Wapiti',
        confidence: 'Medium', method: 'POST', endpoint: '/contact',
        description: 'The form at /contact does not include a CSRF token. An attacker could trick authenticated users into submitting forged requests, potentially sending spam or changing account data.',
        solution: 'Implement CSRF tokens in all state-changing forms. Laravel provides built-in CSRF protection via the @csrf blade directive.',
        reference: '{"OWASP CSRF":"https://owasp.org/www-community/attacks/csrf"}',
        exploit: 'No X-CSRF-Token or _token field detected in POST body',
        wstg: ['WSTG-SESS-05'],
    },
    {
        id: '7', type: 'Open Redirect', severity: 'Medium', scanner: 'ZAP',
        confidence: 'Medium', method: 'GET', endpoint: '/redirect?url=',
        description: 'The application redirects users to URLs provided in the ?url= parameter without validation. Attackers can use this to redirect users to phishing sites while making the link appear legitimate.',
        solution: 'Validate redirect URLs against an allowlist of trusted domains. Avoid using user-supplied input for redirect destinations.',
        reference: '{"OWASP Unvalidated Redirects":"https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html"}',
        exploit: '/redirect?url=https://malicious.example.com',
        wstg: ['WSTG-CLNT-04'],
    },
    {
        id: '8', type: 'Server Information Disclosure', severity: 'Low', scanner: 'Wapiti',
        confidence: 'High', method: 'GET', endpoint: '/',
        description: 'The HTTP response headers expose the web server version (Apache/2.4.51) and PHP version (PHP/8.1.2). This information assists attackers in identifying known vulnerabilities.',
        solution: 'Remove or obfuscate the Server and X-Powered-By headers. In Apache, use ServerTokens Prod and ServerSignature Off in httpd.conf.',
        reference: '{}',
        exploit: 'Server: Apache/2.4.51 (Ubuntu)\nX-Powered-By: PHP/8.1.2',
        wstg: ['WSTG-INFO-02'],
    },
    {
        id: '9', type: 'Missing Security Headers', severity: 'Low', scanner: 'ZAP',
        confidence: 'High', method: 'GET', endpoint: '/',
        description: 'Several recommended HTTP security headers are absent: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.',
        solution: 'Add the missing security headers to all HTTP responses. In Laravel, use a middleware to set headers globally.',
        reference: '{"OWASP Headers":"https://owasp.org/www-project-secure-headers/"}',
        exploit: 'Missing: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options',
        wstg: ['WSTG-CONF-07'],
    },
    {
        id: '10', type: 'Self-Signed SSL Certificate', severity: 'Medium', scanner: 'Nuclei',
        confidence: 'High', method: 'GET', endpoint: '/api',
        description: 'The /api endpoint uses a self-signed SSL certificate not issued by a trusted Certificate Authority. This prevents proper authentication of the server and may expose the API to MITM attacks.',
        solution: 'Replace the self-signed certificate with one issued by a trusted CA. For internal APIs, use a private CA whose root certificate is distributed to all clients.',
        reference: '{}',
        exploit: 'Issuer: CN=dnsc.edu.ph (self-signed)',
        wstg: ['WSTG-CRYP-01'],
    },
    {
        id: '11', type: 'Directory Listing Enabled', severity: 'Low', scanner: 'Wapiti',
        confidence: 'High', method: 'GET', endpoint: '/uploads/',
        description: 'Directory listing is enabled on /uploads/, exposing all uploaded files to unauthenticated users. This may reveal sensitive documents and user-uploaded content.',
        solution: 'Disable directory listing in Apache with "Options -Indexes" or equivalent for your web server.',
        reference: '{}',
        exploit: 'HTTP 200 response with Index of /uploads/ listing',
        wstg: ['WSTG-CONF-03'],
    },
    {
        id: '12', type: 'Cookie Without Secure Flag', severity: 'Informational', scanner: 'ZAP',
        confidence: 'High', method: 'GET', endpoint: '/',
        description: 'Session cookies are set without the Secure flag, which means they can be transmitted over unencrypted HTTP connections, potentially exposing them to interception.',
        solution: 'Set the Secure flag on all cookies that should only be sent over HTTPS.',
        reference: '{}',
        exploit: 'Set-Cookie: laravel_session=abc123; path=/; httponly (missing Secure flag)',
        wstg: ['WSTG-SESS-02'],
    },
]

const summaryStats = {
    scannerAgreementRate: '72.3%',
    confidenceRate: '68.5%',
    highConfidenceVulns: 6,
    mediumConfidenceVulns: 4,
    lowConfidenceVulns: 2,
}

const aiSummary = {
    summary: {
        vulnerabilities: `## Executive Summary\n\nThe full scan of **dnsc.edu.ph** identified **12 vulnerabilities** across multiple severity levels. The most critical findings require immediate attention.\n\n### Critical Findings\n- **SQL Injection** on the admin login endpoint poses the highest risk, potentially allowing complete database compromise.\n\n### SSL/TLS Issues (3 findings)\nThree separate SSL/TLS issues were detected, including weak cipher support, an expired certificate on /portal, and a self-signed certificate on the API endpoint. These collectively weaken transport security.\n\n### Recommendations\n1. Patch the SQL Injection immediately\n2. Renew the expired SSL certificate\n3. Disable TLS 1.0/1.1 and weak ciphers\n4. Implement missing CSRF tokens`,
        tech: `## Technology Stack\n\n| Component | Version | Notes |\n|-----------|---------|-------|\n| Apache | 2.4.51 | Outdated, update recommended |\n| PHP | 8.1.2 | EOL approaching |\n| Laravel | 10.x | Up to date |\n| MySQL | 8.0 | Current |\n\n### Risk Assessment\nThe exposed Apache and PHP version strings increase attack surface. Recommend obfuscating server headers.`,
    }
}

// ─── Table setup ──────────────────────────────────────────────────────────────

function getSeverityStyle(severity: string) {
    return { backgroundColor: getSeverityColor(severity), color: '#ffffff', border: 'none' }
}

function mapSeverityToNumber(sev: string) {
    switch (sev?.toLowerCase()) {
        case 'critical': return 5
        case 'high': return 4
        case 'medium': return 3
        case 'low': return 2
        default: return 1
    }
}

const globalFilter = ref('')
const columnFilters = ref<ColumnFiltersState>([])

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

const columns: ColumnDef<Vulnerability>[] = [
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
        cell: ({ row }) => h('div', { class: 'font-medium min-w-[180px] max-w-[220px]' }, row.getValue('type')),
    },
    {
        accessorKey: 'scanner',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Scanner' }),
        cell: ({ row }) => h(Badge, { variant: 'outline', class: 'whitespace-nowrap' }, () => row.getValue('scanner')),
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
        accessorKey: 'confidence',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Confidence' }),
        cell: ({ row }) => h('span', { class: 'text-sm text-muted-foreground whitespace-nowrap' }, row.getValue('confidence')),
    },
    {
        accessorKey: 'method',
        header: 'Method',
        cell: ({ row }) => h('code', { class: 'text-xs bg-muted px-1.5 py-0.5 rounded' }, row.getValue('method')),
    },
    {
        accessorKey: 'endpoint',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Endpoint' }),
        cell: ({ row }) => h('code', { class: 'text-xs font-mono text-muted-foreground min-w-[160px] block' }, row.getValue('endpoint')),
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
            const desc = row.getValue('description') as string
            return h('p', { class: 'text-xs text-muted-foreground min-w-[260px] max-w-[340px] leading-relaxed' },
                desc?.length > 120 ? desc.slice(0, 120) + '…' : desc
            )
        },
    },
    {
        accessorKey: 'exploit',
        header: 'Evidence',
        cell: ({ row }) => {
            const exploit = row.getValue('exploit') as string
            if (!exploit || exploit === 'N/A') return h('span', { class: 'text-muted-foreground text-xs' }, '—')
            return h('code', { class: 'text-xs font-mono bg-muted px-1.5 py-0.5 rounded block min-w-[160px] max-w-[240px] truncate' }, exploit)
        },
    },
]

const table = useVueTable({
    get data() { return sampleVulnerabilities },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { sorting: [{ id: 'severity', desc: false }], pagination: { pageSize: 10 } },
    state: {
        get globalFilter() { return globalFilter.value },
        get columnFilters() { return columnFilters.value },
    },
    onGlobalFilterChange: (u) => (globalFilter.value = typeof u === 'function' ? u(globalFilter.value) : u),
    onColumnFiltersChange: (u) => (columnFilters.value = typeof u === 'function' ? u(columnFilters.value) : u),
})

const isFiltered = computed(() => columnFilters.value.length > 0)
function resetFilters() { table.resetColumnFilters() }

const criticalHighCount = sampleVulnerabilities.filter(v => ['Critical', 'High'].includes(v.severity)).length
const topVuln = sampleVulnerabilities[0]?.type ?? 'N/A'
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">

            <!-- Page header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 class="font-bold px-2 text-4xl">Scan Results</h1>
                    <div class="p-1.5 text-sm text-muted-foreground">
                        Full vulnerability scan completed for <span class="font-medium text-foreground">{{ scanMeta.target }}</span>
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
                    <CardTitle class="text-2xl">{{ scanMeta.scanType }} Report</CardTitle>
                    <CardDescription class="pt-2">
                        <div class="grid grid-cols-1 gap-1 text-sm md:grid-cols-4">
                            <div><strong>Target:</strong> {{ scanMeta.target }}</div>
                            <div><strong>Tools:</strong> {{ scanMeta.tools.join(', ') }}</div>
                            <div><strong>Location:</strong> {{ scanMeta.country }}</div>
                            <div><strong>IP:</strong> {{ scanMeta.ip }}</div>
                        </div>
                    </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent class="pt-6">
                    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div class="rounded-lg border p-4">
                            <h3 class="text-muted-foreground text-sm font-medium">Total Findings</h3>
                            <p class="text-3xl font-bold">{{ sampleVulnerabilities.length }}</p>
                        </div>
                        <div class="rounded-lg border p-4">
                            <h3 class="text-muted-foreground text-sm font-medium">Critical / High</h3>
                            <p class="text-3xl font-bold text-destructive">{{ criticalHighCount }}</p>
                        </div>
                        <div class="rounded-lg border p-4">
                            <h3 class="text-muted-foreground text-sm font-medium">Technologies</h3>
                            <p class="text-3xl font-bold">4</p>
                        </div>
                        <div class="rounded-lg border p-4">
                            <h3 class="text-muted-foreground text-sm font-medium">Top Vulnerability</h3>
                            <p class="text-lg font-bold leading-tight mt-1">{{ topVuln }}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Scan quality card -->
            <Card>
                <CardHeader>
                    <CardTitle>Scan Quality</CardTitle>
                    <CardDescription>How reliable are these findings?</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent class="pt-6">
                    <div class="grid grid-cols-2 gap-4 md:grid-cols-5">
                        <div class="rounded-lg border p-4">
                            <h3 class="text-muted-foreground text-sm font-medium">Match Rate</h3>
                            <p class="text-2xl font-bold">{{ summaryStats.scannerAgreementRate }}</p>
                            <p class="text-xs text-muted-foreground mt-1">Tools agreed</p>
                        </div>
                        <div class="rounded-lg border p-4">
                            <h3 class="text-muted-foreground text-sm font-medium">Reliability</h3>
                            <p class="text-2xl font-bold">{{ summaryStats.confidenceRate }}</p>
                            <p class="text-xs text-muted-foreground mt-1">Overall score</p>
                        </div>
                        <div class="rounded-lg border p-4">
                            <h3 class="text-muted-foreground text-sm font-medium">Verified</h3>
                            <p class="text-2xl font-bold text-green-600">{{ summaryStats.highConfidenceVulns }}</p>
                            <p class="text-xs text-muted-foreground mt-1">Confirmed</p>
                        </div>
                        <div class="rounded-lg border p-4">
                            <h3 class="text-muted-foreground text-sm font-medium">Likely</h3>
                            <p class="text-2xl font-bold text-yellow-600">{{ summaryStats.mediumConfidenceVulns }}</p>
                            <p class="text-xs text-muted-foreground mt-1">Probable</p>
                        </div>
                        <div class="rounded-lg border p-4">
                            <h3 class="text-muted-foreground text-sm font-medium">Uncertain</h3>
                            <p class="text-2xl font-bold text-orange-600">{{ summaryStats.lowConfidenceVulns }}</p>
                            <p class="text-xs text-muted-foreground mt-1">Needs check</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- AI Summary -->
            <ScanAISummary :summary="aiSummary" />

            <!-- Charts -->
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <SeverityPieChart :vulnerabilities="sampleVulnerabilities" />
                <ScannerBarChart :vulnerabilities="sampleVulnerabilities" scan-type="Full Scan" />
            </div>

            <!-- Vulnerability table (wide / scrollable, no drawer) -->
            <Card>
                <CardHeader>
                    <CardTitle>Vulnerabilities Detected</CardTitle>
                    <CardDescription>All findings from Wapiti, ZAP, and Nuclei</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent class="pt-4 space-y-4">

                    <!-- Filters -->
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
                        <Button
                            v-if="isFiltered"
                            variant="ghost"
                            @click="resetFilters"
                            class="h-8 px-2 lg:px-3"
                        >
                            Reset Filters
                        </Button>
                    </div>

                    <!-- Scrollable table -->
                    <div class="rounded-md border overflow-x-auto">
                        <Table class="min-w-[1100px]">
                            <TableHeader>
                                <TableRow v-for="hg in table.getHeaderGroups()" :key="hg.id">
                                    <TableHead v-for="h in hg.headers" :key="h.id">
                                        <FlexRender :render="h.column.columnDef.header" :props="h.getContext()" />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow v-if="!table.getRowModel().rows.length">
                                    <TableCell :colSpan="columns.length" class="h-24 text-center text-muted-foreground">
                                        No results found.
                                    </TableCell>
                                </TableRow>
                                <TableRow
                                    v-for="row in table.getRowModel().rows"
                                    :key="row.id"
                                    class="hover:bg-muted/50 align-top"
                                >
                                    <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="py-3">
                                        <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    <DataTablePagination :table="table" />
                </CardContent>
            </Card>

        </div>
    </Navigation>
</template>

