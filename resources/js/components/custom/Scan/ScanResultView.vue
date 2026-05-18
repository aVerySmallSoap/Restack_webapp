<script setup lang="ts">
import { computed, h } from 'vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FlexRender, getCoreRowModel, getSortedRowModel, useVueTable, type ColumnDef } from '@tanstack/vue-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Globe, Lock, Shield } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import ExpandableVulnTable from '@/components/custom/Scan/ExpandableVulnTable.vue';
import SiteMapView from '@/components/custom/Scan/SiteMapView.vue';
import SslAnalysis from '@/components/custom/Scan/SslAnalysis.vue';
import ScanAISummary from '@/components/custom/Scan/ScanAISummary.vue';
// import PriorityMatrix   from '@/components/custom/Scan/PriorityMatrix.vue'
import SeverityPieChart from '@/components/custom/Charts/SeverityPieChart.vue';
import ScannerBarChart from '@/components/custom/Charts/ScannerBarChart.vue';
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue';
import type { ScanResult, Technology } from '@/lib/types/scan';

const props = defineProps<{ result: ScanResult }>();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ── Derived flags ─────────────────────────────────────────────────────────────

const isFullScan = computed(() => (props.result.scan_type ?? '').toUpperCase() === 'FULL');

const hasSiteMap = computed(() => {
    const ctx = props.result.discovery_context;
    if (!ctx) return false;
    return ctx.endpoints.length > 0 || Object.keys(ctx.site_map ?? {}).length > 0;
});

const hasSSL = computed(() => !!props.result.discovery_context?.ssl_certs);

// ── Stats ─────────────────────────────────────────────────────────────────────

const totalVulns = computed(() => props.result.vulnerabilities.length);
const critHighCount = computed(() => {
    let n = 0;
    for (const v of props.result.vulnerabilities) {
        if (v.severity === 'Critical' || v.severity === 'High') n++;
    }
    return n;
});

const scanners = computed(() => [...new Set(props.result.vulnerabilities.map((v) => v.scanner).filter(Boolean))]);

// ── AI summary ────────────────────────────────────────────────────────────────

const aiSummary = computed(() => {
    const r = props.result.report;
    if (!r?.ai_summary_vulnerabilities && !r?.ai_summary_tech) return null;
    return {
        summary: {
            vulnerabilities: r.ai_summary_vulnerabilities ?? '',
            tech: r.ai_summary_tech ?? '',
        },
    };
});

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
            const ver = row.getValue('version') as string[] | null;
            return h('span', { class: 'font-mono text-xs text-muted-foreground' }, ver?.length ? ver.join(', ') : '—');
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
            const cats = row.getValue('categories') as string[] | null;
            if (!cats?.length) return h('span', { class: 'text-muted-foreground text-xs' }, '—');
            return h(
                'div',
                { class: 'flex flex-wrap gap-1' },
                cats.map((c) => h(Badge, { variant: 'outline', class: 'text-xs' }, () => c)),
            );
        },
    },
];

const techTable = useVueTable({
    get data() {
        return props.result.technologies;
    },
    get columns() {
        return techColumns;
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
});

// ── Formatting ────────────────────────────────────────────────────────────────

const scanDateDisplay = computed(() => {
    const d = props.result.scan_date;
    if (!d) return 'Unknown';
    try {
        return new Date(d).toLocaleString('en-PH', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return d;
    }
});

const qualityStats = computed(() => {
    const vulns = props.result.vulnerabilities;
    if (!vulns.length || !isFullScan.value) return null;

    let high = 0,
        medium = 0,
        low = 0;

    for (const v of vulns) {
        const conf = (v.confidence ?? '').toLowerCase();
        if (['high', 'confirmed', 'critical'].includes(conf)) high++;
        else if (conf === 'medium') medium++;
        else low++;
    }

    const total = vulns.length;
    const weighted = high * 1.0 + medium * 0.5 + low * 0.1;

    return {
        high_confidence: high,
        medium_confidence: medium,
        low_confidence: low,
        confidence_rate: total > 0 ? (weighted / total) * 100 : 0,
        agreement_rate: total > 0 ? (high / total) * 100 : 0,
    };
});

// ── Export ────────────────────────────────────────────────────────────────────

function downloadReport(format: 'excel' | 'pdf') {
    const id = props.result.id;
    if (!id) {
        toast.error('No report ID available');
        return;
    }
    window.open(`${API_BASE_URL}/v1/report/${id}/export/${format}`, '_blank');
    toast.info(`Generating ${format.toUpperCase()} report…`);
}
</script>

<template>
    <div class="space-y-6">
        <!-- ── Header ─────────────────────────────────────────────────────────── -->
        <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
                <h1 class="text-4xl font-bold">Scan Report</h1>
                <div class="text-muted-foreground mt-1.5 flex flex-wrap gap-4 text-sm">
                    <span><strong>ID:</strong> {{ result.id }}</span>
                    <span><strong>Date:</strong> {{ scanDateDisplay }}</span>
                </div>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <Button variant="outline">
                        <Download class="mr-2 h-4 w-4" />
                        Export Report
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="downloadReport('pdf')"> <FileText class="mr-2 h-4 w-4" /> Export as PDF </DropdownMenuItem>
                    <DropdownMenuItem @click="downloadReport('excel')"> <FileSpreadsheet class="mr-2 h-4 w-4" /> Export as Excel </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <!-- ── Summary card ───────────────────────────────────────────────────── -->
        <Card>
            <CardHeader>
                <CardTitle class="text-2xl">{{ result.scan_type }} Scan Report</CardTitle>
                <CardDescription class="pt-2">
                    <div class="grid grid-cols-1 gap-1 text-sm md:grid-cols-3">
                        <div class="truncate"><strong>Target:</strong> {{ result.target }}</div>
                        <div class="truncate"><strong>Scanners:</strong> {{ scanners.length ? scanners.join(', ') : 'N/A' }}</div>
                        <div>
                            <strong>Source:</strong>
                            {{ result.is_automated ? 'Scheduled' : 'Manual' }}
                        </div>
                    </div>
                </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent class="pt-6">
                <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Total Findings</h3>
                        <p class="text-3xl font-bold">{{ totalVulns }}</p>
                    </div>
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Critical / High</h3>
                        <p class="text-3xl font-bold" :class="critHighCount > 0 ? 'text-destructive' : ''">
                            {{ critHighCount }}
                        </p>
                    </div>
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Technologies</h3>
                        <p class="text-3xl font-bold">{{ result.technologies.length }}</p>
                    </div>
                    <div class="rounded-lg border p-4">
                        <h3 class="text-muted-foreground text-sm font-medium">Top Vulnerability</h3>
                        <p class="truncate text-xl font-bold" :title="result.vulnerabilities[0]?.type">
                            {{ result.vulnerabilities[0]?.type || '—' }}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- ── Full-scan quality stats ─────────────────────────────────────────── -->
        <Card v-if="result.report && isFullScan ">
            <CardHeader class="pb-3">
                <CardTitle class="text-base">Scan Quality</CardTitle>
                <CardDescription>Confidence and scanner agreement breakdown</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent class="pt-4">
                <div class="grid grid-cols-2 gap-3 text-center sm:grid-cols-5">
                    <div class="rounded-lg border p-3">
                        <p class="text-muted-foreground text-xs">Match Rate</p>
                        <p class="mt-1 text-2xl font-bold">{{ qualityStats.agreement_rate.toFixed(1) }}%</p>
                    </div>
                    <div class="rounded-lg border p-3">
                        <p class="text-muted-foreground text-xs">Reliability</p>
                        <p class="mt-1 text-2xl font-bold">{{ qualityStats.confidence_rate.toFixed(1) }}%</p>
                    </div>
                    <div class="rounded-lg border p-3">
                        <p class="text-muted-foreground text-xs">Verified</p>
                        <p class="mt-1 text-2xl font-bold text-emerald-600">
                            {{ qualityStats.high_confidence }}
                        </p>
                    </div>
                    <div class="rounded-lg border p-3">
                        <p class="text-muted-foreground text-xs">Likely</p>
                        <p class="mt-1 text-2xl font-bold text-amber-500">
                            {{ qualityStats.medium_confidence }}
                        </p>
                    </div>
                    <div class="rounded-lg border p-3">
                        <p class="text-muted-foreground text-xs">Uncertain</p>
                        <p class="mt-1 text-2xl font-bold text-orange-500">
                            {{ qualityStats.low_confidence }}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- ── AI summary ─────────────────────────────────────────────────────── -->
        <ScanAISummary v-if="aiSummary" :summary="aiSummary" />

        <!-- ── Charts ──────────────────────────────────────────────────────────────── -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <SeverityPieChart :vulnerabilities="result.vulnerabilities" />
            <ScannerBarChart v-if="isFullScan" :vulnerabilities="result.vulnerabilities" :scan-type="result.scan_type" />
        </div>

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
                    <Globe class="mr-1.5 h-3.5 w-3.5" />
                    Site Map
                </TabsTrigger>
                <TabsTrigger value="ssl" :disabled="!hasSSL">
                    <Lock class="mr-1.5 h-3.5 w-3.5" />
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
                <div v-else class="text-muted-foreground rounded-lg border border-dashed p-10 text-center">
                    <Globe class="mx-auto mb-2 h-8 w-8 opacity-30" />
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
                <div class="mt-4 rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow v-for="hg in techTable.getHeaderGroups()" :key="hg.id" class="bg-muted/40">
                                <TableHead v-for="h in hg.headers" :key="h.id">
                                    <FlexRender v-if="!h.isPlaceholder" :render="h.column.columnDef.header" :props="h.getContext()" />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow v-for="row in techTable.getRowModel().rows" :key="row.id">
                                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                    <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                </TableCell>
                            </TableRow>
                            <TableRow v-if="!techTable.getRowModel().rows.length">
                                <TableCell :colspan="techColumns.length" class="text-muted-foreground h-16 text-center text-sm">
                                    No technologies detected.
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

        <!-- Empty state -->
        <div v-if="totalVulns === 0 && !result.technologies.length" class="text-muted-foreground rounded-lg border border-dashed p-12 text-center">
            <Shield class="mx-auto mb-3 h-10 w-10 opacity-20" />
            <p class="font-medium">No findings recorded</p>
            <p class="mt-1 text-sm">The scan may still be processing, or no issues were detected.</p>
        </div>
    </div>
</template>
