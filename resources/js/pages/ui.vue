<script setup lang="ts">

import AppSidebar from '@/components/AppSidebar.vue';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import DashCard from '@/components/custom/DashCard.vue';
import { LucideBug, LucideScanQrCode, LucideScroll } from 'lucide-vue-next';
import { ref } from 'vue';

const vuln = ref(0);
const reports = ref(0);
const scanners = ref(3);

</script>

<template>
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
            <header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                <div class="flex items-center gap-2 px-4">
                    <SidebarTrigger class="-ml-1" />
                    <Separator orientation="vertical" class="mr-2 h-4" />
                </div>
            </header>
            <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
                <span class="font-bold font-mono px-2 text-4xl">Metrics</span>
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
                        <div class="flex-1 aspect-video rounded-xl bg-muted/50" />
                        <div class="flex-1 aspect-video rounded-xl bg-muted/50" />
                        <div class="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
                        <div class="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
                    </div>
                </div>
            </div>
        </SidebarInset>
    </SidebarProvider>
</template>
