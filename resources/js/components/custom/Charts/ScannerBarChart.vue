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
import { SEVERITY_CHART_CONFIG } from '@/lib/colors'

const props = defineProps({
    vulnerabilities: {
        type: Array as () => Record<string, any>[],
        default: () => []
    },
    // Add scanType prop to know if it's a full scan
    scanType: {
        type: String,
        default: 'basic'
    }
})

// 1. Define the metrics we want to toggle between (now includes informational)
const severities = ['total', 'critical', 'high', 'medium', 'low', 'informational'] as const
type SeverityKey = typeof severities[number]

// 2. Use centralized color configuration
const chartConfig = SEVERITY_CHART_CONFIG

const activeChart = ref<SeverityKey>("total")

// 3. Process the raw vulnerability list into a structured format for the chart
// Result format: [{ scanner: 'ZAP', total: 15, critical: 2, high: 5, ... informational: 1 }, ...]
const normalizeScanner = (raw: string): string => {
    const map: Record<string, string> = {
        'zap': 'ZAP',
        'wapiti': 'Wapiti', 
        'nuclei': 'Nuclei',
    }
    return map[raw.toLowerCase()] ?? raw
}

const chartData = computed(() => {
    const map = new Map<string, Record<SeverityKey, number>>()

    // Initialize with all expected scanners for full scans (even if they found nothing)
    if (props.scanType.toLowerCase().includes('full')) {
        const defaultScanners = ['Nuclei', 'ZAP', 'Wapiti']
        defaultScanners.forEach(scanner => {
            map.set(scanner, {
                total: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                informational: 0
            })
        })
    } else {
        // For basic scans, ensure Wapiti is present
        map.set('Wapiti', {
            total: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            informational: 0
        })
    }

    // Process actual vulnerabilities
    props.vulnerabilities.forEach(v => {
        const scanner = normalizeScanner(v.scanner || 'Unknown')
        const severity = (v.severity || 'informational').toLowerCase() as SeverityKey

        if (!map.has(scanner)) {
            map.set(scanner, {
                total: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                informational: 0
            })
        }

        const entry = map.get(scanner)!
        entry.total += 1

        // Safety check in case a severity isn't one of our standard keys
        if (severity in entry && severity !== 'total') {
            entry[severity] += 1
        } else if (severity !== 'total') {
            // If unknown severity, count as informational
            entry.informational += 1
        }
    })

    // Convert map to array and sort by Total desc, but keep expected scanners even if 0
    return Array.from(map.entries())
        .map(([scanner, counts]) => ({ scanner, ...counts }))
        .sort((a, b) => {
            // Sort by total, but keep order consistent for 0-count scanners
            if (a.total === 0 && b.total === 0) {
                // If both are 0, maintain alphabetical order
                return a.scanner.localeCompare(b.scanner)
            }
            return b.total - a.total
        })
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
        <CardHeader class="flex flex-col gap-4 pb-4">
            <div class="flex flex-col gap-1">
                <CardTitle>Scanner Findings</CardTitle>
                <CardDescription>
                    Distribution of vulnerabilities detected by each scanner
                </CardDescription>
            </div>

            <!-- Compact Filter Buttons -->
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="key in severities"
                    :key="key"
                    :data-active="activeChart === key"
                    class="data-[active=true]:ring-2 data-[active=true]:ring-offset-1 flex items-center gap-2 px-3 py-2 rounded-md border bg-card hover:bg-muted/50 transition-all"
                    :class="{ 'ring-offset-background': activeChart === key }"
                    :style="{
                        'ring-color': activeChart === key ? chartConfig[key].color : undefined
                    }"
                    @click="activeChart = key"
                >
                    <span
                        class="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                        :style="{ backgroundColor: chartConfig[key].color }"
                    />
                    <span class="text-xs font-medium capitalize whitespace-nowrap">
                        {{ chartConfig[key].label }}
                    </span>
                    <span class="text-sm font-bold ml-1">
                        {{ totals[key] }}
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
