<template>
    <div class="h-64 w-full">
        <Line :data="chartData" :options="chartOptions" />
    </div>
</template>

<script setup>
import { Line } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement)

const chartData = {
    labels: [
        '2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05'
    ],
    datasets: [
        {
            label: 'Total Vulnerabilities',
            data: [10, 17, 25, 22, 34, 40],
            fill: false,
            borderColor: '#36A2EB',
            backgroundColor: '#36A2EB',
            tension: 0.2,
            pointBackgroundColor: '#fff',
            pointRadius: 0,
            pointHoverRadius: 6,
        }
    ]
}

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: true },
        title: {
            display: false
        }
    },
    scales: {
        y: { beginAtZero: true, color: '#d1d5db' },
        x: { color: '#d1d5db' },
    }
}
</script>
