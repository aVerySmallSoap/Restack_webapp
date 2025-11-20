<script setup lang="ts">
import { h, ref } from 'vue'
import {
    useVueTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    FlexRender,
    type ColumnDef,
    type SortingState,
} from '@tanstack/vue-table'
import type { PropType } from 'vue'
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue'
import DataTablePagination from '@/components/custom/DataTablePagination.vue'
import HistoryRowActions from '@/components/custom/History/HistoryRowActions.vue'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScanHistory } from '@/lib/restack/restack.types'

const props = defineProps({
    data: {
        type: Array as PropType<ScanHistory[]>,
        required: true,
        default: () => [],
    },
})

const sorting = ref<SortingState>([{ id: 'date', desc: true }])
const globalFilter = ref('')

// --- 1. DEFINE COLUMNS FIRST ---
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
    },
    {
        accessorKey: 'date',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Date' }),
        cell: ({ row }) => h('div', { class: 'text-xs text-muted-foreground' }, new Date(row.getValue('date')).toLocaleString()),
    },
    {
        id: 'actions',
        cell: ({ row }) => h(HistoryRowActions, { rowData: row.original }),
    },
]

// --- 2. THEN DEFINE TABLE ---
const table = useVueTable({
    get data() { return props.data },
    columns, // <--- Safely referenced now
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
        get sorting() { return sorting.value },
        get globalFilter() { return globalFilter.value },
    },
    onSortingChange: (updater) => {
        sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
    },
    onGlobalFilterChange: (updater) => {
        globalFilter.value = typeof updater === 'function' ? updater(globalFilter.value) : updater
    },
})
</script>

<template>
    <Card>
        <CardContent class="p-6">
            <div class="flex items-center py-4">
                <Input
                    placeholder="Filter history..."
                    :model-value="globalFilter"
                    @update:modelValue="globalFilter = String($event)"
                    class="max-w-sm"
                />
            </div>
            <div class="rounded-md border">
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
                                    No scan history found.
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
