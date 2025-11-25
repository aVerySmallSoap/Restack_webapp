<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WapitiTab from '@/pages/settings/WapitiTab.vue';
import Navigation from '@/components/custom/Navigation.vue';
import ZapTab from '@/pages/settings/ZapTab.vue';
import WhatWebTab from '@/pages/settings/WhatWebTab.vue';

</script>

<template>
    <Navigation>
        <div class="px-4">
            <Tabs :default-value="'whatweb'">
                <TabsList>
                    <TabsTrigger value="wapiti">Wapiti</TabsTrigger>
                    <TabsTrigger value="zap">ZAP</TabsTrigger>
                    <TabsTrigger value="whatweb">WhatWeb</TabsTrigger>
                </TabsList>
                <TabsContent value="wapiti">
                    <WapitiTab/>
                </TabsContent>
                <TabsContent value="zap">
                    <ZapTab/>
                </TabsContent>
                <TabsContent value="whatweb">
                    <WhatWebTab/>
                </TabsContent>
            </Tabs>
        </div>
    </Navigation>
</template>
