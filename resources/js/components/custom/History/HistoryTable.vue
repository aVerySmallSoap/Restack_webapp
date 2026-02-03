<script setup lang="ts">
import { h, ref, computed } from 'vue'
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
import type { PropType } from 'vue'
import { CircleAlert, Shield, Info } from 'lucide-vue-next'
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue'
import DataTablePagination from '@/components/custom/DataTablePagination.vue'
import HistoryRowActions from '@/components/custom/History/HistoryRowActions.vue'
import FacetedFilter from '@/components/custom/FacetedFilter.vue'
import DateRangeFilter from '@/components/custom/DateRangeFilter.vue'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScanHistory } from '@/lib/restack/restack.types'

const props = defineProps({
    data: {
        type: Array as PropType<ScanHistory[]>,
        required: true,
        default: () => [],
    },
})

const sorting = ref<SortingState>([{ id: 'date', desc: true }])
const columnFilters = ref<ColumnFiltersState>([])
const globalFilter = ref('')

// Filter options
const scanTypeOptions = [
    { label: 'Full Scan', value: 'Full' },
    { label: 'Basic Scan', value: 'Basic' },
]

const severityOptions = [
    { label: 'Critical/High', value: 'critical-high', icon: CircleAlert },
    { label: 'Has Findings', value: 'has-findings', icon: Shield },
    { label: 'Clean', value: 'clean', icon: Info },
]

// Define columns
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
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
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
            return h('div', { class: `text-center font-bold ${count > 0 ? 'text-destructive' : 'text-muted-foreground'}` }, count)
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
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Date' }),
        cell: ({ row }) => h('div', { class: 'text-xs text-muted-foreground' }, new Date(row.getValue('date')).toLocaleString()),
        filterFn: (row, id, value) => {
            const date = new Date(row.getValue(id))
            const [from, to] = value || []

            if (from && !to) {
                return date >= from
            }
            if (!from && to) {
                return date <= to
            }
            if (from && to) {
                return date >= from && date <= to
            }
            return true
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => h(HistoryRowActions, { rowData: row.original }),
    },
]

// Define table with faceted filtering support
const table = useVueTable({
    get data() { return props.data },
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
    onSortingChange: (updater) => {
        sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
    },
    onColumnFiltersChange: (updater) => {
        columnFilters.value = typeof updater === 'function' ? updater(columnFilters.value) : updater
    },
    onGlobalFilterChange: (updater) => {
        globalFilter.value = typeof updater === 'function' ? updater(globalFilter.value) : updater
    },
})

const isFiltered = computed(() => columnFilters.value.length > 0)

function resetFilters() {
    table.resetColumnFilters()
}
</script>

<template>
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
                                <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <template v-if="table.getRowModel().rows.length">
                            <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
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
</template>
