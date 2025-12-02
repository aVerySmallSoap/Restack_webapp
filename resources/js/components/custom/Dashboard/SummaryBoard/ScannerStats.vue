<script setup lang="ts">

import { computed} from 'vue';

const props = defineProps<{
    data?: object
}>();

// data
const averageScanDuration = computed(() => {
    return props.data?.average_scan_duration || {};
});
const scanTypeDistribution = computed(() => {
    return props.data?.scan_type_distribution || {};
});
const summaryStats = computed(() => {
    return props.data?.summary_statistics || {};
});

</script>

<template>
    <div>
        Scanner statistics
        <div>
            Average scan duration
            <div>Full scan: {{averageScanDuration["full scan"]}}s</div>
            <div>Wapiti scan: {{averageScanDuration["wapiti scan"]}}s</div>
            <div>Zap scan: {{averageScanDuration["zap scan"]}}s</div>
        </div>
        <div>
            Scan Type Distribution
            <div>Full scan: {{scanTypeDistribution["full scan"]}}</div>
            <div>Wapiti scan: {{scanTypeDistribution["wapiti scan"]}}</div>
            <div>Zap scan: {{scanTypeDistribution["zap scan"]}}</div>
        </div>
        <div>
            Summary
            <div>Average vulnerabilities per scan: {{summaryStats["average_vulns_per_scan"]}}</div>
            <div>Scans per day: {{summaryStats["scans_per_day"]}}</div>
            <div>Total scans: {{summaryStats["total_scans"]}}</div>
            <div>Total vulnerabilities found: {{summaryStats["total_vulnerabilities_found"]}}</div>
            <div>Unique targets: {{summaryStats["unique_targets"]}}</div>
        </div>
    </div>

</template>

<style scoped>

</style>
