<script setup lang="ts">
import { ref } from 'vue';
import Navigation from '@/components/custom/Navigation.vue';
// shadcn-vue imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import VulnerabilitiesOverTimeChart from '@/components/custom/VulnerabilitiesOverTimeChart.vue';
import VulnerabilityCategoryChart from '@/components/custom/VulnerabilityCategoryChart.vue';
import SeverityDistributionChart from '@/components/custom/SeverityDistributionChart.vue';

const vuln = ref(0);
const reports = ref(0);
const scanners = ref(3);
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <span class="font-bold px-2 text-4xl">Metrics</span>
            <!-- Main Grid for Metrics and Chart -->
            <div class="grid gap-4 md:grid-cols-3 grid-cols-3 auto-rows-min">
                <!-- Card 1: Vulnerabilities -->
                <Card>
                    <CardHeader>
                        <CardTitle>Vulnerabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span class="text-2xl font-bold">{{ vuln }}</span>
                        <div class="text-xs text-muted-foreground mt-2">
                            Changes since last update: 0%
                        </div>
                    </CardContent>
                </Card>
                <!-- Card 2: Reports -->
                <Card>
                    <CardHeader>
                        <CardTitle>Reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span class="text-2xl font-bold">{{ reports }}</span>
                        <div class="text-xs text-muted-foreground mt-2">
                            Changes since last update: 0%
                        </div>
                    </CardContent>
                </Card>
                <!-- Card 3: Scanners -->
                <Card>
                    <CardHeader>
                        <CardTitle>Scanners</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span class="text-2xl font-bold">{{ scanners }}</span>
                        <div class="text-xs text-muted-foreground mt-2">
                            Constant Value
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Line Chart (spans full width) -->
            <div class="grid gap-4 md:grid-cols-2 grid-cols-1 auto-rows-min">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Vulnerabilities Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <VulnerabilitiesOverTimeChart />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Vulnerabilities by Severity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="w-full flex justify-center">
                            <div class="w-full md:w-2/3">
                                <SeverityDistributionChart />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Vulnerabilities by Categories (custom component, below chart) -->
            <div class="grid gap-4 grid-cols-6 auto-rows-min">
                <Card class="col-span-full">
                    <CardHeader>
                        <CardTitle>Vulnerabilities by Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="w-full h-120">
                            <VulnerabilityCategoryChart/>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Vulnerabilities by Severity (full width) -->
            <div class="w-full">

            </div>
        </div>
    </Navigation>
</template>
