<script setup lang="ts">
import { ref } from 'vue';
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

const Result = ref();
const Status = ref();
const report = ref();

const showClearConfirm = ref(false);
const showFeedback = ref(false);
const feedbackMsg = ref('');
const feedbackType = ref<'success' | 'error' | 'info'>('info');

const formSchema = toTypedSchema(z.object({
   url: z.string().url(),
}));

const form = useForm({
    validationSchema: formSchema
});

const onScan = form.handleSubmit((value) => {
    Status.value = 'Scanning...';
    fetch('http://127.0.0.1:5000/v1/wapiti/scan', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: value.url }),
    })
        .then(response => response.json())
        .then(data => {
            const group = new Map();
            Result.value = data;
            for (let i = 0; i < data['categories'].length; i++) {
                group.set(data['categories'][i], {
                    desc: data['descriptions'][i],
                    vuln: data['vulnerabilities'][i],
                });
            }
            report.value = group;
            Status.value = 'Scan complete';

            feedbackMsg.value = 'Scan completed successfully!';
            feedbackType.value = 'success';
            showFeedback.value = true;
            setTimeout(() => showFeedback.value = false, 2000);
        })
        .catch(err => {
            Status.value = 'Scan failed';

            feedbackMsg.value = 'Scan failed. Please try again.';
            feedbackType.value = 'error';
            showFeedback.value = true;
            setTimeout(() => showFeedback.value = false, 2000);
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
        setTimeout(() => showFeedback.value = false, 2000);
    }
    showClearConfirm.value = false;
};
</script>

<template>
    <Navigation>
        <div class="relative px-2 md:px-12 py-4 h-full max-w-full overflow-x-hidden">
            <!-- Toast -->
            <transition name="fade">
                <div
                    v-if="showFeedback"
                    :class="[
                        'fixed left-1/2 -translate-x-1/2 top-8 z-50 px-5 py-3 rounded shadow-lg',
                        feedbackType === 'success' ? 'bg-green-600 text-white' :
                        feedbackType === 'error' ? 'bg-red-600 text-white' :
                        'bg-neutral-600 text-white'
                    ]"
                    style="min-width: 240px; text-align: center;"
                >
                    {{ feedbackMsg }}
                </div>
            </transition>

            <!-- Loader Overlay -->
            <div
                v-if="Status === 'Scanning...'"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                aria-busy="true"
            >
                <Spinner message="Scanning... Please wait" />
            </div>

            <!-- Clear Confirmation Modal -->
            <div
                v-if="showClearConfirm"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            >
                <div class="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg min-w-[300px]">
                    <h2 class="text-lg font-semibold mb-4">Confirm Clear</h2>
                    <p class="mb-6">Are you sure you want to clear the results?</p>
                    <div class="flex justify-end gap-3">
                        <Button variant="secondary" @click="showClearConfirm = false">Cancel</Button>
                        <Button variant="destructive" @click="onClear">Yes, Clear</Button>
                    </div>
                </div>
            </div>

            <!-- Top Row: Input + Buttons -->
            <form @submit="onScan" class="flex flex-col md:flex-row items-end gap-2 md:gap-4 mb-4">
                <FormField v-slot="{ componentField }" name="url">
                    <FormItem class="w-full md:w-80">
                        <FormLabel>URL</FormLabel>
                        <FormDescription>Web app address to probe</FormDescription>
                        <FormControl>
                            <Input type="url" v-bind="componentField" placeholder="https://example.com"/>
                        </FormControl>
                        <FormMessage class="text-red-500"/>
                    </FormItem>
                </FormField>
                <Button type="submit" :disabled="Status === 'Scanning...'">Quick Scan</Button>
                <Button
                    variant="secondary"
                    type="button"
                    @click="confirmClear"
                    :disabled="Status === 'Scanning...' || !Result"
                >
                    Clear
                </Button>
            </form>

            <div>
                <span v-if="Result == null && Status" class="text-muted">
                    {{ Status }}
                </span>
                <div id="Results" class="p-2 md:p-4 max-w-full overflow-x-hidden" v-if="Result != null">
                    <Accordion type="multiple">
                        <template v-for="[item, value] in report" :key="item">
                            <AccordionItem :value="item">
                                <AccordionTrigger>
                                    <span class="font-semibold">{{ item }}</span>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div class="mb-2">
                                        <h1 class="text-xl font-bold mb-1">{{item}}</h1>
                                        <Separator/>
                                    </div>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                                        <!-- Left: Description & Solution -->
                                        <div class="flex flex-col pt-4 min-w-0">
                                            <span class="py-4">
                                                {{ value.desc.desc }}
                                            </span>
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Solution</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    {{value.desc.sol}}
                                                </CardContent>
                                                <CardFooter>
                                                    References:
                                                    <span class="px-2 flex gap-1 flex-wrap">
                                                        <template v-for="(link, index, number) in value.desc.ref" :key="link">
                                                            <a :href="link" target="_blank" class="text-green-300">
                                                                [{{number}}]
                                                            </a>
                                                        </template>
                                                    </span>
                                                </CardFooter>
                                            </Card>
                                        </div>
                                        <!-- Right: Vulnerability Details -->
                                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 min-w-0">
                                            <div>
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle>Severity</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        {{value.vuln.level}}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                            <div>
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle>Module</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        {{value.vuln.method}}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                            <div>
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle>Method</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        {{value.vuln.module}}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                            <div class="grid grid-cols-1 row-start-2 col-span-3 gap-2 md:gap-4 auto-cols-min auto-rows-max">
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle>Additional Info</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        {{value.vuln.info}}
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle>Curl Command</CardTitle>
                                                    </CardHeader>
                                                    <CardContent class="break-all">
                                                        {{value.vuln.curl_command}}
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle>Path</CardTitle>
                                                    </CardHeader>
                                                    <CardContent class="break-all">
                                                        {{value.vuln.path}}
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle>Referer</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <span v-if="value.vuln.referer == ''" class="text-muted">
                                                            There is no referer
                                                        </span>
                                                        <span v-else>
                                                            {{value.vuln.referer}}
                                                        </span>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle>HTTP Request</CardTitle>
                                                    </CardHeader>
                                                    <CardContent class="break-all">
                                                        {{value.vuln.http_request}}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </template>
                    </Accordion>
                </div>
            </div>
        </div>
    </Navigation>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.fade-enter-to, .fade-leave-from {
  opacity: 1;
}
</style>
