<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/custom/Navigation.vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Result = ref();
const Status = ref();
const report = ref();


const onScan = () => {
    Status.value = "Scanning..."
    fetch('http://127.0.0.1:5000/v1/wapiti/scan')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            const group = new Map();
            Result.value = data;
            for (let i = 0; i < data["categories"].length; i++) {
                group.set(data["categories"][i],
                    {
                        desc: data["descriptions"][i],
                        vuln:data["vulnerabilities"][i]
                    }
                    );
            }
            report.value = group;
        });
    console.log('Scanning...');
};

const onClear = () => {
    if (Result.value != null){
        Result.value = null;
        Status.value = null;
    }
}
</script>

<template>
    <Navigation>
        <div class="px-12 py-4">
            <div class="grid grid-cols-3 gap-4">
                <Button @click="onScan"> Quick Scan </Button>
                <Button @click="onClear"> Clear </Button>
            </div>
            <div>
            <span v-if="Result == null" class="text-muted">
                {{ Status }}
            </span>
                <div id="Results" class="p-4" v-if="Result != null">
                    <Tabs>
                        <TabsList>
                            <template v-for="[item] in report" :key="item">
                                <TabsTrigger :value="item">
                                    {{item}}
                                </TabsTrigger>
                            </template>
                        </TabsList>
                        <template v-for="[item, value] in report" :key="item">
                            <TabsContent :value="item">
                                <div class="grid grid-cols-2 gap-4">
                                    <span>
                                        {{value.vuln}}
                                    </span>
                                    <span>
                                        {{value.desc}}
                                    </span>
                                </div>
                            </TabsContent>
                        </template>
                    </Tabs>
                </div>
            </div>
        </div>
    </Navigation>
</template>
