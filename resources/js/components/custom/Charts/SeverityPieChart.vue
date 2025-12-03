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
} from "@/components/ui/chart"
import { SEVERITY_CHART_CONFIG, getSeverityColor } from '@/lib/colors'

const props = defineProps({
    vulnerabilities: {
        type: Array as () => Record<string, any>[],
        default: () => []
    }
})

// Use centralized color config
const chartConfig = SEVERITY_CHART_CONFIG

// Data Processing
const chartData = computed(() => {
    const counts: Record<string, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        informational: 0
    }

    props.vulnerabilities.forEach(v => {
        let severity = (v.severity || 'informational').trim().toLowerCase()
        if (!(severity in counts)) severity = 'informational'
        counts[severity]++
    })

    return Object.entries(counts)
        .map(([key, value]) => ({
            severity: key,
            count: value,
            fill: getSeverityColor(key)
        }))
        .filter(item => item.count > 0)
})

const totalVulns = computed(() => props.vulnerabilities.length)

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
        <CardHeader class="items-center pb-0">
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Current Findings</CardDescription>
        </CardHeader>
        <CardContent class="flex-1 pb-0 flex flex-col">
            <ChartContainer
                :config="chartConfig"
                class="mx-auto aspect-square max-h-[300px]"
            >
                <VisSingleContainer
                    :data="chartData"
                    :margin="{ top: 20, bottom: 20 }"
                >
                    <VisDonut
                        :value="(d: Data) => d.count"
                        :color="(d: Data) => d.fill"
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
                                },
                            },
                        }"
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
                    <span class="text-muted-foreground font-mono text-xs tabular-nums">{{ item.count }}</span>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
