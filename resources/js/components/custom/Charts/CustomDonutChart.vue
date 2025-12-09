<script setup lang="ts">
import { VisSingleContainer, VisDonut, VisTooltip } from '@unovis/vue'
import { Donut } from '@unovis/ts'
import { computed } from 'vue'
import { SEVERITY_COLORS } from '@/lib/colors'

const props = defineProps<{
    data: { name: string; value: number }[]
}>()

const value = (d: any) => d.value

// Use centralized colors
const color = (d: any) => {
    const key = d.name.toLowerCase()
    return SEVERITY_COLORS[key as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.informational
}

const triggers = {
    [Donut.selectors.segment]: (d: any) =>
        `<div class="p-2 text-sm font-medium bg-background border rounded shadow-sm flex items-center gap-2">
            <span class="w-2 h-2 rounded-full" style="background-color: ${color(d.data)}"></span>
            <span>${d.data.name}: ${d.data.value}</span>
        </div>`
}

// Calculate total for center label
const total = computed(() => {
    return props.data.reduce((sum, item) => sum + item.value, 0)
})

// Center label configuration
const centralLabel = computed(() => total.value.toString())
const centralSubLabel = 'Total'
</script>

<template>
    <div class="flex flex-col md:flex-row items-center h-[300px] w-full">
        <div class="flex-1 h-full w-full relative">
            <VisSingleContainer :data="data" :height="300">
                <VisDonut
                    :value="value"
                    :color="color"
                    :arcWidth="40"
                    :central-label="centralLabel"
                    :central-sub-label="centralSubLabel"
                />
                <VisTooltip :triggers="triggers" />
            </VisSingleContainer>
        </div>

        <div class="w-full md:w-40 flex flex-col gap-2 p-4">
            <div v-for="item in data" :key="item.name" class="flex items-center gap-2 text-sm">
                <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: color({ name: item.name }) }"></div>
                <span class="font-medium text-muted-foreground">{{ item.name }}</span>
                <span class="ml-auto font-bold">{{ item.value }}</span>
            </div>
        </div>
    </div>
</template>
