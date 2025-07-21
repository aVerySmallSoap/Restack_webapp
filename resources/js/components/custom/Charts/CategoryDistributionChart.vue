<template>
    <Doughnut :data="chartData" :options="chartOptions" />
</template>

<script>
import { Doughnut } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    CategoryScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

const vulnerabilities = [
    { scanner: 'Wapiti', category: 'SQL Injection', severity: 'High' },
    { scanner: 'Wapiti', category: 'Cross-Site Scripting', severity: 'Medium' },
    { scanner: 'Wapiti', category: 'Command Injection', severity: 'High' },
    { scanner: 'ZAP', category: 'SQL Injection', severity: 'Critical' },
    { scanner: 'ZAP', category: 'Cross-Site Scripting', severity: 'High' },
    { scanner: 'ZAP', category: 'Open Redirect', severity: 'Medium' },
    { scanner: 'Arachni', category: 'SQL Injection', severity: 'High' },
    { scanner: 'Arachni', category: 'Cross-Site Scripting', severity: 'Low' },
    { scanner: 'Arachni', category: 'Local File Inclusion', severity: 'Medium' },
    { scanner: 'Wapiti', category: 'Cross-Site Scripting', severity: 'Low' },
    { scanner: 'ZAP', category: 'CSRF', severity: 'Medium' },
    { scanner: 'Arachni', category: 'Remote Code Execution', severity: 'Critical' },
    { scanner: 'Wapiti', category: 'Open Redirect', severity: 'Low' },
    { scanner: 'ZAP', category: 'Path Traversal', severity: 'High' },
    { scanner: 'Arachni', category: 'Unvalidated Input', severity: 'Low' },
    { scanner: 'Wapiti', category: 'Command Injection', severity: 'Medium' },
    { scanner: 'ZAP', category: 'HTTP Response Splitting', severity: 'Medium' },
    { scanner: 'Arachni', category: 'Directory Listing', severity: 'Low' },
    { scanner: 'Wapiti', category: 'SQL Injection', severity: 'Medium' },
    { scanner: 'ZAP', category: 'Clickjacking', severity: 'Low' },
];

// Utility for generating visually distinct pastel colors
function getColorPalette(n) {
    const pastelColors = [
        '#1e40af', '#2563eb', '#3b82f6', '#93c5fd', '#fbbf24', '#f87171', '#34d399', '#f472b6', '#60a5fa',
        '#a78bfa', '#fdba74', '#6ee7b7', '#fca5a5', '#fcd34d', '#f9fafb', '#818cf8'
    ];
    // If more categories than colors, repeat colors
    if (n <= pastelColors.length) return pastelColors.slice(0, n);
    else {
        // Simple hue rotation for more colors (fallback)
        return Array.from({ length: n }, (_, i) => `hsl(${(i * 360 / n) % 360}, 60%, 70%)`);
    }
}

export default {
    name: 'VulnerabilityCategoryDoughnutChart',
    components: { Doughnut },
    data() {
        return {
            chartData: {
                labels: [],
                datasets: [
                    {
                        label: 'Vulnerabilities by Category',
                        backgroundColor: [],
                        data: [],
                        borderWidth: 0
                    }
                ]
            },
            chartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                const total = context.dataset.data.reduce((sum, current) => sum + current, 0);
                                const value = context.parsed;
                                const percentage = ((value / total) * 100).toFixed(2);
                                return label + value + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        }
    },
    created() {
        this.processVulnerabilityCategoryData();
    },
    methods: {
        processVulnerabilityCategoryData() {
            // Count vulnerabilities for each category
            const categoryCounts = {};
            vulnerabilities.forEach(vuln => {
                categoryCounts[vuln.category] = (categoryCounts[vuln.category] || 0) + 1;
            });

            const categories = Object.keys(categoryCounts);
            const data = categories.map(cat => categoryCounts[cat]);
            const colors = getColorPalette(categories.length);

            this.chartData.labels = categories;
            this.chartData.datasets[0].data = data;
            this.chartData.datasets[0].backgroundColor = colors;
        }
    }
}
</script>
