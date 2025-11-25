<script setup lang="ts">
import { computed, ref } from 'vue'
import { Donut } from "@unovis/ts"
import { VisDonut, VisSingleContainer } from "@unovis/vue"
import { ShieldAlert } from "lucide-vue-next"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    componentToString,
} from "@/components/ui/chart"

const props = defineProps({
    vulnerabilities: {
        type: Array as () => Record<string, any>[],
        default: () => []
    }
})

// 1. Config
const chartConfig = {
    critical: { label: "Critical", color: "#ef4444" },
    high:     { label: "High",     color: "#f97316" },
    medium:   { label: "Medium",   color: "#eab308" },
    low:      { label: "Low",         color: "#3b82f6" },
    informational:     { label: "Info",        color: "#64748b" },
} as const

// 2. Data Processing
const chartData = computed(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }

    props.vulnerabilities.forEach(v => {
        let severity = (v.severity || 'info').trim().toLowerCase()
        if (!(severity in counts)) severity = 'info'
        counts[severity]++
    })

    return Object.entries(counts)
        .map(([key, value]) => ({
            severity: key,
            count: value,
            fill: chartConfig[key.toLowerCase()]?.color
        }))
        .filter(item => item.count > 0)
})

console.log(chartData);

const totalVulns = computed(() => props.vulnerabilities.length)

// 3. Interactivity State
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
        // Capitalize the severity key for the label
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
        <CardContent class="flex-1 pb-0">
            <ChartContainer
                :config="chartConfig"
                class="mx-auto aspect-square max-h-[350px]"
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
        </CardContent>
    </Card>
</template>
