<script setup lang="ts">
import { VisSingleContainer, VisDonut, VisTooltip } from '@unovis/vue'
import { Donut } from '@unovis/ts' // <--- Import Core Class
import { defineProps } from 'vue'

const props = defineProps<{
    data: { name: string; value: number }[]
}>()

const value = (d: any) => d.value

// Standard Severity Colors
const colorMap: Record<string, string> = {
    critical: '#dc2626', // red-600
    high: '#ea580c',     // orange-600
    medium: '#fbbf24',   // amber-400
    low: '#3b82f6',      // blue-500
    informational: '#94a3b8' // slate-400
}

const color = (d: any) => colorMap[d.name.toLowerCase()] || '#cbd5e1'

// Use Donut.selectors.segment instead of VisDonut.selectors.segment
const triggers = {
    [Donut.selectors.segment]: (d: any) =>
        `<div class="p-2 text-sm font-medium bg-background border rounded shadow-sm">${d.data.name}: ${d.data.value}</div>`
}
</script>

<template>
    <div class="flex flex-col md:flex-row items-center h-[300px] w-full">
        <div class="flex-1 h-full w-full relative">
            <VisSingleContainer :data="data" :height="300">
                <VisDonut :value="value" :color="color" :arcWidth="40" />
                <VisTooltip :triggers="triggers" />
            </VisSingleContainer>
        </div>

        <div class="w-full md:w-40 flex flex-col gap-2 p-4">
            <div v-for="item in data" :key="item.name" class="flex items-center gap-2 text-sm">
        <span
            class="w-3 h-3 rounded-full flex-shrink-0"
            :style="{ backgroundColor: colorMap[item.name.toLowerCase()] || '#ccc' }"
        ></span>
                <span class="capitalize text-slate-700 dark:text-slate-200 truncate">{{ item.name }}</span>
                <span class="ml-auto font-bold">{{ item.value }}</span>
            </div>
        </div>
    </div>
</template>
