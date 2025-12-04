<script setup lang="ts">
import { ref, computed, h } from 'vue'
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
import { ArrowUpDown, MoreHorizontal, Trash2, Calendar, Clock, Edit, Copy } from 'lucide-vue-next'

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
    (e: 'edit', scan: ScheduledScan): void
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

// Fixed parseConfiguration to handle the API response format
const parseConfiguration = (config: any) => {
    try {
        // If it's already an object, convert to entries array
        if (config && typeof config === 'object') {
            const ignoredKeys = ['profile']
            const entries = Object.entries(config).filter(([key]) => !ignoredKeys.includes(key))
            return entries
        }
        return []
    } catch (e) {
        console.error('Error parsing configuration:', e)
        return []
    }
}

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
}

// --- Columns Definition ---
const columns: ColumnDef<ScheduledScan>[] = [
    {
        accessorKey: 'codename',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Name' }),
        cell: ({ row }) => row.getValue('codename'),
    },
    {
        accessorKey: 'url',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Target URL' }),
        cell: ({ row }) => row.getValue('url'),
    },
    {
        accessorKey: 'jobType',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }),
        cell: ({ row }) => row.getValue('jobType'),
    },
    {
        accessorKey: 'configuration',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Configuration' }),
        cell: ({ row }) => row.getValue('configuration'),
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => row.original,
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
                                    <!-- Name Column -->
                                    <template v-if="cell.column.id === 'codename'">
                                        <div class="flex items-center gap-2 font-medium">
                                            <Calendar class="h-4 w-4 text-muted-foreground" />
                                            {{ cell.getValue() }}
                                        </div>
                                    </template>

                                    <!-- URL Column -->
                                    <template v-else-if="cell.column.id === 'url'">
                                        <a :href="cell.getValue() as string"
                                           target="_blank"
                                        class="text-muted-foreground hover:underline text-sm"
                                        >
                                        {{ cell.getValue() }}
                                        </a>
                                    </template>

                                    <!-- Job Type Column -->
                                    <template v-else-if="cell.column.id === 'jobType'">
                                        <div class="flex items-center gap-2">
                                            <Clock class="h-3 w-3 text-muted-foreground" />
                                            <Badge variant="secondary" class="capitalize">
                                                {{ getFrequencyLabel(cell.getValue() as string) }}
                                            </Badge>
                                        </div>
                                    </template>

                                    <!-- Configuration Column -->
                                    <template v-else-if="cell.column.id === 'configuration'">
                                        <div class="flex flex-wrap gap-1">
                                            <template v-if="parseConfiguration(cell.getValue()).length > 0">
                                                <Badge
                                                    v-for="[key, value] in parseConfiguration(cell.getValue())"
                                                    :key="key"
                                                    variant="outline"
                                                    class="font-mono text-[10px] px-2 py-0.5 h-5"
                                                >
                                                    <span class="text-muted-foreground">{{ key }}:</span>
                                                    <span class="ml-1 font-semibold">{{ value }}</span>
                                                </Badge>
                                            </template>
                                            <span v-else class="text-muted-foreground text-xs">No config</span>
                                        </div>
                                    </template>

                                    <!-- Actions Column -->
                                    <template v-else-if="cell.column.id === 'actions'">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger as-child>
                                                <Button variant="ghost" class="h-8 w-8 p-0">
                                                    <span class="sr-only">Open menu</span>
                                                    <MoreHorizontal class="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem @click="copyToClipboard(row.original.id)">
                                                    <Copy class="mr-2 h-4 w-4" />
                                                    Copy ID
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem @click="emit('edit', row.original)">
                                                    <Edit class="mr-2 h-4 w-4" />
                                                    Edit Schedule
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    class="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                    @click="emit('delete', row.original.id)"
                                                >
                                                    <Trash2 class="mr-2 h-4 w-4" />
                                                    Delete Schedule
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </template>

                                    <!-- Default fallback -->
                                    <template v-else>
                                        <FlexRender
                                            :render="cell.column.columnDef.cell"
                                            :props="cell.getContext()"
                                        />
                                    </template>
                                </TableCell>
                            </TableRow>
                        </template>
                        <template v-else>
                            <TableRow>
                                <TableCell :colSpan="columns.length" class="h-24 text-center">
                                    <div class="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Calendar class="h-8 w-8 opacity-50" />
                                        <p>No scheduled scans found.</p>
                                    </div>
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
