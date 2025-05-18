<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WapitiTab from '@/pages/settings/WapitiTab.vue';
import Navigation from '@/components/custom/Navigation.vue';

</script>

<template>
    <Navigation>
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
    </Navigation>
</template>
