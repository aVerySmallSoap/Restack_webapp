<script setup lang="ts">
import { ref, onMounted, watch, h } from 'vue'
import { type DateRange } from 'radix-vue'
import { format } from 'date-fns'
import {
    ArrowRightIcon,
    ArrowUpDown,
    ScanSearch,
    FileText,
    ShieldAlert,
    ShieldX,
} from 'lucide-vue-next'

// DataTable Imports
import {
    useVueTable,
    FlexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
} from '@tanstack/vue-table'

import Navigation from '@/components/custom/Navigation.vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

// Import the working components
import DateRangePicker from '@/components/custom/Dashboard/DateRangePicker.vue'
import DataTablePagination from '@/components/custom/DataTablePagination.vue'
// ----- Import the correct charts from the UI folder -----
import { DonutChart } from '@/components/ui/chart-donut'
import { LineChart } from '@/components/ui/chart-line'

// ---------- State ----------
const loading = ref(true)

// This ref holds the date range state (as JS Dates)
const dateRange = ref({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
})

// This will hold all data for the dashboard
const dashboardData = ref(null)

// ---------- Mock Data (Simulates API response) ----------
const mockDashboardData = {
    stats: {
        totalScans: 142,
        totalVulns: 874,
        criticalVulns: 44,
        highVulns: 129,
    },
    recentScans: [
        { id: 1, target: 'http://example.com', date: '2025-10-30', critical: 2, high: 5, total: 15 },
        { id: 2, target: 'http://api.test.org', date: '2025-10-29', critical: 0, high: 1, total: 4 },
        { id: 3, target: 'http://secure.app', date: '2025-10-29', critical: 0, high: 0, total: 0 },
        { id: 4, target: 'http://dev.internal', date: '2025-10-28', critical: 12, high: 22, total: 68 },
        { id: 5, target: 'http://webapp.com', date: '2025-10-27', critical: 1, high: 3, total: 7 },
        { id: 6, target: 'http://staging.site', date: '2025-10-27', critical: 0, high: 0, total: 2 },
        { id: 7, target: 'http://old.net', date: '2025-10-26', critical: 5, high: 10, total: 25 },
        { id: 8, target: 'http://new-feature.com', date: '2025-10-26', critical: 1, high: 1, total: 2 },
        { id: 9, target: 'http://admin-panel.com', date: '2025-10-25', critical: 8, high: 15, total: 40 },
        { id: 10, target: 'http://user-portal.io', date: '2025-10-25', critical: 0, high: 2, total: 8 },
        { id: 11, target: 'http://blog.company.com', date: '2025-10-24', critical: 0, high: 0, total: 1 },
    ],
    // Data for DonutChart (index="severity", category="count")
    vulnerabilityDistribution: [
        { severity: 'Critical', count: 44 },
        { severity: 'High', count: 129 },
        { severity: 'Medium', count: 301 },
        { severity: 'Low', count: 400 },
    ],
    // Data for LineChart (index="date", categories="['total', 'critical']")
    vulnerabilityTimeline: [
        { date: 'Oct 01', total: 20, critical: 2 },
        { date: 'Oct 05', total: 25, critical: 4 },
        { date: 'Oct 10', total: 18, critical: 1 },
        { date: 'Oct 15', total: 30, critical: 8 },
        { date: 'Oct 20', total: 35, critical: 5 },
        { date: 'Oct 25', total: 40, critical: 12 },
        { date: 'Oct 30', total: 55, critical: 12 },
    ]
}

// ---------- DataTable Setup ----------
type Scan = {
    id: number
    target: string
    date: string
    critical: number
    high: number
    total: number
}

const tableData = ref<Scan[]>([])
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])

const columns: ColumnDef<Scan>[] = [
    {
        accessorKey: 'target',
        header: ({ column }) => {
            return h(Button, {
                variant: 'ghost',
                onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
            }, () => ['Target', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
        },
        cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('target')),
    },
    {
        accessorKey: 'date',
        header: ({ column }) => {
            return h(Button, {
                variant: 'ghost',
                onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
            }, () => ['Date', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
        },
        cell: ({ row }) => h('div', { class: 'text-left' }, row.getValue('date')),
    },
    {
        accessorKey: 'critical',
        header: ({ column }) => {
            return h(Button, {
                variant: 'ghost',
                class: 'w-full flex justify-end', // Align header right
                onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
            }, () => [h('span', 'Critical'), h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
        },
        cell: ({ row }) => h('div', { class: 'text-right font-medium text-destructive pr-4' }, row.getValue('critical')),
    },
    {
        accessorKey: 'high',
        header: ({ column }) => {
            return h(Button, {
                variant: 'ghost',
                class: 'w-full flex justify-end', // Align header right
                onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
            }, () => [h('span', 'High'), h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
        },
        cell: ({ row }) => h('div', { class: 'text-right font-medium text-orange-500 pr-4' }, row.getValue('high')),
    },
    {
        accessorKey: 'total',
        header: ({ column }) => {
            return h(Button, {
                variant: 'ghost',
                class: 'w-full flex justify-end', // Align header right
                onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
            }, () => [h('span', 'Total'), h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
        },
        cell: ({ row }) => h('div', { class: 'text-right pr-4' }, row.getValue('total')),
    },
    {
        id: 'actions',
        header: () => h('div', { class: 'text-right' }, 'Actions'),
        cell: ({ row }) => {
            const scan = row.original
            return h('div', { class: 'text-right' }, [
                h(Button, {
                    variant: 'ghost',
                    size: 'sm',
                    as: 'a', // Use 'a' tag for navigation
                    href: `/history/${scan.id}` // Inertia will intercept this
                }, () => ['View Report', h(ArrowRightIcon, { class: 'ml-2 h-4 w-4' })]),
            ])
        },
    },
]

const table = useVueTable({
    get data() { return tableData.value },
    get columns() { return columns },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    get state() {
        return {
            get sorting() { return sorting.value },
            get columnFilters() { return columnFilters.value },
        }
    },
    onSortingChange: (updaterOrValue) => {
        sorting.value = typeof updaterOrValue === 'function'
            ? updaterOrValue(sorting.value)
            : updaterOrValue
    },
    onColumnFiltersChange: (updaterOrValue) => {
        columnFilters.value = typeof updaterOrValue === 'function'
            ? updaterOrValue(columnFilters.value)
            : updaterOrValue
    },
})

// ---------- Methods ----------
function fetchData() {
    loading.value = true
    // Simulate API call
    setTimeout(() => {
        dashboardData.value = mockDashboardData
        // Populate the datatable
        tableData.value = mockDashboardData.recentScans
        loading.value = false
    }, 1000)
}

// This function is called by the DateRangePicker component's emit
function onRangeUpdate(range: { start: Date, end: Date }) {
    dateRange.value = range
    // This will trigger the watch block
}

// Watch the dateRange ref for changes and re-fetch data
watch(dateRange, (newRange) => {
    if (newRange.start && newRange.end) {
        console.log(`Date range changed: ${format(newRange.start, 'yyyy-MM-dd')} to ${format(newRange.end, 'yyyy-MM-dd')}`)
        fetchData()
    }
}, { deep: true, immediate: false }) // Don't run on initial load

// Fetch data when the component mounts
onMounted(() => {
    fetchData()
})
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-6 p-4 pt-0">
            <div class="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
                <h1 class="font-bold px-2 text-4xl">Dashboard</h1>

                <DateRangePicker @update:range="onRangeUpdate" />

            </div>

            <div v-if="loading" class="space-y-6">
                <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton class="h-[126px] w-full" v-for="i in 4" :key="i" />
                </div>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Skeleton class="h-[350px] w-full" />
                    <Skeleton class="h-[350px] w-full" />
                </div>
                <Skeleton class="h-[400px] w-full" />
            </div>

            <div v-if="!loading && dashboardData" class="space-y-6 animate-fadein">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Total Scans</CardTitle>
                            <ScanSearch class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ dashboardData.stats.totalScans }}</div>
                            <p class="text-xs text-muted-foreground">in the selected period</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Total Vulnerabilities</CardTitle>
                            <FileText class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ dashboardData.stats.totalVulns }}</div>
                            <p class="text-xs text-muted-foreground">found in total</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Critical</CardTitle>
                            <ShieldX class="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold text-destructive">{{ dashboardData.stats.criticalVulns }}</div>
                            <p class="text-xs text-muted-foreground">critical vulnerabilities</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">High</CardTitle>
                            <ShieldAlert class="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold text-orange-500">{{ dashboardData.stats.highVulns }}</div>
                            <p class="text-xs text-muted-foreground">high vulnerabilities</p>
                        </CardContent>
                    </Card>
                </div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card class="h-[350px] flex flex-col">
                        <CardHeader>
                            <CardTitle>Vulnerabilities Over Time</CardTitle>
                        </CardHeader>
                        <CardContent class="flex-1">
                            <LineChart
                                class="h-[250px]"
                                :data="dashboardData.vulnerabilityTimeline"
                                index="date"
                                :categories="['total', 'critical']"
                                :colors="['#3b82f6', '#ef4444']"
                                :y-formatter="(value: number) => `${value}`"
                            />
                        </CardContent>
                    </Card>
                    <Card class="h-[350px] flex flex-col">
                        <CardHeader>
                            <CardTitle>Severity Distribution</CardTitle>
                        </CardHeader>
                        <CardContent class="flex-1">
                            <DonutChart
                                class="h-[250px]"
                                :data="dashboardData.vulnerabilityDistribution"
                                index="severity"
                                category="count"
                                :colors="['#ef4444', '#f97316', '#eab308', '#64748b']"
                                :value-formatter="(value: number) => `${value}`"
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Scans</CardTitle>
                        <CardDescription>
                            A list of the most recent scans performed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <div class="flex items-center">
                            <Input
                                class="max-w-sm"
                                placeholder="Filter targets..."
                                :model-value="(table.getColumn('target')?.getFilterValue() as string) ?? ''"
                                @update:model-value="table.getColumn('target')?.setFilterValue($event)"
                            />
                        </div>
                        <div class="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow
                                        v-for="headerGroup in table.getHeaderGroups()"
                                        :key="headerGroup.id"
                                    >
                                        <TableHead
                                            v-for="header in headerGroup.headers"
                                            :key="header.id"
                                        >
                                            <FlexRender
                                                v-if="!header.isPlaceholder"
                                                :render="header.column.columnDef.header"
                                                :props="header.getContext()"
                                            />
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <template v-if="table.getRowModel().rows?.length">
                                        <TableRow
                                            v-for="row in table.getRowModel().rows"
                                            :key="row.id"
                                            :data-state="row.getIsSelected() && 'selected'"
                                        >
                                            <TableCell
                                                v-for="cell in row.getVisibleCells()"
                                                :key="cell.id"
                                            >
                                                <FlexRender
                                                    :render="cell.column.columnDef.cell"
                                                    :props="cell.getContext()"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    </template>
                                    <template v-else>
                                        <TableRow>
                                            <TableCell
                                                :colSpan="columns.length"
                                                class="h-24 text-center"
                                            >
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    </template>
                                </TableBody>
                            </Table>
                        </div>
                        <DataTablePagination :table="table" />
                    </CardContent>
                </Card>
            </div>
        </div>
    </Navigation>
</template>

<style scoped>
.animate-fadein {
    animation: fadein 0.5s;
}
@keyframes fadein {
    from { opacity: 0; transform: translateY(10px);}
    to { opacity: 1; transform: translateY(0);}
}
</style>
