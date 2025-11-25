<script setup lang="ts">
import { ref, computed, watch } from 'vue' // Added computed here
import { router } from '@inertiajs/vue3'
import { Donut } from "@unovis/ts" // Required for event selectors
import { VisSingleContainer, VisDonut } from '@unovis/vue'
import {
    ScanSearch,
    FileText,
    ShieldAlert,
    ShieldX,
} from 'lucide-vue-next'

// Components
import Navigation from '@/components/custom/Navigation.vue'
import HistoryTable from "@/components/custom/History/HistoryTable.vue"
import DateRangePicker from '@/components/custom/Dashboard/DateRangePicker.vue'
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from '@/components/ui/card'
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton'
import VulnerabilityTrendChart from '@/components/custom/Dashboard/VulnerabilityTrendChart.vue'

// Types
import { ScanHistory } from '@/lib/restack/restack.types'

// ---------- Props from Laravel ----------
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

// ---------- Chart Configuration ----------
const donutConfig = {
    critical: {
        label: "Critical",
        color: "#ef4444"
    },
    high: {
        label: "High",
        color: "#f97316"
    },
    medium: {
        label: "Medium",
        color: "#eab308"
    },
    low: {
        label: "Low",
        color: "#3b82f6"
    },
    informational: {
        label: "Informational",
        color: "#64748b"
    },
} satisfies ChartConfig

// ---------- Interactive Donut Logic ----------
const activeSegmentKey = ref<string | null>(null)

// Calculate total for the central label default state
const totalDistVulns = computed(() =>
    props.vulnerabilityDistribution.reduce((acc, curr) => acc + curr.count, 0)
)

// Dynamic label: Shows "Total" or the specific Count
const centralLabel = computed(() => {
    if (activeSegmentKey.value) {
        const segment = props.vulnerabilityDistribution.find(d => d.severity === activeSegmentKey.value)
        return segment ? `${segment.count}` : '0'
    }
    return `${totalDistVulns.value}`
})

// Dynamic sub-label: Shows "Total" or the Severity Name
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
                <h1 class="font-bold px-2 text-4xl">Dashboard</h1>
                <DateRangePicker
                    :model-value="dateRange"
                    @update:range="onRangeUpdate"
                />
            </div>

            <div v-if="loading" class="space-y-6">
                <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton class="h-[126px] w-full" v-for="i in 4" :key="i" />
                </div>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Skeleton class="h-[400px] w-full" />
                    <Skeleton class="h-[400px] w-full" />
                </div>
                <Skeleton class="h-[400px] w-full" />
            </div>

            <div v-else class="space-y-6 animate-fadein">

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Total Scans</CardTitle>
                            <ScanSearch class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ props.stats.totalScans }}</div>
                            <p class="text-xs text-muted-foreground">in selected period</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Total Vulnerabilities</CardTitle>
                            <FileText class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ props.stats.totalVulns }}</div>
                            <p class="text-xs text-muted-foreground">findings detected</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Critical</CardTitle>
                            <ShieldX class="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold text-destructive">{{ props.stats.criticalVulns }}</div>
                            <p class="text-xs text-muted-foreground">critical issues</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">High</CardTitle>
                            <ShieldAlert class="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold text-orange-500">{{ props.stats.highVulns }}</div>
                            <p class="text-xs text-muted-foreground">high priority issues</p>
                        </CardContent>
                    </Card>
                </div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <VulnerabilityTrendChart
                        class="h-[400px]"
                        :data="props.vulnerabilityTimeline"
                    />

                    <Card class="h-[400px] flex flex-col">
                        <CardHeader>
                            <CardTitle>Severity Distribution</CardTitle>
                        </CardHeader>
                        <CardContent class="flex-1 pb-0">
                            <div v-if="props.vulnerabilityDistribution.length > 0" class="h-full w-full flex items-center justify-center">
                                <ChartContainer
                                    :config="donutConfig"
                                    class="aspect-square max-h-[300px] w-full"
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
                                                    click: (d, ev, i, elements) => {z
                                                        // 'd' here wraps the data: { data: { severity: '...', count: ... } }
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
