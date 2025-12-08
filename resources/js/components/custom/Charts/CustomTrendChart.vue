<script setup lang="ts">
import { VisXYContainer, VisLine, VisAxis, VisScatter, VisTooltip } from '@unovis/vue'
import { Scatter } from '@unovis/ts' // <--- Import Core Class
import { defineProps } from 'vue'

const props = defineProps<{
    data: any[]
}>()

const x = (d: any) => new Date(d.date).getTime()
const yReal = (d: any) => d.value
const yReg = (d: any) => d.regression

const tickFormat = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Use Scatter.selectors.point instead of VisScatter.selectors.point
const tooltipTriggers = {
    [Scatter.selectors.point]: (d: any) => `
    <div class="p-2 bg-background border rounded shadow-sm text-sm">
      <div class="font-bold">${new Date(d.date).toLocaleDateString()}</div>
      <div>Actual: ${d.value}</div>
      <div>Trend: ${Math.round(d.regression * 10) / 10}</div>
    </div>
  `
}
</script>

<template>
    <div class="h-[300px] w-full">
        <VisXYContainer :data="data" :height="300" :margin="{ top: 20, right: 20, bottom: 20, left: 20 }">
            <VisLine :x="x" :y="yReal" color="#3b82f6" :strokeWidth="2" />
            <VisScatter :x="x" :y="yReal" color="#3b82f6" :size="6" />

            <VisLine
                :x="x"
                :y="yReg"
                color="#94a3b8"
                :strokeWidth="2"
                strokeDasharray="5, 5"
            />

            <VisAxis type="x" :tickFormat="tickFormat" />
            <VisAxis type="y" />
            <VisTooltip :triggers="tooltipTriggers" />
        </VisXYContainer>
    </div>
</template>
