<script setup lang="ts">
import Navigation from '@/components/custom/Navigation.vue';
import SeverityBadge from '@/components/custom/SeverityBadge.vue';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { valueUpdater } from '@/components/ui/table/utils';
import type { ColumnFiltersState, ExpandedState, SortingState, VisibilityState } from '@tanstack/vue-table';
import {
    createColumnHelper,
    FlexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useVueTable,
} from '@tanstack/vue-table';
import { ChevronDown, ChevronsUpDown } from 'lucide-vue-next';
import { h, ref } from 'vue';

const showDeleteModal = ref(false);
const deleteTarget = ref<null | number>(null);

export interface ScanHistory {
    id: number;
    date: string;
    target: string;
    scanner: string;
    severity: string;
    vulnCount: number;
    status: string;
}

// Example data
const data = ref<ScanHistory[]>([
    {
        id: 1,
        date: '2025-05-21 14:23',
        target: 'https://example.com',
        scanner: 'Wapiti',
        severity: 'Critical',
        vulnCount: 3,
        status: 'Completed',
    },
    {
        id: 2,
        date: '2025-05-20 10:13',
        target: 'https://demoapp.com',
        scanner: 'Arachni',
        severity: 'High',
        vulnCount: 2,
        status: 'Completed',
    },
    {
        id: 3,
        date: '2025-05-19 08:42',
        target: 'https://testsite.org',
        scanner: 'Zap',
        severity: 'Medium',
        vulnCount: 1,
        status: 'In Progress',
    },
    {
        id: 4,
        date: '2025-05-18 17:05',
        target: 'https://mywebapp.net',
        scanner: 'Wapiti',
        severity: 'Low',
        vulnCount: 0,
        status: 'Completed',
    },
]);

function confirmDelete(id: number) {
    deleteTarget.value = id;
    showDeleteModal.value = true;
}
function doDelete() {
    if (deleteTarget.value !== null) {
        data.value = data.value.filter((row) => row.id !== deleteTarget.value);
        showDeleteModal.value = false;
        deleteTarget.value = null;
    }
}
function cancelDelete() {
    showDeleteModal.value = false;
    deleteTarget.value = null;
}
function downloadRow(row: ScanHistory) {
    // dummy download as JSON file
    const blob = new Blob([JSON.stringify(row, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-${row.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

const columnHelper = createColumnHelper<ScanHistory>();

const columns = [
    columnHelper.accessor('date', {
        header: ({ column }) =>
            h(
                Button,
                {
                    variant: 'ghost',
                    class: 'px-0',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
                },
                {
                    default: () => [
                        'Date',
                        h(ChevronsUpDown, {
                            class: 'ml-2 h-4 w-4 inline align-text-bottom opacity-60',
                        }),
                    ],
                },
            ),
        enableSorting: true,
        cell: ({ row }) => h('span', row.original.date),
    }),
    columnHelper.accessor('target', {
        header: 'Target URL',
        enableSorting: true,
        cell: ({ row }) =>
            h(
                'span',
                {
                    class: 'block max-w-xs truncate',
                    title: row.original.target,
                },
                row.original.target,
            ),
    }),
    columnHelper.accessor('scanner', {
        header: 'Scanner',
        enableSorting: true,
        cell: ({ row }) => h('span', row.original.scanner),
    }),
    columnHelper.accessor('severity', {
        header: 'Severity',
        enableSorting: true,
        cell: ({ row }) => h(SeverityBadge, { severity: row.original.severity }),
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        enableSorting: true,
        cell: ({ row }) =>
            h(
                'span',
                {
                    class: [
                        'font-semibold',
                        row.original.status === 'Completed' ? 'text-green-600' : row.original.status === 'In Progress' ? 'text-yellow-500' : '',
                    ],
                },
                row.original.status,
            ),
    }),
    columnHelper.accessor('vulnCount', {
        header: 'Vulnerability Count',
        enableSorting: true,
        cell: ({ row }) => h('span', row.original.vulnCount),
    }),
    columnHelper.display({
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: ({ row }) =>
            h(
                DropdownMenu,
                {},
                {
                    default: () => [
                        h(
                            DropdownMenuTrigger,
                            { asChild: true },
                            {
                                default: () =>
                                    h(
                                        Button,
                                        { variant: 'ghost', size: 'icon', class: 'w-8 h-8' },
                                        { default: () => h(ChevronDown, { class: 'h-4 w-4' }) },
                                    ),
                            },
                        ),
                        h(
                            DropdownMenuContent,
                            { align: 'end' },
                            {
                                default: () => [
                                    h(
                                        DropdownMenuItem,
                                        {
                                            onClick: () => alert(`Viewing scan ${row.original.id}`),
                                        },
                                        { default: () => 'View' },
                                    ),
                                    h(
                                        DropdownMenuItem,
                                        {
                                            onClick: () => downloadRow(row.original),
                                        },
                                        { default: () => 'Download' },
                                    ),
                                    h(
                                        DropdownMenuItem,
                                        {
                                            class: 'text-destructive focus:text-destructive',
                                            onClick: () => confirmDelete(row.original.id),
                                        },
                                        { default: () => 'Delete' },
                                    ),
                                ],
                            },
                        ),
                    ],
                },
            ),
    }),
];

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});
const rowSelection = ref({});
const expanded = ref<ExpandedState>({});

const table = useVueTable({
    data: data.value,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
    onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
    onColumnVisibilityChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnVisibility),
    onRowSelectionChange: (updaterOrValue) => valueUpdater(updaterOrValue, rowSelection),
    onExpandedChange: (updaterOrValue) => valueUpdater(updaterOrValue, expanded),
    state: {
        get sorting() {
            return sorting.value;
        },
        get columnFilters() {
            return columnFilters.value;
        },
        get columnVisibility() {
            return columnVisibility.value;
        },
        get rowSelection() {
            return rowSelection.value;
        },
        get expanded() {
            return expanded.value;
        },
    },
});
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <h1 class="font-bold px-2 text-4xl">Scan History</h1>
            <div class="w-full">
                <div class="flex items-center gap-2 py-4">
                    <Input
                        class="max-w-sm"
                        placeholder="Filter target URL..."
                        :model-value="table.getColumn('target')?.getFilterValue() as string"
                        @update:model-value="table.getColumn('target')?.setFilterValue($event)"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <Button variant="outline" class="ml-auto"> Columns <ChevronDown class="ml-2 h-4 w-4" /> </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuCheckboxItem
                                v-for="column in table.getAllColumns().filter((column) => column.getCanHide())"
                                :key="column.id"
                                class="capitalize"
                                :model-value="column.getIsVisible()"
                                @update:model-value="(value) => column.toggleVisibility(!!value)"
                            >
                                {{ column.id }}
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                            <template v-if="table.getRowModel().rows?.length">
                                <template v-for="row in table.getRowModel().rows" :key="row.id">
                                    <TableRow :data-state="row.getIsSelected() && 'selected'">
                                        <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                            <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                        </TableCell>
                                    </TableRow>
                                </template>
                            </template>
                            <TableRow v-else>
                                <TableCell :colspan="columns.length" class="h-24 text-center"> No results. </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                <div class="flex items-center justify-end space-x-2 py-4">
                    <div class="text-muted-foreground flex-1 text-sm">
                        {{ table.getFilteredSelectedRowModel().rows.length }} of {{ table.getFilteredRowModel().rows.length }} row(s) selected.
                    </div>
                    <div class="space-x-2">
                        <Button variant="outline" size="sm" :disabled="!table.getCanPreviousPage()" @click="table.previousPage()"> Previous </Button>
                        <Button variant="outline" size="sm" :disabled="!table.getCanNextPage()" @click="table.nextPage()"> Next </Button>
                    </div>
                </div>
            </div>
        </div>
        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900">
                <h2 class="mb-2 text-lg font-semibold">Delete Scan</h2>
                <p class="mb-4">Are you sure you want to delete this scan? This action cannot be undone.</p>
                <div class="flex justify-end gap-2">
                    <Button variant="outline" @click="cancelDelete">Cancel</Button>
                    <Button variant="destructive" @click="doDelete">Delete</Button>
                </div>
            </div>
        </div>
    </Navigation>
</template>
