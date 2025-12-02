<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { router } from '@inertiajs/vue3'
import { Donut } from "@unovis/ts"
import { VisSingleContainer, VisDonut } from '@unovis/vue'
import {
    ScanSearch,
    FileText,
    Target,
    Activity,
    Timer,
    BarChart3,
    ArrowUpRight
} from 'lucide-vue-next'

// Components
import Navigation from '@/components/custom/Navigation.vue'
import HistoryTable from "@/components/custom/History/HistoryTable.vue"
import DateRangePicker from '@/components/custom/Dashboard/DateRangePicker.vue'
import ParetoAnalysis from '@/components/custom/Dashboard/ParetoAnalysis.vue'

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import VulnerabilityTrendChart from '@/components/custom/Dashboard/VulnerabilityTrendChart.vue'

// Types
import { ScanHistory } from '@/lib/restack/restack.types'

const props = defineProps<{
    stats: {
        totalScans: number
        totalVulns: number
        criticalVulns: number
        highVulns: number
    }
    recentScans: ScanHistory[]
    vulnerabilityDistribution: Array<{ severity: string, count: number }>
    vulnerabilityTimeline: Array<{ date: string, total: number, critical: number }>
    filters: {
        start: string
        end: string
    }
}>()

// ---------- Polling Logic ----------
const API_ENDPOINT = "http://localhost:25565/test/poll/data/summary/30"
const live_data = ref<any>(null)
let pollingInterval: ReturnType<typeof setInterval> | null = null

const fetchSummaryData = async () => {
    try {
        const res = await fetch(API_ENDPOINT)
        if (!res.ok) throw new Error('Network response was not ok')
        const data = await res.json()
        live_data.value = data
    } catch (e) {
        console.error("Failed to fetch summary data", e)
    }
}

onMounted(() => {
    fetchSummaryData()
    pollingInterval = setInterval(fetchSummaryData, 30_000)
})

onUnmounted(() => {
    if (pollingInterval) clearInterval(pollingInterval)
})

// ---------- Computed Stats (Safe Access) ----------
const summaryStats = computed(() => live_data.value?.summary_statistics || {})
const scanDistribution = computed(() => live_data.value?.scan_type_distribution || {})
const scanDurations = computed(() => live_data.value?.average_scan_duration || {})
const topTargets = computed(() => live_data.value?.most_scanned_targets || [])

// Helper: Format duration from seconds to readable string
const formatDuration = (seconds: number) => {
    if (!seconds) return '0s'
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
}

// Helper: Capitalize keys (e.g. "full scan" -> "Full Scan")
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

// ---------- Chart Configuration ----------
const donutConfig = {
    critical: { label: "Critical", color: "#ef4444" },
    high: { label: "High", color: "#f97316" },
    medium: { label: "Medium", color: "#eab308" },
    low: { label: "Low", color: "#3b82f6" },
    informational: { label: "Informational", color: "#64748b" },
} satisfies ChartConfig

// ---------- Interactive Donut Logic ----------
const activeSegmentKey = ref<string | null>(null)

const totalDistVulns = computed(() =>
    props.vulnerabilityDistribution.reduce((acc, curr) => acc + curr.count, 0)
)

const centralLabel = computed(() => {
    if (activeSegmentKey.value) {
        const segment = props.vulnerabilityDistribution.find(d => d.severity === activeSegmentKey.value)
        return segment ? `${segment.count}` : '0'
    }
    return `${totalDistVulns.value}`
})

const centralSubLabel = computed(() => {
    if (activeSegmentKey.value) {
        return activeSegmentKey.value.charAt(0).toUpperCase() + activeSegmentKey.value.slice(1)
    }
    return 'Total'
})

// ---------- State & Navigation ----------
const loading = ref(false)
const dateRange = ref({
    start: props.filters.start ? new Date(props.filters.start) : new Date(new Date().setDate(new Date().getDate() - 30)),
    end: props.filters.end ? new Date(props.filters.end) : new Date(),
})

function onRangeUpdate(range: { start: Date, end: Date }) {
    dateRange.value = range
}

watch(dateRange, (newRange) => {
    if (newRange.start && newRange.end) {
        loading.value = true
        router.get(route('dashboard'), {
            start: newRange.start.toISOString(),
            end: newRange.end.toISOString()
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['stats', 'recentScans', 'vulnerabilityDistribution', 'vulnerabilityTimeline', 'filters'],
            onFinish: () => loading.value = false
        })
    }
}, { deep: true })
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-6 p-4 pt-0">
            <div class="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
                <div>
                    <h1 class="font-bold px-2 text-3xl tracking-tight">System Overview</h1>
                    <p class="px-2 text-sm text-muted-foreground">Summary for all domains</p>
                </div>
                <DateRangePicker
                    :model-value="dateRange"
                    @update:range="onRangeUpdate"
                />
            </div>

            <div v-if="loading" class="space-y-6">
                <div class="grid gap-4 grid-cols-1 md:grid-cols-4">
                    <Skeleton class="h-[120px] w-full" v-for="i in 4" :key="i" />
                </div>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Skeleton class="h-[300px] w-full col-span-2" />
                    <Skeleton class="h-[300px] w-full" />
                </div>
            </div>

            <div v-else class="space-y-6 animate-fadein">

                <!-- KPI Cards -->
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Total Scans Executed</CardTitle>
                            <ScanSearch class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ summaryStats.total_scans ?? 0 }}</div>
                            <p class="text-xs text-muted-foreground">Across all environments</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Total Findings</CardTitle>
                            <FileText class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ summaryStats.total_vulnerabilities_found ?? 0 }}</div>
                            <div class="flex items-center text-xs text-muted-foreground">
                                <span class="font-medium text-foreground mr-1">
                                    {{ Math.round(summaryStats.average_vulns_per_scan ?? 0) }}
                                </span>
                                avg per scan
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Scan Velocity</CardTitle>
                            <Activity class="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ summaryStats.scans_per_day ?? 0 }}</div>
                            <p class="text-xs text-muted-foreground">scans per day</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Active Targets</CardTitle>
                            <Target class="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ summaryStats.unique_targets ?? 0 }}</div>
                            <p class="text-xs text-muted-foreground">unique endpoints probed</p>
                        </CardContent>
                    </Card>
                </div>

                <!-- Vulnerability Trend -->
                <VulnerabilityTrendChart
                    class="h-[450px]"
                    :data="props.vulnerabilityTimeline"
                />

                <!-- Pareto Analysis + Severity Distribution -->
                <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ParetoAnalysis class="h-[500px]" />

                    <Card class="h-[500px] flex flex-col">
                        <CardHeader>
                            <CardTitle>Severity Distribution</CardTitle>
                            <CardDescription>Breakdown of vulnerabilities by severity level</CardDescription>
                        </CardHeader>
                        <CardContent class="flex-1 pb-0">
                            <div v-if="props.vulnerabilityDistribution.length > 0" class="h-full w-full flex items-center justify-center">
                                <ChartContainer
                                    :config="donutConfig"
                                    class="aspect-square max-h-[350px] w-full"
                                >
                                    <VisSingleContainer
                                        :data="props.vulnerabilityDistribution"
                                        :margin="{ top: 0, right: 0, bottom: 0, left: 0 }"
                                    >
                                        <VisDonut
                                            :value="(d) => d.count"
                                            :color="(d) => donutConfig[d.severity.toLowerCase()]?.color"
                                            :sort-function="() => 0"
                                            :arc-width="40"
                                            :central-label="centralLabel"
                                            :central-sub-label="centralSubLabel"
                                            :events="{
                                                [Donut.selectors.segment]: {
                                                    click: (d, ev, i, elements) => {
                                                        const clickedKey = d.data.severity
                                                        if (activeSegmentKey === clickedKey) {
                                                            activeSegmentKey = null
                                                            elements.forEach(el => el.style.opacity = '1')
                                                        } else {
                                                            activeSegmentKey = clickedKey
                                                            elements.forEach(el => el.style.opacity = '0.3')
                                                            elements[i].style.opacity = '1'
                                                        }
                                                    }
                                                }
                                            }"
                                        />
                                        <ChartTooltip
                                            :content="ChartTooltipContent"
                                            :config="donutConfig"
                                        />
                                    </VisSingleContainer>
                                </ChartContainer>
                            </div>
                            <div v-else class="h-full flex items-center justify-center text-muted-foreground">
                                No vulnerabilities found
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <!-- Scanner Performance + Top Targets -->
                <div class="grid grid-cols-1 gap-4 md:grid-cols-7">

                    <Card class="md:col-span-4 flex flex-col">
                        <CardHeader>
                            <CardTitle class="flex items-center gap-2">
                                <BarChart3 class="h-5 w-5 text-muted-foreground" />
                                Scanner Performance Metrics
                            </CardTitle>
                            <CardDescription>Breakdown of execution volume and average duration by engine.</CardDescription>
                        </CardHeader>
                        <CardContent class="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Scanner Type</TableHead>
                                        <TableHead class="text-center">Execution Count</TableHead>
                                        <TableHead class="text-right">Avg Duration</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow v-for="(count, type) in scanDistribution" :key="type">
                                        <TableCell class="font-medium capitalize">
                                            {{ type }}
                                        </TableCell>
                                        <TableCell class="text-center">
                                            <Badge variant="secondary" class="rounded-sm">
                                                {{ count }}
                                            </Badge>
                                        </TableCell>
                                        <TableCell class="text-right font-mono text-xs">
                                            <div class="flex items-center justify-end gap-2">
                                                {{ formatDuration(scanDurations[type]) }}
                                                <Timer class="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow v-if="Object.keys(scanDistribution).length === 0">
                                        <TableCell colspan="3" class="text-center h-24 text-muted-foreground">
                                            No scanner data available.
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card class="md:col-span-3 flex flex-col">
                        <CardHeader>
                            <CardTitle>Most Scanned Targets</CardTitle>
                            <CardDescription>Endpoints with highest scan frequency.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div class="space-y-4">
                                <div v-for="(target, index) in topTargets.slice(0, 5)" :key="index" class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3 overflow-hidden">
                                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-xs font-bold">
                                            {{ index + 1 }}
                                        </div>
                                        <div class="flex flex-col truncate">
                                            <a :href="target.url" target="_blank" class="text-sm font-medium hover:underline truncate w-[180px] md:w-[140px] lg:w-[200px]" :title="target.url">
                                                {{ target.url.replace(/^https?:\/\//, '') }}
                                            </a>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm font-bold">{{ target.scan_count }}</span>
                                        <ArrowUpRight class="h-3 w-3 text-muted-foreground" />
                                    </div>
                                </div>
                                <div v-if="topTargets.length === 0" class="flex h-full items-center justify-center text-muted-foreground text-sm">
                                    No target data available.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <!-- Recent Scans History -->
                <HistoryTable :data="props.recentScans" />
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
