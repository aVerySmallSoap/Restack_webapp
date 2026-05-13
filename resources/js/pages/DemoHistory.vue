<script setup lang="ts">
import { h, ref, computed } from 'vue'
import Navigation from '@/components/custom/Navigation.vue'
import {
    useVueTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    FlexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
} from '@tanstack/vue-table'
import { CircleAlert, Shield, Info } from 'lucide-vue-next'
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue'
import DataTablePagination from '@/components/custom/DataTablePagination.vue'
import FacetedFilter from '@/components/custom/FacetedFilter.vue'
import DateRangeFilter from '@/components/custom/DateRangeFilter.vue'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ScanHistory } from '@/lib/restack/restack.types'

// ─── Hardcoded sample data ────────────────────────────────────────────────────

const history: ScanHistory[] = [
    {
        id: 'rpt-001', target: 'dnsc.edu.ph', scanType: 'Full',
        totalFindings: 47, criticalHigh: 12,
        date: '2026-03-25T02:34:00.000Z', status: 'Completed',
        owner: 'Ian Padios', duration: 847, isAutomated: false,
    },
    {
        id: 'rpt-002', target: 'dnsc.edu.ph', scanType: 'Basic',
        totalFindings: 19, criticalHigh: 5,
        date: '2026-03-20T06:15:00.000Z', status: 'Completed',
        owner: 'Ian Padios', duration: 213, isAutomated: true,
    },
    {
        id: 'rpt-003', target: 'dnsc.edu.ph', scanType: 'Full',
        totalFindings: 61, criticalHigh: 18,
        date: '2026-03-13T01:00:00.000Z', status: 'Completed',
        owner: 'Ian Padios', duration: 1024, isAutomated: false,
    },
    {
        id: 'rpt-004', target: 'dnsc.edu.ph', scanType: 'Basic',
        totalFindings: 8, criticalHigh: 0,
        date: '2026-03-07T07:48:00.000Z', status: 'Completed',
        owner: 'Ian Padios', duration: 178, isAutomated: true,
    },
    {
        id: 'rpt-005', target: 'dnsc.edu.ph', scanType: 'Full',
        totalFindings: 34, criticalHigh: 9,
        date: '2026-03-01T03:22:00.000Z', status: 'Completed',
        owner: 'Ian Padios', duration: 731, isAutomated: false,
    },
    {
        id: 'rpt-006', target: 'dnsc.edu.ph', scanType: 'Basic',
        totalFindings: 11, criticalHigh: 2,
        date: '2026-02-22T08:00:00.000Z', status: 'Completed',
        owner: 'Ian Padios', duration: 195, isAutomated: true,
    },
    {
        id: 'rpt-007', target: 'dnsc.edu.ph', scanType: 'Full',
        totalFindings: 28, criticalHigh: 7,
        date: '2026-02-14T05:30:00.000Z', status: 'Completed',
        owner: 'Ian Padios', duration: 892, isAutomated: false,
    },
]

// ─── Table columns ────────────────────────────────────────────────────────────

const sorting = ref<SortingState>([{ id: 'date', desc: true }])
const columnFilters = ref<ColumnFiltersState>([])
const globalFilter = ref('')

const scanTypeOptions = [
    { label: 'Full Scan', value: 'Full' },
    { label: 'Basic Scan', value: 'Basic' },
]

const severityOptions = [
    { label: 'Critical/High', value: 'critical-high', icon: CircleAlert },
    { label: 'Has Findings', value: 'has-findings', icon: Shield },
    { label: 'Clean', value: 'clean', icon: Info },
]

const columns: ColumnDef<ScanHistory>[] = [
    {
        accessorKey: 'target',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Target' }),
        cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('target')),
    },
    {
        accessorKey: 'scanType',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }),
        cell: ({ row }) => {
            const type = row.getValue('scanType') as string
            return h(Badge, { variant: type === 'Full' ? 'default' : 'secondary' }, () => type)
        },
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
        accessorKey: 'totalFindings',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Findings' }),
        cell: ({ row }) => h('div', { class: 'text-center' }, row.getValue('totalFindings')),
    },
    {
        accessorKey: 'criticalHigh',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Crit/High' }),
        cell: ({ row }) => {
            const count = row.getValue('criticalHigh') as number
            return h('div', {
                class: `text-center font-bold ${count > 0 ? 'text-destructive' : 'text-muted-foreground'}`
            }, count)
        },
        filterFn: (row, id, value) => {
            const criticalHigh = row.getValue('criticalHigh') as number
            const totalFindings = row.getValue('totalFindings') as number
            if (value.includes('critical-high') && criticalHigh > 0) return true
            if (value.includes('has-findings') && totalFindings > 0) return true
            if (value.includes('clean') && totalFindings === 0) return true
            return false
        },
    },
    {
        accessorKey: 'date',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Date (PH Time)' }),
        cell: ({ row }) => {
            const date = new Date(row.getValue('date'))
            return h('div', { class: 'text-xs text-muted-foreground' },
                date.toLocaleString('en-PH', {
                    timeZone: 'Asia/Manila',
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true,
                })
            )
        },
        filterFn: (row, id, value) => {
            const date = new Date(row.getValue(id))
            const [from, to] = value || []
            if (from && !to) return date >= from
            if (!from && to) return date <= to
            if (from && to) return date >= from && date <= to
            return true
        },
    },
    {
        accessorKey: 'isAutomated',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Source' }),
        cell: ({ row }) => {
            const isAutomated = row.getValue('isAutomated')
            return h(Badge, { variant: isAutomated ? 'secondary' : 'default' },
                () => isAutomated ? 'Scheduled' : 'Manual'
            )
        },
    },
]

const table = useVueTable({
    get data() { return history },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
        get sorting() { return sorting.value },
        get columnFilters() { return columnFilters.value },
        get globalFilter() { return globalFilter.value },
    },
    onSortingChange: (u) => (sorting.value = typeof u === 'function' ? u(sorting.value) : u),
    onColumnFiltersChange: (u) => (columnFilters.value = typeof u === 'function' ? u(columnFilters.value) : u),
    onGlobalFilterChange: (u) => (globalFilter.value = typeof u === 'function' ? u(globalFilter.value) : u),
})

const isFiltered = computed(() => columnFilters.value.length > 0)
function resetFilters() { table.resetColumnFilters() }
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div>
                <h1 class="font-bold px-2 text-4xl">Previous Scans</h1>
                <div class="p-1.5">
                    <span>Review, filter, and search all previous scan reports.</span>
                </div>
            </div>

            <Card>
                <CardContent class="p-6">
                    <div class="flex items-center justify-between">
                        <div class="flex flex-1 flex-wrap items-center gap-2">
                            <Input
                                placeholder="Search history..."
                                :model-value="globalFilter"
                                @update:modelValue="globalFilter = String($event)"
                                class="h-8 w-[150px] lg:w-[250px]"
                            />
                            <FacetedFilter
                                v-if="table.getColumn('scanType')"
                                :column="table.getColumn('scanType')"
                                title="Scan Type"
                                :options="scanTypeOptions"
                            />
                            <FacetedFilter
                                v-if="table.getColumn('criticalHigh')"
                                :column="table.getColumn('criticalHigh')"
                                title="Severity"
                                :options="severityOptions"
                            />
                            <DateRangeFilter
                                v-if="table.getColumn('date')"
                                :column="table.getColumn('date')"
                                title="Date Range"
                            />
                            <Button
                                v-if="isFiltered"
                                variant="ghost"
                                @click="resetFilters"
                                class="h-8 px-2 lg:px-3"
                            >
                                Reset
                            </Button>
                        </div>
                    </div>

                    <div class="rounded-md border mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                                    <TableHead v-for="header in headerGroup.headers" :key="header.id">
                                        <FlexRender
                                            v-if="!header.isPlaceholder"
                                            :render="header.column.columnDef.header"
                                            :props="header.getContext()"
                                        />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <template v-if="table.getRowModel().rows.length">
                                    <TableRow
                                        v-for="row in table.getRowModel().rows"
                                        :key="row.id"
                                        class="cursor-pointer hover:bg-muted/50"
                                    >
                                        <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                            <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                        </TableCell>
                                    </TableRow>
                                </template>
                                <template v-else>
                                    <TableRow>
                                        <TableCell :colSpan="columns.length" class="h-24 text-center">
                                            No results found.
                                        </TableCell>
                                    </TableRow>
                                </template>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter>
                    <DataTablePagination :table="table" />
                </CardFooter>
            </Card>
        </div>
    </Navigation>
</template>
