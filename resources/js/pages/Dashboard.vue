<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Navigation from '@/components/custom/Navigation.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SeverityDistributionChart from '@/components/custom/Charts/SeverityDistributionChart.vue';
import CategoryDistributionChart from '@/components/custom/Charts/CategoryDistributionChart.vue';
import TopVulnerabilitiesRanking from '@/components/custom/Charts/TopVulnerabilitiesRanking.vue';
import DateRangePicker from '@/components/custom/Dashboard/DateRangePicker.vue'
import TopVulnerabiltyTable from '@/components/custom/Dashboard/TopVulnerabilityTable.vue'

import type { TableTop } from '@/components/custom/Dashboard/TableTop';
import { columns } from '@/components/custom/Dashboard/TableTop';

const vuln = ref(0);
const reports = ref(0);
const scanners = ref(3);
const topN = ref(10);

const dateRange = ref({
    start: null,
    end: null,
})



const data = ref<topVuln[]>([])

async function getData(): Promise<topVuln[]> {
    return [
          { id: 1, app: 'App1', type: 'SQL Injection', severity: 'High', occurrence: 12 },
  { id: 2, app: 'App2', type: 'Cross-Site Scripting', severity: 'Medium', occurrence: 9 },
  { id: 3, app: 'App3', type: 'CSRF', severity: 'Low', occurrence: 4 },
  { id: 4, app: 'App1', type: 'Command Injection', severity: 'Critical', occurrence: 15 },
  { id: 5, app: 'App4', type: 'Local File Inclusion', severity: 'High', occurrence: 7 },
  { id: 6, app: 'App2', type: 'Remote Code Execution', severity: 'Critical', occurrence: 11 },
  { id: 7, app: 'App5', type: 'Directory Listing', severity: 'Medium', occurrence: 5 },
  { id: 8, app: 'App3', type: 'Clickjacking', severity: 'Low', occurrence: 2 },
  { id: 9, app: 'App4', type: 'Open Redirect', severity: 'Medium', occurrence: 6 },
  { id: 10, app: 'App2', type: 'Path Traversal', severity: 'High', occurrence: 8 },
  { id: 11, app: 'App1', type: 'Unvalidated Input', severity: 'Low', occurrence: 3 },
  { id: 12, app: 'App5', type: 'HTTP Response Splitting', severity: 'Medium', occurrence: 4 },
  { id: 13, app: 'App3', type: 'Remote Code Execution', severity: 'Critical', occurrence: 10 },
  { id: 14, app: 'App2', type: 'SQL Injection', severity: 'High', occurrence: 7 },
  { id: 15, app: 'App4', type: 'Cross-Site Scripting', severity: 'Medium', occurrence: 6 },
  { id: 16, app: 'App1', type: 'Clickjacking', severity: 'Low', occurrence: 1 },
  { id: 17, app: 'App5', type: 'CSRF', severity: 'Low', occurrence: 3 },
  { id: 18, app: 'App3', type: 'Directory Listing', severity: 'Medium', occurrence: 5 },
  { id: 19, app: 'App2', type: 'HTTP Response Splitting', severity: 'High', occurrence: 6 },
  { id: 20, app: 'App1', type: 'Open Redirect', severity: 'Medium', occurrence: 4 },
    ]
}

onMounted(async () => {
    data.value = await getData()
})
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
                        <CardTitle>Vulnerabilities By Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CategoryDistributionChart />
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
                        <CardTitle>Vulnerability Rankings Chart</CardTitle>
                        <div class="flex gap-2 mt-2">
                            <Select v-model="topN">
                                <SelectTrigger>
                                    <SelectValue placeholder="Top Vulnerabilities"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem :value="10">Top 10</SelectItem>
                                        <SelectItem :value="5">Top 5</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <DateRangePicker :v-model="dateRange" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="w-full h-128">
                            <TopVulnerabilitiesRanking :top="Number(topN)" :date="dateRange"/>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Top Vulnerabilities Section -->
            <div class="grid gap-4 grid-cols-6 auto-rows-min overflow-hidden">
                <!-- Table/List of Top Vulnerabilities with filters -->
                <Card class="col-span-full">
                    <CardHeader>
                        <CardTitle>Top Vulnerabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="w-full max-h-[30rem] overflow-auto">
                            <TopVulnerabiltyTable :columns="columns" :data="data" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </Navigation>
</template>
