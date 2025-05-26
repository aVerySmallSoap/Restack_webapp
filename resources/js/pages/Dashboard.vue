<script setup lang="ts">
import DashCard from '@/components/custom/DashCard.vue';
import { LucideBug, LucideScanQrCode, LucideScroll } from 'lucide-vue-next';
import { ref } from 'vue';
import VulnerabilityCategoryChart from '@/components/custom/VulnerabilityCategoryChart.vue'
import SeverityDistributionChart from '@/components/custom/SeverityDistributionChart.vue'
import DashCardChart from '@/components/custom/DashCardChart.vue';
import Navigation from '@/components/custom/Navigation.vue';

const vuln = ref(0);
const reports = ref(0);
const scanners = ref(3);
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <span class="font-bold px-2 text-4xl">Metrics</span>
            <div class="grid auto-rows-min gap-4 md:grid-cols-3">
                <DashCard title="Vulnerabilities" :icon="LucideBug">
                    <template #card-content>
                        <span class="">{{vuln}}</span>
                    </template>
                    <template #card-footer>
                        Changes since last update: 0%
                    </template>
                </DashCard>
                <DashCard title="Reports" :icon="LucideScroll">
                    <template #card-content>
                        <span>{{reports}}</span>
                    </template>
                    <template #card-footer>
                        Changes since last update: 0%
                    </template>
                </DashCard>
                <DashCard title="Scanners" :icon="LucideScanQrCode">
                    <template #card-content>
                        <span>{{scanners}}</span>
                    </template>
                    <template #card-footer>
                        Constant Value
                    </template>
                </DashCard>
                <div class="grid gap-4 md:grid-cols-2 col-span-4">
                    <DashCardChart title="Vulnerabilities by Categories">
                        <template #card-content>
                            <VulnerabilityCategoryChart />
                        </template>
                    </DashCardChart>
                    <DashCardChart title="Vulnerability Severity Distribution">
                        <template #card-content>
                            <SeverityDistributionChart />
                        </template>
                    </DashCardChart>
                </div>
            </div>
        </div>
    </Navigation>
</template>
