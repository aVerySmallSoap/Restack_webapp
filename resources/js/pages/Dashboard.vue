<script setup lang="ts">
import { ref, onMounted, watch, h } from 'vue'
import { Head } from '@inertiajs/vue3'
import AppLayout from '@/layouts/AppLayout.vue'
import {
    ShieldCheck,
    Activity,
    AlertTriangle,
    Calendar,
    Target,
    RotateCcw,
} from 'lucide-vue-next'
import axios from 'axios'

// Components
import CustomAreaChart from '@/components/custom/Charts/CustomAreaChart.vue'
import CustomDonutChart from '@/components/custom/Charts/CustomDonutChart.vue'
import CustomHorizBarChart from '@/components/custom/Charts/CustomHorizBarChart.vue'
import CustomTrendChart from '@/components/custom/Charts/CustomTrendChart.vue'
import DateRangePicker from '@/components/custom/Dashboard/DateRangePicker.vue'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

// Data Table Imports
import {
    useVueTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    FlexRender,
    type ColumnDef,
    type SortingState,
} from '@tanstack/vue-table'
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue'
import DataTablePagination from '@/components/custom/DataTablePagination.vue'
import { getSeverityColor } from '@/lib/colors'

// State
const loading = ref(true)
const analyticsData = ref<any>(null)
const rawVulns = ref<any[]>([])

// Filter State
const selectedDomain = ref<string>("all")
const dateRange = ref<{ start: string | null, end: string | null }>({
    start: null,
    end: null
})
const availableDomains = ref<string[]>([])

// Data Table State
const sorting = ref<SortingState>([])

// Helper for Severity Colors
const getSeverityStyle = (sev: string) => {
    return {
        backgroundColor: getSeverityColor(sev),
        color: '#ffffff',
        border: 'none'
    }
}

// Helper for Sorting Severity
const mapSeverityToNumber = (sev: string) => {
    switch (sev?.toLowerCase()) {
        case 'critical': return 4;
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 0;
    }
}

// Data Table Columns Configuration
const columns: ColumnDef<any>[] = [
    {
        accessorKey: 'severity',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Severity' }),
        cell: ({ row }) => h(Badge, {
            style: getSeverityStyle(row.getValue('severity'))
        }, () => row.getValue('severity')),
        sortingFn: (a, b) => mapSeverityToNumber(b.original.severity) - mapSeverityToNumber(a.original.severity),
    },
    {
        accessorKey: 'type',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Vulnerability' }),
        cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('type')),
    },
    {
        accessorKey: 'endpoint',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Endpoint' }),
        cell: ({ row }) => h('div', { class: 'truncate max-w-[250px] text-muted-foreground' }, row.getValue('endpoint')),
    },
    {
        accessorKey: 'target',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Target' }),
        cell: ({ row }) => h('div', { class: 'truncate max-w-[150px]' }, row.getValue('target')),
    },
    {
        accessorKey: 'date',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Date' }),
        cell: ({ row }) => h('div', { class: 'text-right' }, row.getValue('date')),
    },
]

// Initialize Table
const table = useVueTable({
    get data() { return rawVulns.value },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (updaterOrValue) => {
        sorting.value = typeof updaterOrValue === 'function'
            ? updaterOrValue(sorting.value)
            : updaterOrValue
    },
    state: {
        get sorting() { return sorting.value },
    },
})

// Fetch available domains/targets
const fetchDomains = async () => {
    try {
        const res = await axios.get('http://localhost:25565/api/v1/analytics/targets')
        availableDomains.value = res.data.domains
    } catch (e) {
        console.error("Failed to load targets", e)
    }
}

// Main analytics fetch with dynamic filters
const fetchAnalytics = async () => {
    try {
        loading.value = true

        const params = new URLSearchParams()
        if (selectedDomain.value && selectedDomain.value !== 'all') {
            params.append('target', selectedDomain.value)
        }
        if (dateRange.value.start) params.append('start', dateRange.value.start)
        if (dateRange.value.end) params.append('end', dateRange.value.end)

        const [dashRes, rawRes] = await Promise.all([
            fetch(`http://localhost:25565/api/v1/analytics/dashboard?${params.toString()}`),
            fetch(`http://localhost:25565/api/v1/analytics/vulnerabilities?${params.toString()}`)
        ])

        analyticsData.value = await dashRes.json()
        rawVulns.value = await rawRes.json()

    } catch (error) {
        console.error("Failed to load analytics", error)
    } finally {
        loading.value = false
    }
}

// Handle date range updates
const handleDateUpdate = (range: any) => {
    if (range?.start && range?.end) {
        const startDate = range.start instanceof Date
            ? range.start.toISOString().split('T')[0]
            : range.start
        const endDate = range.end instanceof Date
            ? range.end.toISOString().split('T')[0]
            : range.end

        dateRange.value = { start: startDate, end: endDate }
    } else {
        dateRange.value = { start: null, end: null }
    }
}

const resetFilters = () => {
    selectedDomain.value = "all"
    dateRange.value = { start: null, end: null }
}

watch(() => [selectedDomain.value, dateRange.value.start, dateRange.value.end], () => {
    fetchAnalytics()
})

onMounted(() => {
    fetchDomains()
    fetchAnalytics()
})
</script>

<template>
    <Head title="Analytics Dashboard" />

    <AppLayout>
        <div class="p-6 space-y-6">

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex flex-col gap-2">
                    <h1 class="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                    <p class="text-muted-foreground">
                        {{ selectedDomain === 'all' ? 'Global posture overview' : `Detailed analysis for ${selectedDomain}` }}
                    </p>
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-2">
                    <Select v-model="selectedDomain">
                        <SelectTrigger class="w-[200px]">
                            <SelectValue placeholder="Select Target" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Targets</SelectItem>
                            <SelectItem
                                v-for="domain in availableDomains"
                                :key="domain"
                                :value="domain"
                            >
                                {{ domain }}
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <DateRangePicker
                        @update:range="handleDateUpdate"
                    />

                    <Button variant="outline" size="icon" @click="resetFilters" title="Reset Filters">
                        <RotateCcw class="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div v-if="loading" class="flex items-center justify-center h-96">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>

            <div v-else-if="analyticsData && analyticsData.kpi" class="space-y-6 animate-fadein">

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Target</CardTitle>
                            <Target class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold truncate" :title="analyticsData.kpi.target">{{ analyticsData.kpi.target }}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Total Scans</CardTitle>
                            <Activity class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ analyticsData.kpi.total_scans }}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Current Vulnerabilities</CardTitle>
                            <AlertTriangle class="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ analyticsData.kpi.total_vulns }}</div>
                            <p class="text-xs text-muted-foreground mt-1">
                                {{ analyticsData.kpi.total_vulns_all_time }} total across all scans
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Time Period</CardTitle>
                            <Calendar class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ analyticsData.kpi.days_analyzed }} <span class="text-xs font-normal text-muted-foreground">Days</span></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Stability Score</CardTitle>
                            <ShieldCheck class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold" :class="analyticsData.kpi.stability_score > 80 ? 'text-green-600' : 'text-yellow-600'">
                                {{ analyticsData.kpi.stability_score }}%
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Last Scan</CardTitle>
                            <Activity class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-lg font-bold truncate">{{ analyticsData.kpi.last_scan || 'N/A' }}</div>
                        </CardContent>
                    </Card>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <Card class="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Vulnerabilities Over Time</CardTitle>
                            <CardDescription>Aggregated daily vulnerability count</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CustomAreaChart :data="analyticsData.charts.history" />
                        </CardContent>
                    </Card>

                    <Card class="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Severity Distribution</CardTitle>
                            <CardDescription>Latest scan breakdown</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CustomDonutChart :data="analyticsData.charts.distribution" />
                        </CardContent>
                    </Card>

                    <Card class="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Top Vulnerability Types</CardTitle>
                            <CardDescription>Most frequent issue types (Top 5)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div v-if="!analyticsData.charts.types || analyticsData.charts.types.length === 0" class="text-sm text-muted-foreground py-4">
                                No vulnerability types data available
                            </div>
                            <div v-else>
                                <CustomHorizBarChart :data="analyticsData.charts.types" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card class="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Trend Analysis</CardTitle>
                            <CardDescription>Linear regression of risk exposure</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CustomTrendChart :data="analyticsData.charts.trend" />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Latest Findings</CardTitle>
                        <CardDescription>Most recent vulnerabilities detected across targets</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                    <TableRow v-if="table.getRowModel().rows.length === 0">
                                        <TableCell :colspan="columns.length" class="h-24 text-center">
                                            No findings available.
                                        </TableCell>
                                    </TableRow>
                                    <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
                                        <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                            <FlexRender
                                                :render="cell.column.columnDef.cell"
                                                :props="cell.getContext()"
                                            />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                        <DataTablePagination :table="table" />
                    </CardContent>
                </Card>

            </div>

            <div v-else class="flex flex-col items-center justify-center h-96 text-muted-foreground">
                <AlertTriangle class="h-12 w-12 mb-4 opacity-50" />
                <p>No analytics data available for this target or time range.</p>
            </div>
        </div>
    </AppLayout>
</template>

<style scoped>
.animate-fadein {
    animation: fadein 0.5s ease-out;
}
@keyframes fadein {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
