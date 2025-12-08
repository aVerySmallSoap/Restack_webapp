<script setup lang="ts">
import { computed } from 'vue'

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

// Color map
const colors = {
    low: '#3b82f6',
    medium: '#fbbf24',
    high: '#ea580c',
    critical: '#dc2626'
}

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
    <div v-if="!chartData || chartData.length === 0" class="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
        <p>No vulnerability type data available</p>
    </div>
    <div v-else class="space-y-4">
        <!-- Chart Bars -->
        <div class="space-y-3">
            <div v-for="item in chartData" :key="item.name" class="space-y-1">
                <!-- Label -->
                <div class="flex items-center justify-between text-sm">
                    <span class="font-medium truncate pr-2" :title="item.name">
                        {{ truncateName(item.name) }}
                    </span>
                    <span class="text-muted-foreground text-xs">{{ item.total }}</span>
                </div>

                <!-- Stacked Bar -->
                <div class="flex h-8 w-full bg-muted rounded-md overflow-hidden">
                    <!-- Low -->
                    <div
                        v-if="item.low > 0"
                        :style="{
                            width: getBarWidth(item.low),
                            backgroundColor: colors.low
                        }"
                        class="flex items-center justify-center text-xs text-white font-medium transition-all hover:opacity-80"
                        :title="`Low: ${item.low}`"
                    >
                        <span v-if="item.low > 0" class="px-1">{{ item.low }}</span>
                    </div>

                    <!-- Medium -->
                    <div
                        v-if="item.medium > 0"
                        :style="{
                            width: getBarWidth(item.medium),
                            backgroundColor: colors.medium
                        }"
                        class="flex items-center justify-center text-xs text-white font-medium transition-all hover:opacity-80"
                        :title="`Medium: ${item.medium}`"
                    >
                        <span v-if="item.medium > 0" class="px-1">{{ item.medium }}</span>
                    </div>

                    <!-- High -->
                    <div
                        v-if="item.high > 0"
                        :style="{
                            width: getBarWidth(item.high),
                            backgroundColor: colors.high
                        }"
                        class="flex items-center justify-center text-xs text-white font-medium transition-all hover:opacity-80"
                        :title="`High: ${item.high}`"
                    >
                        <span v-if="item.high > 0" class="px-1">{{ item.high }}</span>
                    </div>

                    <!-- Critical -->
                    <div
                        v-if="item.critical > 0"
                        :style="{
                            width: getBarWidth(item.critical),
                            backgroundColor: colors.critical
                        }"
                        class="flex items-center justify-center text-xs text-white font-medium transition-all hover:opacity-80"
                        :title="`Critical: ${item.critical}`"
                    >
                        <span v-if="item.critical > 0" class="px-1">{{ item.critical }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Legend -->
        <div class="flex items-center justify-center gap-4 pt-4 border-t text-xs">
            <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded" :style="{ backgroundColor: colors.low }"></div>
                <span>Low</span>
            </div>
            <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded" :style="{ backgroundColor: colors.medium }"></div>
                <span>Medium</span>
            </div>
            <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded" :style="{ backgroundColor: colors.high }"></div>
                <span>High</span>
            </div>
            <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded" :style="{ backgroundColor: colors.critical }"></div>
                <span>Critical</span>
            </div>
        </div>
    </div>
</template>
