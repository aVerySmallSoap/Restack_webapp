<script setup lang="ts">
import { ref, watch, computed, h } from 'vue'
import { Head, router } from '@inertiajs/vue3'
import AppLayout from '@/layouts/AppLayout.vue'
import {
    ShieldCheck, Activity, AlertTriangle, Calendar, Target, RotateCcw
} from 'lucide-vue-next'

// Components
import CustomAreaChart from '@/components/custom/Charts/CustomAreaChart.vue'
import CustomDonutChart from '@/components/custom/Charts/CustomDonutChart.vue'
import CustomHorizBarChart from '@/components/custom/Charts/CustomHorizBarChart.vue'
import CustomTrendChart from '@/components/custom/Charts/CustomTrendChart.vue'
import DateRangePicker from '@/components/custom/Dashboard/DateRangePicker.vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

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

import { toast } from 'vue-sonner'

// --- PROPS ---
const props = defineProps<{
    stats: any;
    recentScans: any[];
    vulnerabilityDistribution: any[];
    vulnerabilityTimeline: any[];
    topVulnerabilityTypes: any[];
    trendAnalysis: any[];
    availableDomains: string[];
    filters: {
        start: string;
        end: string;
        target: string;
    };
}>()

// --- STATE ---
const loading = ref(false)
const selectedDomain = ref(props.filters.target || "all")
const dateRange = ref({
    start: props.filters.start,
    end: props.filters.end
})
const sorting = ref<SortingState>([])

// --- RELOAD FUNCTION ---
const updateDashboard = (newDomain?: string, newDates?: { start: string, end: string }) => {
    loading.value = true

    // Use arguments if provided, otherwise fallback to current state
    const target = newDomain !== undefined ? (newDomain === 'all' ? null : newDomain) : (selectedDomain.value === 'all' ? null : selectedDomain.value)
    const start = newDates ? newDates.start : dateRange.value.start
    const end = newDates ? newDates.end : dateRange.value.end

    console.log('Updating dashboard with:', { target, start, end })

    router.get(route('dashboard'), {
        target: target,
        start: start,
        end: end
    }, {
        preserveState: true,
        preserveScroll: true,
        only: ['stats', 'recentScans', 'vulnerabilityDistribution', 'vulnerabilityTimeline', 'topVulnerabilityTypes', 'trendAnalysis', 'filters'],
        onSuccess: (page) => {
            console.log('Dashboard updated successfully', page.props)
            loading.value = false
        },
        onError: (errors) => {
            console.error('Dashboard update failed:', errors)
            toast.error('Failed to load dashboard data')
            loading.value = false
        },
        onFinish: () => {
            loading.value = false
        }
    })
}

// --- HANDLERS ---

// 1. Explicit Domain Handler (Replaces v-model watcher)
const handleDomainUpdate = (val: string) => {
    selectedDomain.value = val
    console.log("Domain changed manually:", val)
    updateDashboard(val, undefined) // Pass new value directly to ensure sync
}

// 2. Explicit Date Handler
const handleDateUpdate = (range: any) => {
    if (range?.start && range?.end) {
        // Format dates in LOCAL timezone, avoiding toISOString() which converts to UTC
        const formatLocalDate = (date: Date): string => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }

        const start = range.start instanceof Date ? formatLocalDate(range.start) : range.start
        const end = range.end instanceof Date ? formatLocalDate(range.end) : range.end

        dateRange.value = { start, end }
        console.log("Date changed manually:", start, end)
        updateDashboard(undefined, { start, end })
    }
}
// 3. Sync from Backend (e.g. Back Button)
watch(() => props.filters, (newFilters) => {
    console.log('Props filters changed:', newFilters)
    selectedDomain.value = newFilters.target || "all"
    dateRange.value = { start: newFilters.start, end: newFilters.end }
}, { deep: true })

const resetFilters = () => {
    selectedDomain.value = "all"
    dateRange.value = { start: props.filters.start, end: props.filters.end }
    updateDashboard("all", { start: props.filters.start, end: props.filters.end })
}

// --- COMPUTED DATA ---
const analyticsData = computed(() => {
    const startStr = dateRange.value.start || props.filters.start;
    const endStr = dateRange.value.end || props.filters.end;
    let daysDiff = 0;

    if (startStr && endStr) {
        const start = new Date(startStr);
        const end = new Date(endStr);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const diffTime = Math.abs(end.getTime() - start.getTime());
            daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
    }
    const finalDays = daysDiff > 0 ? daysDiff : 30;

    return {
        kpi: {
            target: selectedDomain.value === 'all' ? 'All Targets' : selectedDomain.value,
            total_scans: props.stats.totalScans,
            total_vulns: props.stats.totalVulns,
            total_vulns_all_time: props.stats.totalVulns,
            days_analyzed: finalDays,
            stability_score: props.stats.stabilityScore,
            last_scan: props.recentScans.length > 0 ? new Date(props.recentScans[0].date).toLocaleDateString() : 'N/A'
        },
        charts: {
            history: props.vulnerabilityTimeline,
            distribution: props.vulnerabilityDistribution,
            types: props.topVulnerabilityTypes.map(t => ({
                name: t.name,
                total: Number(t.count ?? t.value ?? t.total ?? 0),
                color: t.color
            })),
            trend: props.trendAnalysis
        }
    }
})

// Check if we have any data
const hasData = computed(() => {
    return props.stats && (props.stats.totalScans > 0 || props.stats.totalVulns > 0)
})

// --- TABLE CONFIG ---
const getSeverityStyle = (sev: string) => ({ backgroundColor: getSeverityColor(sev), color: '#ffffff', border: 'none' })

const columns: ColumnDef<any>[] = [
    {
        accessorKey: 'status',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Status' }),
        cell: ({ row }) => {
            const crit = row.original.criticalHigh as number
            const label = crit > 0 ? 'Critical Issues' : 'Completed'
            const color = crit > 0 ? 'critical' : 'low'
            return h(Badge, { style: getSeverityStyle(color) }, () => label)
        },
    },
    {
        accessorKey: 'target',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Target' }),
        cell: ({ row }) => h('div', { class: 'font-medium truncate max-w-[150px]' }, row.getValue('target')),
    },
    {
        accessorKey: 'scanType',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Scan Type' }),
        cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('scanType')),
    },
    {
        accessorKey: 'totalFindings',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Findings' }),
        cell: ({ row }) => h('div', { class: 'text-center font-bold' }, row.getValue('totalFindings')),
    },
    {
        accessorKey: 'date',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Date' }),
        cell: ({ row }) => h('div', { class: 'text-right' }, new Date(row.getValue('date')).toLocaleDateString()),
    },
]

const table = useVueTable({
    get data() { return props.recentScans },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (updaterOrValue) => sorting.value = typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue,
    state: { get sorting() { return sorting.value } },
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

                    <Select
                        :model-value="selectedDomain"
                        @update:model-value="handleDomainUpdate"
                    >
                        <SelectTrigger class="w-[200px]">
                            <SelectValue placeholder="Select Target" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Targets</SelectItem>
                            <SelectItem v-for="domain in props.availableDomains" :key="domain" :value="domain">
                                {{ domain }}
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <DateRangePicker
                        :start-date="dateRange.start"
                        :end-date="dateRange.end"
                        @update="handleDateUpdate"
                    />

                    <Button variant="outline" size="icon" @click="resetFilters" title="Reset Filters">
                        <RotateCcw class="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <Card v-for="i in 6" :key="i">
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton class="h-4 w-20" />
                            <Skeleton class="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton class="h-8 w-16" />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <!-- Data State -->
            <div v-else-if="hasData" class="space-y-6 animate-fadein">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Target</CardTitle>
                            <Target class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-base font-bold truncate" :title="analyticsData.kpi.target">
                                {{ analyticsData.kpi.target }}
                            </div>
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
                            <CardTitle class="text-sm font-medium">Vulnerabilities</CardTitle>
                            <AlertTriangle class="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ analyticsData.kpi.total_vulns }}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Time Period</CardTitle>
                            <Calendar class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">
                                {{ analyticsData.kpi.days_analyzed }}
                                <span class="text-xs font-normal text-muted-foreground">Days</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Stability</CardTitle>
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
                            <div class="text-lg font-bold truncate">{{ analyticsData.kpi.last_scan }}</div>
                        </CardContent>
                    </Card>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    <Card class="lg:col-span-2">
                        <CardHeader><CardTitle>Vulnerabilities Over Time</CardTitle></CardHeader>
                        <CardContent>
                            <CustomAreaChart :data="analyticsData.charts.history" />
                        </CardContent>
                    </Card>
                    <Card class="lg:col-span-1">
                        <CardHeader><CardTitle>Severity Distribution</CardTitle></CardHeader>
                        <CardContent>
                            <CustomDonutChart :data="analyticsData.charts.distribution" />
                        </CardContent>
                    </Card>
                    <Card class="lg:col-span-1">
                        <CardHeader><CardTitle>Top Types</CardTitle></CardHeader>
                        <CardContent>
                            <CustomHorizBarChart :data="analyticsData.charts.types" />
                        </CardContent>
                    </Card>
                    <Card class="lg:col-span-2">
                        <CardHeader><CardTitle>Trend Analysis</CardTitle></CardHeader>
                        <CardContent>
                            <CustomTrendChart :data="analyticsData.charts.trend" />
                        </CardContent>
                    </Card>
                </div>

            </div>

            <!-- Empty State -->
            <div v-else class="flex flex-col items-center justify-center h-96 text-muted-foreground">
                <AlertTriangle class="h-12 w-12 mb-4 opacity-50" />
                <p class="text-lg font-medium mb-2">No data available for the selected date range</p>
                <p class="text-sm mb-4">Try selecting a different date range or target</p>
                <Button @click="resetFilters" variant="outline">
                    <RotateCcw class="h-4 w-4 mr-2" />
                    Reset Filters
                </Button>
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
