<script setup lang="ts">
import Button from '../../../components/ui/button/Button.vue'
import StatCard from "./StatCard.vue"
import ScanTable from './/resources/js/pag  es/temp/dashboard/ScanTable.vue'

// Dummy data for recent scans
const dummyScans = [
    {
        id: 1,
        app: "Restack UI",
        status: "Completed",
        vulnerabilities: 2,
        startedAt: "2025-07-15 10:00",
        finishedAt: "2025-07-15 10:10",
    },
    {
        id: 2,
        app: "Restack API",
        status: "In Progress",
        vulnerabilities: 0,
        startedAt: "2025-07-16 09:00",
        finishedAt: null,
    },
    {
        id: 3,
        app: "Customer Portal",
        status: "Failed",
        vulnerabilities: 0,
        startedAt: "2025-07-14 16:00",
        finishedAt: "2025-07-14 16:03",
    },
]
</script>

<template>
    <div class="dashboard flex flex-col gap-6 p-6">
        <!-- Header -->
        <header class="flex items-center justify-between mb-4">
            <h1 class="text-2xl font-bold">Dashboard</h1>
            <Button @click="newScan" aria-label="Start a new scan">New Scan</Button>
        </header>

        <!-- Stat Cards -->
        <section class="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Scan summary cards">
            <StatCard title="Active Scans" :value="4" icon="mdi:cloud-search" />
            <StatCard title="Vulnerabilities Found" :value="12" icon="mdi:alert" />
            <StatCard title="Resolved Issues" :value="8" icon="mdi:check-circle" />
        </section>

        <!-- Recent Scans Table -->
        <section aria-label="Recent scans" class="mt-8">
            <h2 class="text-xl font-semibold mb-2">Recent Scans</h2>
            <ScanTable :scans="dummyScans" />
        </section>
    </div>
</template>

<style scoped>

</style>
