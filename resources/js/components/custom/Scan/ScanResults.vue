<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, FileSpreadsheet, FileText, Shield, Globe, Lock } from 'lucide-vue-next'
import {
    FlexRender,
    getCoreRowModel,
    getSortedRowModel,
    useVueTable,
    type ColumnDef,
} from '@tanstack/vue-table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import SeverityPieChart   from '@/components/custom/Charts/SeverityPieChart.vue'
import ScannerBarChart    from '@/components/custom/Charts/ScannerBarChart.vue'
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue'
import DataTablePagination   from '@/components/custom/DataTablePagination.vue'
import ScanAISummary      from '@/components/custom/Scan/ScanAISummary.vue'
import ExpandableVulnTable from '@/components/custom/Scan/ExpandableVulnTable.vue'
import SslAnalysis         from '@/components/custom/Scan/SslAnalysis.vue'
import SiteMapView         from '@/components/custom/Scan/SiteMapView.vue'
import { getSeverityColor } from '@/lib/colors'
import { toast } from 'vue-sonner'

import type { ScanResult, Vulnerability, Technology } from '@/lib/restack/restack.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const props = defineProps<{
    data: ScanResult & { id?: string; session_id?: string }
}>()

// ── Safe data with defaults ───────────────────────────────────────────────────

const safeData = computed(() => ({
    target:           props.data?.target           || 'Unknown',
    scanType:         props.data?.scanType         || 'Scan',
    tools:            props.data?.tools            || [],
    country:          props.data?.country          || 'Unknown',
    ip:               props.data?.ip               || 'Unknown',
    totalVulns:       props.data?.totalVulns       || 0,
    criticalHighVulns:props.data?.criticalHighVulns|| 0,
    technologies:     props.data?.technologies     || [],
    priorities:       props.data?.priorities       || [],
    vulnerabilities:  props.data?.vulnerabilities  || [],
    matrix:           props.data?.matrix           || null,
    aiSummary:        props.data?.aiSummary        || null,
    summaryStats:     props.data?.summaryStats     || null,
    siteMap:          props.data?.siteMap          || null,
    sslData:          props.data?.sslData          || null,
}))

const isBasicScan = computed(() => {
    const type = safeData.value.scanType.toLowerCase()
    return type.includes('basic') || type.includes('wapiti')
})

const hasSiteMap = computed(() =>
    !!(safeData.value.siteMap?.endpoints?.length || safeData.value.siteMap?.siteMap),
)

const hasSsl = computed(() => !!safeData.value.sslData)

// ── Severity helpers ─────────────────────────────────────────────────────────

function getSeverityStyle(sev: any) {
    return { backgroundColor: getSeverityColor(sev), color: '#ffffff', border: 'none' }
}

function severityRank(sev: string) {
    switch (sev?.toLowerCase()) {
        case 'critical': return 4
        case 'high':     return 3
        case 'medium':   return 2
        case 'low':      return 1
        default:         return 0
    }
}

// ── Export ───────────────────────────────────────────────────────────────────

function downloadReport(format: 'excel' | 'pdf') {
    const reportId = props.data.id
    if (!reportId) {
        toast.error('Report ID missing — cannot export.')
        return
    }
    window.open(`${API_BASE_URL}/api/v1/report/${reportId}/export/${format}`, '_blank')
    toast.info(`Generating ${format.toUpperCase()} report…`)
}

// ── Top-vulnerabilities summary table ────────────────────────────────────────

const priorityColumns: ColumnDef<Vulnerability>[] = [
    {
        accessorKey: 'type',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }),
        cell: ({ row }) => h('div', { class: 'font-medium truncate max-w-[220px]' }, row.getValue('type')),
    },
    {
        accessorKey: 'severity',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Severity' }),
        cell: ({ row }) => h(Badge, { style: getSeverityStyle(row.getValue('severity')) }, () => row.getValue('severity')),
        sortingFn: (a, b) => severityRank(a.original.severity) - severityRank(b.original.severity),
    },
    {
        accessorKey: 'endpoint',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Endpoint' }),
        cell: ({ row }) => h('div', { class: 'truncate max-w-[180px] font-mono text-xs text-muted-foreground' }, row.getValue('endpoint')),
    },
]

const priorityTable = useVueTable({
    get data()    { return safeData.value.priorities },
    get columns() { return priorityColumns },
    getCoreRowModel:    getCoreRowModel(),
    getSortedRowModel:  getSortedRowModel(),
})

// ── Tech table ────────────────────────────────────────────────────────────────

const techColumns: ColumnDef<Technology>[] = [
    { accessorKey: 'name',    header: 'Technology' },
    { accessorKey: 'version', header: 'Version'    },
    {
        accessorKey: 'vulnerable',
        header: 'Vulnerable',
        cell: ({ row }) => h(Badge, {
            variant: row.getValue('vulnerable') ? 'destructive' : 'secondary',
        }, () => row.getValue('vulnerable') ? 'YES' : 'NO'),
    },
]

const techTable = useVueTable({
    get data()    { return safeData.value.technologies },
    get columns() { return techColumns },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
})
</script>

<template>
    <div class="space-y-6 mt-2 animate-fadein">

        <!-- Header -->
        <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold">Scan Results</h2>
            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <Button variant="outline">
                        <Download class="mr-2 h-4 w-4" />
                        Export Report
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="downloadReport('pdf')">
                        <FileText class="mr-2 h-4 w-4" /> Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="downloadReport('excel')">
                        <FileSpreadsheet class="mr-2 h-4 w-4" /> Export as Excel
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <!-- Summary card -->
        <Card>
            <CardHeader>
                <CardTitle class="text-2xl">{{ safeData.scanType }} Report</CardTitle>
                <CardDescription class="pt-2">
                    <div class="grid grid-cols-1 gap-1 text-sm md:grid-cols-4">
                        <div class="truncate"><strong>Target:</strong> {{ safeData.target }}</div>
                        <div class="truncate"><strong>Tools:</strong> {{ safeData.tools.join(', ') || 'N/A' }}</div>
                        <div class="truncate"><strong>Location:</strong> {{ safeData.country }}</div>
                        <div><strong>IP:</strong> {{ safeData.ip }}</div>
                    </div>
                </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent class="pt-6">
                <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Total Findings</h3>
                        <p class="text-3xl font-bold">{{ safeData.totalVulns }}</p>
                    </div>
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">High / Medium</h3>
                        <p class="text-destructive text-3xl font-bold">{{ safeData.criticalHighVulns }}</p>
                    </div>
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Technologies</h3>
                        <p class="text-3xl font-bold">{{ safeData.technologies.length }}</p>
                    </div>
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Top Vulnerability</h3>
                        <p class="text-2xl font-bold md:text-3xl">{{ safeData.priorities[0]?.type || 'N/A' }}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Scan quality (full scan only) -->
        <Card v-if="safeData.summaryStats && !isBasicScan">
            <CardHeader>
                <CardTitle>Scan Quality</CardTitle>
                <CardDescription>How reliable are these findings?</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent class="pt-6">
                <div class="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Match Rate</h3>
                        <p class="text-2xl font-bold">{{ safeData.summaryStats.scannerAgreementRate || 'N/A' }}</p>
                        <p class="text-xs text-muted-foreground mt-1">Tools agreed</p>
                    </div>
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Reliability</h3>
                        <p class="text-2xl font-bold">{{ safeData.summaryStats.confidenceRate || 'N/A' }}</p>
                        <p class="text-xs text-muted-foreground mt-1">Overall score</p>
                    </div>
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Verified</h3>
                        <p class="text-2xl font-bold text-green-600">{{ safeData.summaryStats.highConfidenceVulns }}</p>
                        <p class="text-xs text-muted-foreground mt-1">Confirmed</p>
                    </div>
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Likely</h3>
                        <p class="text-2xl font-bold text-yellow-600">{{ safeData.summaryStats.mediumConfidenceVulns }}</p>
                        <p class="text-xs text-muted-foreground mt-1">Probable</p>
                    </div>
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Uncertain</h3>
                        <p class="text-2xl font-bold text-orange-600">{{ safeData.summaryStats.lowConfidenceVulns }}</p>
                        <p class="text-xs text-muted-foreground mt-1">Needs check</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- AI summary -->
        <ScanAISummary v-if="safeData.aiSummary" :summary="safeData.aiSummary" />

        <!-- Charts -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <SeverityPieChart :vulnerabilities="safeData.vulnerabilities" />
            <ScannerBarChart  :vulnerabilities="safeData.vulnerabilities" :scan-type="safeData.scanType" />
        </div>

        <!-- Top vulnerabilities compact table -->
        <Card>
            <CardHeader>
                <CardTitle>Top Vulnerabilities</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent class="pt-4">
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
                            <TableCell :colspan="priorityColumns.length" class="h-20 text-center text-muted-foreground">
                                <Shield class="h-6 w-6 mx-auto mb-1 opacity-30" /> No critical risks found.
                            </TableCell>
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

        <!-- Main tabbed section: Vulnerabilities | Site Map | SSL -->
        <Card>
            <CardHeader class="pb-0">
                <CardTitle>Detailed Findings</CardTitle>
            </CardHeader>
            <CardContent class="pt-0">
                <Tabs default-value="vulns" class="mt-4">
                    <TabsList>
                        <TabsTrigger value="vulns">
                            Vulnerabilities
                            <Badge variant="secondary" class="ml-2 text-xs">{{ safeData.vulnerabilities.length }}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="sitemap" :disabled="!hasSiteMap">
                            <Globe class="h-3.5 w-3.5 mr-1.5" />
                            Site Map
                        </TabsTrigger>
                        <TabsTrigger value="ssl" :disabled="!hasSsl">
                            <Lock class="h-3.5 w-3.5 mr-1.5" />
                            SSL/TLS
                        </TabsTrigger>
                    </TabsList>

                    <!-- Expandable vulnerability table -->
                    <TabsContent value="vulns" class="mt-4">
                        <ExpandableVulnTable
                            :vulnerabilities="safeData.vulnerabilities"
                            :scan-type="isBasicScan ? 'basic' : 'full'"
                        />
                    </TabsContent>

                    <!-- Site map -->
                    <TabsContent value="sitemap" class="mt-4">
                        <SiteMapView
                            v-if="hasSiteMap"
                            :site-map="safeData.siteMap!.siteMap"
                            :endpoints="safeData.siteMap!.endpoints"
                            :out-of-scope="safeData.siteMap!.outOfScope"
                            :ports="safeData.siteMap!.ports"
                        />
                        <div v-else class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                            <Globe class="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p class="text-sm">No site map data for this scan.</p>
                        </div>
                    </TabsContent>

                    <!-- SSL/TLS -->
                    <TabsContent value="ssl" class="mt-4">
                        <SslAnalysis :data="safeData.sslData" />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        <!-- Technologies -->
        <Card>
            <CardHeader><CardTitle>Technologies Detected</CardTitle></CardHeader>
            <Separator />
            <CardContent class="pt-4 space-y-2">
                <div class="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow v-for="hg in techTable.getHeaderGroups()" :key="hg.id">
                                <TableHead v-for="h in hg.headers" :key="h.id">
                                    <FlexRender :render="h.column.columnDef.header" :props="h.getContext()" />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow v-if="!techTable.getRowModel().rows.length">
                                <TableCell :colspan="techColumns.length" class="h-20 text-center text-muted-foreground">
                                    No technologies detected.
                                </TableCell>
                            </TableRow>
                            <TableRow v-for="row in techTable.getRowModel().rows" :key="row.id">
                                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                    <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                <DataTablePagination :table="techTable" />
            </CardContent>
        </Card>

    </div>
</template>

<style scoped>
.animate-fadein { animation: fadein 0.4s ease; }
@keyframes fadein { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
</style>

