<script setup lang="ts">
import { computed, ref } from 'vue'
import { Donut } from '@unovis/ts'
import { VisDonut, VisSingleContainer } from '@unovis/vue'
import { ChartContainer } from '@/components/ui/chart'
import { SEVERITY_COLORS, SEVERITY_CHART_CONFIG } from '@/lib/colors'

const props = defineProps<{
    data: { name: string; value: number }[]
}>()

// Use centralized chart config for consistency
const chartConfig = SEVERITY_CHART_CONFIG

// Map data to chart format with colors
const chartData = computed(() => {
    return props.data.map(item => ({
        name: item.name.toLowerCase(),
        value: item.value,
        fill: SEVERITY_COLORS[item.name.toLowerCase() as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.informational
    }))
})

// Calculate total for center label
const total = computed(() => {
    return props.data.reduce((sum, item) => sum + item.value, 0)
})

// Interactivity State
const activeSegmentKey = ref<string | null>(null)

// Dynamic labels based on selection
const centralLabel = computed(() => {
    if (activeSegmentKey.value) {
        const segment = chartData.value.find(d => d.name === activeSegmentKey.value)
        return segment ? segment.value.toLocaleString() : '0'
    }
    return total.value.toLocaleString()
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
    <div class="flex flex-col h-full w-full">
        <!-- Chart -->
        <ChartContainer
            :config="chartConfig"
            class="mx-auto aspect-square max-h-[300px] w-full"
        >
            <VisSingleContainer
                :data="chartData"
                :margin="{ top: 20, bottom: 20 }"
            >
                <VisDonut
                    :value="(d: Data) => d.value"
                    :color="(d: Data) => d.fill"
                    :arc-width="40"
                    :central-label="centralLabel"
                    :central-sub-label="centralSubLabel"
                    :events="{
                        [Donut.selectors.segment]: {
                            click: (d: Data, ev: PointerEvent, i: number, elements: HTMLElement[]) => {
                                const clickedKey = d.data.name
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

        <!-- Legend - Styled like SeverityPieChart -->
        <div class="mt-6 space-y-2 px-4">
            <div
                v-for="item in chartData"
                :key="item.name"
                class="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-all"
                :class="{ 'opacity-50': activeSegmentKey && activeSegmentKey !== item.name }"
                @click="activeSegmentKey = activeSegmentKey === item.name ? null : item.name"
            >
                <!-- Color indicator (square like SeverityPieChart) -->
                <div
                    class="h-3 w-3 rounded-sm shrink-0"
                    :style="{ backgroundColor: item.fill }"
                />
                <!-- Name (capitalized, flex-1 to push count right) -->
                <span class="font-medium capitalize flex-1">{{ item.name }}</span>
                <!-- Count (right-aligned, tabular nums) -->
                <span class="text-muted-foreground font-mono text-xs tabular-nums">{{ item.value }}</span>
            </div>
        </div>
    </div>
</template>
