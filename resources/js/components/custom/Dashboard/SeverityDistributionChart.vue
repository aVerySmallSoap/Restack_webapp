<script setup lang="ts">
import { DonutChart } from '@/components/ui/chart-donut'
import type { PropType } from 'vue'

// Define the data structure
type DistributionData = {
    severity: string
    count: number
}

defineProps({
    data: {
        type: Array as PropType<DistributionData[]>,
        required: true,
    },
})
</script>

<template>
    <DonutChart
        class="h-[250px]"
        :data="data"
        index="severity"
        category="count"
        :colors="['hsl(var(--destructive))', 'hsl(var(--orange-500))', 'hsl(var(--yellow-500))', 'hsl(var(--muted-foreground))']"
        :value-formatter="(value: number) => `${value}`"
    />
</template>
