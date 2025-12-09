<script setup lang="ts">
import { VisXYContainer, VisArea, VisLine, VisAxis, VisCrosshair } from '@unovis/vue'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegendContent, componentToString, type ChartConfig } from '@/components/ui/chart'

const props = defineProps<{
    data: any[]
}>()

const x = (d: any) => new Date(d.date).getTime()
const y = (d: any) => d.Total

// Gradient ID
const gradientId = 'area-gradient'

const tickFormat = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Chart config for tooltip
const chartConfig = {
    Total: {
        label: 'Total Vulnerabilities',
        color: '#ef4444'
    }
} satisfies ChartConfig

// Custom template that handles the data properly
const tooltipTemplate = (d: any) => {
    if (!d) return ''

    const date = new Date(d.date).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })

    return `
        <div class="flex min-w-[130px] flex-col gap-2 rounded-lg border bg-background p-2.5 text-xs shadow-xl">
            <div class="flex items-center gap-1.5 font-medium leading-none">${date}</div>
            <div class="grid gap-1.5">
                <div class="flex items-center gap-2">
                    <div class="h-2.5 w-2.5 shrink-0 rounded-[2px]" style="background-color: #ef4444"></div>
                    <div class="flex flex-1 items-center justify-between gap-2 leading-none">
                        <span class="text-muted-foreground">Total Vulnerabilities</span>
                        <span class="font-mono font-medium tabular-nums text-foreground">${d.Total}</span>
                    </div>
                </div>
            </div>
        </div>
    `
}
</script>

<template>
    <div class="h-[300px] w-full">
        <ChartContainer :config="chartConfig" class="h-full w-full">
            <VisXYContainer :data="data" :height="300" :margin="{ top: 20, right: 20, bottom: 40, left: 40 }">
                <svg height="0" width="0" class="absolute">
                    <defs>
                        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#ef4444" stop-opacity="0.4" />
                            <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
                        </linearGradient>
                    </defs>
                </svg>

                <VisArea :x="x" :y="y" :fill="`url(#${gradientId})`" />
                <VisLine :x="x" :y="y" color="#ef4444" :strokeWidth="2" />
                <VisAxis type="x" :tickFormat="tickFormat" :tick-line="false" :grid-line="false" />
                <VisAxis type="y" :grid-line="true" :tick-line="false" :domain-line="false" />

                <ChartTooltip />
                <VisCrosshair
                    :template="tooltipTemplate"
                    color="#ef4444"
                />
            </VisXYContainer>
            <ChartLegendContent class="justify-center pt-4" />
        </ChartContainer>
    </div>
</template>
