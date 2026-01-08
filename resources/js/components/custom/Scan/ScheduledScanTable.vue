<script setup lang="ts">
import { ref, computed, h } from 'vue'
import type { PropType } from 'vue'
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
import { MoreHorizontal, Trash2, Calendar, Clock, Edit, Copy } from 'lucide-vue-next'

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
import FacetedFilter from '@/components/custom/FacetedFilter.vue'

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
        cron: 'Scheduled'
    }
    return map[type] || type
}

// Filter options for job types
const jobTypeOptions = [
    { label: 'Interval', value: 'interval' },
    { label: 'Scheduled (Cron)', value: 'cron' },
]

// Improved configuration formatter
const formatConfiguration = (config: any, jobType: string) => {
    try {
        if (!config || typeof config !== 'object') {
            return 'No configuration'
        }

        if (jobType === 'interval') {
            const parts = []
            if (config.weeks) parts.push(`${config.weeks}w`)
            if (config.days) parts.push(`${config.days}d`)
            if (config.hours) parts.push(`${config.hours}h`)
            if (config.minutes) parts.push(`${config.minutes}m`)
            if (config.seconds) parts.push(`${config.seconds}s`)

            return parts.length > 0 ? `Every ${parts.join(' ')}` : 'Not configured'
        } else if (jobType === 'cron') {
            const month = config.month !== '*' ? String(config.month).padStart(2, '0') : 'XX'
            const day = config.day !== '*' ? String(config.day).padStart(2, '0') : 'XX'
            const year = config.year !== '*' ? config.year : 'XXXX'
            const hour = String(config.hour || '0').padStart(2, '0')
            const minute = String(config.minute || '0').padStart(2, '0')
            const second = String(config.second || '0').padStart(2, '0')

            const isRecurring = config.month === '*' && config.year === '*'

            if (isRecurring) {
                return `Every month on day ${day} at ${hour}:${minute}:${second}`
            } else {
                const dateStr = `${month}/${day}/${year}`
                const timeStr = `${hour}:${minute}:${second}`
                return `${dateStr} ${timeStr}`
            }
        }

        return 'Unknown schedule type'
    } catch (e) {
        console.error('Error formatting configuration:', e)
        return 'Invalid configuration'
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
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: 'configuration',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Schedule' }),
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
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
        get sorting() { return sorting.value },
        get columnFilters() { return columnFilters.value },
        get globalFilter() { return globalFilter.value },
    },
    onSortingChange: (updater) => sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater,
    onColumnFiltersChange: (updater) => columnFilters.value = typeof updater === 'function' ? updater(columnFilters.value) : updater,
    onGlobalFilterChange: (updater) => globalFilter.value = typeof updater === 'function' ? updater(globalFilter.value) : updater,
})

const isFiltered = computed(() => columnFilters.value.length > 0)

function resetFilters() {
    table.resetColumnFilters()
}
</script>

<template>
    <Card>
        <CardContent class="p-6">
            <div class="flex flex-wrap items-center gap-2 py-4">
                <Input
                    placeholder="Search schedules..."
                    :model-value="globalFilter"
                    @update:model-value="globalFilter = String($event)"
                    class="h-8 w-[200px] lg:w-[250px]"
                />
                <FacetedFilter
                    v-if="table.getColumn('jobType')"
                    :column="table.getColumn('jobType')"
                    title="Schedule Type"
                    :options="jobTypeOptions"
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
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm text-foreground">
                                                {{ formatConfiguration(cell.getValue(), row.original.jobType) }}
                                            </span>
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
