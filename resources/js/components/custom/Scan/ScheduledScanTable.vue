<script setup lang="ts">
import { h, ref } from 'vue'
import type { PropType } from 'vue'
import {
    useVueTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    FlexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
} from '@tanstack/vue-table'
import { ArrowUpDown, MoreHorizontal, Trash2, Calendar, Clock } from 'lucide-vue-next'

// Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue'
import DataTablePagination from '@/components/custom/DataTablePagination.vue'

// Types
import type { ScheduledScan } from '@/lib/restack/restack.types'

const props = defineProps({
    data: {
        type: Array as PropType<ScheduledScan[]>,
        required: true,
        default: () => [],
    },
})

const emit = defineEmits<{
    (e: 'delete', id: string): void
}>()

// --- State ---
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const globalFilter = ref('')

// --- Helpers ---
const getFrequencyLabel = (type: string) => {
    const map: Record<string, string> = {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        interval: 'Interval',
        cron: 'Cron'
    }
    return map[type] || type
}

// --- Columns Definition ---
const columns: ColumnDef<ScheduledScan>[] = [
    {
        accessorKey: 'codename',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Codename' }),
        cell: ({ row }) => h('div', { class: 'flex items-center gap-2 font-medium' }, [
            h(Calendar, { class: 'h-4 w-4 text-muted-foreground' }),
            row.getValue('codename')
        ]),
    },
    {
        accessorKey: 'url',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Target URL' }),
        cell: ({ row }) => h('a', {
            href: row.getValue('url'),
            target: '_blank',
            class: 'text-muted-foreground hover:underline'
        }, row.getValue('url')),
    },
    {
        accessorKey: 'jobType',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Frequency' }),
        cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
            h(Clock, { class: 'h-3 w-3 text-muted-foreground' }),
            getFrequencyLabel(row.getValue('jobType'))
        ]),
    },
    {
        accessorKey: 'configuration',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Configuration' }),
        cell: ({ row }) => {
            try {
                // Parse the JSON configuration string
                const configRaw = row.getValue('configuration');
                const config = typeof configRaw === 'string' ? JSON.parse(configRaw) : configRaw;

                // Filter out keys we don't want to show (like 'profile' if it still exists in old records)
                const ignoredKeys = ['profile'];
                const entries = Object.entries(config || {}).filter(([key]) => !ignoredKeys.includes(key));

                if (entries.length === 0) {
                    return h('span', { class: 'text-muted-foreground text-xs' }, '-')
                }

                // Render each key-value pair as a small badge
                return h('div', { class: 'flex flex-wrap gap-1' },
                    entries.map(([key, value]) =>
                        h(Badge, {
                            variant: 'outline',
                            class: 'font-mono text-[10px] px-1 py-0 h-5'
                        }, () => `${key}: ${value}`)
                    )
                )
            } catch (e) {
                return h('span', { class: 'text-muted-foreground text-xs' }, 'Invalid Config')
            }
        },
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            return h(DropdownMenu, {}, {
                default: () => h(DropdownMenuTrigger, { asChild: true }, {
                    default: () => h(Button, { variant: 'ghost', class: 'h-8 w-8 p-0' }, {
                        default: () => [
                            h('span', { class: 'sr-only' }, 'Open menu'),
                            h(MoreHorizontal, { class: 'h-4 w-4' })
                        ]
                    })
                }),
                content: () => h(DropdownMenuContent, { align: 'end' }, {
                    default: () => [
                        h(DropdownMenuLabel, {}, () => 'Actions'),
                        h(DropdownMenuItem, {
                            onClick: () => navigator.clipboard.writeText(row.original.id)
                        }, () => 'Copy ID'),
                        h(DropdownMenuSeparator),
                        h(DropdownMenuItem, {
                            class: 'text-destructive focus:text-destructive focus:bg-destructive/10',
                            onClick: () => emit('delete', row.original.id)
                        }, {
                            default: () => [
                                h(Trash2, { class: 'mr-2 h-4 w-4' }),
                                'Delete Schedule'
                            ]
                        })
                    ]
                })
            })
        },
    },
]

// --- Table Initialization ---
const table = useVueTable({
    get data() { return props.data },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
        get sorting() { return sorting.value },
        get columnFilters() { return columnFilters.value },
        get globalFilter() { return globalFilter.value },
    },
    onSortingChange: (updater) => sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater,
    onColumnFiltersChange: (updater) => columnFilters.value = typeof updater === 'function' ? updater(columnFilters.value) : updater,
    onGlobalFilterChange: (updater) => globalFilter.value = typeof updater === 'function' ? updater(globalFilter.value) : updater,
})
</script>

<template>
    <Card>
        <CardContent class="p-6">
            <div class="flex items-center justify-between py-4">
                <Input
                    placeholder="Filter schedules..."
                    :model-value="globalFilter"
                    @update:model-value="globalFilter = String($event)"
                    class="max-w-sm"
                />
            </div>

            <div class="rounded-md border">
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
                                :data-state="row.getIsSelected() ? 'selected' : undefined"
                            >
                                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                    <FlexRender
                                        :render="cell.column.columnDef.cell"
                                        :props="cell.getContext()"
                                    />
                                </TableCell>
                            </TableRow>
                        </template>
                        <template v-else>
                            <TableRow>
                                <TableCell :colSpan="columns.length" class="h-24 text-center">
                                    No scheduled scans found.
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
