<script setup lang="ts">
import { computed } from 'vue';
import BasePlotlyChart from './BasePlotlyChart.vue';
import { SEVERITY_COLORS } from '@/lib/colors';

const props = defineProps<{
    // Now accepts the array of objects we built in Python
    data: Array<{
        type: string;
        Critical: number;
        High: number;
        Medium: number;
        Low: number;
        Informational: number;
    }>;
}>();

const chartData = computed(() => {
    // We reverse the array so the highest total volume appears at the TOP of the chart
    const sortedData = [...props.data].reverse();
    const categories = sortedData.map(d => d.type);

    // Helper to build a trace for one severity level
    const buildTrace = (severity: string, color: string) => ({
        x: sortedData.map(d => d[severity as keyof typeof d]),
        y: categories,
        name: severity,
        type: 'bar',
        orientation: 'h',
        marker: { color: color },
        hoverinfo: 'x+name'
    });

    return [
        buildTrace('Informational', SEVERITY_COLORS.informational),
        buildTrace('Low', SEVERITY_COLORS.low),
        buildTrace('Medium', SEVERITY_COLORS.medium),
        buildTrace('High', SEVERITY_COLORS.high),
        buildTrace('Critical', SEVERITY_COLORS.critical),
    ];
});

const layout = {
    title: { text: 'Risk by Type (Severity Stack)', font: { size: 14 } },
    margin: { t: 30, r: 20, l: 220, b: 40 }, // Wide left margin for names
    barmode: 'stack', // STACKED BAR MAGIC
    xaxis: { title: 'Count' },
    yaxis: { title: '' },
    bargap: 0.2,
    showlegend: true,
    legend: { orientation: 'h', y: -0.2 } // Legend at bottom
};
</script>

<template>
    <BasePlotlyChart :data="chartData" :layout="layout" />
</template>
