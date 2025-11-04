<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DonutChart, type DonutChartData } from '@/components/ui/chart-donut';
import type { FullVulnerability } from '@/lib/restack/historyParsers';
import { computed } from 'vue';

// Define props to accept vulnerability data
const props = defineProps<{
    vulnerabilities: FullVulnerability[];
}>();

// Hex colors for severities
const severityColors = {
    Critical: '#ef4444', // red-500
    High: '#f97316', // orange-500
    Medium: '#eab308', // yellow-500
    Low: '#22c55e', // green-500
    Informational: '#3b82f6', // blue-500
};

// Compute severity counts based on the prop
const severityCounts = computed(() => {
    const counts = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        Informational: 0,
    };

    for (const vuln of props.vulnerabilities) {
        const severity = vuln.severity || 'Informational';
        if (counts.hasOwnProperty(severity)) {
            counts[severity as keyof typeof counts]++;
        }
    }
    return counts;
});

// Generate data for the donut chart
const chartData = computed<DonutChartData[]>(() => {
    return Object.entries(severityCounts.value)
        .filter(([, count]) => count > 0) // Only show severities with counts > 0
        .map(([severity, count]) => ({
            name: severity,
            total: count,
            fill: severityColors[severity as keyof typeof severityColors],
        }));
});
</script>

<template>
    <Card class="flex h-full flex-col">
        <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription> Overview of vulnerability severity. </CardDescription>
        </CardHeader>
        <CardContent class="flex flex-1 items-center justify-center pb-6">
            <DonutChart
                v-if="chartData.length > 0"
                index="name"
                category="total"
                :data="chartData"
                :colors="chartData.map((c) => c.fill)"
                :value-formatter="(v: number) => v.toString()"
                class="w-full"
            />
            <div v-else class="text-muted-foreground py-10 text-center">No vulnerabilities found.</div>
        </CardContent>
    </Card>
</template>
