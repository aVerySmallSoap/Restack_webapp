<script setup lang="ts">
import { ref, computed } from 'vue';
import Navigation from '@/components/custom/Navigation.vue';
import SeverityBadge from '@/components/custom/SeverityBadge.vue';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { usePage } from '@inertiajs/vue3';
import { parseFromAPI } from '@/lib/restack/parse';
import { Separator } from '@/components/ui/separator';
import { useDark } from '@vueuse/core';

const page = usePage();
const isDark = ref(useDark())
const report = computed(() => page.props.report);
const details = computed(() => page.props.details);
const res = computed(() => JSON.parse(report.value));
const otherRes = computed(() => JSON.parse(details.value));
const parsed = computed(() => parseFromAPI(res.value));

// Flatten Map to array for grid
const allVulns = computed(() => {
    let idx = 0;
    const arr = [];
    // parsed.value is a Map(category, {desc, vuln: [vuln, ...]})
    for (const [category, { desc, vuln }] of parsed.value.entries()) {
        if (Array.isArray(vuln)) {
            for (const v of vuln) {
                arr.push({
                    ...v,
                    category,
                    desc,
                    _idx: idx++,
                });
            }
        }
    }
    return arr;
});

const expandedIdx = ref<number | null>(null);
function toggleExpand(idx: number) {
    expandedIdx.value = (expandedIdx.value === idx ? null : idx);
}

function isMin(idx: number) {
    console.log(!expandedIdx.value === idx);
    if (!expandedIdx.value === idx) return 'height: min-content';
}

// Modern icon suggestion for each severity (you can swap for your own icons)
</script>

<template>
    <Navigation>
        <div class="flex flex-col gap-2 px-4 pt-4 pb-2">
            <span class="text-4xl font-bold">Vulnerability Report Details</span>
            <Separator />
            <div class="text-muted-foreground flex flex-col gap-2 text-base md:flex-row md:items-center">
                <div class="grid grid-cols-2 gap-x-3">
                    <div class="grid grid-cols-[max-content_1fr] items-center gap-x-3 gap-y-2 align-middle">
                        <span>ID:</span>
                        <span class="text-primary">{{ otherRes.id }}</span>
                        <span>Date Executed:</span>
                        <span class="text-primary">{{ otherRes.date }}</span>
                        <span>Scanner:</span>
                        <span class="text-primary">{{ otherRes.scanner }}</span>
                    </div>
                    <div class="grid grid-cols-[max-content_1fr] items-center gap-x-3 gap-y-2 align-middle">
                        <span>Scan Type:</span>
                        <span class="text-primary">{{ otherRes.type }}</span>
                        <span>Target URL:</span>
                        <span class="text-primary"> {{ otherRes.target }}</span>
                        <span>Total Issues:</span>
                        <span v-if="allVulns.length" class="text-primary"> {{ allVulns.length }}</span>
                    </div>
                </div>
            </div>
            <div class="text-muted-foreground mt-1 text-sm italic">
                The following vulnerabilities were discovered during the security assessment. Click a card to view more details.
            </div>
        </div>
        <div class="grid grid-cols-1 items-start gap-4 px-4 md:grid-cols-3">
            <Card
                v-for="vuln in allVulns"
                :key="vuln._idx"
                class="group cursor-pointer transition-shadow hover:shadow-lg"
                v-bind:class="(expandedIdx != null && expandedIdx?.value != vuln._idx) ? 'h-min-content' : 'h-full'"
                @click="toggleExpand(vuln._idx)"
                :aria-expanded="expandedIdx === vuln._idx"
            >
                <CardHeader class="flex flex-row items-center gap-2">
                    <SeverityBadge :severity="vuln.level" />
                    <CardTitle class="flex-1 text-base font-semibold">
                        {{ vuln.category }}
                    </CardTitle>
                </CardHeader>
                <div v-if="expandedIdx !== vuln._idx" class="text-muted-foreground line-clamp-2 px-4 pt-2 pb-4 text-sm">
                    <span v-if="vuln.desc.desc && vuln.desc.desc.length > 0">{{ vuln.desc.desc }}</span>
                    <span v-else>No description available.</span>
                </div>
                <transition name="expand">
                    <CardContent v-if="expandedIdx === vuln._idx" class="flex flex-col gap-2 pt-2 text-[15px]">
                        <div class="px-2 py-0.5" v-if="vuln.desc"><b>Description:</b> {{ vuln.desc.desc }}</div>
                        <div class="px-2 py-0.5">
                            <b>Module:</b> <span class="font-mono">{{ vuln.module }}</span>
                        </div>
                        <div class="px-2 py-0.5"><b>Severity:</b> <SeverityBadge :severity="vuln.level" /></div>
                        <div class="px-2 py-0.5"><b>Info:</b> {{ vuln.info }}</div>
                        <div class="px-2 py-0.5">
                            <b>Method:</b> <span class="font-mono">{{ vuln.method }}</span>
                        </div>
                        <div class="px-2 py-0.5">
                            <b>Path:</b> <span class="font-mono break-all">{{ vuln.path }}</span>
                        </div>
                        <div class="px-2 py-0.5">
                            <b>Referer: </b>
                            <span v-if="!vuln.referer" v-bind:class="isDark ? 'text-white' : 'text-black'">No referer</span>
                            <span v-else>{{ vuln.referer }}</span>
                        </div>
                        <div class="px-2 py-0.5" v-if="vuln.http_request">
                            <b>HTTP Request:</b>
                            <pre class="bg-muted mt-1 rounded p-2 pb-0 text-xs break-all whitespace-pre-wrap">{{ vuln.http_request }}</pre>
                        </div>
                        <div class="px-2 py-0.5" v-if="vuln.curl_command">
                            <b>Curl Command:</b>
                            <pre class="bg-muted mt-1 rounded p-2 pb-0 text-xs break-all whitespace-pre-wrap">{{ vuln.curl_command }}</pre>
                        </div>
                        <div class="px-2 py-0.5" v-if="vuln.wstg && vuln.wstg.length">
                            <b>WSTG:</b>
                            <ul class="ml-6 list-disc">
                                <li v-for="w in vuln.wstg" :key="w">{{ w }}</li>
                            </ul>
                        </div>
                    </CardContent>
                </transition>
            </Card>
            <div v-if="allVulns.length === 0" class="text-muted-foreground col-span-full py-8 text-center">No vulnerabilities found.</div>
        </div>
    </Navigation>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
    transition:
        max-height 0.2s cubic-bezier(0.4, 0, 0.2, 1),
        opacity 0.2s;
    overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
    max-height: 0;
    opacity: 0;
}
.expand-enter-to,
.expand-leave-from {
    max-height: 500px;
    opacity: 1;
}

/* Clamp preview text */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
