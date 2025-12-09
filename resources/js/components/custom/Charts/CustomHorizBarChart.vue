<script setup lang="ts">
import { computed } from 'vue'
import { SEVERITY_COLORS } from '@/lib/colors'

const props = defineProps<{
    data: any[]
}>()

// Format data for display
const chartData = computed(() => {
    if (!props.data || props.data.length === 0) return []

    return props.data.map(item => ({
        name: item.name || 'Unknown',
        low: Number(item.low || 0),
        medium: Number(item.medium || 0),
        high: Number(item.high || 0),
        critical: Number(item.critical || 0),
        total: Number(item.total || 0)
    }))
})

// Find max value for scaling
const maxValue = computed(() => {
    if (!chartData.value.length) return 0
    return Math.max(...chartData.value.map(d => d.total))
})

// Calculate bar widths as percentages
const getBarWidth = (value: number) => {
    if (maxValue.value === 0) return '0%'
    return `${(value / maxValue.value) * 100}%`
}

// Truncate long names
const truncateName = (name: string, maxLen: number = 30) => {
    return name.length > maxLen ? name.substring(0, maxLen - 3) + '...' : name
}
</script>

<template>
    <div class="w-full space-y-4">
        <div v-for="(item, idx) in chartData" :key="idx" class="space-y-1">
            <div class="flex justify-between text-sm">
                <span class="font-medium truncate" :title="item.name">{{ truncateName(item.name) }}</span>
                <span class="text-muted-foreground">{{ item.total }}</span>
            </div>

            <div class="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                <div v-if="item.critical > 0"
                     class="h-full"
                     :style="{ width: getBarWidth(item.critical), backgroundColor: SEVERITY_COLORS.critical }">
                </div>
                <div v-if="item.high > 0"
                     class="h-full"
                     :style="{ width: getBarWidth(item.high), backgroundColor: SEVERITY_COLORS.high }">
                </div>
                <div v-if="item.medium > 0"
                     class="h-full"
                     :style="{ width: getBarWidth(item.medium), backgroundColor: SEVERITY_COLORS.medium }">
                </div>
                <div v-if="item.low > 0"
                     class="h-full"
                     :style="{ width: getBarWidth(item.low), backgroundColor: SEVERITY_COLORS.low }">
                </div>
            </div>
        </div>

        <div class="flex items-center justify-end gap-3 text-xs text-muted-foreground pt-2">
            <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" :style="{background: SEVERITY_COLORS.critical}"></div>Critical</div>
            <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" :style="{background: SEVERITY_COLORS.high}"></div>High</div>
            <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" :style="{background: SEVERITY_COLORS.medium}"></div>Medium</div>
            <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" :style="{background: SEVERITY_COLORS.low}"></div>Low</div>
        </div>
    </div>
</template>
