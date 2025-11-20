<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { router } from '@inertiajs/vue3'
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DonutChart } from '@/components/ui/chart-donut'
import { LineChart } from '@/components/ui/chart-line'

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

// ---------- State ----------
const loading = ref(false)

// Initialize DateRange from props (server state) or defaults
const dateRange = ref({
    start: props.filters.start ? new Date(props.filters.start) : new Date(new Date().setDate(new Date().getDate() - 30)),
    end: props.filters.end ? new Date(props.filters.end) : new Date(),
})

// ---------- Methods ----------

function onRangeUpdate(range: { start: Date, end: Date }) {
    dateRange.value = range
}

// Watch for date changes and reload page data via Inertia
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
                    <Skeleton class="h-[350px] w-full" />
                    <Skeleton class="h-[350px] w-full" />
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
                    <Card class="h-[350px] flex flex-col">
                        <CardHeader>
                            <CardTitle>Vulnerabilities Over Time</CardTitle>
                        </CardHeader>
                        <CardContent class="flex-1">
                            <div v-if="props.vulnerabilityTimeline.length > 0">
                                <LineChart
                                    class="h-[250px]"
                                    :data="props.vulnerabilityTimeline"
                                    index="date"
                                    :categories="['total']"
                                    :colors="['#3b82f6']"
                                    :y-formatter="(value: number) => `${value}`"
                                />
                            </div>
                            <div v-else class="h-full flex items-center justify-center text-muted-foreground">
                                No data for this period
                            </div>
                        </CardContent>
                    </Card>

                    <Card class="h-[350px] flex flex-col">
                        <CardHeader>
                            <CardTitle>Severity Distribution</CardTitle>
                        </CardHeader>
                        <CardContent class="flex-1">
                            <div v-if="props.vulnerabilityDistribution.length > 0">
                                <DonutChart
                                    class="h-[250px]"
                                    :data="props.vulnerabilityDistribution"
                                    index="severity"
                                    category="count"
                                    :colors="['#ef4444', '#f97316', '#eab308', '#64748b']"
                                    :value-formatter="(value: number) => `${value}`"
                                />
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
