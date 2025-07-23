<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
    Chart,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Props
const props = defineProps<{
    top: number;
    date: string;
}>();

// Dummy data for demonstration; replace with real API/data fetching logic
const allVulnerabilities = [
    { name: 'XSS', count: 24 },
    { name: 'SQL Injection', count: 17 },
    { name: 'CSRF', count: 8 },
    { name: 'RCE', count: 6 },
    { name: 'IDOR', count: 5 },
    { name: 'Path Traversal', count: 3 },
    { name: 'Insecure Deserialization', count: 2 },
    { name: 'SSRF', count: 1 },
];

// Filter and sort data based on props
const chartData = computed(() => {
    // In a real app, filter by props.date
    const sorted = [...allVulnerabilities].sort((a, b) => b.count - a.count);
    const topN = sorted.slice(0, props.top);

    return {
        labels: topN.map(v => v.name),
        datasets: [
            {
                label: 'Occurrences',
                backgroundColor: '#4f46e5',
                data: topN.map(v => v.count),
            }
        ]
    };
});

const chartOptions = {
    responsive: true,
    maintainAspectRation: false,
    plugins: {
        legend: { display: false },
        title: { display: false }
    },
    scales: {
        y: { beginAtZero: true }
    }
};
</script>

<template>
    <div>
        <Bar :data="chartData" :options="chartOptions" />
    </div>
</template>
