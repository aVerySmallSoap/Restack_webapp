<script setup lang="ts">
import { computed, ref } from 'vue'
import { Donut } from "@unovis/ts"
import { VisDonut, VisSingleContainer } from "@unovis/vue"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { SEVERITY_CHART_CONFIG, getSeverityColor } from '@/lib/colors'

const props = defineProps<{
    vulnerabilityDistribution: Array<{ severity: string, count: number }>
}>()

// Use centralized color configuration
const chartConfig = SEVERITY_CHART_CONFIG

// Process data with standardized colors
const chartData = computed(() => {
    return props.vulnerabilityDistribution
        .map(item => ({
            severity: item.severity.toLowerCase(),
            count: item.count,
            fill: getSeverityColor(item.severity)
        }))
        .filter(item => item.count > 0)
})

const totalVulns = computed(() =>
    props.vulnerabilityDistribution.reduce((sum, item) => sum + item.count, 0)
)

// Interactivity State
const activeSegmentKey = ref<string | null>(null)

// Dynamic labels based on selection
const centralLabel = computed(() => {
    if (activeSegmentKey.value) {
        const segment = chartData.value.find(d => d.severity === activeSegmentKey.value)
        return segment ? segment.count.toLocaleString() : '0'
    }
    return totalVulns.value.toLocaleString()
})

const centralSubLabel = computed(() => {
    if (activeSegmentKey.value) {
        return activeSegmentKey.value.charAt(0).toUpperCase() + activeSegmentKey.value.slice(1)
    }
    return 'Total'
})

type Data = typeof chartData.value[number]
</script>

<template>
    <Card class="flex flex-col h-full">
        <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Breakdown of vulnerabilities by severity level</CardDescription>
        </CardHeader>
        <CardContent class="flex-1 pb-4 flex flex-col">
            <div v-if="chartData.length > 0" class="flex-1 flex flex-col">
                <ChartContainer
                    :config="chartConfig"
                    class="aspect-square max-h-[300px] mx-auto w-full"
                >
                    <VisSingleContainer
                        :data="chartData"
                        :margin="{ top: 0, right: 0, bottom: 0, left: 0 }"
                    >
                        <VisDonut
                            :value="(d: Data) => d.count"
                            :color="(d: Data) => d.fill"
                            :sort-function="() => 0"
                            :arc-width="40"
                            :central-label="centralLabel"
                            :central-sub-label="centralSubLabel"
                            :events="{
                                [Donut.selectors.segment]: {
                                    click: (d: Data, ev: PointerEvent, i: number, elements: HTMLElement[]) => {
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
                            :config="chartConfig"
                        />
                    </VisSingleContainer>
                </ChartContainer>

                <!-- Legend -->
                <div class="mt-6 space-y-2 px-4">
                    <div
                        v-for="item in chartData"
                        :key="item.severity"
                        class="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-all"
                        :class="{ 'opacity-50': activeSegmentKey && activeSegmentKey !== item.severity }"
                        @click="activeSegmentKey = activeSegmentKey === item.severity ? null : item.severity"
                    >
                        <div
                            class="h-3 w-3 rounded-sm shrink-0"
                            :style="{ backgroundColor: item.fill }"
                        />
                        <span class="font-medium capitalize flex-1">{{ item.severity }}</span>
                        <span class="text-muted-foreground font-mono text-xs tabular-nums">
                            {{ item.count }}
                        </span>
                    </div>
                </div>
            </div>
            <div v-else class="h-full flex items-center justify-center text-muted-foreground">
                No vulnerabilities found
            </div>
        </CardContent>
    </Card>
</template>
