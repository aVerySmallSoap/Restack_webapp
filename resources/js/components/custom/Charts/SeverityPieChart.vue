<script setup lang="ts">
import { computed } from 'vue'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js'
import type { PropType } from 'vue'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

const props = defineProps({
    vulnerabilities: {
        type: Array as PropType<Record<string, any>[]>,
        default: () => []
    }
})

// Process the vulnerability data to get severity counts
const severityCounts = computed(() => {
    const counts = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        Info: 0
    }

    props.vulnerabilities.forEach(vuln => {
        const severity = vuln.severity?.toLowerCase()
        if (severity === 'critical') counts.Critical++
        else if (severity === 'high') counts.High++
        else if (severity === 'medium') counts.Medium++
        else if (severity === 'low') counts.Low++
        else counts.Info++
    })

    return counts
})

// Format data for Chart.js
const chartData = computed(() => {
    const counts = severityCounts.value
    return {
        labels: ['Critical', 'High', 'Medium', 'Low', 'Info'],
        datasets: [
            {
                backgroundColor: [
                    '#DC2626', // red-600
                    '#F97316', // orange-500
                    '#FACC15', // yellow-400
                    '#3B82F6', // blue-500
                    '#6B7280'  // gray-500
                ],
                data: [
                    counts.Critical,
                    counts.High,
                    counts.Medium,
                    counts.Low,
                    counts.Info
                ]
            }
        ]
    }
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'right' as const,
        }
    }
}
</script>

<template>
    <div class="h-64 w-full">
        <Pie :data="chartData" :options="chartOptions" />
    </div>
</template>
