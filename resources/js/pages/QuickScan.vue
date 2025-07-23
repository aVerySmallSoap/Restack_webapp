<script setup lang="ts">
import { ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/custom/Navigation.vue';
import Spinner from '@/components/custom/Spinner.vue';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormItem, FormLabel, FormField, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import SeverityBadge from '@/components/custom/SeverityBadge.vue';
import { parseFromAPI } from '@/lib/restack/parse';

const Result = ref();
const Status = ref();
const report = ref();

const showClearConfirm = ref(false);
const showFeedback = ref(false);
const feedbackMsg = ref('');
const feedbackType = ref<'success' | 'error' | 'info'>('info');

const formSchema = toTypedSchema(
    z.object({
        url: z.string().url(),
    }),
);

const form = useForm({
    validationSchema: formSchema,
});

const hasErrored = ref(form.errors);
const elevate = ref(false);

watch(hasErrored, (value) => {
    elevate.value = !(value.url == undefined);
});

const onScan = form.handleSubmit((value) => {
    Status.value = 'Scanning...';
    fetch('http://127.0.0.1:25565/api/v1/wapiti/scan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: value.url }),
    })
        .then((response) => response.json())
        .then((data) => {
            Result.value = data;
            report.value = parseFromAPI(data);
            Status.value = 'Scan complete';

            feedbackMsg.value = 'Scan completed successfully!';
            feedbackType.value = 'success';
            showFeedback.value = true;
            setTimeout(() => (showFeedback.value = false), 2000);
        })
        .catch((err) => {
            Status.value = 'Scan failed';

            feedbackMsg.value = 'Scan failed. Please try again.';
            feedbackType.value = 'error';
            showFeedback.value = true;
            setTimeout(() => (showFeedback.value = false), 2000);
        });
});

const confirmClear = () => {
    showClearConfirm.value = true;
};

const onClear = () => {
    if (Result.value != null) {
        Result.value = null;
        Status.value = null;
        report.value = null;
        feedbackMsg.value = 'Results have been cleared.';
        feedbackType.value = 'info';
        showFeedback.value = true;
        setTimeout(() => (showFeedback.value = false), 2000);
    }
    showClearConfirm.value = false;
};

function colorize(severity: string) {
    switch (severity) {
        case 'Low':
            return 'text-green-700';
        case 'Medium':
            return 'text-yellow-700';
        case 'High':
            return 'text-red-700';
        case 'Critical':
            return 'text-red-900';
        default:
            return 'text-muted';
    }
}
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <!-- Toast -->
            <transition name="fade">
                <div
                    v-if="showFeedback"
                    class="bg-background fixed top-6 right-6 z-50 rounded border px-4 py-2 text-sm shadow"
                    :class="{
                        'border-green-600 bg-green-50 text-green-700': feedbackType === 'success',
                        'border-red-600 bg-red-50 text-red-700': feedbackType === 'error',
                        'border-neutral-400 bg-neutral-50 text-neutral-700': feedbackType === 'info',
                    }"
                    style="min-width: 240px; text-align: center"
                >
                    {{ feedbackMsg }}
                </div>
            </transition>

            <!-- Loader Overlay -->
            <div v-if="Status === 'Scanning...'" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" aria-busy="true">
                <Spinner message="Scanning... Please wait" />
            </div>

            <!-- Clear Confirmation Modal -->
            <div v-if="showClearConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                <div class="min-w-[300px] rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-800">
                    <h2 class="mb-4 text-lg font-semibold">Confirm Clear</h2>
                    <p class="mb-6">Are you sure you want to clear the results?</p>
                    <div class="flex justify-end gap-3">
                        <Button variant="secondary" @click="showClearConfirm = false">Cancel</Button>
                        <Button variant="destructive" @click="onClear">Yes, Clear</Button>
                    </div>
                </div>
            </div>

            <!-- Page description -->
            <div class="">
                <h1 class="font-bold px-2 text-4xl">Quick Scan</h1>
                <div class="p-1.5">
                    <span>
                        Run a preconfigured Wapiti scan to quickly probe websites. <br />
                        <span class="text-sm text-red-600 italic">
                            WARNING: This scan tries to probe websites as quickly as possible, therefore, it may not produce accurate results.
                        </span>
                    </span>
                </div>
            </div>

            <!-- Top Row: Input + Buttons -->
            <form @submit="onScan">
                <div class="mb-4 flex flex-col gap-2 p-1.5 md:flex-row md:gap-4">
                    <FormField v-slot="{ componentField }" name="url">
                        <FormItem class="w-full md:w-80">
                            <FormLabel>URL</FormLabel>
                            <FormDescription>Web app address to probe</FormDescription>
                            <FormControl>
                                <Input type="url" v-bind="componentField" placeholder="https://example.com" />
                            </FormControl>
                            <FormMessage class="text-red-500" />
                        </FormItem>
                    </FormField>
                    <div class="flex flex-col gap-2">
                        <div class="flex flex-1 flex-col items-end gap-2 md:flex-row md:gap-4">
                            <Button type="submit" :disabled="Status === 'Scanning...'">Quick Scan</Button>
                            <Button variant="secondary" type="button" @click="confirmClear" :disabled="Status === 'Scanning...' || !Result">
                                Clear
                            </Button>
                        </div>
                        <div class="h-[20px]" v-if="elevate"></div>
                    </div>
                </div>
            </form>

            <!-- Results -->
            <div>
                <div id="Results" class="max-w-full overflow-x-hidden p-2 md:p-4" v-if="Result != null">
                    <Accordion type="multiple">
                        <template v-for="[item, value] in report" :key="item">
                            <AccordionItem :value="item">
                                <AccordionTrigger>
                                    <span class="font-semibold">{{ item }}</span>
                                </AccordionTrigger>
                                <AccordionContent>
<!--                                    <div class="mb-2">-->
<!--                                        <h1 class="mb-1 text-xl font-bold">{{ item }}</h1>-->
<!--                                        <Separator />-->
<!--                                    </div>-->
                                    <div class="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
                                        <!-- Left: Description & Solution -->
                                        <div class="flex min-w-0 flex-col gap-8 pt-4">
                                            <span class="py-4">
                                                {{ value.desc.desc }}
                                            </span>
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Solution</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    {{ value.desc.sol }}
                                                </CardContent>
                                                <CardFooter class="grid grid-rows-[min-content]">
                                                    References:
                                                    <span class="flex flex-col flex-wrap gap-1 px-2">
                                                        <template v-for="(link, site) in value.desc.ref" :key="link">
                                                            <a :href="link" target="_blank" class="text-green-500">
                                                                {{ site }}
                                                            </a>
                                                        </template>
                                                    </span>
                                                </CardFooter>
                                            </Card>
                                            <!-- Left-lower: How to fix-->
                                            <span class="text-muted"> No content on how to fix it for now! </span>
                                        </div>
                                        <!-- Right: Vulnerability Details -->
                                        <div class="flex flex-col gap-4">
                                            <template v-for="data in value.vuln" :key="data">
                                                <div class="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 md:gap-4">
                                                    <div>
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle>Severity</CardTitle>
                                                            </CardHeader>
                                                            <CardContent :class="colorize(data.level)" class="">
                                                                <SeverityBadge :severity="data.level"/>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                    <div>
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle>Module</CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                {{ data.method }}
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                    <div>
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle>Method</CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                {{ data.module }}
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                    <div class="col-span-3 row-start-2 grid auto-cols-min auto-rows-max grid-cols-1 gap-2 md:gap-4">
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle>Additional Info</CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                {{ data.info }}
                                                            </CardContent>
                                                        </Card>
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle>Curl Command</CardTitle>
                                                            </CardHeader>
                                                            <CardContent class="break-all">
                                                                {{ data.curl_command }}
                                                            </CardContent>
                                                        </Card>
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle>Path</CardTitle>
                                                            </CardHeader>
                                                            <CardContent class="break-all">
                                                                {{ data.path }}
                                                            </CardContent>
                                                        </Card>
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle>Referer</CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <span v-if="data.referer == ''" class="text-muted"> There is no referer </span>
                                                                <span v-else>
                                                                    {{ data.referer }}
                                                                </span>
                                                            </CardContent>
                                                        </Card>
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle>HTTP Request</CardTitle>
                                                            </CardHeader>
                                                            <CardContent class="break-all">
                                                                {{ data.http_request }}
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                </div>
                                                <div v-if="value.vuln.length > 1">
                                                    <Separator />
                                                </div>
                                            </template>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </template>
                    </Accordion>
                    <!-- Temporary WhatWeb Results Display for Testing -->
                    <div v-if="Result && Result.plugins">
                        <h2 class="font-bold text-xl mt-8 mb-2">WhatWeb Results (Temporary)</h2>
                        <div class="grid gap-2 mb-8">
                            <template v-for="(plugin, idx) in Result.plugins" :key="idx">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{{ Object.keys(plugin)[0] }}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div v-for="(val, key) in plugin[Object.keys(plugin)[0]]" :key="key">
                                            <strong>{{ key }}:</strong>
                                            <span v-if="Array.isArray(val)">
                            {{ val.join(', ') }}
                        </span>
                                            <span v-else>
                            {{ val }}
                        </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Navigation>
</template>
