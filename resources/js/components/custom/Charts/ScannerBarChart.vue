<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import type { PropType } from 'vue'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
    vulnerabilities: {
        type: Array as PropType<Record<string, any>[]>,
        default: () => []
    }
})

// Process the vulnerability data to get scanner counts
const scannerCounts = computed(() => {
    const counts: Record<string, number> = {}

    props.vulnerabilities.forEach(vuln => {
        const scanner = vuln.scanner || 'Unknown'
        if (!counts[scanner]) {
            counts[scanner] = 0
        }
        counts[scanner]++
    })

    return counts
})

// Format data for Chart.js
const chartData = computed(() => {
    const counts = scannerCounts.value
    return {
        labels: Object.keys(counts),
        datasets: [
            {
                label: 'Vulnerabilities Found',
                backgroundColor: '#3B82F6', // blue-500
                data: Object.values(counts)
            }
        ]
    }
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false,
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                precision: 0 // Ensure y-axis has whole numbers
            }
        }
    }
}
</script>

<template>
    <div class="h-64 w-full">
        <Bar :data="chartData" :options="chartOptions" />
    </div>
</template>
