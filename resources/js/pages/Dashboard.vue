<script setup lang="ts">
import { ref } from 'vue';
import Navigation from '@/components/custom/Navigation.vue';
// shadcn-vue imports
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

const vuln = ref(0);
const reports = ref(0);
const scanners = ref(3);
const topN = ref(10);

const dateRange = ref({
    start: null,
    end: null,
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
            <!-- <div class="grid gap-4 grid-cols-6 auto-rows-min"> -->
            <!--     <Card class="col-span-full"> -->
            <!--         <CardHeader> -->
            <!--             <CardTitle>Vulnerabilities by Categories</CardTitle> -->
            <!--         </CardHeader> -->
            <!--         <CardContent> -->
            <!--             <div class="w-full h-120"> -->
            <!--                 <VulnerabilityCategoryChart/> -->
            <!--             </div> -->
            <!--         </CardContent> -->
            <!--     </Card> -->
            <!-- </div> -->

            <!-- Top Vulnerabilities Section -->
            <div class="grid gap-4 md:grid-cols-2 grid-cols-1 auto-rows-min">
                <!-- Table/List of Top Vulnerabilities with filters -->
                <Card>
                    <CardHeader>
                        <CardTitle>Top Vulnerabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="flex gap-2 mb-4">
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="App"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>App</SelectLabel>
                                        <SelectItem value="App1">App1</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Type"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Type</SelectLabel>
                                        <SelectItem value="Type1">Type1</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Severity"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Type</SelectLabel>
                                        <SelectItem value="Severity1">Severity1</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Occurence"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Occurence</SelectLabel>
                                        <SelectItem value="Occurence1">Occurence1</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>


                        </div>
                        <!-- Table of vulnerabilities (stub) -->
                        <table class="w-full text-sm"> <thead> <tr> <th>App</th>
                                    <th>Type</th>
                                    <th>Severity</th>
                                    <th>Occurrence</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in filteredVulnerabilities" :key="item.id">
                                    <td>{{ item.app }}</td>
                                    <td>{{ item.type }}</td>
                                    <td>{{ item.severity }}</td>
                                    <td>{{ item.occurrence }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <!-- Rankings Chart and Filters -->
                <Card>
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
                        <div class="w-full h-60">
                            <TopVulnerabilitiesRanking :top="Number(topN)" :date="dateRange"/>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </Navigation>
</template>
