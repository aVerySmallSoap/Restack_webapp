<script setup lang="ts">
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar.vue';
</script>

<template>
    <SidebarProvider>
        <AppSidebar/>
        <SidebarInset>
            <header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                <div class="flex items-center gap-2 px-4">
                    <SidebarTrigger class="-ml-1" />
                </div>
            </header>
            <slot></slot>
        </SidebarInset>
    </SidebarProvider>
</template>

<style scoped>

</style>
