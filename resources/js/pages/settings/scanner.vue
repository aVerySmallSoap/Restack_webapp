<script setup lang="ts">

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar.vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';



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
                <Tabs>
                    <TabsList>
                        <TabsTrigger value="Wapiti">Wapiti</TabsTrigger>
                        <TabsTrigger value="ZAP">ZAP</TabsTrigger>
                        <TabsTrigger value="Arachni">Arachni</TabsTrigger>
                    </TabsList>
                    <TabsContent value="Wapiti">
                        Wapiti Tab
                    </TabsContent>
                    <TabsContent value="ZAP">
                        ZAP Tab
                    </TabsContent>
                    <TabsContent value="Arachni">
                        Arachni Tab
                    </TabsContent>
                </Tabs>
            </div>
        </SidebarInset>
    </SidebarProvider>
</template>
