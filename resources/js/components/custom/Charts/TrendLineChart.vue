<script setup lang="ts">
import { computed } from 'vue';
import BasePlotlyChart from './BasePlotlyChart.vue';
import { SEVERITY_COLORS } from '@/lib/colors';

// FIX: Define the interface locally or import it
interface TimeSeriesPoint {
    date: string;
    count: number;
}

// FIX: Props must match what DomainDashboard passes (:data, :trendMean)
const props = defineProps<{
    data: TimeSeriesPoint[];
    trendMean?: number;
}>();

const chartData = computed(() => {
    // Extract arrays for Plotly
    const dates = props.data.map(d => d.date);
    const counts = props.data.map(d => d.count);

    const traces: any[] = [
        {
            x: dates,
            y: counts,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Total Vulnerabilities',
            line: { color: SEVERITY_COLORS.informational, width: 3 },
            fill: 'tozeroy',
            fillcolor: `${SEVERITY_COLORS.informational}1A` // ~10% opacity
        }
    ];

    // Add Mean Line if provided
    if (props.trendMean) {
        traces.push({
            x: [dates[0], dates[dates.length - 1]], // Span from start to end
            y: [props.trendMean, props.trendMean],
            type: 'scatter',
            mode: 'lines',
            name: 'Historical Average',
            line: { color: SEVERITY_COLORS.medium, width: 2, dash: 'dash' },
            hoverinfo: 'none' // Don't show hover for the static line
        });
    }

    return traces;
});

const layout = {
    title: { text: 'Vulnerability Trend', font: { size: 14 } },
    margin: { t: 30, r: 20, l: 40, b: 40 },
    xaxis: {
        title: 'Scan Date',
        showgrid: false
    },
    yaxis: {
        title: 'Count',
        zeroline: true,
        gridcolor: '#e5e7eb'
    },
    showlegend: true,
    legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center' }
};
</script>

<template>
    <BasePlotlyChart :data="chartData" :layout="layout" />
</template>
