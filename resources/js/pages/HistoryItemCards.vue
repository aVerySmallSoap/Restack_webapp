<script setup lang="ts">
import { ref, computed } from 'vue';
import Navigation from '@/components/custom/Navigation.vue';
import SeverityBadge from '@/components/custom/SeverityBadge.vue';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { usePage } from '@inertiajs/vue3';
import { parseFromAPI } from '@/lib/restack/parse';

const page = usePage();
const report = computed(() => page.props.report);
const res = JSON.parse(report.value);
const parsed = parseFromAPI(res);

// Only one expanded at a time
const expandedIdx = ref<number|null>(null);

function toggleExpand(idx: number) {
    expandedIdx.value = expandedIdx.value === idx ? null : idx;
}
</script>

<template>
    <Navigation>
        <span class="font-bold px-6 text-4xl p-4">Metrics</span>
        <div class="grid gap-4 md:grid-cols-3 grid-cols-1 items-start px-4">
            <template v-for="[category, data] in parsed" :key="category">
               <Card class="h-full">
                   <CardHeader>
                       <CardTitle>{{category}}</CardTitle>
                   </CardHeader>
                   <CardContent>
                       {{ console.log(data) }}
                       <span>Module: {{data.vuln[0].module}}</span>
                       <span>Severity: {{data.vuln.module}}</span>
                       <span>Path: {{data.vuln.module}}</span>
                       <span>Info {{data.vuln.module}}</span>
                       <span>Method {{data.vuln.module}}</span>
                       <span>Path {{data.vuln.module}}</span>
                   </CardContent>
               </Card>
            </template>

<!--            <Card-->
<!--                v-for="vuln in allVulns"-->
<!--                :key="vuln._idx"-->
<!--                class="transition-shadow cursor-pointer hover:shadow-lg"-->
<!--                @click="toggleExpand(vuln._idx)"-->
<!--                :aria-expanded="expandedIdx === vuln._idx"-->
<!--            >-->
<!--                <CardHeader class="flex flex-row items-center gap-2">-->
<!--                    <SeverityBadge :severity="vuln.level" />-->
<!--                    <CardTitle class="text-base font-semibold flex-1">-->
<!--                        {{ vuln[vuln._idx] }}-->
<!--                    </CardTitle>-->
<!--                </CardHeader>-->
<!--                <transition name="expand">-->
<!--                    <CardContent v-if="expandedIdx === vuln._idx" class="pt-2 flex flex-col gap-2">-->
<!--                            <div class="px-2 py-0.5"><b>Module:</b> {{ vuln.module }}</div>-->
<!--                            <div class="px-2 py-0.5"><b>Severity:</b> <SeverityBadge :severity="vuln.level" /></div>-->
<!--                            <div class="px-2 py-0.5"><b>Info:</b> {{ vuln.info }}</div>-->
<!--                            <div class="px-2 py-0.5"><b>Method:</b> {{ vuln.method }}</div>-->
<!--                            <div class="px-2 py-0.5"><b>Path:</b> <span class="break-all">{{ vuln.path }}</span></div>-->
<!--                            <div class="px-2 py-0.5"><b>Referer: </b>-->
<!--                                <span v-if="vuln.referer === ''" class="text-muted">No referer</span>-->
<!--                                <span v-else>{{ vuln.referer }}</span>-->
<!--                            </div>-->
<!--                            <div class="px-2 py-0.5">-->
<!--                                <b>HTTP Request:</b>-->
<!--                                <pre class="bg-muted mt-1 rounded p-2 pb-0 break-all whitespace-pre-wrap">{{ vuln.http_request }}</pre>-->
<!--                            </div>-->
<!--                            <div class="px-2 py-0.5">-->
<!--                                <b>Curl Command:</b>-->
<!--                                <pre class="bg-muted mt-1 rounded p-2 pb-0 break-all whitespace-pre-wrap">{{ vuln.curl_command }}</pre>-->
<!--                            </div>-->
<!--                            <div class="px-2 py-0.5" v-if="vuln.wstg && vuln.wstg.length">-->
<!--                                <b>WSTG:</b>-->
<!--                                <ul class="list-disc ml-6">-->
<!--                                    <li v-for="w in vuln.wstg" :key="w">{{ w }}</li>-->
<!--                                </ul>-->
<!--                            </div>-->
<!--                        </CardContent>-->
<!--                    </transition>-->
<!--                </Card>-->
            </div>
    </Navigation>
</template>

<style scoped>
.expand-enter-active, .expand-leave-active {
    transition: max-height 0.2s cubic-bezier(0.4,0,0.2,1), opacity 0.2s;
    overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
    max-height: 0;
    opacity: 0;
}
.expand-enter-to, .expand-leave-from {
    max-height: 500px; /* adjust as needed */
    opacity: 1;
}
</style>
