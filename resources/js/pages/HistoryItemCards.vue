<script setup lang="ts">
import { ref, computed } from 'vue';
import Navigation from '@/components/custom/Navigation.vue';
import SeverityBadge from '@/components/custom/SeverityBadge.vue';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const scanResult = ref({
    categories: ['Content Security Policy Configuration', 'Clickjacking Protection', 'MIME Type Confusion'],
    vulnerabilities: [
        [
            {
                category: 'Content Security Policy Configuration',
                info: 'CSP is not set',
                level: 'Low',
                method: 'GET',
                module: 'csp',
                parameter: '',
                path: '/',
                referer: '',
                curl_command: 'curl "http://oten.com/"',
                http_request:
                    'GET / HTTP/1.1\nhost: oten.com\nconnection: keep-alive\nuser-agent: Mozilla/5.0 (Windows NT 6.1; rv:45.0) Gecko/20100101 Firefox/45.0\naccept-language: en-US\naccept-encoding: gzip, deflate, br\naccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                wstg: ['WSTG-CONF-12', 'OSHP-Content-Security-Policy'],
            },
        ],
        [
            {
                category: 'Clickjacking Protection',
                info: 'X-Frame-Options is not set',
                level: 'Low',
                method: 'GET',
                module: 'http_headers',
                parameter: '',
                path: '/',
                referer: '',
                curl_command: 'curl "http://oten.com/"',
                http_request:
                    'GET / HTTP/1.1\nhost: oten.com\nconnection: keep-alive\nuser-agent: Mozilla/5.0 (Windows NT 6.1; rv:45.0) Gecko/20100101 Firefox/45.0\naccept-language: en-US\naccept-encoding: gzip, deflate, br\naccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                wstg: ['OSHP-X-Frame-Options'],
            },
        ],
        [
            {
                category: 'MIME Type Confusion',
                info: 'X-Content-Type-Options is not set',
                level: 'Low',
                method: 'GET',
                module: 'http_headers',
                parameter: '',
                path: '/',
                referer: '',
                curl_command: 'curl "http://oten.com/"',
                http_request:
                    'GET / HTTP/1.1\nhost: oten.com\nconnection: keep-alive\nuser-agent: Mozilla/5.0 (Windows NT 6.1; rv:45.0) Gecko/20100101 Firefox/45.0\naccept-language: en-US\naccept-encoding: gzip, deflate, br\naccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                wstg: ['OSHP-X-Content-Type-Options'],
            },
        ],
    ]
});

const allVulns = computed(() =>
    scanResult.value.vulnerabilities.flat().map((vuln, idx) => ({
        ...vuln,
        _idx: idx
    }))
);

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
            <Card
                v-for="vuln in allVulns"
                :key="vuln._idx"
                class="transition-shadow cursor-pointer hover:shadow-lg"
                @click="toggleExpand(vuln._idx)"
                :aria-expanded="expandedIdx === vuln._idx"
            >
                <CardHeader class="flex flex-row items-center gap-2">
                    <SeverityBadge :severity="vuln.level" />
                    <CardTitle class="text-base font-semibold flex-1">
                        {{ vuln.category }}
                    </CardTitle>
                </CardHeader>
                <transition name="expand">
                    <CardContent v-if="expandedIdx === vuln._idx" class="pt-2 flex flex-col gap-2">
                            <div class="px-2 py-0.5"><b>Module:</b> {{ vuln.module }}</div>
                            <div class="px-2 py-0.5"><b>Severity:</b> <SeverityBadge :severity="vuln.level" /></div>
                            <div class="px-2 py-0.5"><b>Info:</b> {{ vuln.info }}</div>
                            <div class="px-2 py-0.5"><b>Method:</b> {{ vuln.method }}</div>
                            <div class="px-2 py-0.5"><b>Path:</b> <span class="break-all">{{ vuln.path }}</span></div>
                            <div class="px-2 py-0.5"><b>Referer: </b>
                                <span v-if="vuln.referer === ''" class="text-muted">No referer</span>
                                <span v-else>{{ vuln.referer }}</span>
                            </div>
                            <div class="px-2 py-0.5">
                                <b>HTTP Request:</b>
                                <pre class="bg-muted mt-1 rounded p-2 pb-0 break-all whitespace-pre-wrap">{{ vuln.http_request }}</pre>
                            </div>
                            <div class="px-2 py-0.5">
                                <b>Curl Command:</b>
                                <pre class="bg-muted mt-1 rounded p-2 pb-0 break-all whitespace-pre-wrap">{{ vuln.curl_command }}</pre>
                            </div>
                            <div class="px-2 py-0.5" v-if="vuln.wstg && vuln.wstg.length">
                                <b>WSTG:</b>
                                <ul class="list-disc ml-6">
                                    <li v-for="w in vuln.wstg" :key="w">{{ w }}</li>
                                </ul>
                            </div>
                        </CardContent>
                    </transition>
                </Card>
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
