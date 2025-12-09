<script setup lang="ts">
import { VisXYContainer, VisLine, VisAxis, VisScatter, VisCrosshair } from '@unovis/vue'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegendContent, componentToString, type ChartConfig } from '@/components/ui/chart'

const props = defineProps<{
    data: any[]
}>()

const x = (d: any) => new Date(d.date).getTime()
const yReal = (d: any) => d.value
const yReg = (d: any) => d.regression

const tickFormat = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Chart config for tooltip
const chartConfig = {
    value: {
        label: 'Vulnerabilities',
        color: '#3b82f6'
    },
    regression: {
        label: 'Trend Line',
        color: '#94a3b8'
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
        <div class="flex min-w-[180px] flex-col gap-2 rounded-lg border bg-background p-2.5 text-xs shadow-xl">
            <div class="flex items-center gap-1.5 font-medium leading-none">${date}</div>
            <div class="grid gap-1.5">
                <div class="flex items-center gap-2">
                    <div class="h-2.5 w-2.5 shrink-0 rounded-[2px]" style="background-color: #3b82f6"></div>
                    <div class="flex flex-1 items-center justify-between gap-2 leading-none">
                        <span class="text-muted-foreground">Vulnerabilities</span>
                        <span class="font-mono font-medium tabular-nums text-foreground">${d.value}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="h-2.5 w-2.5 shrink-0 rounded-[2px]" style="background-color: #94a3b8"></div>
                    <div class="flex flex-1 items-center justify-between gap-2 leading-none">
                        <span class="text-muted-foreground">Trend Line</span>
                        <span class="font-mono font-medium tabular-nums text-foreground">${Math.round(d.regression * 10) / 10}</span>
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
                <!-- Actual line with scatter points -->
                <VisLine :x="x" :y="yReal" color="#3b82f6" :strokeWidth="2" />
                <VisScatter :x="x" :y="yReal" color="#3b82f6" :size="6" />

                <!-- Trend line (dashed) -->
                <VisLine
                    :x="x"
                    :y="yReg"
                    color="#94a3b8"
                    :strokeWidth="2"
                    strokeDasharray="5, 5"
                />

                <VisAxis type="x" :tickFormat="tickFormat" :tick-line="false" :grid-line="false" />
                <VisAxis type="y" :grid-line="true" :tick-line="false" :domain-line="false" />

                <ChartTooltip />
                <VisCrosshair
                    :template="tooltipTemplate"
                    :color="['#3b82f6', '#94a3b8']"
                />
            </VisXYContainer>
            <ChartLegendContent class="justify-center pt-4" />
        </ChartContainer>
    </div>
</template>
