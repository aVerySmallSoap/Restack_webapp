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
import { AlertCircle, Download, FileSpreadsheet, FileText } from 'lucide-vue-next'
import Navigation from '@/components/custom/Navigation.vue'
import FullScanDetailDrawer from '@/components/custom/FullScanDetailDrawer.vue'
import BasicScanDetailDrawer from '@/components/custom/BasicScanDetailDrawer.vue'
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue'
import DataTablePagination from '@/components/custom/DataTablePagination.vue'
import FacetedFilter from '@/components/custom/FacetedFilter.vue'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import SeverityPieChart from '@/components/custom/Charts/SeverityPieChart.vue'
import ScannerBarChart from '@/components/custom/Charts/ScannerBarChart.vue'
import ScanAISummary from '@/components/custom/Scan/ScanAISummary.vue'
import { toast } from 'vue-sonner'
import { getSeverityColor } from '@/lib/colors'

const API_BASE_URL = 'http://127.0.0.1:25565'

const props = defineProps<{
    report: {
        id: string
        scan_type: string
        scan_date: string
        total_vulnerabilities: number
        critical_count: number
        scanner_agreement_rate: number | null
        confidence_rate: number | null
        high_confidence_vulns: number
        medium_confidence_vulns: number
        low_confidence_vulns: number
        ai_summary_vulnerabilities: string | null
        ai_summary_tech: string | null
        high_severity_high_confidence: number
        high_severity_low_confidence: number
        low_severity_high_confidence: number
        low_severity_low_confidence: number
        vulnerabilities: any[]
        tech_discoveries: any[]
        scans: any[]
    } | null
}>()

const basicDrawerOpen = ref(false)
const fullDrawerOpen = ref(false)
const selectedBasicVuln = ref<any>(null)
const selectedFullVuln = ref<any>(null)

function resolveVulnTitle(v: any): string {
    if (v.name && v.name !== 'Vulnerability') return v.name
    if (v.vulnerability_type && v.vulnerability_type !== 'Vulnerability') return v.vulnerability_type
    if (v.data?.ruleId) return v.data.ruleId
    if (v.data?.title) return v.data.title
    if (v.data?.name) return v.data.name
    return 'Vulnerability'
}

function getSeverityStyle(level: any) {
    const severityStr = typeof level === 'number'
        ? (level >= 3 ? 'high' : (level === 2 ? 'medium' : 'low'))
        : level;
    return {
        backgroundColor: getSeverityColor(severityStr),
        color: '#ffffff',
        border: 'none'
    }
}

function mapSeverityToNumber(sev: string) {
    switch (sev?.toLowerCase()) {
        case 'critical': return 4
        case 'high': return 3
        case 'medium': return 2
        default: return 1
    }
}

function formatHttpRequest(req: any): string {
    if (!req) return ''
    if (typeof req === 'string') return req
    if (req.raw) return req.raw
    return JSON.stringify(req, null, 2)
}

const downloadReport = (format: 'excel' | 'pdf') => {
    if (!props.report?.id) return
    const url = `${API_BASE_URL}/api/v1/report/${props.report.id}/export/${format}`
    window.open(url, '_blank')
    toast.info(`Generating ${format.toUpperCase()} report...`)
}

const scanType = computed(() => {
    if (!props.report) return 'basic'
    const type = props.report.scan_type?.toLowerCase() || ''
    return (type.includes('wapiti') || type.includes('basic')) ? 'basic' : 'full'
})

const transformedData = computed(() => {
    if (!props.report) return null

    const target = props.report.scans?.[0]?.target_url || 'Unknown Target'
    const duration = props.report.scans?.[0]?.scan_duration || 0
    let country = 'Unknown', ip = 'Unknown'

    const techData = props.report.tech_discoveries?.[0]?.data || []
    const plugins = typeof techData === 'string' ? JSON.parse(techData) : techData
    const flatPlugins = Array.isArray(plugins) ? plugins.flat() : []
    const technologies: any[] = []
    const excludedTech = ['Country', 'IP', 'HTML5', 'HTTPServer']

    flatPlugins.forEach((p: any) => {
        const name = Object.keys(p)[0]
        const details = p[name]
        if (name === 'Country') country = Array.isArray(details) ? details.join(', ') : details
        else if (name === 'IP') ip = Array.isArray(details) ? details.join(', ') : details
        else if (!excludedTech.includes(name)) {
            let version = '-'
            if (Array.isArray(details)) version = details.length ? details.join(', ') : '-'
            else if (typeof details === 'object' && details?.version) version = details.version
            else if (typeof details === 'string') version = details
            technologies.push({ name, version, vulnerable: false, fix: 'N/A' })
        }
    })

    // AI Summary object
    const aiSummary = (props.report.ai_summary_vulnerabilities || props.report.ai_summary_tech) ? {
        summary: {
            vulnerabilities: props.report.ai_summary_vulnerabilities || '',
            tech: props.report.ai_summary_tech || ''
        }
    } : null

    // Priority Matrix object
    const matrix = {
        quadrant_counts: {
            high_severity_high_confidence: props.report.high_severity_high_confidence || 0,
            high_severity_low_confidence: props.report.high_severity_low_confidence || 0,
            low_severity_high_confidence: props.report.low_severity_high_confidence || 0,
            low_severity_low_confidence: props.report.low_severity_low_confidence || 0,
        }
    }

    if (scanType.value === 'basic') {
        const grouped: Record<string, any> = {}
        props.report.vulnerabilities.forEach((v: any) => {
            const categoryName = resolveVulnTitle(v)

            if (!grouped[categoryName]) {
                grouped[categoryName] = {
                    name: categoryName,
                    desc: v.description,
                    solution: v.remediation_effort,
                    vulns: []
                }
            }
            grouped[categoryName].vulns.push({
                severity: v.severity,
                level: mapSeverityToNumber(v.severity),
                method: v.method,
                path: v.endpoint,
                info: v.description,
                module: v.scanner,
                category: categoryName,
                type: categoryName,
                name: categoryName,
                description: v.description,
                solution: v.remediation_effort,
                http_request: formatHttpRequest(v.http_request),
                curl_command: v.data?.curl_command || ''
            })
        })

        const categories = Object.values(grouped)
        const allVulns = categories.flatMap((c: any) => c.vulns).sort((a: any, b: any) => b.level - a.level)
        const priorities = allVulns.filter((v: any) => v.level >= 2).slice(0, 5).map((v: any) => ({ type: v.category, severity: v.severity, endpoint: v.path }))

        return {
            scanMeta: { target, duration, country, ip, totalVulns: props.report.total_vulnerabilities, criticalHighVulns: props.report.critical_count },
            topRisk: priorities[0]?.type || 'N/A',
            categories,
            allVulns,
            priorities,
            technologies,
            aiSummary,
            matrix,
            summaryStats: {
                scannerAgreementRate: props.report.scanner_agreement_rate ? props.report.scanner_agreement_rate.toFixed(1) + '%' : null,
                confidenceRate: props.report.confidence_rate ? props.report.confidence_rate.toFixed(1) + '%' : null,
                highConfidenceVulns: props.report.high_confidence_vulns || 0,
                mediumConfidenceVulns: props.report.medium_confidence_vulns || 0,
                lowConfidenceVulns: props.report.low_confidence_vulns || 0,
            }
        }
    } else {
        const vulns = props.report.vulnerabilities.map((v: any) => ({
            id: v.id,
            type: resolveVulnTitle(v),
            severity: v.severity,
            scanner: v.scanner,
            confidence: v.confidence,
            method: v.method,
            endpoint: v.endpoint,
            http_request: formatHttpRequest(v.http_request),
            curl_command: v.data?.curl_command || '',
            exploit: v.data?.evidence || v.data?.exploit || '',
            description: v.description,
            solution: v.remediation_effort,
            reference: v.reference || 'N/A'
        }))

        const priorities = vulns
            .filter((v: any) => ['High', 'Critical', 'Medium'].includes(v.severity))
            .sort((a: any, b: any) => mapSeverityToNumber(b.severity) - mapSeverityToNumber(a.severity))
            .slice(0, 5)
            .map((v: any) => ({ type: v.type, severity: v.severity, endpoint: v.endpoint }))

        return {
            scanMeta: { target, duration, country, ip, totalVulns: props.report.total_vulnerabilities, criticalVulns: props.report.critical_count },
            topRisk: priorities[0]?.type || 'N/A',
            vulns,
            priorities,
            technologies,
            aiSummary,
            matrix,
            summaryStats: {
                scannerAgreementRate: props.report.scanner_agreement_rate ? props.report.scanner_agreement_rate.toFixed(1) + '%' : null,
                confidenceRate: props.report.confidence_rate ? props.report.confidence_rate.toFixed(1) + '%' : null,
                highConfidenceVulns: props.report.high_confidence_vulns || 0,
                mediumConfidenceVulns: props.report.medium_confidence_vulns || 0,
                lowConfidenceVulns: props.report.low_confidence_vulns || 0,
            }
        }
    }
})

const severityOptions = [
    { label: 'Critical', value: 'critical' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
    { label: 'Informational', value: 'informational' },
]

const scannerOptions = computed(() => {
    const vulns = scanType.value === 'basic' ? transformedData.value?.allVulns : transformedData.value?.vulns
    if (!vulns) return []
    const scanners = new Set(vulns.map((v: any) => v.scanner || v.module).filter(Boolean))
    return Array.from(scanners).sort().map(scanner => ({
        label: scanner,
        value: scanner
    }))
})

const prioritySorting = ref<SortingState>([])
const priorityColumns: ColumnDef<any>[] = [
    { accessorKey: 'type', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }), cell: ({ row }) => h('div', { class: 'font-medium truncate max-w-[200px]' }, row.getValue('type')) },
    {
        accessorKey: 'severity',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Severity' }),
        cell: ({ row }) => h(Badge, { style: getSeverityStyle(row.getValue('severity')) }, () => row.getValue('severity'))
    },
    { accessorKey: 'endpoint', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Endpoint' }), cell: ({ row }) => h('div', { class: 'truncate max-w-[150px]' }, row.getValue('endpoint')) },
]
const priorityTable = useVueTable({
    get data() { return transformedData.value?.priorities || [] },
    get columns() { return priorityColumns },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
})

const basicVulnSorting = ref<SortingState>([{ id: 'severity', desc: true }])
const basicFilter = ref('')
const basicColumnFilters = ref<ColumnFiltersState>([])

const basicVulnColumns: ColumnDef<any>[] = [
    { accessorKey: 'category', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Category' }), cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('category')) },
    {
        accessorKey: 'severity',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Severity' }),
        cell: ({ row }) => h(Badge, { style: getSeverityStyle(row.getValue('severity')) }, () => row.getValue('severity')),
        sortingFn: (a, b) => mapSeverityToNumber(b.original.severity) - mapSeverityToNumber(a.original.severity),
        filterFn: (row, id, value) => value.includes(row.getValue(id)?.toLowerCase())
    },
    { accessorKey: 'path', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Path' }), cell: ({ row }) => h('div', { class: 'max-w-[250px] truncate font-mono text-xs' }, row.getValue('path')) },
    {
        id: 'actions',
        cell: ({ row }) => h(Button, {
            variant: 'ghost',
            size: 'sm',
            type: 'button',
            onClick: () => { selectedBasicVuln.value = row.original; basicDrawerOpen.value = true }
        }, () => 'Details')
    },
]

const basicTable = useVueTable({
    get data() { return transformedData.value?.allVulns || [] },
    get columns() { return basicVulnColumns },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onSortingChange: (u) => basicVulnSorting.value = typeof u === 'function' ? u(basicVulnSorting.value) : u,
    onGlobalFilterChange: (u) => basicFilter.value = typeof u === 'function' ? u(basicFilter.value) : u,
    onColumnFiltersChange: (u) => basicColumnFilters.value = typeof u === 'function' ? u(basicColumnFilters.value) : u,
    state: {
        get sorting() { return basicVulnSorting.value },
        get globalFilter() { return basicFilter.value },
        get columnFilters() { return basicColumnFilters.value }
    }
})

const fullVulnSorting = ref<SortingState>([{ id: 'severity', desc: true }])
const fullFilter = ref('')
const fullColumnFilters = ref<ColumnFiltersState>([])

const fullVulnColumns: ColumnDef<any>[] = [
    { accessorKey: 'type', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }), cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('type')) },
    {
        accessorKey: 'severity',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Severity' }),
        cell: ({ row }) => h(Badge, { style: getSeverityStyle(row.getValue('severity')) }, () => row.getValue('severity')),
        sortingFn: (a, b) => mapSeverityToNumber(b.original.severity) - mapSeverityToNumber(a.original.severity),
        filterFn: (row, id, value) => value.includes(row.getValue(id)?.toLowerCase())
    },
    {
        accessorKey: 'scanner',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Scanner' }),
        filterFn: (row, id, value) => value.includes(row.getValue(id))
    },
    { accessorKey: 'endpoint', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Endpoint' }), cell: ({ row }) => h('div', { class: 'max-w-[150px] truncate' }, row.getValue('endpoint')) },
    { id: 'actions', cell: ({ row }) => h(Button, { variant: 'ghost', size: 'sm', type: 'button', onClick: () => { selectedFullVuln.value = row.original; fullDrawerOpen.value = true } }, () => 'Details') },
]
const fullTable = useVueTable({
    get data() { return transformedData.value?.vulns || [] },
    get columns() { return fullVulnColumns },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onSortingChange: (u) => fullVulnSorting.value = typeof u === 'function' ? u(fullVulnSorting.value) : u,
    onGlobalFilterChange: (u) => fullFilter.value = typeof u === 'function' ? u(fullFilter.value) : u,
    onColumnFiltersChange: (u) => fullColumnFilters.value = typeof u === 'function' ? u(fullColumnFilters.value) : u,
    state: {
        get sorting() { return fullVulnSorting.value },
        get globalFilter() { return fullFilter.value },
        get columnFilters() { return fullColumnFilters.value }
    }
})

const techFilter = ref('')
const techColumns: ColumnDef<any>[] = [
    { accessorKey: 'name', header: 'Technology' },
    { accessorKey: 'version', header: 'Version' },
]
const techTable = useVueTable({
    get data() { return transformedData.value?.technologies || [] },
    get columns() { return techColumns },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
})

const isFiltered = computed(() => {
    return scanType.value === 'basic'
        ? basicColumnFilters.value.length > 0
        : fullColumnFilters.value.length > 0
})

function resetFilters() {
    if (scanType.value === 'basic') {
        basicTable.resetColumnFilters()
    } else {
        fullTable.resetColumnFilters()
    }
}
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div v-if="report && transformedData">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 class="font-bold px-2 text-4xl">Scan Report</h1>
                        <div class="p-1.5 flex gap-4 text-sm text-muted-foreground">
                            <span><strong>ID:</strong> {{ report.id }}</span>
                            <span><strong>Date:</strong> {{ new Date(report.scan_date).toLocaleString() }}</span>
                        </div>
                    </div>
                    <div class="flex gap-2 px-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button variant="outline"><Download class="mr-2 h-4 w-4" /> Export Report</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem @click="downloadReport('pdf')"><FileText class="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem>
                                <DropdownMenuItem @click="downloadReport('excel')"><FileSpreadsheet class="mr-2 h-4 w-4" /> Export as Excel</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div class="space-y-4 animate-fadein mt-2">
                    <!-- Main Report Card -->
                    <Card>
                        <CardHeader>
                            <CardTitle class="text-2xl">{{ scanType === 'basic' ? 'Basic' : 'Full' }} Scan Report</CardTitle>
                            <CardDescription class="pt-2">
                                <div class="grid grid-cols-1 md:grid-cols-4 gap-1 text-sm">
                                    <div class="truncate"><strong>Target:</strong> {{ transformedData.scanMeta.target }}</div>
                                    <div><strong>Duration:</strong> {{ transformedData.scanMeta.duration }}s</div>
                                    <div class="truncate"><strong>Location:</strong> {{ transformedData.scanMeta.country }}</div>
                                    <div><strong>IP:</strong> {{ transformedData.scanMeta.ip }}</div>
                                </div>
                            </CardDescription>
                        </CardHeader>
                        <Separator />
                        <CardContent class="pt-6">
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div class="p-4 border rounded-lg">
                                    <h3 class="text-sm font-medium text-muted-foreground">Total Findings</h3>
                                    <p class="text-3xl font-bold">{{ transformedData.scanMeta.totalVulns }}</p>
                                </div>
                                <div class="p-4 border rounded-lg">
                                    <h3 class="text-sm font-medium text-muted-foreground">Critical/High</h3>
                                    <p class="text-3xl font-bold text-destructive">{{ scanType === 'basic' ? transformedData.scanMeta.criticalHighVulns : transformedData.scanMeta.criticalVulns }}</p>
                                </div>
                                <div class="p-4 border rounded-lg">
                                    <h3 class="text-sm font-medium text-muted-foreground">Technologies</h3>
                                    <p class="text-3xl font-bold">{{ transformedData.technologies.length }}</p>
                                </div>
                                <div class="p-4 border rounded-lg">
                                    <h3 class="text-sm font-medium text-muted-foreground">Top Vulnerability</h3>
                                    <p class="text-2xl md:text-3xl font-bold">{{ transformedData.topRisk }}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Summary Stats Card (Full Scan Only) -->
                    <Card v-if="transformedData.summaryStats && scanType === 'full'" class="mb-6">
                        <CardHeader>
                            <CardTitle>Scan Quality</CardTitle>
                            <CardDescription>How reliable are these findings?</CardDescription>
                        </CardHeader>
                        <Separator />
                        <CardContent class="pt-6">
                            <div class="grid grid-cols-2 gap-4 md:grid-cols-5">
                                <div class="rounded-lg border p-4">
                                    <h3 class="text-muted-foreground text-sm font-medium">Match Rate</h3>
                                    <p class="text-2xl font-bold">{{ transformedData.summaryStats.scannerAgreementRate || 'N/A' }}</p>
                                    <p class="text-xs text-muted-foreground mt-1">Tools agreed</p>
                                </div>
                                <div class="rounded-lg border p-4">
                                    <h3 class="text-muted-foreground text-sm font-medium">Reliability</h3>
                                    <p class="text-2xl font-bold">{{ transformedData.summaryStats.confidenceRate || 'N/A' }}</p>
                                    <p class="text-xs text-muted-foreground mt-1">Overall score</p>
                                </div>
                                <div class="rounded-lg border p-4">
                                    <h3 class="text-muted-foreground text-sm font-medium">Verified</h3>
                                    <p class="text-2xl font-bold text-green-600">{{ transformedData.summaryStats.highConfidenceVulns }}</p>
                                    <p class="text-xs text-muted-foreground mt-1">Confirmed</p>
                                </div>
                                <div class="rounded-lg border p-4">
                                    <h3 class="text-muted-foreground text-sm font-medium">Likely</h3>
                                    <p class="text-2xl font-bold text-yellow-600">{{ transformedData.summaryStats.mediumConfidenceVulns }}</p>
                                    <p class="text-xs text-muted-foreground mt-1">Probable</p>
                                </div>
                                <div class="rounded-lg border p-4">
                                    <h3 class="text-muted-foreground text-sm font-medium">Uncertain</h3>
                                    <p class="text-2xl font-bold text-orange-600">{{ transformedData.summaryStats.lowConfidenceVulns }}</p>
                                    <p class="text-xs text-muted-foreground mt-1">Needs check</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- AI Summary -->
                    <ScanAISummary v-if="transformedData.aiSummary" :summary="transformedData.aiSummary" />

                    <!-- Charts Section -->
                    <div v-if="scanType === 'basic'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Vulnerabilities</CardTitle>
                            </CardHeader>
                            <Separator />
                            <CardContent class="pt-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow v-for="hg in priorityTable.getHeaderGroups()" :key="hg.id">
                                            <TableHead v-for="h in hg.headers" :key="h.id">
                                                <FlexRender :render="h.column.columnDef.header" :props="h.getContext()" />
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow v-if="!priorityTable.getRowModel().rows.length">
                                            <TableCell :colSpan="priorityColumns.length" class="h-24 text-center">No critical risks found.</TableCell>
                                        </TableRow>
                                        <TableRow v-for="row in priorityTable.getRowModel().rows" :key="row.id">
                                            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <SeverityPieChart :vulnerabilities="transformedData.allVulns" />
                    </div>

                    <template v-else>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SeverityPieChart :vulnerabilities="transformedData.vulns" />
                            <ScannerBarChart :vulnerabilities="transformedData.vulns" :scan-type="scanType" />
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Vulnerabilities</CardTitle>
                            </CardHeader>
                            <Separator />
                            <CardContent class="pt-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow v-for="hg in priorityTable.getHeaderGroups()" :key="hg.id">
                                            <TableHead v-for="h in hg.headers" :key="h.id">
                                                <FlexRender :render="h.column.columnDef.header" :props="h.getContext()" />
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow v-if="!priorityTable.getRowModel().rows.length">
                                            <TableCell :colSpan="priorityColumns.length" class="h-24 text-center">No high risks found.</TableCell>
                                        </TableRow>
                                        <TableRow v-for="row in priorityTable.getRowModel().rows" :key="row.id">
                                            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </template>

                    <!-- Vulnerabilities Table -->
                    <Card>
                        <CardHeader>
                            <CardTitle>Vulnerabilities Detected</CardTitle>
                        </CardHeader>
                        <Separator />
                        <CardContent class="pt-6 space-y-4">
                            <div class="flex flex-wrap items-center gap-2">
                                <Input
                                    v-if="scanType === 'basic'"
                                    placeholder="Filter vulnerabilities..."
                                    :model-value="basicFilter"
                                    @update:modelValue="basicFilter = String($event)"
                                    class="h-8 w-[200px] lg:w-[250px]"
                                />
                                <Input
                                    v-else
                                    placeholder="Filter..."
                                    :model-value="fullFilter"
                                    @update:modelValue="fullFilter = String($event)"
                                    class="h-8 w-[200px] lg:w-[250px]"
                                />
                                <template v-if="scanType === 'basic'">
                                    <FacetedFilter
                                        v-if="basicTable.getColumn('severity')"
                                        :column="basicTable.getColumn('severity')"
                                        title="Severity"
                                        :options="severityOptions"
                                    />
                                </template>
                                <template v-else>
                                    <FacetedFilter
                                        v-if="fullTable.getColumn('severity')"
                                        :column="fullTable.getColumn('severity')"
                                        title="Severity"
                                        :options="severityOptions"
                                    />
                                    <FacetedFilter
                                        v-if="fullTable.getColumn('scanner') && scannerOptions.length > 1"
                                        :column="fullTable.getColumn('scanner')"
                                        title="Scanner"
                                        :options="scannerOptions"
                                    />
                                </template>
                                <Button
                                    v-if="isFiltered"
                                    variant="ghost"
                                    @click="resetFilters"
                                    class="h-8 px-2 lg:px-3"
                                >
                                    Reset Filters
                                </Button>
                            </div>

                            <div class="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow v-for="hg in (scanType === 'basic' ? basicTable : fullTable).getHeaderGroups()" :key="hg.id">
                                            <TableHead v-for="h in hg.headers" :key="h.id">
                                                <FlexRender :render="h.column.columnDef.header" :props="h.getContext()" />
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow v-if="!(scanType === 'basic' ? basicTable : fullTable).getRowModel().rows.length">
                                            <TableCell :colSpan="(scanType === 'basic' ? basicVulnColumns : fullVulnColumns).length" class="h-24 text-center">No results found.</TableCell>
                                        </TableRow>
                                        <TableRow v-for="row in (scanType === 'basic' ? basicTable : fullTable).getRowModel().rows" :key="row.id" class="cursor-pointer hover:bg-muted/50" @click="scanType === 'basic' ? (selectedBasicVuln = row.original, basicDrawerOpen = true) : (selectedFullVuln = row.original, fullDrawerOpen = true)">
                                            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            <DataTablePagination :table="scanType === 'basic' ? basicTable : fullTable" />
                        </CardContent>
                    </Card>

                    <!-- Technologies Table -->
                    <Card>
                        <CardHeader>
                            <CardTitle>Technologies</CardTitle>
                        </CardHeader>
                        <Separator />
                        <CardContent class="pt-6 space-y-2">
                            <Input placeholder="Filter technologies..." :model-value="techFilter" @update:modelValue="techFilter = String($event)" class="h-8 mb-2" />
                            <div class="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow v-for="hg in techTable.getHeaderGroups()" :key="hg.id">
                                            <TableHead v-for="h in hg.headers" :key="h.id">
                                                <FlexRender :render="h.column.columnDef.header" :props="h.getContext()"/>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow v-if="!techTable.getRowModel().rows.length">
                                            <TableCell :colSpan="techColumns.length" class="h-24 text-center">No technologies detected.</TableCell>
                                        </TableRow>
                                        <TableRow v-for="row in techTable.getRowModel().rows" :key="row.id">
                                            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()"/>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            <DataTablePagination :table="techTable" />
                        </CardContent>
                    </Card>
                </div>

                <!-- Drawers -->
                <BasicScanDetailDrawer v-if="selectedBasicVuln" :vuln="selectedBasicVuln" :open="basicDrawerOpen" @update:open="basicDrawerOpen = $event" />
                <FullScanDetailDrawer v-if="selectedFullVuln" :vuln="selectedFullVuln" :open="fullDrawerOpen" @update:open="fullDrawerOpen = $event" />
            </div>
            <div v-else class="flex flex-col items-center justify-center h-[50vh] space-y-4 text-muted-foreground">
                <AlertCircle class="h-12 w-12" />
                <div class="text-center">
                    <h3 class="text-lg font-medium">Report Not Found</h3>
                    <p>The scan report could not be loaded.</p>
                </div>
            </div>
        </div>
    </Navigation>
</template>

<style scoped>
.animate-fadein { animation: fadein 0.5s; }
</style>
