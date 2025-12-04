<script setup lang="ts">
import { computed } from 'vue'
import { VisXYContainer, VisGroupedBar, VisAxis, VisTooltip, VisBulletLegend } from '@unovis/vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Percent, Activity, Trophy } from 'lucide-vue-next'

// Mocking the structure from scanner_effectiveness.py
interface ScannerMetrics {
    total_detections: number
    unique_vulnerability_types: number
    average_severity_score: number
    confidence_distribution: Record<string, number>
}

interface ComparisonResponse {
    period_days: number
    scanner_comparison: Record<string, ScannerMetrics>
    overlap_metrics: {
        full_scans_analyzed: number
        average_overlap: number
    }
    recommendation: string
}

const props = defineProps<{
    data?: ComparisonResponse
}>()

// --- Mock Data ---
const mockData: ComparisonResponse = {
    period_days: 30,
    scanner_comparison: {
        wapiti: {
            total_detections: 145,
            unique_vulnerability_types: 12,
            average_severity_score: 2.1,
            confidence_distribution: { High: 100, Low: 45 }
        },
        zap: {
            total_detections: 210,
            unique_vulnerability_types: 18,
            average_severity_score: 1.8,
            confidence_distribution: { High: 150, Medium: 40, Low: 20 }
        }
    },
    overlap_metrics: {
        full_scans_analyzed: 8,
        average_overlap: 4.5
    },
    recommendation: "zap"
}

const actualData = computed(() => props.data || mockData)

// Prepare Data for Chart
// We want to compare Total Detections vs Unique Types for each scanner
const chartData = computed(() => {
    return Object.entries(actualData.value.scanner_comparison).map(([scanner, metrics]) => ({
        scanner: scanner.toUpperCase(),
        total: metrics.total_detections,
        unique: metrics.unique_vulnerability_types
    }))
})

const chartConfig = {
    total: { label: 'Total Findings', color: '#8b5cf6' }, // Violet
    unique: { label: 'Unique Types', color: '#10b981' }   // Emerald
}

const getWinner = computed(() => {
    return actualData.value.recommendation.toUpperCase()
})
</script>

<template>
    <Card class="flex flex-col h-full">
        <CardHeader>
            <div class="flex justify-between items-start">
                <div>
                    <CardTitle>Scanner Effectiveness</CardTitle>
                    <CardDescription>Performance comparison (Last {{ actualData.period_days }} Days)</CardDescription>
                </div>
                <Badge variant="outline" class="flex gap-1 items-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">
                    <Trophy class="h-3 w-3" />
                    Winner: {{ getWinner }}
                </Badge>
            </div>
        </CardHeader>

        <CardContent class="flex-1 space-y-6">
            <div class="grid grid-cols-2 gap-4">
                <div class="rounded-lg border p-3 bg-muted/20">
                    <div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Activity class="h-4 w-4" /> Avg Overlap
                    </div>
                    <div class="text-2xl font-bold">
                        {{ actualData.overlap_metrics.average_overlap.toFixed(1) }}
                    </div>
                    <div class="text-xs text-muted-foreground">findings shared per scan</div>
                </div>
                <div class="rounded-lg border p-3 bg-muted/20">
                    <div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Percent class="h-4 w-4" /> Coverage
                    </div>
                    <div class="text-2xl font-bold">
                        {{ actualData.overlap_metrics.full_scans_analyzed }}
                    </div>
                    <div class="text-xs text-muted-foreground">full scans analyzed</div>
                </div>
            </div>

            <div class="h-[200px] w-full">
                <ChartContainer :config="chartConfig" class="h-full w-full">
                    <VisXYContainer
                        :data="chartData"
                        :margin="{ top: 10, right: 10, bottom: 25, left: 0 }"
                        :y-domain="[0, undefined]"
                    >
                        <VisGroupedBar
                            :x="(d, i) => i"
                            :y="[(d) => d.total, (d) => d.unique]"
                            :color="[chartConfig.total.color, chartConfig.unique.color]"
                            :rounded-corners="4"
                            :bar-padding="0.2"
                        />
                        <VisAxis
                            type="x"
                            :tick-format="(i) => chartData[i]?.scanner"
                            :grid-line="false"
                        />
                        <VisAxis type="y" :num-ticks="4" :grid-line="false" />
                        <VisTooltip />
                    </VisXYContainer>
                </ChartContainer>
                <div class="flex justify-center mt-2">
                    <div class="flex gap-4 text-xs">
                        <div class="flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full" :style="{ background: chartConfig.total.color }"></span>
                            Total Findings
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full" :style="{ background: chartConfig.unique.color }"></span>
                            Unique Types
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
