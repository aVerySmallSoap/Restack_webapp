<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { format } from 'date-fns'
import {
    Activity,
    Target,
    Sigma,
    BarChart3,
    AlertTriangle,
    Calendar,
    Camera
} from 'lucide-vue-next'

// Components
import Navigation from '@/components/custom/Navigation.vue'
import DateRangePicker from '@/components/custom/Dashboard/DateRangePicker.vue'
import VulnerabilityTable from '@/components/custom/Dashboard/VulnerabilityTable.vue';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription
} from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

import DistributionHistogram from '@/components/custom/Charts/DistributionHistogram.vue';
import OutlierBoxPlot from '@/components/custom/Charts/OutlierBoxPlot.vue';
import TrendLineChart from '@/components/custom/Charts/TrendLineChart.vue';
import PrevalenceChart from '@/components/custom/Charts/PrevalenceChart.vue';
import CategoryDistributionChart from '@/components/custom/Charts/CategoryDistributionChart.vue';
import { DescriptiveStatsResponse, TimeSeriesPoint, RawVulnerability } from '@/lib/restack/restack.types'; // Ensure RawVulnerability is added to types

// Config
const API_BASE = "http://localhost:25565";

// State
const isLoading = ref(false)
const targets = ref<string[]>([])
const selectedTarget = ref<string>('all')
const analysisMode = ref<'snapshot' | 'time-series'>('snapshot')

// Date State (Default to last 90 days)
const dateRange = ref<{ start: Date; end: Date }>({
    start: new Date(new Date().setDate(new Date().getDate() - 90)),
    end: new Date()
})

// Data
const stats = ref<DescriptiveStatsResponse | null>(null)
const trendData = ref<TimeSeriesPoint[]>([])
const vulnerabilities = ref<RawVulnerability[]>([])

// Helper: Ensure valid URI for backend
const ensureUrl = (domain: string) => {
    if (!domain || domain === 'all') return '';
    return domain.startsWith('http') ? domain : `http://${domain}`;
}

const fetchTargets = async () => {
    try {
        const response = await axios.get(`${API_BASE}/api/v1/analytics/targets`)
        targets.value = response.data.domains || []
    } catch (error) {
        console.error('Failed to fetch targets:', error)
    }
}

const fetchDashboardData = async () => {
    isLoading.value = true
    stats.value = null
    trendData.value = []
    vulnerabilities.value = []

    // Format dates for API
    const dateParams = {
        start: format(dateRange.value.start, 'yyyy-MM-dd'),
        end: format(dateRange.value.end, 'yyyy-MM-dd')
    }

    try {
        // 1. Prepare Params
        const queryParams: any = {
            mode: analysisMode.value,
            ...dateParams
        }

        if (selectedTarget.value && selectedTarget.value !== 'all') {
            queryParams.target = selectedTarget.value
        }

        // 2. Fetch Descriptive Stats
        const statsRes = await axios.get(`${API_BASE}/api/v1/analytics/descriptive`, { params: queryParams })
        stats.value = statsRes.data

        // 3. Fetch Vulnerability List (New Endpoint)
        // We use the same params (target + date range) to ensure the table matches the charts
        const vulnsRes = await axios.get(`${API_BASE}/api/v1/analytics/vulnerabilities`, { params: queryParams })
        vulnerabilities.value = vulnsRes.data

        // 4. Fetch Time-Series Data (Only in time-series mode)
        if (analysisMode.value === 'time-series' && selectedTarget.value !== 'all') {
            const trendRes = await axios.get(`${API_BASE}/test/poll/data/timeseries`, {
                params: {
                    target: ensureUrl(selectedTarget.value),
                    days: 90, // Fallback if backend uses days
                    ...dateParams
                }
            })

            if(Array.isArray(trendRes.data)) {
                trendData.value = trendRes.data.map((d: any) => ({
                    date: d.date,
                    count: d.total_vulnerabilities || d.count,
                    critical_count: d.critical_count
                }));
            }
        }

    } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
    } finally {
        isLoading.value = false
    }
}

// Handle Date Picker Updates
const handleDateUpdate = (newRange: { start: Date; end: Date }) => {
    dateRange.value = newRange
    fetchDashboardData()
}

// Watchers
watch([selectedTarget, analysisMode], () => {
    fetchDashboardData()
})

// Lifecycle
onMounted(() => {
    fetchTargets()
    fetchDashboardData()
})
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">

            <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                <div>
                    <h1 class="px-2 text-4xl font-bold">Analytics Dashboard</h1>
                    <p class="text-muted-foreground text-sm mt-1">
                        {{ analysisMode === 'snapshot' ? 'Latest Scan Performance and Trends' : 'Historical performance and trends' }}
                    </p>
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">

                    <DateRangePicker
                        class="w-full sm:w-auto"
                        @update:range="handleDateUpdate"
                    />

                    <Tabs v-model="analysisMode" class="w-full sm:w-[300px]">
                        <TabsList class="grid w-full grid-cols-2">
                            <TabsTrigger value="snapshot" class="flex items-center gap-2">
                                <Camera class="h-4 w-4" /> Snapshot
                            </TabsTrigger>
                            <TabsTrigger value="time-series" class="flex items-center gap-2">
                                <Calendar class="h-4 w-4" /> Time Series
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div class="flex items-center gap-2 w-full sm:w-auto">
                        <span class="text-sm font-medium whitespace-nowrap hidden sm:inline">Target:</span>
                        <Select v-model="selectedTarget">
                            <SelectTrigger class="w-full sm:w-[220px]">
                                <SelectValue placeholder="All Targets" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Targets</SelectItem>
                                <SelectItem v-for="t in targets" :key="t" :value="t">
                                    {{ t }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div v-if="isLoading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton class="h-32" v-for="i in 4" :key="i" />
            </div>

            <div v-else-if="!stats || stats.meta.report_count === 0" class="flex flex-col items-center justify-center h-64 border rounded-lg bg-muted/10 border-dashed">
                <AlertTriangle class="h-10 w-10 text-muted-foreground mb-2" />
                <p class="text-muted-foreground font-medium">No data found for this selection.</p>
                <p class="text-xs text-muted-foreground mt-1">Try selecting a different target, date range, or mode.</p>
            </div>

            <div v-else class="space-y-6 animate-fadein">

                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">
                                <span v-if="selectedTarget !== 'all' && analysisMode === 'snapshot'">
                                    Total Findings
                                </span>
                                <span v-else>
                                    {{ analysisMode === 'snapshot' ? 'Mean Findings' : 'Historical Mean' }}
                                </span>
                            </CardTitle>
                            <Activity class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">
                                <span v-if="selectedTarget !== 'all' && analysisMode === 'snapshot' && stats.selected_target">
                                    {{ stats.selected_target.total_vulns }}
                                </span>
                                <span v-else>
                                    {{ stats.findings_per_scan?.mean.toFixed(1) || 0 }}
                                </span>
                            </div>
                            <p class="text-xs text-muted-foreground">
                                <span v-if="selectedTarget !== 'all' && analysisMode === 'snapshot' && stats.selected_target">
                                    (Global Avg: {{ stats.findings_per_scan?.mean.toFixed(1) }})
                                </span>
                                <span v-else>
                                    Average per {{ analysisMode === 'snapshot' ? 'target' : 'historical scan' }}
                                </span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Median</CardTitle>
                            <Target class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ stats.findings_per_scan?.median || 0 }}</div>
                            <p class="text-xs text-muted-foreground">
                                Typical finding count (Global)
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Coef. of Variation</CardTitle>
                            <Sigma class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ stats.findings_per_scan?.coefficient_of_variation || 0 }}</div>
                            <p class="text-xs text-muted-foreground">
                                Volatility (StdDev / Mean)
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Total Reports</CardTitle>
                            <BarChart3 class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ stats.meta.report_count }}</div>
                            <p class="text-xs text-muted-foreground">
                                Processed findings: {{ stats.meta.total_findings }}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div class="grid gap-4 md:grid-cols-2">

                    <Card class="col-span-1">
                        <CardHeader>
                            <CardTitle>Severity Distribution</CardTitle>
                            <CardDescription>Global risk breakdown</CardDescription>
                        </CardHeader>
                        <CardContent class="h-[350px]">
                            <DistributionHistogram
                                v-if="stats.severity_distribution"
                                :data="stats.severity_distribution"
                            />
                        </CardContent>
                    </Card>

                    <Card class="col-span-1">
                        <CardHeader>
                            <CardTitle>Risk by Vulnerability Type</CardTitle>
                            <CardDescription>Top issues broken down by severity</CardDescription>
                        </CardHeader>
                        <CardContent class="h-[350px]">
                            <CategoryDistributionChart
                                v-if="stats.severity_type_distribution"
                                :data="stats.severity_type_distribution"
                            />
                            <div v-else class="h-full flex items-center justify-center text-muted-foreground">
                                No data available.
                            </div>
                        </CardContent>
                    </Card>

                </div>

                <div class="grid gap-4 md:grid-cols-2 mt-6">

                    <Card class="col-span-1">
                        <CardHeader>
                            <CardTitle>Systemic Vulnerabilities</CardTitle>
                            <CardDescription>
                                Percentage of targets affected by each issue type.
                                High values indicate systemic failures.
                            </CardDescription>
                        </CardHeader>
                        <CardContent class="h-[350px]">
                            <PrevalenceChart
                                v-if="stats && stats.prevalence && Object.keys(stats.prevalence).length > 0"
                                :data="stats.prevalence"
                            />
                            <div v-else class="h-full flex items-center justify-center text-muted-foreground">
                                No prevalence data available.
                            </div>
                        </CardContent>
                    </Card>

                    <Card class="col-span-1">
                        <CardHeader>
                            <CardTitle>Statistical Spread (IQR)</CardTitle>
                            <CardDescription>
                                Box plot showing min, max, median, and quartiles (Global Context)
                            </CardDescription>
                        </CardHeader>
                        <CardContent class="h-[350px]">
                            <OutlierBoxPlot
                                v-if="stats.findings_per_scan"
                                :min="stats.findings_per_scan.min"
                                :q1="stats.findings_per_scan.q1"
                                :median="stats.findings_per_scan.median"
                                :q3="stats.findings_per_scan.q3"
                                :max="stats.findings_per_scan.max"
                                :mean="stats.findings_per_scan.mean"
                                :sd="stats.findings_per_scan.std_dev"
                            />
                        </CardContent>
                    </Card>

                </div>

                <div v-if="analysisMode === 'time-series'" class="grid gap-4 grid-cols-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vulnerability Trend</CardTitle>
                            <CardDescription>
                                History {{ selectedTarget !== 'all' ? `for ${selectedTarget}` : '(Select a target to view trend)' }}
                            </CardDescription>
                        </CardHeader>
                        <CardContent class="h-[400px]">
                            <div v-if="trendData.length > 0">
                                <TrendLineChart
                                    :data="trendData"
                                    :trend-mean="stats.findings_per_scan?.mean"
                                />
                            </div>
                            <div v-else class="h-full flex items-center justify-center text-muted-foreground">
                                <p v-if="selectedTarget === 'all'">Select a specific target to view trend data.</p>
                                <p v-else>No trend data available for this target in the selected range.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div class="col-span-1 md:col-span-2 lg:col-span-4 animate-fadein">
                    <VulnerabilityTable :data="vulnerabilities" />
                </div>
            </div>
        </div>
    </Navigation>
</template>

<style scoped>
.animate-fadein {
    animation: fadein 0.3s ease-out;
}
@keyframes fadein {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
