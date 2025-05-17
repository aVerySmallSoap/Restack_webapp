<script setup lang="ts">

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar.vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WapitiTab from '@/pages/settings/WapitiTab.vue';

</script>

<template>
    <SidebarProvider>
        <AppSidebar/>
        <SidebarInset>
            <header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                <div class="flex items-center gap-2 px-4">
                    <SidebarTrigger class="-ml-1" />
                    <Separator orientation="vertical" class="mr-2 h-4" />
                </div>
            </header>
            <div class="px-6">
                <Tabs :default-value="'wapiti'">
                    <TabsList>
                        <TabsTrigger value="wapiti">Wapiti</TabsTrigger>
                        <TabsTrigger value="zap">ZAP</TabsTrigger>
                        <TabsTrigger value="arachni">Arachni</TabsTrigger>
                    </TabsList>
                    <TabsContent value="wapiti">
                        <WapitiTab/>
                    </TabsContent>
                    <TabsContent value="zap">
                        <div class="flex justify-center">
                            <span class="text-muted">No content yet</span>
                        </div>
                    </TabsContent>
                    <TabsContent value="arachni">
                        <div class="flex justify-center">
                            <span class="text-muted">No content yet</span>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </SidebarInset>
    </SidebarProvider>
</template>
