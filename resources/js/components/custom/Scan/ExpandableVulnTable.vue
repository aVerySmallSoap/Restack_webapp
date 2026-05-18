<script setup lang="ts">
import { h, ref, computed } from 'vue';
import {
    useVueTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getExpandedRowModel,
    FlexRender,
    type ColumnDef,
    type ExpandedState,
    type ColumnFiltersState,
    type SortingState,
} from '@tanstack/vue-table';
import type { PropType } from 'vue';
import { ChevronDown, ChevronRight, AlertTriangle, Shield, ExternalLink, Code, Terminal, BookOpen, Globe, Cpu } from 'lucide-vue-next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue';
import DataTablePagination from '@/components/custom/DataTablePagination.vue';
import FacetedFilter from '@/components/custom/FacetedFilter.vue';
import { getSeverityColor } from '@/lib/colors';
import type { Vulnerability } from '@/lib/types/scan';

const props = defineProps({
    vulnerabilities: {
        type: Array as PropType<Vulnerability[]>,
        required: true,
        default: () => [],
    },
    scanType: {
        type: String as PropType<'basic' | 'full'>,
        default: 'full',
    },
    showScannerFilter: {
        type: Boolean,
        default: true,
    },
});

// ── Severity helpers ──────────────────────────────────────────────────────────

function getSeverityStyle(sev: string) {
    return {
        backgroundColor: getSeverityColor(sev),
        color: '#ffffff',
        border: 'none',
    };
}

function severityRank(sev: string): number {
    switch (sev?.toLowerCase()) {
        case 'critical':
            return 4;
        case 'high':
            return 3;
        case 'medium':
            return 2;
        case 'low':
            return 1;
        default:
            return 0;
    }
}

// ── Confidence badge ──────────────────────────────────────────────────────────

function confidenceVariant(conf: string): 'default' | 'secondary' | 'outline' {
    const c = (conf || '').toLowerCase();
    if (['high', 'confirmed'].includes(c)) return 'default';
    if (['medium'].includes(c)) return 'secondary';
    return 'outline';
}

// ── HTTP request display ──────────────────────────────────────────────────────

function formatHttpRequest(req: any): string {
    if (!req) return '';
    if (typeof req === 'string') return req;
    if (req.raw) return req.raw;
    try {
        return JSON.stringify(req, null, 2);
    } catch {
        return String(req);
    }
}

function formatReferences(ref: string): Array<{ label: string; url: string }> {
    if (!ref) return [];
    return ref
        .split('\n')
        .filter(Boolean)
        .map((line) => {
            // Markdown link: [label](url)
            const md = line.match(/\[(.+?)\]\((.+?)\)/);
            if (md) return { label: md[1], url: md[2] };
            // Plain URL
            if (line.startsWith('http')) return { label: line, url: line };
            return { label: line, url: '' };
        });
}

// ── Table state ───────────────────────────────────────────────────────────────

const expanded = ref<ExpandedState>({});
const sorting = ref<SortingState>([{ id: 'severity', desc: true }]);
const columnFilters = ref<ColumnFiltersState>([]);
const globalFilter = ref('');

const severityOptions = [
    { label: 'Critical', value: 'critical' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
    { label: 'Informational', value: 'informational' },
];

const scannerOptions = computed(() => {
    const seen = new Set(props.vulnerabilities.map((v) => v.scanner).filter(Boolean));
    return Array.from(seen)
        .sort()
        .map((s) => ({ label: s, value: s }));
});

// ── Columns ───────────────────────────────────────────────────────────────────

const columns: ColumnDef<Vulnerability>[] = [
    // Expand toggle
    {
        id: 'expander',
        header: () => null,
        size: 32,
        cell: ({ row }) =>
            h(
                Button,
                {
                    variant: 'ghost',
                    size: 'icon',
                    class: 'h-7 w-7 shrink-0',
                    onClick: (e: MouseEvent) => {
                        e.stopPropagation();
                        row.toggleExpanded();
                    },
                },
                () =>
                    row.getIsExpanded()
                        ? h(ChevronDown, { class: 'h-4 w-4 text-muted-foreground' })
                        : h(ChevronRight, { class: 'h-4 w-4 text-muted-foreground' }),
            ),
    },
    // Vulnerability name
    {
        accessorKey: 'type',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Vulnerability' }),
        cell: ({ row }) => h('div', { class: 'font-medium max-w-[220px] truncate', title: row.getValue('type') }, row.getValue('type')),
    },
    // Severity
    {
        accessorKey: 'severity',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Severity' }),
        cell: ({ row }) => h(Badge, { style: getSeverityStyle(row.getValue('severity')) }, () => row.getValue('severity')),
        sortingFn: (a, b) => severityRank(a.original.severity) - severityRank(b.original.severity),
        filterFn: (row, id, value) => value.includes((row.getValue(id) as string)?.toLowerCase()),
    },
    // Scanner (full scan only)
    ...(props.scanType === 'full'
        ? [
              {
                  accessorKey: 'scanner',
                  header: ({ column }: any) => h(DataTableColumnHeader, { column, title: 'Scanner' }),
                  cell: ({ row }: any) => h('span', { class: 'text-xs font-mono text-muted-foreground' }, row.getValue('scanner')),
                  filterFn: (row: any, id: any, value: any) => value.includes(row.getValue(id)),
              } as ColumnDef<Vulnerability>,
          ]
        : []),
    // Method
    {
        accessorKey: 'method',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Method' }),
        size: 80,
        cell: ({ row }) => h('span', { class: 'text-xs font-mono px-1.5 py-0.5 rounded bg-muted' }, (row.getValue('method') as string) || 'N/A'),
    },
    // Endpoint
    {
        accessorKey: 'endpoint',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Endpoint' }),
        cell: ({ row }) =>
            h(
                'div',
                { class: 'max-w-[200px] truncate font-mono text-xs text-muted-foreground', title: row.getValue('endpoint') },
                row.getValue('endpoint'),
            ),
    },
    // Confidence (full scan only)
    ...(props.scanType === 'full'
        ? [
              {
                  accessorKey: 'confidence',
                  header: ({ column }: any) => h(DataTableColumnHeader, { column, title: 'Confidence' }),
                  size: 100,
                  cell: ({ row }: any) => {
                      const conf = row.getValue('confidence') as string;
                      return h(Badge, { variant: confidenceVariant(conf), class: 'text-xs' }, () => conf || 'Unknown');
                  },
              } as ColumnDef<Vulnerability>,
          ]
        : []),
];

// ── Table instance ────────────────────────────────────────────────────────────

const table = useVueTable({
    get data() {
        return props.vulnerabilities;
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getExpandedRowModel: getExpandedRowModel(),
    state: {
        get expanded() {
            return expanded.value;
        },
        get sorting() {
            return sorting.value;
        },
        get columnFilters() {
            return columnFilters.value;
        },
        get globalFilter() {
            return globalFilter.value;
        },
    },
    onExpandedChange: (u) => {
        expanded.value = typeof u === 'function' ? u(expanded.value) : u;
    },
    onSortingChange: (u) => {
        sorting.value = typeof u === 'function' ? u(sorting.value) : u;
    },
    onColumnFiltersChange: (u) => {
        columnFilters.value = typeof u === 'function' ? u(columnFilters.value) : u;
    },
    onGlobalFilterChange: (u) => {
        globalFilter.value = typeof u === 'function' ? u(globalFilter.value) : u;
    },
});

const isFiltered = computed(() => columnFilters.value.length > 0);

function resetFilters() {
    table.resetColumnFilters();
    globalFilter.value = '';
}

// Collapse all expanded rows when filter changes
function onFilterInput(val: string) {
    globalFilter.value = val;
    expanded.value = {};
}
</script>

<template>
    <div class="space-y-3">
        <!-- Filter Bar -->
        <div class="flex flex-wrap items-center gap-2">
            <Input
                placeholder="Search vulnerabilities…"
                :model-value="globalFilter"
                @update:modelValue="onFilterInput(String($event))"
                class="h-8 w-[200px] lg:w-[260px]"
            />
            <FacetedFilter v-if="table.getColumn('severity')" :column="table.getColumn('severity')" title="Severity" :options="severityOptions" />
            <FacetedFilter
                v-if="showScannerFilter && scanType === 'full' && table.getColumn('scanner') && scannerOptions.length > 1"
                :column="table.getColumn('scanner')"
                title="Scanner"
                :options="scannerOptions"
            />
            <Button v-if="isFiltered || globalFilter" variant="ghost" size="sm" class="h-8 px-2" @click="resetFilters"> Reset </Button>
            <span class="text-muted-foreground ml-auto text-xs">
                {{ table.getFilteredRowModel().rows.length }} of {{ vulnerabilities.length }} findings
            </span>
        </div>

        <!-- Table -->
        <div class="overflow-hidden rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow v-for="hg in table.getHeaderGroups()" :key="hg.id" class="bg-muted/40">
                        <TableHead v-for="h in hg.headers" :key="h.id" :style="{ width: h.getSize() + 'px' }">
                            <FlexRender v-if="!h.isPlaceholder" :render="h.column.columnDef.header" :props="h.getContext()" />
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <template v-if="table.getRowModel().rows.length">
                        <template v-for="row in table.getRowModel().rows" :key="row.id">
                            <!-- Data Row -->
                            <TableRow
                                class="cursor-pointer transition-colors"
                                :class="row.getIsExpanded() ? 'bg-muted/30 border-b-0' : 'hover:bg-muted/20'"
                                @click="row.toggleExpanded()"
                            >
                                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="py-2.5">
                                    <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                </TableCell>
                            </TableRow>

                            <!-- Expanded Details Panel -->
                            <TableRow v-if="row.getIsExpanded()" class="border-t-0 hover:bg-transparent">
                                <TableCell :colspan="columns.length" class="p-0">
                                    <div class="border-border/60 bg-muted/20 space-y-5 border-t px-6 py-5">
                                        <!-- Header strip with severity + title -->
                                        <div class="flex items-start gap-3">
                                            <div
                                                class="mt-0.5 h-4 w-1.5 shrink-0 rounded-full"
                                                :style="{ backgroundColor: getSeverityColor(row.original.severity) }"
                                            />
                                            <div>
                                                <p class="text-sm font-semibold">{{ row.original.type }}</p>
                                                <p class="text-muted-foreground mt-0.5 font-mono text-xs">{{ row.original.endpoint }}</p>
                                            </div>
                                            <div class="ml-auto flex shrink-0 items-center gap-2">
                                                <Badge :style="getSeverityStyle(row.original.severity)">{{ row.original.severity }}</Badge>
                                                <Badge
                                                    v-if="row.original.confidence"
                                                    :variant="confidenceVariant(row.original.confidence)"
                                                    class="text-xs"
                                                >
                                                    {{ row.original.confidence }}
                                                </Badge>
                                            </div>
                                        </div>

                                        <Separator />

                                        <!-- 2-col detail grid -->
                                        <div class="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
                                            <!-- Description -->
                                            <div v-if="row.original.description" class="min-w-0 space-y-1.5">
                                                <div
                                                    class="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"
                                                >
                                                    <AlertTriangle class="h-3.5 w-3.5 shrink-0" />
                                                    Description
                                                </div>
                                                <p class="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                                    {{ row.original.description }}
                                                </p>
                                            </div>

                                            <!-- Remediation -->
                                            <div v-if="row.original.solution" class="min-w-0 space-y-1.5">
                                                <div
                                                    class="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"
                                                >
                                                    <Shield class="h-3.5 w-3.5 shrink-0" />
                                                    Remediation
                                                </div>
                                                <p class="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                                    {{ row.original.solution }}
                                                </p>
                                            </div>

                                            <!-- Evidence / Exploit -->
                                            <div v-if="row.original.exploit && row.original.exploit !== 'N/A'" class="min-w-0 space-y-1.5">
                                                <div
                                                    class="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"
                                                >
                                                    <Code class="h-3.5 w-3.5 shrink-0" />
                                                    Evidence
                                                </div>
                                                <code
                                                    class="bg-background block rounded border px-3 py-2 font-mono text-xs break-all whitespace-pre-wrap"
                                                >
                                                    {{ row.original.exploit }}
                                                </code>
                                            </div>

                                            <!-- Scanner metadata -->
                                            <div v-if="row.original.scanner" class="min-w-0 space-y-1.5">
                                                <div
                                                    class="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"
                                                >
                                                    <Cpu class="h-3.5 w-3.5 shrink-0" />
                                                    Detection
                                                </div>
                                                <div class="flex flex-wrap gap-2 text-xs">
                                                    <span class="bg-background rounded-md border px-2 py-1 font-mono">
                                                        Scanner: {{ row.original.scanner }}
                                                    </span>
                                                    <span v-if="row.original.method" class="bg-background rounded-md border px-2 py-1 font-mono">
                                                        Method: {{ row.original.method }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- HTTP Request (full width) -->
                                        <div v-if="formatHttpRequest(row.original.http_request)" class="space-y-1.5">
                                            <div
                                                class="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"
                                            >
                                                <Globe class="h-3.5 w-3.5" />
                                                HTTP Request
                                            </div>
                                            <pre
                                                class="bg-background max-h-48 overflow-x-auto rounded-md border px-4 py-3 font-mono text-xs whitespace-pre-wrap"
                                                >{{ formatHttpRequest(row.original.http_request) }}</pre
                                            >
                                        </div>

                                        <!-- Curl Command -->
                                        <div v-if="row.original.curl_command" class="space-y-1.5">
                                            <div
                                                class="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"
                                            >
                                                <Terminal class="h-3.5 w-3.5" />
                                                cURL Command
                                            </div>
                                            <pre
                                                class="bg-background max-h-32 overflow-x-auto rounded-md border px-4 py-3 font-mono text-xs whitespace-pre-wrap"
                                                >{{ row.original.curl_command }}</pre
                                            >
                                        </div>

                                        <!-- WSTG tags -->
                                        <div v-if="row.original.wstg?.length" class="space-y-1.5">
                                            <div class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">WSTG Tags</div>
                                            <div class="flex flex-wrap gap-1.5">
                                                <Badge v-for="tag in row.original.wstg" :key="tag" variant="outline" class="font-mono text-xs">
                                                    {{ tag }}
                                                </Badge>
                                            </div>
                                        </div>

                                        <!-- References -->
                                        <div v-if="row.original.reference && formatReferences(row.original.reference).length" class="space-y-1.5">
                                            <div
                                                class="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"
                                            >
                                                <BookOpen class="h-3.5 w-3.5" />
                                                References
                                            </div>
                                            <div class="flex flex-wrap gap-2">
                                                <a
                                                    v-for="ref in formatReferences(row.original.reference)"
                                                    :key="ref.url"
                                                    :href="ref.url || undefined"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                                                    @click.stop
                                                >
                                                    <ExternalLink v-if="ref.url" class="h-3 w-3" />
                                                    {{ ref.label }}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </template>
                    </template>

                    <!-- Empty state -->
                    <template v-else>
                        <TableRow>
                            <TableCell :colspan="columns.length" class="text-muted-foreground h-32 text-center">
                                <Shield class="mx-auto mb-2 h-8 w-8 opacity-30" />
                                No vulnerabilities match the current filters.
                            </TableCell>
                        </TableRow>
                    </template>
                </TableBody>
            </Table>
        </div>

        <DataTablePagination :table="table" />
    </div>
</template>
