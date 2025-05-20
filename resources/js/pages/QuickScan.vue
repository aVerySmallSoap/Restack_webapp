<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/custom/Navigation.vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const formSchema = toTypedSchema(z.object({
   url: z.string().url(),
}))

const form = useForm({
    validationSchema: formSchema
})

const onScan = form.handleSubmit((value) => {
    Status.value = 'Scanning...';
    fetch('http://127.0.0.1:5000/v1/wapiti/scan',
        {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({url: value.url}),
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            const group = new Map();
            Result.value = data;
            for (let i = 0; i < data['categories'].length; i++) {
                group.set(data['categories'][i], {
                    desc: data['descriptions'][i],
                    vuln: data['vulnerabilities'][i],
                });
            }
            report.value = group;
        });
})

const onClear = () => {
    if (Result.value != null) {
        Result.value = null;
        Status.value = null;
    }
};
</script>

<template>
    <Navigation>
        <div class="px-12 py-4 h-full">
            <div>
                <form @submit="onScan">
                    <FormField v-slot="{ componentField }" name="url">
                        <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormDescription>web app address to probe</FormDescription>
                            <FormControl>
                                <Input type="url" v-bind="componentField"/>
                            </FormControl>
                            <FormMessage class="text-red-500"/>
                        </FormItem>
                    </FormField>
                    <Button type="submit">
                        Quick Scan
                    </Button>
                </form>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <Button @click="onClear"> Clear </Button>
            </div>

            <div>
                <span v-if="Result == null" class="text-muted">
                    {{ Status }}
                </span>
                <div id="Results" class="p-4" v-if="Result != null">
                    <Tabs :default-value="1">
                        <TabsList>
                            <template v-for="[item] in report" :key="item">
                                <TabsTrigger :value="item">
                                    {{ item }}
                                </TabsTrigger>
                            </template>
                        </TabsList>
                        <template v-for="[item, value] in report" :key="item">
                            <TabsContent :value="item">
                                <h1>{{item}}</h1>
                                <Separator/>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="flex flex-col pt-4">
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
                                                <span class="px-2 flex gap-1">
                                                    <template v-for="(link, index, number) in value.desc.ref" :key="link">
                                                    <a :href="link" target="_blank" class="text-green-300">
                                                        [{{number}}]
                                                    </a>
                                                </template>
                                                </span>
                                            </CardFooter>
                                        </Card>
                                    </div>
                                    <div class="grid grid-cols-3 grid-rows-[min-content] gap-8 p-4">
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
                                        <div class="grid grid-cols-1 row-start-2 col-span-3 gap-4 auto-cols-min auto-rows-max">
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
                                                <CardContent>
                                                    {{value.vuln.curl_command}}
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Path</CardTitle>
                                                </CardHeader>
                                                <CardContent>
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
                                                <CardContent>
                                                    {{value.vuln.http_request}}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </template>
                    </Tabs>
                </div>
            </div>
        </div>
    </Navigation>
</template>
