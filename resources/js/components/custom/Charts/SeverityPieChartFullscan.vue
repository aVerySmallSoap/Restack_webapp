<template>
    <Doughnut :data="chartData" :options="chartOptions" />
</template>

<script>
import { ArcElement, CategoryScale, Chart as ChartJS, Legend, Title, Tooltip } from 'chart.js';
import { Doughnut } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

const severityCounts = {
    Critical: 4,
    High: 6,
    Medium: 10,
    Low: 3,
    Info: 2,
};

const severityColors = {
    Critical: '#ef4444',
    High: '#f59e42',
    Medium: '#fbbf24',
    Low: '#3b82f6',
    Info: '#a1a1aa',
};

export default {
    name: 'SeverityPieChart',
    components: { Doughnut },
    data() {
        const levels = Object.keys(severityCounts);
        return {
            chartData: {
                labels: levels,
                datasets: [
                    {
                        label: 'Severity',
                        backgroundColor: levels.map((lvl) => severityColors[lvl]),
                        data: levels.map((lvl) => severityCounts[lvl]),
                        borderWidth: 0,
                    },
                ],
            },
            chartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.label || '';
                                if (label) label += ': ';
                                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                const value = context.parsed;
                                const percentage = ((value / total) * 100).toFixed(2);
                                return label + value + ' (' + percentage + '%)';
                            },
                        },
                    },
                },
            },
        };
    },
};
</script>

<style scoped></style>
