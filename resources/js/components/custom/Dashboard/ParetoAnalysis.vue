<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { VisXYContainer, VisGroupedBar, VisLine, VisScatter, VisAxis, VisTooltip, VisAnnotations } from '@unovis/vue'
import { GroupedBar, Line, Scatter } from '@unovis/ts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { AlertCircle, RefreshCw } from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'

// --- Interfaces ---
interface ParetoItem {
    vulnerability_type: string
    count: number
    percentage: number // "Impact"
    cumulative_percentage: number
}

interface ParetoResponse {
    pareto_vulnerabilities: ParetoItem[]
    insight: string
    recommendation: string
}

// --- API Config ---
const API_ENDPOINT = "http://127.0.0.1:25565/test/poll/data/pareto"
const POLL_INTERVAL = 30000

// --- State ---
const paretoData = ref<ParetoResponse | null>(null)
const isLoading = ref(true)
const isError = ref(false)
const errorMessage = ref('')
let pollingInterval: ReturnType<typeof setInterval> | null = null

// --- Fetch Logic ---
const fetchParetoData = async () => {
    try {
        isError.value = false
        const response = await fetch(API_ENDPOINT)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        paretoData.value = data
        isLoading.value = false
    } catch (error) {
        console.error('Failed to fetch Pareto data:', error)
        isError.value = true
        errorMessage.value = error instanceof Error ? error.message : 'Unknown error occurred'
        isLoading.value = false
    }
}

onMounted(() => {
    fetchParetoData()
    pollingInterval = setInterval(fetchParetoData, POLL_INTERVAL)
})

onUnmounted(() => {
    if (pollingInterval) clearInterval(pollingInterval)
})

const truncateLabel = (str: string, maxLength: number = 20) => {
    if (!str) return ''
    if (str.length <= maxLength) return str
    return str.substring(0, maxLength) + '...'
}

// --- Chart Configuration ---
const chartConfig = {
    count: { label: 'Occurrence Count', color: '#3b82f6' }, // Blue-500
    cumulative: { label: 'Cumulative %', color: '#ef4444' } // Red-500
}

const chartData = computed(() => paretoData.value?.pareto_vulnerabilities || [])

const maxCount = computed(() => {
    if (chartData.value.length === 0) return 100
    return Math.max(...chartData.value.map(d => d.count))
})

const yMax = computed(() => maxCount.value * 1.15)

// Labels for top of bars
const barLabels = computed(() => {
    return chartData.value.map((d, i) => ({
        x: i,
        y: d.count,
        text: d.count.toString(),
        color: '#1e293b'
    }))
})

// Force all X-axis labels to show
const xTickValues = computed(() => chartData.value.map((_, i) => i))

</script>

<template>
    <Card class="flex flex-col h-full w-full">
        <CardHeader>
            <div class="flex items-start justify-between">
                <div>
                    <CardTitle class="flex items-center gap-2">
                        Pareto Analysis
                    </CardTitle>
                    <CardDescription>
                        Vulnerability distribution (80/20 Rule)
                    </CardDescription>
                </div>
            </div>
        </CardHeader>

        <CardContent class="flex-1 min-h-0">
            <div v-if="isLoading" class="space-y-4 h-full">
                <Skeleton class="h-full w-full" />
            </div>

            <div v-else-if="isError" class="flex flex-col items-center justify-center h-full text-center space-y-4">
                <AlertCircle class="h-12 w-12 text-destructive" />
                <div>
                    <p class="text-sm font-medium">Failed to load data</p>
                    <p class="text-xs text-muted-foreground mt-1">{{ errorMessage }}</p>
                </div>
            </div>

            <div v-else-if="chartData.length > 0" class="flex flex-col space-y-4">

                <ChartContainer :config="chartConfig" class="min-h-[500px] w-full">
                    <VisXYContainer
                        :data="chartData"
                        :margin="{ top: 40, right: 60, bottom: 110, left: 60 }"
                        :y-domain="[0, yMax]"
                    >
                        <VisGroupedBar
                            :x="(d, i) => i"
                            :y="(d) => d.count"
                            :color="chartConfig.count.color"
                            :rounded-corners="0"
                            :bar-padding="0.2"
                        />

                        <VisAnnotations
                            :items="barLabels"
                            :x="(d) => d.x"
                            :y="(d) => d.y + (maxCount * 0.02)"
                            :content="(d) => d.text"
                            :text-color="(d) => d.color"
                            vertical-align="bottom"
                        />

                        <VisLine
                            :x="(d, i) => i"
                            :y="[(d) => (d.cumulative_percentage / 100) * yMax]"
                            :color="chartConfig.cumulative.color"
                            :stroke-width="2"
                            :curve-type="'monotoneX'"
                        />

                        <VisScatter
                            :x="(d, i) => i"
                            :y="[(d) => (d.cumulative_percentage / 100) * yMax]"
                            :color="chartConfig.cumulative.color"
                            :size="8"
                            :stroke-color="'white'"
                            :stroke-width="1"
                        />

                        <VisAxis
                            type="x"
                            :tick-values="xTickValues"
                            :tick-format="(i) => truncateLabel(chartData[i]?.vulnerability_type)"
                            :grid-line="false"
                            :tick-text-angle="-45"
                            :tick-text-anchor="'end'"
                            :tick-text-font-size="12"
                            :tick-text-color="'#333'"
                        />

                        <VisAxis
                            type="y"
                            label="Count"
                            :label-color="chartConfig.count.color"
                            :grid-line="true"
                            :grid-line-color="'#e0e0e0'"
                            :tick-text-color="chartConfig.count.color"
                            :tick-format="(v) => v.toFixed(0)"
                        />

                        <VisAxis
                            type="y"
                            position="right"
                            label="Cumulative %"
                            :label-color="chartConfig.cumulative.color"
                            :grid-line="false"
                            :tick-text-color="chartConfig.cumulative.color"
                            :tick-format="(v) => ((v / yMax) * 100).toFixed(0) + '%'"
                        />

                        <VisTooltip :triggers="{
                            [GroupedBar.selectors.bar]: (d) => `
                                <div style='padding: 12px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'>
                                    <div style='font-weight: 600; margin-bottom: 8px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;'>
                                        ${d.vulnerability_type}
                                    </div>
                                    <div style='display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 13px;'>
                                        <span style='color: #64748b;'>Count:</span>
                                        <span style='font-weight: 600; color: ${chartConfig.count.color}; text-align: right;'>${d.count}</span>

                                        <span style='color: #64748b;'>Impact:</span>
                                        <span style='font-weight: 600; color: #0f172a; text-align: right;'>${d.percentage.toFixed(1)}%</span>

                                        <span style='color: #64748b;'>Cumulative:</span>
                                        <span style='font-weight: 600; color: ${chartConfig.cumulative.color}; text-align: right;'>${d.cumulative_percentage.toFixed(1)}%</span>
                                    </div>
                                </div>
                            `,
                            [Scatter.selectors.point]: (d) => `
                                <div style='padding: 8px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 13px;'>
                                    <span style='color: ${chartConfig.cumulative.color}; font-weight: 600;'>Cumulative: ${d.cumulative_percentage.toFixed(1)}%</span>
                                </div>
                            `
                        }" />
                    </VisXYContainer>
                </ChartContainer>

                <div v-if="paretoData" class="space-y-2 pt-2 border-t px-1">
                    <div class="flex items-start gap-2">
                        <div class="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        <p class="text-sm font-medium">{{ paretoData.insight }}</p>
                    </div>
                    <div class="flex items-start gap-2">
                        <div class="h-2 w-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                        <p class="text-sm text-medium">{{ paretoData.recommendation }}</p>
                    </div>
                </div>
            </div>

            <div v-else class="flex flex-col items-center justify-center h-full text-center space-y-2">
                <p class="text-sm font-medium text-muted-foreground">No data available</p>
            </div>
        </CardContent>
    </Card>
</template>
