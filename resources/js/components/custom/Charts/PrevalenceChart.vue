<script setup lang="ts">
import { computed } from 'vue';
import BasePlotlyChart from './BasePlotlyChart.vue';

const props = defineProps<{
    data: Record<string, number>; // { "SQL Injection": 45.5, "XSS": 20.0 }
}>();

const chartData = computed(() => {
    // Sort ascending for horizontal bar (Top item appears at top)
    const sortedEntries = Object.entries(props.data).sort((a, b) => a[1] - b[1]);
    const categories = sortedEntries.map(e => e[0]);
    const values = sortedEntries.map(e => e[1]);

    return [{
        x: values,
        y: categories,
        type: 'bar',
        orientation: 'h',
        text: values.map(v => `${v}%`),
        textposition: 'auto',
        marker: {
            // Highlight widespread issues (>50% prevalence) in Red
            color: values.map(v => v > 50 ? '#ef4444' : '#3b82f6'),
            opacity: 0.8
        },
        hoverinfo: 'y+x'
    }];
});

const layout = {
    title: { text: 'Systemic Risk (Prevalence)', font: { size: 14 } },
    margin: { t: 30, r: 20, l: 220, b: 40 }, // Extra left margin for labels
    xaxis: {
        title: '% of Targets Affected',
        range: [0, 100],
        dtick: 20
    },
    yaxis: { title: '' },
    bargap: 0.2,
    showlegend: false
};
</script>

<template>
    <BasePlotlyChart :data="chartData" :layout="layout" />
</template>
