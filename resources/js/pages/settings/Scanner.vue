<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WapitiTab from '@/pages/settings/WapitiTab.vue';
import Navigation from '@/components/custom/Navigation.vue';
import ZapTab from '@/pages/settings/ZapTab.vue';
import ArachniTab from '@/pages/settings/ArachniTab.vue';

</script>

<template>
    <Navigation>
        <div class="px-4">
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
                    <ZapTab/>
                </TabsContent>
                <TabsContent value="arachni">
                    <ArachniTab/>
                </TabsContent>
            </Tabs>
        </div>
    </Navigation>
</template>
