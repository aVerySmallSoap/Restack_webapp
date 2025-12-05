<script setup lang="ts">
import { computed } from 'vue';
import BasePlotlyChart from './BasePlotlyChart.vue';
import { getSeverityColor } from '@/lib/colors';

// FIX: Accept 'data' object instead of separate arrays
const props = defineProps<{
    data: Record<string, number>;
}>();

const chartData = computed(() => {
    // Extract keys/values from the object dynamically
    const categories = Object.keys(props.data);
    const values = Object.values(props.data);

    return [{
        x: categories,
        y: values,
        type: 'bar',
        text: values.map(String),
        textposition: 'auto',
        marker: {
            color: categories.map(c => getSeverityColor(c))
        },
        hoverinfo: 'x+y'
    }];
});

const layout = {
    title: { text: 'Severity Distribution', font: { size: 14 } },
    margin: { t: 30, r: 20, l: 40, b: 40 },
    xaxis: { title: 'Severity' },
    yaxis: { title: 'Count' },
    bargap: 0.2,
    showlegend: false
};
</script>

<template>
    <BasePlotlyChart :data="chartData" :layout="layout" />
</template>
