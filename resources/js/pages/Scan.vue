<script setup lang="ts">
import BasicScanDetailDrawer from '@/components/custom/BasicScanDetailDrawer.vue';
import ScannerBarChart from '@/components/custom/Charts/ScannerBarChart.vue';
import SeverityPieChart from '@/components/custom/Charts/SeverityPieChart.vue';
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue';
import DataTablePagination from '@/components/custom/DataTablePagination.vue';
import FullScanDetailDrawer from '@/components/custom/FullScanDetailDrawer.vue';
import Navigation from '@/components/custom/Navigation.vue';
import ScanTracker from '@/components/custom/ScanTracker.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    FlexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useVueTable,
    type ColumnDef,
} from '@tanstack/vue-table';
import { Sparkles } from 'lucide-vue-next';
import { computed, h, ref } from 'vue';
import { toast } from 'vue-sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ---------- CONFIGURATION ----------
const API_BASE_URL = 'http://127.0.0.1:25565';

// ---------- TYPES ----------
// Unified Vulnerability Interface
interface Vulnerability {
    id: string;
    type: string;
    severity: string;
    scanner: string;
    confidence: string;
    method: string;
    endpoint: string;
    exploit: string;
    description: string;
    solution: string;
    reference: string;
    wstg?: string[];
}

interface Technology {
    name: string;
    version: string;
    vulnerable: boolean;
    cve: string;
    fix: string;
}

interface ScanResult {
    target: string;
    tools: string[];
    duration: number;
    date: string;
    totalVulns: number;
    criticalHighVulns: number;
    priorities: Vulnerability[];
    vulnerabilities: Vulnerability[];
    technologies: Technology[];
    aiSummary: {
        assessment: string;
        keyFindings: string[];
        recommendations: string[];
    } | null;
    country: string;
    ip: string;
}

// ---------- STATE ----------
const url = ref('');
const scanning = ref(false);
const progress = ref(0);
const errorMsg = ref('');
const activeScanType = ref('basic');

// Full Scan Options
const useZap = ref(true);

// Data Storage
const scanData = ref<ScanResult | null>(null);

// Drawers
const drawerOpen = ref(false);
const selectedVuln = ref<Vulnerability | null>(null);

// ---------- PARSERS ----------

function processPlugins(rawPlugins: any[]) {
    const flatPlugins = Array.isArray(rawPlugins) ? rawPlugins.flat() : [];
    let country = 'Unknown',
        ip = 'Unknown';
    const technologies: Technology[] = [];
    const excludedTech = ['Country', 'IP', 'HTML5', 'HTTPServer'];

    flatPlugins.forEach((p: any) => {
        const name = Object.keys(p)[0],
            details = p[name];
        if (name === 'Country') country = Array.isArray(details) ? details.join(', ') : details || 'Unknown';
        else if (name === 'IP') ip = Array.isArray(details) ? details.join(', ') : details || 'Unknown';
        else if (!excludedTech.includes(name)) {
            let version = '-';
            if (Array.isArray(details)) version = details.length ? details.join(', ') : '-';
            else if (typeof details === 'object' && details?.version) version = details.version;
            else if (typeof details === 'string') version = details;
            technologies.push({ name, version, vulnerable: false, cve: 'N/A', fix: 'N/A' });
        }
    });
    return { technologies, country, ip };
}

function mapSeverity(level: string | number): string {
    if (typeof level === 'string') {
        switch (level.toLowerCase()) {
            case 'error': return 'High';
            case 'warning': return 'Medium';
            case 'note': return 'Low';
            case 'critical': return 'Critical';
            case 'high': return 'High';
            case 'medium': return 'Medium';
            case 'low': return 'Low';
            default: return 'Informational';
        }
    }
    // Handle numeric (Wapiti style sometimes)
    if (level >= 4) return 'Critical';
    if (level === 3) return 'High';
    if (level === 2) return 'Medium';
    return 'Low';
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

// Unified Parser Function
function parseScanResponse(data: any, targetUrl: string): ScanResult {
    const { technologies, country, ip } = processPlugins(data.plugins?.fingerprinted || []);
    const allVulns: Vulnerability[] = [];

    // Check for SARIF format (Wapiti Basic Scan)
    if (data.data?.runs) {
        const run = data.data.runs[0];
        const rulesMap = new Map();
        run.tool?.driver?.rules?.forEach((r: any) => rulesMap.set(r.id, r));

        const results = run.results || [];
        results.forEach((res: any, idx: number) => {
            const rule = rulesMap.get(res.ruleId);
            allVulns.push({
                id: `sarif-${idx}`,
                type: rule?.name || res.ruleId,
                severity: mapSeverity(res.level),
                scanner: run.tool?.driver?.name || 'Wapiti',
                confidence: 'Unknown',
                method: res.properties?.method || 'GET',
                endpoint: res.locations?.[0]?.physicalLocation?.artifactLocation?.uri || targetUrl,
                exploit: '', // Wapiti sometimes puts this in properties
                description: res.message?.text || rule?.fullDescription?.text || '',
                solution: rule?.help?.text || '',
                reference: rule?.help?.markdown || '',
                wstg: rule?.properties?.tags || []
            });
        });
    }
    // Check for Aggregated format (Full Scan)
    else if (data.data?.union) {
        const rules = data.data.rules || [];
        const getRule = (id: string) => {
            const found = rules.find((r: any) => r[id]);
            return found ? found[id] : null;
        };

        data.data.union.flat().forEach((finding: any, idx: number) => {
            const rule = getRule(finding.ruleId);
            allVulns.push({
                id: `agg-${idx}`,
                type: rule?.name || finding.ruleId,
                severity: mapSeverity(finding.level),
                scanner: finding.properties?.zapId ? 'ZAP' : 'Wapiti',
                confidence: finding.properties?.confidence || 'Unknown',
                method: finding.properties?.method || 'GET',
                endpoint: finding.locations?.[0]?.physicalLocation?.artifactLocation?.uri || targetUrl,
                exploit: finding.properties?.evidence || '',
                description: finding.message?.text || rule?.fullDescription?.text || '',
                solution: rule?.help?.text || '',
                reference: rule?.help?.markdown ? (typeof rule.help.markdown === 'string' ? rule.help.markdown : JSON.stringify(rule.help.markdown)) : '',
            });
        });
    }

    // Post-processing
    const sortedVulns = allVulns.sort((a, b) => mapSeverityToNumber(b.severity) - mapSeverityToNumber(a.severity));
    const criticalHighCount = sortedVulns.filter(v => ['Critical', 'High', 'Medium'].includes(v.severity)).length;

    const priorities = sortedVulns
        .filter(v => mapSeverityToNumber(v.severity) >= 2)
        .slice(0, 5);

    const tools = Array.from(new Set(allVulns.map(v => v.scanner))).concat(['WhatWeb']);

    return {
        target: targetUrl,
        tools: tools.length > 1 ? tools : ['Wapiti', 'WhatWeb'],
        duration: Math.round(data.scan_time || 0),
        date: new Date().toISOString(),
        totalVulns: allVulns.length,
        criticalHighVulns: criticalHighCount,
        priorities,
        vulnerabilities: sortedVulns,
        technologies,
        aiSummary: {
            assessment: `Scan completed against ${targetUrl}. Found ${allVulns.length} issues.`,
            keyFindings: priorities.slice(0,3).map(v => v.type),
            recommendations: ['Review high priority findings.', 'Update detected technologies.']
        },
        country,
        ip
    };
}

// ---------- API CALLS ----------
let progressInterval: any = null;
const startMockProgress = (duration: number) => {
    progress.value = 0;
    const step = 100 / (duration / 500);
    progressInterval = setInterval(() => {
        if (progress.value < 90) progress.value += step;
    }, 500);
};
const stopMockProgress = () => {
    clearInterval(progressInterval);
    progress.value = 100;
};

function formatUrl(inputUrl: string) {
    let formatted = inputUrl.trim();
    if (!formatted) return '';
    if (inputUrl.includes('localhost')) {
        formatted = inputUrl.replace("localhost", "host.docker.internal");
    }else if (inputUrl.includes('127.0.0.1')){
        formatted = inputUrl.replace("127.0.0.1", "host.docker.internal");
    }
    if (!/^https?:\/\//i.test(formatted)) {
        formatted = 'https://' + formatted;
        return formatted
    }
    if (formatted.includes("host.docker.internal") && !formatted.includes("http://")){
        formatted = "http://" + formatted
        return formatted;
    }
    return inputUrl
}

async function handleFetchError(res: Response) {
    let message = res.statusText;
    try {
        const errorBody = await res.json();
        if (errorBody.detail) {
            message = Array.isArray(errorBody.detail)
                ? errorBody.detail.map((e: any) => e.msg).join(', ')
                : errorBody.detail;
        }
    } catch (e) {}
    throw new Error(message);
}

async function runScan(endpoint: string, payload: any, duration: number) {
    const target = formatUrl(url.value);
    if (!target) return toast.error('Please enter a URL');
    url.value = target;

    resetState();
    scanning.value = true;
    startMockProgress(duration);

    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, url: target }),
        });

        if (!res.ok) await handleFetchError(res);
        const data = await res.json();

        // Use Unified Parser
        scanData.value = parseScanResponse(data, target);
        toast.success('Scan completed!');
    } catch (e: any) {
        errorMsg.value = e.message;
        toast.error('Scan Failed', { description: e.message });
    } finally {
        scanning.value = false;
        stopMockProgress();
    }
}

function handleScanSubmit() {
    if (activeScanType.value === 'basic') {
        runScan('/api/v1/wapiti/scan/quick', {}, 15000);
    } else {
        runScan('/api/v1/scan/', { config: { useZap: useZap.value } }, 45000);
    }
}

function resetState() {
    scanData.value = null;
    progress.value = 0;
    errorMsg.value = '';
}

function onClear() {
    resetState();
    url.value = '';
}

// Helpers
function getSeverityBadge(severity: string) {
    switch (severity?.toLowerCase()) {
        case 'critical':
        case 'high': return 'destructive';
        case 'medium': return 'default';
        default: return 'secondary';
    }
}

// ---------- TABLE CONFIG ----------
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
];

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
            onClick: () => showVulnDetail(row.original),
        }, () => 'Details'),
    },
];

const techColumns: ColumnDef<Technology>[] = [
    { accessorKey: 'name', header: 'Technology' },
    { accessorKey: 'version', header: 'Version' },
    {
        accessorKey: 'vulnerable',
        header: 'Vulnerable',
        cell: ({ row }) => h(Badge, { variant: row.getValue('vulnerable') ? 'destructive' : 'secondary' },
            () => (row.getValue('vulnerable') ? 'YES' : 'NO')),
    },
];

// Tables
const priorityTable = useVueTable({
    get data() { return scanData.value?.priorities || []; },
    get columns() { return priorityColumns; },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
});

const vulnerabilitiesTable = useVueTable({
    get data() { return scanData.value?.vulnerabilities || []; },
    get columns() { return vulnerabilityColumns; },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { get globalFilter() { return globalFilter.value; } },
    onGlobalFilterChange: (u) => (globalFilter.value = typeof u === 'function' ? u(globalFilter.value) : u),
});

const techTable = useVueTable({
    get data() { return scanData.value?.technologies || []; },
    get columns() { return techColumns; },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
});

const globalFilter = ref('');
const showVulnDetail = (vuln: Vulnerability) => {
    selectedVuln.value = vuln;
    drawerOpen.value = true;
};

const previewUrl = computed(() => {
    if (!url.value) return '';
    return /^https?:\/\//i.test(url.value) ? url.value : `http://${url.value}`;
});
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div>
                <h1 class="px-2 text-4xl font-bold">New Scan</h1>
                <div class="p-1.5"><span>Run scans to probe websites for vulnerabilities.</span></div>
            </div>

            <Tabs v-model="activeScanType" default-value="basic" class="w-full" @update:model-value="resetState">
                <TabsList class="grid w-full grid-cols-2 md:w-[400px]">
                    <TabsTrigger value="basic">Basic Scan</TabsTrigger>
                    <TabsTrigger value="full">Full Scan</TabsTrigger>
                </TabsList>

                <TabsContent v-for="type in ['basic', 'full']" :key="type" :value="type">
                    <form @submit.prevent="handleScanSubmit">
                        <div class="grid grid-rows-2 grid-cols-5 gap-4">
                            <Card class="row-span-2 col-span-2 flex flex-col">
                                <CardHeader class="flex">
                                    <div>
                                        <CardTitle>{{ type === 'basic' ? 'Basic' : 'Full' }} Scan</CardTitle>
                                        <CardContent class="px-0 pt-4 pb-0">
                                            <span class="text-muted-foreground text-sm">
                                                {{ type === 'basic' ? 'Runs a preconfigured Wapiti and WhatWeb scan.' : 'Comprehensive scan using Wapiti, ZAP, and SearchVuln.' }}
                                            </span>
                                        </CardContent>
                                    </div>
                                </CardHeader>
                                <CardContent class="flex flex-col gap-4 pt-6 md:flex-row md:items-start">
                                    <Input v-model="url" placeholder="Enter site URL" class="w-full md:w-80" :disabled="scanning" />
                                    <div class="flex gap-2">
                                        <Button type="submit" :disabled="scanning">
                                            <svg v-if="scanning" class="mr-3 -ml-1 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {{ scanning ? 'Scanning...' : 'Run Scan' }}
                                        </Button>
                                        <Button variant="secondary" type="button" @click="onClear" :disabled="scanning"> Clear </Button>
                                    </div>
                                </CardContent>
                                <div v-if="scanning" class="px-6 pb-6">
                                    <Progress :model-value="progress" class="h-2" />
                                </div>
<!--                                <div class="h-[300px] min-h-0 px-6 pb-6">-->
<!--                                    <ScanTracker />-->
<!--                                </div>-->
                            </Card>
                            <div class="row-span-2 col-span-3">
                                <Card class="sticky top-4">
                                    <CardHeader class="pb-2">
                                        <CardTitle class="text-lg">Target Preview</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div class="bg-muted relative aspect-video w-full overflow-hidden rounded-md border">
                                            <iframe v-if="previewUrl" :src="previewUrl" class="h-full w-full border-0" sandbox="allow-scripts allow-same-origin"></iframe>
                                            <div v-else class="text-muted-foreground flex h-full flex-col items-center justify-center p-4 text-center">
                                                <span class="text-xs">Enter a URL to see a preview</span>
                                            </div>
                                        </div>
                                        <p class="text-muted-foreground mt-2 text-center text-[10px]">Preview may not load if blocked by site policy (X-Frame-Options).</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </form>
                </TabsContent>
            </Tabs>

            <div v-if="errorMsg && !scanning" class="p-2 text-center font-bold text-red-600">{{ errorMsg }}</div>

            <div v-if="scanning" class="mt-2 animate-pulse space-y-4">
                <Card><CardHeader><Skeleton class="h-6 w-48" /></CardHeader><CardContent class="space-y-4"><Skeleton class="h-4 w-full" /><Skeleton class="h-4 w-3/4" /></CardContent></Card>
                <Card><CardHeader><Skeleton class="h-8 w-64" /></CardHeader><CardContent><div class="grid grid-cols-2 gap-4 md:grid-cols-4"><div v-for="i in 4" :key="i" class="space-y-2 rounded-lg border p-4"><Skeleton class="h-4 w-20" /><Skeleton class="h-8 w-12" /></div></div></CardContent></Card>
            </div>

            <div v-else-if="scanData" class="animate-fadein mt-2 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle class="text-2xl">{{ activeScanType === 'basic' ? 'Basic' : 'Full' }} Scan Report</CardTitle>
                        <CardDescription class="pt-2">
                            <div class="grid grid-cols-1 gap-1 text-sm md:grid-cols-4">
                                <div class="truncate"><strong>Target:</strong> {{ scanData.target }}</div>
                                <div class="truncate"><strong>Tools:</strong> {{ scanData.tools.join(', ') }}</div>
                                <div class="truncate"><strong>Location:</strong> {{ scanData.country }}</div>
                                <div class="truncate"><strong>IP:</strong> {{ scanData.ip }}</div>
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent class="pt-6">
                        <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div class="rounded-lg border p-4">
                                <h3 class="text-muted-foreground text-sm font-medium">Total Findings</h3>
                                <p class="text-3xl font-bold">{{ scanData.totalVulns }}</p>
                            </div>
                            <div class="rounded-lg border p-4">
                                <h3 class="text-muted-foreground text-sm font-medium">High/Medium</h3>
                                <p class="text-destructive text-3xl font-bold">{{ scanData.criticalHighVulns }}</p>
                            </div>
                            <div class="rounded-lg border p-4">
                                <h3 class="text-muted-foreground text-sm font-medium">Technologies</h3>
                                <p class="text-3xl font-bold">{{ scanData.technologies.length }}</p>
                            </div>
                            <div class="rounded-lg border p-4">
                                <h3 class="text-muted-foreground text-sm font-medium">Top Vulnerability</h3>
                                <p class="text-2xl font-bold md:text-3xl">{{ scanData.priorities[0]?.type || 'N/A' }}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card v-if="scanData.aiSummary">
                    <CardHeader>
                        <CardTitle class="flex items-center gap-2">
                            <Sparkles class="text-primary h-5 w-5" />
                            <span>AI Summary & Recommendations</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-4 text-sm">
                        <div>
                            <h4 class="mb-2 font-semibold">Overall Assessment</h4>
                            <p class="text-muted-foreground">{{ scanData.aiSummary.assessment }}</p>
                        </div>
                        <div>
                            <h4 class="mb-2 font-semibold">Key Findings</h4>
                            <ul class="text-muted-foreground list-disc space-y-1 pl-5">
                                <li v-for="(finding, idx) in scanData.aiSummary.keyFindings" :key="`f-${idx}`">{{ finding }}</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle>Severity Distribution</CardTitle></CardHeader>
                        <CardContent><SeverityPieChart :vulnerabilities="scanData.vulnerabilities" /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Findings by Scanner</CardTitle></CardHeader>
                        <CardContent><ScannerBarChart :vulnerabilities="scanData.vulnerabilities" /></CardContent>
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
                                    <TableRow v-for="row in vulnerabilitiesTable.getRowModel().rows" :key="row.id" class="cursor-pointer" @click="showVulnDetail(row.original)">
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

                <Card v-if="scanData.technologies.length">
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
            </div>

            <FullScanDetailDrawer
                v-if="selectedVuln"
                :vuln="selectedVuln"
                :open="drawerOpen"
                @update:open="drawerOpen = $event"
            />
        </div>
    </Navigation>
</template>

<style scoped>
.animate-fadein { animation: fadein 0.5s; }
@keyframes fadein {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
th { position: sticky; top: 0; z-index: 1; }
</style>
