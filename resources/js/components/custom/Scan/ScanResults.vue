<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sparkles } from 'lucide-vue-next'
import {
    FlexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useVueTable,
    type ColumnDef,
} from '@tanstack/vue-table'

import SeverityPieChart from '@/components/custom/Charts/SeverityPieChart.vue'
import ScannerBarChart from '@/components/custom/Charts/ScannerBarChart.vue'
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue'
import DataTablePagination from '@/components/custom/DataTablePagination.vue'
import BasicScanDetailDrawer from '@/components/custom/BasicScanDetailDrawer.vue'
import FullScanDetailDrawer from '@/components/custom/FullScanDetailDrawer.vue'

import type { ScanResult, Vulnerability, Technology } from '@/lib/restack/restack.types'

const props = defineProps<{
    data: ScanResult
}>()

// Computed safe accessors with fallbacks
const safeData = computed(() => ({
    target: props.data?.target || 'Unknown',
    scanType: props.data?.scanType || 'Scan',
    tools: props.data?.tools || [],
    country: props.data?.country || 'Unknown',
    ip: props.data?.ip || 'Unknown',
    totalVulns: props.data?.totalVulns || 0,
    criticalHighVulns: props.data?.criticalHighVulns || 0,
    technologies: props.data?.technologies || [],
    priorities: props.data?.priorities || [],
    vulnerabilities: props.data?.vulnerabilities || [],
    aiSummary: props.data?.aiSummary || null,
    summaryStats: props.data?.summaryStats || null
}))

// --- Drawer State ---
const drawerOpen = ref(false)
const selectedVuln = ref<Vulnerability | null>(null)

function showVulnDetail(vuln: Vulnerability) {
    selectedVuln.value = vuln
    drawerOpen.value = true
}

// --- Helpers ---
function getSeverityBadge(severity: string) {
    switch (severity?.toLowerCase()) {
        case 'critical':
        case 'high': return 'destructive'
        case 'medium': return 'default'
        default: return 'secondary'
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

// --- Table Configs ---

// 1. Priority Table
const priorityColumns: ColumnDef<Vulnerability>[] = [
    {
        accessorKey: 'type',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }),
        cell: ({ row }) => h('div', { class: 'font-medium truncate max-w-[200px]' }, row.getValue('type')),
    },
    {
        accessorKey: 'severity',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Severity' }),
        cell: ({ row }) => h(Badge, { variant: getSeverityBadge(row.getValue('severity')) }, () => row.getValue('severity')),
    },
    {
        accessorKey: 'endpoint',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Endpoint' }),
        cell: ({ row }) => h('div', { class: 'truncate max-w-[150px]' }, row.getValue('endpoint')),
    },
]

const priorityTable = useVueTable({
    get data() { return safeData.value.priorities },
    get columns() { return priorityColumns },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
})

// 2. All Vulnerabilities Table
const vulnerabilityColumns: ColumnDef<Vulnerability>[] = [
    {
        accessorKey: 'type',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Vulnerability' }),
        cell: ({ row }) => h('div', { class: 'font-medium max-w-[200px] truncate' }, row.getValue('type')),
    },
    {
        accessorKey: 'severity',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Severity' }),
        cell: ({ row }) => h(Badge, { variant: getSeverityBadge(row.getValue('severity')) }, () => row.getValue('severity')),
        sortingFn: (a, b) => mapSeverityToNumber(b.original.severity) - mapSeverityToNumber(a.original.severity),
    },
    { accessorKey: 'scanner', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Scanner' }) },
    {
        accessorKey: 'endpoint',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Path' }),
        cell: ({ row }) => h('div', { class: 'max-w-[250px] truncate font-mono text-xs' }, row.getValue('endpoint')),
    },
    {
        id: 'actions',
        cell: ({ row }) => h(Button, {
            variant: 'ghost', size: 'sm',
            onClick: (e) => { e.stopPropagation(); showVulnDetail(row.original) },
        }, () => 'Details'),
    },
]

const globalFilter = ref('')
const vulnerabilitiesTable = useVueTable({
    get data() { return safeData.value.vulnerabilities },
    get columns() { return vulnerabilityColumns },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { get globalFilter() { return globalFilter.value } },
    onGlobalFilterChange: (u) => (globalFilter.value = typeof u === 'function' ? u(globalFilter.value) : u),
})

// 3. Tech Table
const techColumns: ColumnDef<Technology>[] = [
    { accessorKey: 'name', header: 'Technology' },
    { accessorKey: 'version', header: 'Version' },
    {
        accessorKey: 'vulnerable',
        header: 'Vulnerable',
        cell: ({ row }) => h(Badge, { variant: row.getValue('vulnerable') ? 'destructive' : 'secondary' },
            () => (row.getValue('vulnerable') ? 'YES' : 'NO')),
    },
]

const techTable = useVueTable({
    get data() { return safeData.value.technologies },
    get columns() { return techColumns },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
})
</script>

<template>
    <div class="animate-fadein mt-2 space-y-4">
        <Card>
            <CardHeader>
                <CardTitle class="text-2xl">{{ safeData.scanType }} Report</CardTitle>
                <CardDescription class="pt-2">
                    <div class="grid grid-cols-1 gap-1 text-sm md:grid-cols-4">
                        <div class="truncate"><strong>Target:</strong> {{ safeData.target }}</div>
                        <div class="truncate"><strong>Tools:</strong> {{ safeData.tools.join(', ') || 'N/A' }}</div>
                        <div class="truncate"><strong>Location:</strong> {{ safeData.country }}</div>
                        <div class="truncate"><strong>IP:</strong> {{ safeData.ip }}</div>
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
                        <h3 class="text-muted-foreground text-sm font-medium">High/Medium</h3>
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

        <!-- Scanner Agreement Card (Full Scan Only) -->
        <Card v-if="safeData.summaryStats && safeData.scanType === 'Full Scan'">
            <CardHeader>
                <CardTitle>Scan Confidence Metrics</CardTitle>
                <CardDescription>Agreement and confidence statistics from multiple scanners</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent class="pt-6">
                <div class="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Scanner Agreement</h3>
                        <p class="text-2xl font-bold">{{ safeData.summaryStats.scannerAgreementRate || 'N/A' }}</p>
                    </div>
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Overall Confidence</h3>
                        <p class="text-2xl font-bold">{{ safeData.summaryStats.confidenceRate || 'N/A' }}</p>
                    </div>
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">High Confidence</h3>
                        <p class="text-2xl font-bold text-green-600">{{ safeData.summaryStats.highConfidenceVulns }}</p>
                    </div>
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Medium Confidence</h3>
                        <p class="text-2xl font-bold text-yellow-600">{{ safeData.summaryStats.mediumConfidenceVulns }}</p>
                    </div>
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Low Confidence</h3>
                        <p class="text-2xl font-bold text-orange-600">{{ safeData.summaryStats.lowConfidenceVulns }}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card v-if="safeData.aiSummary">
            <CardHeader>
                <div class="flex items-center justify-between">
                    <CardTitle class="flex items-center gap-2">
                        <Sparkles class="text-primary h-5 w-5" />
                        <span>AI Summary & Recommendations</span>
                    </CardTitle>
                    <Badge variant="outline" class="bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border-indigo-200"> Powered by Gemini </Badge>
                </div>
            </CardHeader>
            <CardContent class="space-y-4 text-sm">
                <div>
                    <h4 class="mb-2 font-semibold">Overall Assessment</h4>
                    <p class="text-muted-foreground">{{ safeData.aiSummary.assessment }}</p>
                </div>
                <div>
                    <h4 class="mb-2 font-semibold">Key Findings</h4>
                    <ul class="text-muted-foreground list-disc space-y-1 pl-5">
                        <li v-for="(finding, idx) in safeData.aiSummary.keyFindings" :key="`f-${idx}`">{{ finding }}</li>
                    </ul>
                </div>
            </CardContent>
        </Card>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>Severity Distribution</CardTitle></CardHeader>
                <CardContent><SeverityPieChart :vulnerabilities="safeData.vulnerabilities" /></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Findings by Scanner</CardTitle></CardHeader>
                <CardContent><ScannerBarChart :vulnerabilities="safeData.vulnerabilities" /></CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader><CardTitle>Top Vulnerabilities</CardTitle></CardHeader>
            <CardContent>
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

        <Card>
            <CardHeader><CardTitle>Vulnerabilities Detected</CardTitle></CardHeader>
            <CardContent class="space-y-2">
                <Input placeholder="Filter vulnerabilities..." v-model="globalFilter" class="h-8" />
                <div class="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow v-for="hg in vulnerabilitiesTable.getHeaderGroups()" :key="hg.id">
                                <TableHead v-for="h in hg.headers" :key="h.id">
                                    <FlexRender :render="h.column.columnDef.header" :props="h.getContext()" />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow v-if="!vulnerabilitiesTable.getRowModel().rows.length">
                                <TableCell :colSpan="vulnerabilityColumns.length" class="h-24 text-center">No results.</TableCell>
                            </TableRow>
                            <TableRow v-for="row in vulnerabilitiesTable.getRowModel().rows" :key="row.id" class="cursor-pointer hover:bg-muted/50" @click="showVulnDetail(row.original)">
                                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                    <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                <DataTablePagination :table="vulnerabilitiesTable" />
            </CardContent>
        </Card>

        <Card v-if="safeData.technologies.length">
            <CardHeader><CardTitle>Technologies</CardTitle></CardHeader>
            <CardContent class="space-y-2">
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

        <BasicScanDetailDrawer
            v-if="safeData.scanType === 'Basic Scan' && selectedVuln"
            :vuln="selectedVuln"
            :open="drawerOpen"
            @update:open="drawerOpen = $event"
        />

        <FullScanDetailDrawer
            v-else-if="selectedVuln"
            :vuln="selectedVuln"
            :open="drawerOpen"
            @update:open="drawerOpen = $event"
        />
    </div>
</template>

<style scoped>
.animate-fadein { animation: fadein 0.5s; }
@keyframes fadein {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
