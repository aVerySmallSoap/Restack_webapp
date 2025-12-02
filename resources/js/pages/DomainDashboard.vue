<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
    VisXYContainer,
    VisGroupedBar,
    VisLine,
    VisScatter,
    VisAxis,
    VisTooltip,
    VisAnnotations,
    VisDonut,
    VisSingleContainer
} from '@unovis/vue'
import { Donut, GroupedBar, Scatter } from '@unovis/ts'
import {
    ScanSearch,
    FileText,
    Target,
    Activity,
    TrendingUp,
    Sigma,
    Network,
    PieChart,
    CalendarDays
} from 'lucide-vue-next'

// Components
import Navigation from '@/components/custom/Navigation.vue'
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
import { ChartContainer } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

// ---------- Types ----------

interface ActivityData {
    date: string
    count: number
}

interface SummaryApiResponse {
    period_days: number
    summary_statistics: {
        total_scans: number
        total_vulnerabilities_found: number
        average_vulns_per_scan: number
        scans_per_day: number
        unique_targets: number
    }
    scan_type_distribution: Record<string, number>
    average_scan_duration: Record<string, number>
    daily_activity: ActivityData[]
    most_scanned_targets: Array<{ url: string, scan_count: number }>
}

interface ParetoItem {
    vulnerability_type: string
    count: number
    percentage: number
    cumulative_percentage: number
}

interface DistributionData {
    best_fit_distribution: string
    interpretation: string
}

interface CorrelationData {
    significant_correlations: Array<{
        variable_1: string
        variable_2: string
        correlation: number
        strength: string
    }>
}

interface RegressionData {
    model_accuracy: number
    predicted_next_month_vulns: number
    trend_direction: 'increasing' | 'decreasing' | 'stable'
}

// ---------- State ----------
const loading = ref(true)
const targets = ref<string[]>([])
const selectedTarget = ref<string>("")

const analytics = ref<{
    full_summary: SummaryApiResponse | null,
    pareto: { pareto_vulnerabilities: ParetoItem[], insight: string, recommendation: string } | null,
    distribution: DistributionData | null,
    correlation: CorrelationData | null,
    regression: RegressionData | null
}>({
    full_summary: null,
    pareto: null,
    distribution: null,
    correlation: null,
    regression: null
})

// ---------- Computed Chart Data ----------

// 1. Activity (Line Chart from daily_activity)
const activityData = computed(() => analytics.value.full_summary?.daily_activity || [])
const activityConfig = {
    scans: { label: 'Scans', color: '#10b981' } // Emerald
}

// 2. Scanner Distribution (Donut from scan_type_distribution)
const scannerData = computed(() => {
    const dist = analytics.value.full_summary?.scan_type_distribution || {}
    return Object.entries(dist).map(([key, value]) => ({ key, value }))
})
const scannerConfig = {
    value: { label: 'Scans', color: '#3b82f6' }
}
const donutColors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6']

// 3. Pareto (Bar + Line) - RESTORED ORIGINAL COLORS
const paretoConfig = {
    count: { label: 'Occurrence Count', color: '#3b82f6' }, // Blue-500 (Restored)
    cumulative: { label: 'Cumulative %', color: '#ef4444' } // Red-500 (Restored)
}

const paretoChartData = computed(() => analytics.value.pareto?.pareto_vulnerabilities || [])
const paretoMaxCount = computed(() => {
    if (paretoChartData.value.length === 0) return 100
    return Math.max(...paretoChartData.value.map(d => d.count))
})
const paretoYMax = computed(() => paretoMaxCount.value * 1.15)
const xTickValues = computed(() => paretoChartData.value.map((_, i) => i))
const barLabels = computed(() => {
    return paretoChartData.value.map((d, i) => ({
        x: i,
        y: d.count,
        text: d.count.toString(),
        color: '#1e293b'
    }))
})

// Helper: Truncate Labels
const truncateLabel = (str: string, maxLength: number = 15) => {
    if (!str) return ''
    if (str.length <= maxLength) return str
    return str.substring(0, maxLength) + '...'
}
const API_BASE = 'http://localhost:25565'
// ---------- API Logic ----------
const fetchTargets = async () => {
    try {
        const res = await fetch(`${API_BASE}/api/v1/analytics/targets`)
        if (res.ok) {
            const data = await res.json()
            targets.value = data.domains || []

            const urlParams = new URLSearchParams(window.location.search)
            const targetParam = urlParams.get('target')

            if (targetParam && targets.value.includes(targetParam)) {
                selectedTarget.value = targetParam
            } else if (targets.value.length > 0) {
                selectedTarget.value = targets.value[0]
            }
        }
    } catch (e) {
        console.error("Failed to fetch targets", e)
    }
}

const fetchAllAnalytics = async (target: string) => {
    if (!target) return
    loading.value = true

    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('target', target)
    window.history.pushState({}, '', newUrl)

    try {
        const [summaryRes, paretoRes, distRes, corrRes, regRes] = await Promise.all([
            fetch(`${API_BASE}/test/poll/data/summary/30?target=${target}`),
            fetch(`${API_BASE}/test/poll/data/pareto?target=${target}`),
            fetch(`${API_BASE}/test/poll/data/distribution?target=${target}`),
            fetch(`${API_BASE}/test/poll/data/correlation?target=${target}`),
            fetch(`${API_BASE}/test/poll/data/regression?target=${target}`)
        ])

        if (summaryRes.ok) analytics.value.full_summary = await summaryRes.json()
        if (paretoRes.ok) analytics.value.pareto = await paretoRes.json()
        if (distRes.ok) analytics.value.distribution = await distRes.json()
        if (corrRes.ok) analytics.value.correlation = await corrRes.json()
        if (regRes.ok) analytics.value.regression = await regRes.json()

    } catch (e) {
        console.error("Error fetching analytics", e)
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    await fetchTargets()
})

watch(selectedTarget, (newVal) => {
    if (newVal) {
        fetchAllAnalytics(newVal)
    }
})
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-6 p-4 pt-0">
            <div class="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
                <div>
                    <h1 class="font-bold px-2 text-3xl tracking-tight">Domain Analytics</h1>
                    <p class="px-2 text-sm text-muted-foreground">Summary for {{ selectedTarget || 'Selected Domain' }}</p>
                </div>
                <div class="w-full md:w-[300px]">
                    <Select v-model="selectedTarget">
                        <SelectTrigger>
                            <SelectValue placeholder="Select a target domain" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="t in targets" :key="t" :value="t">
                                {{ t }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div v-if="loading" class="space-y-6">
                <div class="grid gap-4 grid-cols-1 md:grid-cols-4">
                    <Skeleton class="h-[120px] w-full" v-for="i in 4" :key="i" />
                </div>
                <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <Skeleton class="h-[300px] w-full" />
                    <Skeleton class="h-[300px] w-full" />
                </div>
            </div>

            <div v-else class="space-y-6 animate-fadein">

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Total Scans</CardTitle>
                            <ScanSearch class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ analytics.full_summary?.summary_statistics.total_scans ?? 0 }}</div>
                            <p class="text-xs text-muted-foreground">last 30 days</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Total Findings</CardTitle>
                            <FileText class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ analytics.full_summary?.summary_statistics.total_vulnerabilities_found ?? 0 }}</div>
                            <div class="flex items-center text-xs text-muted-foreground">
                                <span class="font-medium text-foreground mr-1">
                                    {{ Math.round(analytics.full_summary?.summary_statistics.average_vulns_per_scan ?? 0) }}
                                </span>
                                avg per scan
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Scan Frequency</CardTitle>
                            <Activity class="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ analytics.full_summary?.summary_statistics.scans_per_day ?? 0 }}</div>
                            <p class="text-xs text-muted-foreground">scans per day</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Active Targets</CardTitle>
                            <Target class="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ analytics.full_summary?.summary_statistics.unique_targets ?? 0 }}</div>
                            <p class="text-xs text-muted-foreground">endpoints or subdomains</p>
                        </CardContent>
                    </Card>
                </div>

                <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">

                    <Card class="flex flex-col">
                        <CardHeader>
                            <CardTitle class="flex items-center gap-2">
                                <CalendarDays class="h-4 w-4" /> Scan History
                            </CardTitle>
                            <CardDescription>Daily scan volume over the last 30 days.</CardDescription>
                        </CardHeader>
                        <CardContent class="h-[300px] w-full">
                            <ChartContainer :config="activityConfig" class="h-full w-full">
                                <VisXYContainer :data="activityData" :margin="{ top: 10, right: 10, bottom: 40, left: 40 }">
                                    <VisLine
                                        :x="(d) => new Date(d.date).getTime()"
                                        :y="(d) => d.count"
                                        :color="activityConfig.scans.color"
                                        :stroke-width="2"
                                    />
                                    <VisAxis
                                        type="x"
                                        :tick-format="(ts) => new Date(ts).toLocaleDateString(undefined, {month:'short', day:'numeric'})"
                                        :num-ticks="6"
                                        :grid-line="false"
                                    />
                                    <VisAxis type="y" :tick-format="(v) => v.toFixed(0)" />
                                    <VisTooltip />
                                </VisXYContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card class="flex flex-col">
                        <CardHeader>
                            <CardTitle class="flex items-center gap-2">
                                <PieChart class="h-4 w-4" /> Tools Used
                            </CardTitle>
                            <CardDescription>Distribution of scans by scanner type.</CardDescription>
                        </CardHeader>
                        <CardContent class="h-[300px] w-full flex items-center justify-center">
                            <div v-if="scannerData.length > 0" class="w-full h-full">
                                <ChartContainer :config="scannerConfig" class="h-full w-full">
                                    <VisSingleContainer :data="scannerData" :margin="{ top: 0, bottom: 0, left: 0, right: 0 }">
                                        <VisDonut
                                            :value="(d) => d.value"
                                            :color="(d, i) => donutColors[i % donutColors.length]"
                                            :arc-width="40"
                                            :central-label="scannerData.reduce((acc, curr) => acc + curr.value, 0).toString()"
                                            central-sub-label="Total Scans"
                                        />
                                        <VisTooltip :triggers="{
                                            [Donut.selectors.segment]: (d) => `${d.data.key}: ${d.data.value} scans`
                                        }" />
                                    </VisSingleContainer>
                                </ChartContainer>
                            </div>
                            <div v-else class="h-full flex items-center justify-center text-muted-foreground">
                                No scanner data available
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card class="flex flex-col w-full">
                    <CardHeader>
                        <CardTitle>Pareto Analysis (80/20 Rule)</CardTitle>
                        <CardDescription>Identifying the vital few vulnerabilities causing the majority of findings.</CardDescription>
                    </CardHeader>
                    <CardContent class="min-h-[450px]">
                        <ChartContainer :config="paretoConfig" class="h-[450px] w-full">
                            <VisXYContainer
                                :data="paretoChartData"
                                :margin="{ top: 40, right: 60, bottom: 110, left: 60 }"
                                :y-domain="[0, paretoYMax]"
                            >
                                <VisGroupedBar
                                    :x="(d, i) => i"
                                    :y="(d) => d.count"
                                    :color="paretoConfig.count.color"
                                    :rounded-corners="0"
                                    :bar-padding="0.2"
                                />
                                <VisAnnotations
                                    :items="barLabels"
                                    :x="(d) => d.x"
                                    :y="(d) => d.y + (paretoMaxCount * 0.02)"
                                    :content="(d) => d.text"
                                    :text-color="(d) => d.color"
                                    vertical-align="bottom"
                                />
                                <VisLine
                                    :x="(d, i) => i"
                                    :y="[(d) => (d.cumulative_percentage / 100) * paretoYMax]"
                                    :color="paretoConfig.cumulative.color"
                                    :stroke-width="2"
                                    :curve-type="'monotoneX'"
                                />
                                <VisScatter
                                    :x="(d, i) => i"
                                    :y="[(d) => (d.cumulative_percentage / 100) * paretoYMax]"
                                    :color="paretoConfig.cumulative.color"
                                    :size="8"
                                    :stroke-color="'white'"
                                    :stroke-width="1"
                                />
                                <VisAxis
                                    type="x"
                                    :tick-values="xTickValues"
                                    :tick-format="(i) => truncateLabel(paretoChartData[i]?.vulnerability_type)"
                                    :grid-line="false"
                                    :tick-text-angle="-15"
                                    :tick-text-anchor="'end'"
                                    :tick-text-font-size="12"
                                />
                                <VisAxis
                                    type="y"
                                    label="Count"
                                    :label-color="paretoConfig.count.color"
                                    :grid-line="true"
                                    :tick-text-color="paretoConfig.count.color"
                                    :tick-format="(v) => v.toFixed(0)"
                                />
                                <VisAxis
                                    type="y"
                                    position="right"
                                    label="Cumulative %"
                                    :label-color="paretoConfig.cumulative.color"
                                    :grid-line="false"
                                    :tick-text-color="paretoConfig.cumulative.color"
                                    :tick-format="(v) => ((v / paretoYMax) * 100).toFixed(0) + '%'"
                                />
                                <VisTooltip :triggers="{
                                    [GroupedBar.selectors.bar]: (d) => `
                                        <div style='padding: 12px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'>
                                            <div style='font-weight: 600; margin-bottom: 8px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;'>
                                                ${d.vulnerability_type}
                                            </div>
                                            <div style='display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 13px;'>
                                                <span style='color: #64748b;'>Count:</span>
                                                <span style='font-weight: 600; color: ${paretoConfig.count.color}; text-align: right;'>${d.count}</span>

                                                <span style='color: #64748b;'>Impact:</span>
                                                <span style='font-weight: 600; color: #0f172a; text-align: right;'>${d.percentage.toFixed(1)}%</span>

                                                <span style='color: #64748b;'>Cumulative:</span>
                                                <span style='font-weight: 600; color: ${paretoConfig.cumulative.color}; text-align: right;'>${d.cumulative_percentage.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    `,
                                    [Scatter.selectors.point]: (d) => `
                                        <div style='padding: 8px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 13px;'>
                                            <span style='color: ${paretoConfig.cumulative.color}; font-weight: 600;'>Cumulative: ${d.cumulative_percentage.toFixed(1)}%</span>
                                        </div>
                                    `
                                }" />
                            </VisXYContainer>
                        </ChartContainer>

                        <div v-if="analytics.pareto" class="mt-4 pt-4 border-t space-y-2">
                            <div class="flex items-start gap-2">
                                <div class="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                <p class="text-sm font-medium">{{ analytics.pareto.insight }}</p>
                            </div>
                            <div class="flex items-start gap-2">
                                <div class="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                <p class="text-sm text-muted-foreground">{{ analytics.pareto.recommendation }}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <Card class="flex flex-col">
                        <CardHeader>
                            <CardTitle class="flex items-center gap-2 text-base">
                                <Sigma class="h-4 w-4 text-purple-500"/> Distribution Fit
                            </CardTitle>
                            <CardDescription>Mathematical model of vuln occurrence.</CardDescription>
                        </CardHeader>
                        <CardContent class="flex-1 flex flex-col justify-center">
                            <div v-if="analytics.distribution">
                                <div class="text-center py-4 bg-muted/20 rounded-lg mb-4">
                                    <div class="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Best Fit Model</div>
                                    <div class="text-2xl font-bold text-primary mt-1 capitalize">{{ analytics.distribution.best_fit_distribution }}</div>
                                </div>
                                <div class="text-sm text-muted-foreground italic text-center">
                                    "{{ analytics.distribution.interpretation }}"
                                </div>
                            </div>
                            <div v-else class="text-center text-sm text-muted-foreground">Insufficient data</div>
                        </CardContent>
                    </Card>

                    <Card class="flex flex-col">
                        <CardHeader>
                            <CardTitle class="flex items-center gap-2 text-base">
                                <Network class="h-4 w-4 text-blue-500"/> Correlations
                            </CardTitle>
                            <CardDescription>Hidden relationships in scan data.</CardDescription>
                        </CardHeader>
                        <CardContent class="flex-1">
                            <div v-if="analytics.correlation?.significant_correlations?.length" class="space-y-3">
                                <div v-for="(corr, i) in analytics.correlation.significant_correlations.slice(0, 3)" :key="i" class="flex items-center justify-between p-2 border rounded-md text-xs">
                                    <div class="font-medium">
                                        {{ corr.variable_1 }} <span class="text-muted-foreground">vs</span> {{ corr.variable_2 }}
                                    </div>
                                    <Badge :variant="Math.abs(corr.correlation) > 0.7 ? 'destructive' : 'secondary'">
                                        {{ corr.correlation.toFixed(2) }}
                                    </Badge>
                                </div>
                            </div>
                            <div v-else class="h-full flex items-center justify-center text-sm text-muted-foreground">
                                No strong correlations found.
                            </div>
                        </CardContent>
                    </Card>

                    <Card class="flex flex-col">
                        <CardHeader>
                            <CardTitle class="flex items-center gap-2 text-base">
                                <TrendingUp class="h-4 w-4 text-orange-500"/> Forecast
                            </CardTitle>
                            <CardDescription>Predictive analysis for next month.</CardDescription>
                        </CardHeader>
                        <CardContent class="flex-1 flex flex-col justify-between">
                            <div v-if="analytics.regression">
                                <div class="text-sm text-muted-foreground mb-1">Projected Vulnerabilities</div>
                                <div class="text-4xl font-bold mb-2">
                                    {{ Math.round(analytics.regression.predicted_next_month_vulns || 0) }}
                                </div>
                                <Badge :variant="analytics.regression.trend_direction === 'increasing' ? 'destructive' : 'outline'">
                                    Trend: {{ analytics.regression.trend_direction }}
                                </Badge>
                            </div>
                            <div v-else class="h-full flex items-center justify-center text-sm text-muted-foreground">
                                Data unavailable for prediction.
                            </div>

                            <div v-if="analytics.regression" class="mt-4 pt-4 border-t flex justify-between text-xs text-muted-foreground">
                                <span>Confidence</span>
                                <span class="font-mono font-medium text-foreground">
                                    {{ ((analytics.regression.model_accuracy || 0) * 100).toFixed(1) }}%
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    </Navigation>
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
