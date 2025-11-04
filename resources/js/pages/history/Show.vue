<script setup lang="ts">
import FullScanDetailDrawer from '@/components/custom/FullScanDetailDrawer.vue';
import Navigation from '@/components/custom/Navigation.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parseZapReport, type FullVulnerability } from '@/lib/restack/historyParsers';
import { computed, ref } from 'vue';

// Import the refactored chart components
import SeverityPieChartFullscan from '@/components/custom/Charts/SeverityPieChartFullscan.vue';
import TopVulnerabilitiesRanking from '@/components/custom/Charts/TopVulnerabilitiesRanking.vue';
import VulnerabilityCategoryChart from '@/components/custom/Charts/VulnerabilityCategoryChart.vue';

// --- Mock Data Imports ---
// We only use zapMock now to match the "Full Scan" vibes
import zapMock from '@/data/zap_active-scan.json';
// --- End Mock Data ---

// --- Prop Simulation ---
// Hardcoded to 'full' scan type as requested.
const simulatedReport = ref(zapMock);

const simulatedScanDetails = computed(() => ({
    id: '12345',
    target: 'https://google-gruyere.appspot.com/362606228745311540152441387477944179112/',
    date: '2025-10-30 15:06:11',
    scanner: 'ZAP',
}));
// --- End Prop Simulation ---

const isDrawerOpen = ref(false);
const selectedVulnerability = ref<FullVulnerability | null>(null);

// Process the raw report JSON into a unified vulnerability list
const processedVulnerabilities = computed(() => {
    return parseZapReport(simulatedReport.value);
});

// Calculate summary statistics for the dashboard cards
const summaryStats = computed(() => {
    const stats = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        Informational: 0,
        Total: processedVulnerabilities.value.length,
    };

    for (const vuln of processedVulnerabilities.value) {
        const severity = (vuln as any).severity || 'Informational';
        if (stats.hasOwnProperty(severity)) {
            stats[severity as keyof typeof stats]++;
        }
    }
    return stats;
});

// Event handler for when the Top 10 table requests a detail view
function openVulnerabilityDetails(vuln: FullVulnerability) {
    selectedVulnerability.value = vuln;
    isDrawerOpen.value = true;
}
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div>
                <h1 class="px-2 text-3xl font-bold">Scan Report</h1>
                <p class="text-muted-foreground truncate px-2">
                    {{ simulatedScanDetails.target }}
                </p>
            </div>

            <div class="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                <Card>
                    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle class="text-sm font-medium">Total Vulnerabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {{ summaryStats.Total }}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle class="text-sm font-medium text-red-500">Critical</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {{ summaryStats.Critical }}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle class="text-sm font-medium text-red-500">High</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {{ summaryStats.High }}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle class="text-sm font-medium text-orange-500">Medium</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {{ summaryStats.Medium }}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle class="text-sm font-medium text-yellow-500">Low</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {{ summaryStats.Low }}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div class="lg:col-span-1">
                    <SeverityPieChartFullscan :vulnerabilities="processedVulnerabilities" />
                </div>

                <div class="lg:col-span-2">
                    <TopVulnerabilitiesRanking :vulnerabilities="processedVulnerabilities" @view-vulnerability="openVulnerabilityDetails" />
                </div>
            </div>

            <div class="grid grid-cols-1">
                <VulnerabilityCategoryChart :vulnerabilities="processedVulnerabilities" />
            </div>
        </div>

        <FullScanDetailDrawer :open="isDrawerOpen" :vuln="selectedVulnerability" @update:open="isDrawerOpen = $event" />
    </Navigation>
</template>
