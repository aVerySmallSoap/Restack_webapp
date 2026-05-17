<script setup lang="ts">
import { computed, h } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from '@/components/ui/table'
import {
    FlexRender,
    getCoreRowModel,
    getSortedRowModel,
    useVueTable,
    type ColumnDef,
} from '@tanstack/vue-table'
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Download, FileText, FileSpreadsheet,
    Globe, Lock, Shield,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import ExpandableVulnTable from '@/components/custom/Scan/ExpandableVulnTable.vue'
import SiteMapView         from '@/components/custom/Scan/SiteMapView.vue'
import SslAnalysis         from '@/components/custom/Scan/SslAnalysis.vue'
import ScanAISummary       from '@/components/custom/Scan/ScanAISummary.vue'
// import PriorityMatrix   from '@/components/custom/Scan/PriorityMatrix.vue'
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue'
import type { ScanResult, Technology } from '@/lib/types/scan'

const props = defineProps<{ result: ScanResult }>()

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// ── Derived flags ─────────────────────────────────────────────────────────────

const isFullScan = computed(() =>
    (props.result.scan_type ?? '').toUpperCase() === 'FULL'
)

const hasSiteMap = computed(() => {
    const ctx = props.result.discovery_context
    if (!ctx) return false
    return ctx.endpoints.length > 0 || Object.keys(ctx.site_map ?? {}).length > 0
})

const hasSSL = computed(() => !!(props.result.discovery_context?.ssl_certs))

// ── Stats ─────────────────────────────────────────────────────────────────────

const totalVulns    = computed(() => props.result.vulnerabilities.length)
const critHighCount = computed(() => {
    let n = 0
    for (const v of props.result.vulnerabilities) {
        if (v.severity === 'Critical' || v.severity === 'High') n++
    }
    return n
})

const scanners = computed(() =>
    [...new Set(props.result.vulnerabilities.map(v => v.scanner).filter(Boolean))]
)

// ── AI summary ────────────────────────────────────────────────────────────────

const aiSummary = computed(() => {
    const r = props.result.report
    if (!r?.ai_summary_vulnerabilities && !r?.ai_summary_tech) return null
    return {
        summary: {
            vulnerabilities: r.ai_summary_vulnerabilities ?? '',
            tech: r.ai_summary_tech ?? '',
        },
    }
})

// ── Technology table ──────────────────────────────────────────────────────────

const techColumns: ColumnDef<Technology>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Technology' }),
        cell: ({ row }) => h('span', { class: 'font-medium' }, row.getValue('name')),
    },
    {
        accessorKey: 'version',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Version' }),
        cell: ({ row }) => {
            const ver = row.getValue('version') as string[] | null
            return h('span', { class: 'font-mono text-xs text-muted-foreground' },
                ver?.length ? ver.join(', ') : '—'
            )
        },
    },
    {
        accessorKey: 'source',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Source' }),
        cell: ({ row }) => h('span', { class: 'text-xs text-muted-foreground capitalize' }, row.getValue('source')),
    },
    {
        accessorKey: 'categories',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Categories' }),
        cell: ({ row }) => {
            const cats = row.getValue('categories') as string[] | null
            if (!cats?.length) return h('span', { class: 'text-muted-foreground text-xs' }, '—')
            return h('div', { class: 'flex flex-wrap gap-1' },
                cats.map(c => h(Badge, { variant: 'outline', class: 'text-xs' }, () => c))
            )
        },
    },
]

const techTable = useVueTable({
    get data()    { return props.result.technologies },
    get columns() { return techColumns },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
})

// ── Formatting ────────────────────────────────────────────────────────────────

const scanDateDisplay = computed(() => {
    const d = props.result.scan_date
    if (!d) return 'Unknown'
    try {
        return new Date(d).toLocaleString('en-PH', {
            timeZone: 'Asia/Manila',
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
        })
    } catch {
        return d
    }
})

// ── Export ────────────────────────────────────────────────────────────────────

function downloadReport(format: 'excel' | 'pdf') {
    const id = props.result.id
    if (!id) { toast.error('No report ID available'); return }
    window.open(`${API_BASE_URL}/v1/report/${id}/export/${format}`, '_blank')
    toast.info(`Generating ${format.toUpperCase()} report…`)
}
</script>

<template>
    <div class="space-y-6">

        <!-- ── Header ─────────────────────────────────────────────────────────── -->
        <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-lg font-bold font-mono truncate max-w-[520px]" :title="result.target">
                        {{ result.target }}
                    </h2>
                    <Badge>{{ result.scan_type }}</Badge>
                    <Badge v-if="result.is_automated" variant="secondary">Scheduled</Badge>
                </div>
                <p class="text-sm text-muted-foreground mt-0.5">{{ scanDateDisplay }}</p>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <Button variant="outline" size="sm">
                        <Download class="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="downloadReport('pdf')">
                        <FileText class="h-4 w-4 mr-2" /> PDF Report
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="downloadReport('excel')">
                        <FileSpreadsheet class="h-4 w-4 mr-2" /> Excel Spreadsheet
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <!-- ── Summary stats ──────────────────────────────────────────────────── -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
                <CardContent class="pt-5 pb-4">
                    <p class="text-xs text-muted-foreground">Total Findings</p>
                    <p class="text-3xl font-bold mt-1">{{ totalVulns }}</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent class="pt-5 pb-4">
                    <p class="text-xs text-muted-foreground">Critical / High</p>
                    <p class="text-3xl font-bold mt-1" :class="critHighCount > 0 ? 'text-destructive' : ''">
                        {{ critHighCount }}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardContent class="pt-5 pb-4">
                    <p class="text-xs text-muted-foreground">Technologies</p>
                    <p class="text-3xl font-bold mt-1">{{ result.technologies.length }}</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent class="pt-5 pb-4">
                    <p class="text-xs text-muted-foreground">Scanners</p>
                    <p class="text-sm font-medium mt-2">
                        {{ scanners.length ? scanners.join(', ') : '—' }}
                    </p>
                </CardContent>
            </Card>
        </div>

        <!-- ── Full-scan quality stats ─────────────────────────────────────────── -->
        <Card v-if="result.report && isFullScan">
            <CardHeader class="pb-3">
                <CardTitle class="text-base">Scan Quality</CardTitle>
                <CardDescription>Confidence and scanner agreement breakdown</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent class="pt-4">
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    <div class="rounded-lg border p-3">
                        <p class="text-xs text-muted-foreground">Match Rate</p>
                        <p class="text-2xl font-bold mt-1">
                            {{ result.report.scanner_agreement_rate != null
                            ? result.report.scanner_agreement_rate.toFixed(1) + '%'
                            : '—' }}
                        </p>
                    </div>
                    <div class="rounded-lg border p-3">
                        <p class="text-xs text-muted-foreground">Reliability</p>
                        <p class="text-2xl font-bold mt-1">
                            {{ result.report.confidence_rate != null
                            ? result.report.confidence_rate.toFixed(1) + '%'
                            : '—' }}
                        </p>
                    </div>
                    <div class="rounded-lg border p-3">
                        <p class="text-xs text-muted-foreground">Verified</p>
                        <p class="text-2xl font-bold mt-1 text-emerald-600">
                            {{ result.report.high_confidence_vulns }}
                        </p>
                    </div>
                    <div class="rounded-lg border p-3">
                        <p class="text-xs text-muted-foreground">Likely</p>
                        <p class="text-2xl font-bold mt-1 text-amber-500">
                            {{ result.report.medium_confidence_vulns }}
                        </p>
                    </div>
                    <div class="rounded-lg border p-3">
                        <p class="text-xs text-muted-foreground">Uncertain</p>
                        <p class="text-2xl font-bold mt-1 text-orange-500">
                            {{ result.report.low_confidence_vulns }}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- ── AI summary ─────────────────────────────────────────────────────── -->
        <ScanAISummary v-if="aiSummary" :summary="aiSummary" />

        <!-- ── Priority matrix commented out ─────────────────────────────────── -->
        <!-- <PriorityMatrix v-if="matrixData" :matrix="matrixData" /> -->

        <!-- ── Main tabbed content ────────────────────────────────────────────── -->
        <Tabs default-value="findings">
            <TabsList>
                <TabsTrigger value="findings">
                    Findings
                    <Badge variant="secondary" class="ml-2 text-xs">{{ totalVulns }}</Badge>
                </TabsTrigger>
                <TabsTrigger value="sitemap" :disabled="!hasSiteMap">
                    <Globe class="h-3.5 w-3.5 mr-1.5" />
                    Site Map
                </TabsTrigger>
                <TabsTrigger value="ssl" :disabled="!hasSSL">
                    <Lock class="h-3.5 w-3.5 mr-1.5" />
                    SSL / TLS
                </TabsTrigger>
            </TabsList>

            <TabsContent value="findings" class="mt-4">
                <ExpandableVulnTable
                    :vulnerabilities="result.vulnerabilities"
                    :scan-type="isFullScan ? 'full' : 'basic'"
                    :show-scanner-filter="isFullScan"
                />
            </TabsContent>

            <TabsContent value="sitemap" class="mt-4">
                <SiteMapView
                    v-if="result.discovery_context"
                    :site-map="result.discovery_context.site_map ?? {}"
                    :endpoints="result.discovery_context.endpoints ?? []"
                    :out-of-scope="result.discovery_context.out_of_scope ?? []"
                    :ports="result.discovery_context.ports ?? []"
                />
                <div
                    v-else
                    class="rounded-lg border border-dashed p-10 text-center text-muted-foreground"
                >
                    <Globe class="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p class="text-sm">No site map data available for this scan.</p>
                </div>
            </TabsContent>

            <TabsContent value="ssl" class="mt-4">
                <SslAnalysis :data="result.discovery_context?.ssl_certs ?? null" />
            </TabsContent>
        </Tabs>

        <!-- ── Technologies table ─────────────────────────────────────────────── -->
        <Card v-if="result.technologies.length">
            <CardHeader>
                <CardTitle>Technologies Detected</CardTitle>
                <CardDescription>
                    {{ result.technologies.length }}
                    fingerprint{{ result.technologies.length !== 1 ? 's' : '' }} across all scanners
                </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent class="pt-0">
                <div class="rounded-md border mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow
                                v-for="hg in techTable.getHeaderGroups()"
                                :key="hg.id"
                                class="bg-muted/40"
                            >
                                <TableHead v-for="h in hg.headers" :key="h.id">
                                    <FlexRender
                                        v-if="!h.isPlaceholder"
                                        :render="h.column.columnDef.header"
                                        :props="h.getContext()"
                                    />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow
                                v-for="row in techTable.getRowModel().rows"
                                :key="row.id"
                            >
                                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                    <FlexRender
                                        :render="cell.column.columnDef.cell"
                                        :props="cell.getContext()"
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow v-if="!techTable.getRowModel().rows.length">
                                <TableCell :colspan="techColumns.length" class="h-16 text-center text-muted-foreground text-sm">
                                    No technologies detected.
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

        <!-- Empty state -->
        <div
            v-if="totalVulns === 0 && !result.technologies.length"
            class="rounded-lg border border-dashed p-12 text-center text-muted-foreground"
        >
            <Shield class="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p class="font-medium">No findings recorded</p>
            <p class="text-sm mt-1">The scan may still be processing, or no issues were detected.</p>
        </div>

    </div>
</template>
