<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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

        // Construct Query Params based on filters
        const params = new URLSearchParams()

        // Only add target param if not "all"
        if (selectedDomain.value && selectedDomain.value !== 'all') {
            params.append('target', selectedDomain.value)
        }

        // Add date range if selected
        if (dateRange.value.start) params.append('start', dateRange.value.start)
        if (dateRange.value.end) params.append('end', dateRange.value.end)

        // Fetch Chart Data from the dashboard endpoint
        const res = await fetch(`http://localhost:25565/api/v1/analytics/dashboard?${params.toString()}`)
        analyticsData.value = await res.json()

        // Fetch Raw Vulnerability Data for Table
        const rawRes = await fetch(`http://localhost:25565/api/v1/analytics/vulnerabilities?${params.toString()}`)
        rawVulns.value = await rawRes.json()

    } catch (error) {
        console.error("Failed to load analytics", error)
    } finally {
        loading.value = false
    }
}

// Handle date range updates from DateRangePicker
const handleDateUpdate = (range: any) => {
    console.log('Date range updated:', range) // Debug log

    if (range?.start && range?.end) {
        // DateRangePicker emits JS Date objects
        const startDate = range.start instanceof Date
            ? range.start.toISOString().split('T')[0]
            : range.start
        const endDate = range.end instanceof Date
            ? range.end.toISOString().split('T')[0]
            : range.end

        dateRange.value = {
            start: startDate,
            end: endDate
        }
        console.log('Formatted dates:', dateRange.value) // Debug log
    } else {
        dateRange.value = { start: null, end: null }
    }
}

// Reset all filters
const resetFilters = () => {
    selectedDomain.value = "all"
    dateRange.value = { start: null, end: null }
}

// Watch filters and refetch when they change
watch(() => [selectedDomain.value, dateRange.value.start, dateRange.value.end], () => {
    fetchAnalytics()
})

onMounted(() => {
    fetchDomains()
    fetchAnalytics()
})

const severityColor = (sev: string) => {
    switch (sev.toLowerCase()) {
        case 'critical': return 'destructive';
        case 'high': return 'destructive';
        case 'medium': return 'secondary';
        case 'low': return 'outline';
        default: return 'outline';
    }
}
</script>

<template>
    <Head title="Analytics Dashboard" />

    <AppLayout>
        <div class="p-6 space-y-6">

            <!-- Header with Filters -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex flex-col gap-2">
                    <h1 class="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                    <p class="text-muted-foreground">
                        {{ selectedDomain === 'all' ? 'Global posture overview' : `Detailed analysis for ${selectedDomain}` }}
                    </p>
                </div>

                <!-- Filter Controls -->
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

            <!-- Loading State -->
            <div v-if="loading" class="flex items-center justify-center h-96">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>

            <!-- Main Dashboard Content -->
            <div v-else-if="analyticsData && analyticsData.kpi" class="space-y-6">

                <!-- KPI Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Target</CardTitle>
                            <Target class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold truncate">{{ analyticsData.kpi.target }}</div>
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
                            <CardTitle class="text-sm font-medium">Current Risk (Vulns)</CardTitle>
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
                            <div class="text-lg font-bold">{{ analyticsData.kpi.last_scan || 'N/A' }}</div>
                        </CardContent>
                    </Card>
                </div>

                <!-- Charts Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <!-- Vulnerabilities Over Time -->
                    <Card class="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Vulnerabilities Over Time</CardTitle>
                            <CardDescription>Aggregated daily vulnerability count</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CustomAreaChart :data="analyticsData.charts.history" />
                        </CardContent>
                    </Card>

                    <!-- Severity Distribution -->
                    <Card class="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Severity Distribution</CardTitle>
                            <CardDescription>Latest scan breakdown</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CustomDonutChart :data="analyticsData.charts.distribution" />
                        </CardContent>
                    </Card>

                    <!-- Top Vulnerability Types -->
                    <Card class="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Top Vulnerability Types</CardTitle>
                            <CardDescription>Most frequent issue types (Top 5)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <!-- Debug: Show raw data -->
                            <div v-if="!analyticsData.charts.types || analyticsData.charts.types.length === 0" class="text-sm text-muted-foreground py-4">
                                No vulnerability types data available
                            </div>
                            <div v-else-if="analyticsData.charts.types.length > 0">
                                <!-- Debug info (remove after fixing) -->
                                <details class="mb-4 text-xs">
                                    <summary class="cursor-pointer text-muted-foreground">Debug Data</summary>
                                    <pre class="mt-2 p-2 bg-muted rounded">{{ JSON.stringify(analyticsData.charts.types, null, 2) }}</pre>
                                </details>
                                <CustomHorizBarChart :data="analyticsData.charts.types" />
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Trend Analysis -->
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

                <!-- Latest Findings Table -->
                <Card>
                    <CardHeader>
                        <CardTitle>Latest Findings</CardTitle>
                        <CardDescription>Most recent vulnerabilities detected</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead class="w-[100px]">Severity</TableHead>
                                    <TableHead>Vulnerability</TableHead>
                                    <TableHead>Endpoint</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead class="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow v-for="(vuln, index) in rawVulns" :key="index">
                                    <TableCell>
                                        <Badge :variant="severityColor(vuln.severity)">{{ vuln.severity }}</Badge>
                                    </TableCell>
                                    <TableCell class="font-medium">{{ vuln.type }}</TableCell>
                                    <TableCell class="text-muted-foreground truncate max-w-[200px]">{{ vuln.endpoint }}</TableCell>
                                    <TableCell>{{ vuln.target }}</TableCell>
                                    <TableCell class="text-right">{{ vuln.date }}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>

            <!-- Empty State -->
            <div v-else class="flex flex-col items-center justify-center h-96 text-muted-foreground">
                <AlertTriangle class="h-12 w-12 mb-4 opacity-50" />
                <p>No analytics data available for this target or time range.</p>
            </div>
        </div>
    </AppLayout>
</template>
