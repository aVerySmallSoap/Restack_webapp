<script setup lang="ts">
import { ref, computed } from 'vue';
import Navigation from '@/components/custom/Navigation.vue';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import SeverityBadge from '@/components/custom/SeverityBadge.vue';

const scanResult = ref({
    categories: ['Content Security Policy Configuration', 'Clickjacking Protection', 'MIME Type Confusion'],
    descriptions: [
        {
            desc: 'Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross Site Scripting (XSS) and data injection attacks.',
            ref: {
                'Mozilla: Content Security Policy (CSP)': 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
                'OWASP: Content Security Policy':
                    'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/12-Test_for_Content_Security_Policy',
                'OWASP: Content Security Policy Cheat Sheet':
                    'https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html',
                'OWASP: How to do Content Security Policy (PDF)':
                    'https://owasp.org/www-pdf-archive/2019-02-22_-_How_do_I_Content_Security_Policy_-_Print.pdf',
            },
            sol: 'Configuring Content Security Policy involves adding the Content-Security-Policy HTTP header to a web page and giving it values to control what resources the user agent is allowed to load for that page.',
            wstg: ['WSTG-CONF-12', 'OSHP-Content-Security-Policy'],
        },
        {
            desc: 'Clickjacking is a technique that tricks a user into clicking something different from what the user perceives, potentially revealing confidential information or taking control of their computer.',
            ref: {
                'KeyCDN: Preventing Clickjacking': 'https://www.keycdn.com/support/prevent-clickjacking',
                'OWASP: Clickjacking':
                    'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/09-Testing_for_Clickjacking',
            },
            sol: 'Implement X-Frame-Options or Content Security Policy (CSP) frame-ancestors directive.',
            wstg: ['OSHP-X-Frame-Options'],
        },
        {
            desc: 'MIME type confusion can occur when a browser interprets files as a different type than intended, which could lead to security vulnerabilities like cross-site scripting (XSS).',
            ref: {
                'KeyCDN: Preventing MIME Type Sniffing': 'https://www.keycdn.com/support/preventing-mime-type-sniffing',
                'OWASP: MIME Sniffing': 'https://owasp.org/www-community/attacks/MIME_sniffing',
            },
            sol: 'Implement X-Content-Type-Options to prevent MIME type sniffing.',
            wstg: ['OSHP-X-Content-Type-Options'],
        },
    ],
    vulnerabilities: [
        [
            {
                curl_command: 'curl "http://oten.com/"',
                http_request:
                    'GET / HTTP/1.1\nhost: oten.com\nconnection: keep-alive\nuser-agent: Mozilla/5.0 (Windows NT 6.1; rv:45.0) Gecko/20100101 Firefox/45.0\naccept-language: en-US\naccept-encoding: gzip, deflate, br\naccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                info: 'CSP is not set',
                level: 'Low',
                method: 'GET',
                module: 'csp',
                parameter: '',
                path: '/',
                referer: '',
                wstg: ['WSTG-CONF-12', 'OSHP-Content-Security-Policy'],
            },
        ],
        [
            {
                curl_command: 'curl "http://oten.com/"',
                http_request:
                    'GET / HTTP/1.1\nhost: oten.com\nconnection: keep-alive\nuser-agent: Mozilla/5.0 (Windows NT 6.1; rv:45.0) Gecko/20100101 Firefox/45.0\naccept-language: en-US\naccept-encoding: gzip, deflate, br\naccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                info: 'X-Frame-Options is not set',
                level: 'Low',
                method: 'GET',
                module: 'http_headers',
                parameter: '',
                path: '/',
                referer: '',
                wstg: ['OSHP-X-Frame-Options'],
            },
        ],
        [
            {
                curl_command: 'curl "http://oten.com/"',
                http_request:
                    'GET / HTTP/1.1\nhost: oten.com\nconnection: keep-alive\nuser-agent: Mozilla/5.0 (Windows NT 6.1; rv:45.0) Gecko/20100101 Firefox/45.0\naccept-language: en-US\naccept-encoding: gzip, deflate, br\naccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                info: 'X-Content-Type-Options is not set',
                level: 'Low',
                method: 'GET',
                module: 'http_headers',
                parameter: '',
                path: '/',
                referer: '',
                wstg: ['OSHP-X-Content-Type-Options'],
            },
        ],
    ],
});

const categories = computed(() => scanResult.value.categories);
const descriptions = computed(() => scanResult.value.descriptions);
const vulnerabilities = computed(() => scanResult.value.vulnerabilities);
const activeTab = ref(0);
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <span class="px-2 text-4xl font-bold">Scan Details</span>
            <ResizablePanelGroup
                id="history-item-panel-group"
                direction="horizontal"
                class="h-[60vh] min-h-[400px] w-full gap-4"
            >
                <!-- Left: TabsList as vertical sidebar -->
                <ResizablePanel id="history-item-panel-sidebar" :max-size="40">
                    <Tabs v-model="activeTab" orientation="vertical" class="h-full">
                        <TabsList class="grid w-full grid-cols-1">
                            <TabsTrigger
                                v-for="(cat, idx) in categories"
                                :key="cat"
                                :value="String(idx)"
                                class="w-full justify-start text-left"
                            >
                                {{ cat }}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </ResizablePanel>
                <!-- Middle: Resizable handle -->
                <ResizableHandle id="history-item-handle" with-handle />
                <!-- Right: Content -->
                <ResizablePanel id="history-item-panel-content" :default-size="75">
                    <Tabs v-model="activeTab" orientation="vertical" class="w-full h-full">
                        <template v-for="(desc, idx) in descriptions" :key="categories[idx]">
                            <TabsContent :value="String(idx)" class="h-full w-full">
                                <div class="flex flex-col gap-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>{{ categories[idx] }}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div class="mb-2 text-base">{{ desc.desc }}</div>
                                            <div class="mb-2 font-semibold">Solution:</div>
                                            <div class="mb-4">{{ desc.sol }}</div>
                                            <div class="font-semibold">References:</div>
                                            <ul class="ml-6 list-disc">
                                                <li v-for="(url, site) in desc.ref" :key="url">
                                                    <a :href="url" target="_blank" class="text-green-600 underline">{{ site }}</a>
                                                </li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                    <div v-if="vulnerabilities[idx] && vulnerabilities[idx].length > 0" class="flex flex-col gap-4">
                                        <template v-for="(vuln, j) in vulnerabilities[idx]" :key="vuln.info + j">
                                            <Card>
                                                <CardHeader class="flex flex-row items-center justify-between">
                                                    <CardTitle>
                                                        <div class="px-1 text-lg font-bold">Vulnerability Info:</div>
                                                    </CardTitle>
                                                    <span class="text-muted-foreground text-xs">{{ vuln.module }}</span>
                                                </CardHeader>
                                                <CardContent>
                                                    <div class="mb-2 flex flex-col gap-2">
                                                        <div class="px-2 py-0.5"><b>Severity: </b> <SeverityBadge :severity="vuln.level" /></div>
                                                        <div class="px-2 py-0.5"><b>Info:</b> {{ vuln.info }}</div>
                                                        <div class="px-2 py-0.5"><b>Method:</b> {{ vuln.method }}</div>
                                                        <div class="px-2 py-0.5">
                                                            <b>Path:</b> <span class="break-all">{{ vuln.path }}</span>
                                                        </div>
                                                        <div class="px-2 py-0.5">
                                                            <b>Referer:</b> <span v-if="vuln.referer === ''" class="text-muted">No referer</span>
                                                            <span v-else>{{ vuln.referer }}</span>
                                                        </div>
                                                        <div class="px-2 py-0.5">
                                                            <b>HTTP Request:</b>
                                                            <pre class="bg-muted mt-1 rounded p-2 pb-0 break-all whitespace-pre-wrap">
{{ vuln.http_request }}
                                                            </pre>
                                                        </div>
                                                        <div class="px-2 py-0.5">
                                                            <b>Curl Command:</b>
                                                            <pre class="bg-muted mt-1 rounded p-2 pb-0 break-all whitespace-pre-wrap">
{{ vuln.curl_command }}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Separator v-if="vulnerabilities[idx].length > 1 && j !== vulnerabilities[idx].length - 1" />
                                        </template>
                                    </div>
                                    <div v-else class="text-muted px-2 pt-2 text-sm">No vulnerabilities found for this category.</div>
                                </div>
                            </TabsContent>
                        </template>
                    </Tabs>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    </Navigation>
</template>
