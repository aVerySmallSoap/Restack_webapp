<script setup lang="ts">

import AppSidebar from '@/components/AppSidebar.vue';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Dashcard from '@/components/custom/dashcard.vue';
import { LucideBug, LucideScanQrCode, LucideScroll } from 'lucide-vue-next';
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
                    <dashcard title="Vulnerabilities" :icon="LucideBug"/>
                    <dashcard title="Reports" :icon="LucideScroll"/>
                    <dashcard title="Scanners" :icon="LucideScanQrCode"/>
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
