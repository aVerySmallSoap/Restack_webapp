<script setup lang="ts">
import { computed, ref } from 'vue'
import { VisAxis, VisGroupedBar, VisXYContainer } from "@unovis/vue"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartCrosshair,
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

// 1. Define the metrics we want to toggle between
const severities = ['total', 'critical', 'high', 'medium', 'low'] as const
type SeverityKey = typeof severities[number]

// 2. Configuration for colors and labels
const chartConfig = {
    total:    { label: "Total Found", color: "#3b82f6" }, // Blue
    critical: { label: "Critical",    color: "#ef4444" }, // Red
    high:     { label: "High",        color: "#f97316" }, // Orange
    medium:   { label: "Medium",      color: "#eab308" }, // Yellow
    low:      { label: "Low",         color: "#22c55e" }, // Green
}

const activeChart = ref<SeverityKey>("total")

// 3. Process the raw vulnerability list into a structured format for the chart
// Result format: [{ scanner: 'ZAP', total: 15, critical: 2, high: 5 ... }, ...]
const chartData = computed(() => {
    const map = new Map<string, Record<SeverityKey, number>>()

    props.vulnerabilities.forEach(v => {
        const scanner = v.scanner || 'Unknown'
        const severity = (v.severity || 'low').toLowerCase() as SeverityKey

        if (!map.has(scanner)) {
            map.set(scanner, { total: 0, critical: 0, high: 0, medium: 0, low: 0 })
        }

        const entry = map.get(scanner)!
        entry.total += 1

        // Safety check in case a severity isn't one of our standard keys
        if (severity in entry) {
            entry[severity] += 1
        }
    })

    // Convert map to array and sort by Total desc
    return Array.from(map.entries())
        .map(([scanner, counts]) => ({ scanner, ...counts }))
        .sort((a, b) => b.total - a.total)
})

// 4. Calculate grand totals for the header buttons
const totals = computed(() => {
    return severities.reduce((acc, key) => {
        acc[key] = chartData.value.reduce((sum, item) => sum + item[key], 0)
        return acc
    }, {} as Record<SeverityKey, number>)
})

type Data = typeof chartData.value[number]
</script>

<template>
    <Card class="w-full">
        <CardHeader class="flex flex-col items-stretch border-b !p-0 sm:flex-row">
            <div class="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                <CardTitle>Scanner Findings</CardTitle>
                <CardDescription>
                    Distribution of vulnerabilities detected by each scanner
                </CardDescription>
            </div>
            <div class="flex flex-wrap">
                <button
                    v-for="key in severities"
                    :key="key"
                    :data-active="activeChart === key"
                    class="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-6 min-w-[80px]"
                    @click="activeChart = key"
                >
          <span class="text-xs text-muted-foreground capitalize">
            {{ chartConfig[key].label }}
          </span>
                    <span class="text-lg font-bold leading-none sm:text-2xl">
            {{ totals[key].toLocaleString() }}
          </span>
                </button>
            </div>
        </CardHeader>

        <CardContent class="px-2 sm:p-6">
            <ChartContainer :config="chartConfig" class="aspect-auto h-[250px] w-full" cursor>
                <VisXYContainer
                    :data="chartData"
                    :margin="{ left: 5, right: 5 }"
                    :y-domain="[0, undefined]"
                >
                    <VisGroupedBar
                        :x="(d: Data, i: number) => i"
                        :y="(d: Data) => d[activeChart]"
                        :color="chartConfig[activeChart].color"
                        :bar-padding="0.2"
                        :rounded-corners="4"
                    />

                    <VisAxis
                        type="x"
                        :tick-format="(i: number) => chartData[i]?.scanner"
                        :tick-line="false"
                        :grid-line="false"
                        tick-text-color="hsl(var(--vis-text-color))"
                    />

                    <VisAxis
                        type="y"
                        :tick-line="false"
                        :grid-line="false"
                        :num-ticks="3"
                        tick-text-color="hsl(var(--vis-text-color))"
                    />

                    <ChartTooltip />

                    <ChartCrosshair
                        :template="componentToString(chartConfig, ChartTooltipContent, {
               labelFormatter: (d, i) => chartData[i]?.scanner
            })"
                    />
                </VisXYContainer>
            </ChartContainer>
        </CardContent>
    </Card>
</template>
