<script setup lang="ts">
import { computed } from 'vue';
import BasePlotlyChart from './BasePlotlyChart.vue';
import { SEVERITY_COLORS } from '@/lib/colors';

// FIX: Update props to accept pre-calculated stats instead of raw arrays
const props = defineProps<{
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    mean?: number;
    sd?: number;
}>();

const chartData = computed(() => [
    {
        type: 'box',
        name: 'Findings per Scan',
        // Plotly format for pre-computed box plots
        q1: [props.q1],
        median: [props.median],
        q3: [props.q3],
        lowerfence: [props.min],
        upperfence: [props.max],
        mean: [props.mean],
        sd: [props.sd],
        marker: { color: SEVERITY_COLORS.total },
        fillcolor: 'rgba(100, 116, 139, 0.2)', // Slate-500 transparent
        line: { width: 1.5 },
        boxpoints: false // We don't have the raw points to show outliers here
    }
]);

const layout = {
    title: { text: 'Statistical Spread (IQR)', font: { size: 14 } },
    margin: { t: 30, r: 20, l: 40, b: 40 },
    showlegend: false,
    yaxis: {
        title: 'Findings Count',
        zeroline: true
    }
};
</script>

<template>
    <BasePlotlyChart :data="chartData" :layout="layout" />
</template>
