<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'

import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

const formSchema = toTypedSchema(z.object({
    timeout: z.onumber().default(30),
    cookieFlags: z.boolean().default(true),
    csp: z.boolean().default(true),
    exec: z.boolean().default(true),
    file: z.boolean().default(true),
    httpHeaders: z.boolean().default(true),
    permanentXss: z.boolean().default(true),
    redirect: z.boolean().default(true),
    sql: z.boolean().default(true),
    ssl: z.boolean().default(true),
    ssrf: z.boolean().default(true),
    upload: z.boolean().default(true),
    xss: z.boolean().default(true),
    exMode: z.boolean().default(false),
}))

const { handleSubmit } = useForm({
    validationSchema: formSchema
})

const onSubmit = handleSubmit((values) => {
    console.log(values)
})

</script>

<template>
    <div class="p-4">
        <form @submit="onSubmit" class="mt-4">
            <div>
                <h2 class="font-bold text-2xl">Flags</h2>
                <span class="pt-4 text-muted">Control how ZAP behaves</span>
                <Separator/>
            </div>
            <div class="grid grid-cols-3 gap-4 p-4">
                <FormField v-slot="{ value, handleChange }" name="timeout">
                    <FormItem class="flex flex-col justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                Timeout
                            </FormLabel>
                            <FormDescription class="flex">
                                <span class="self-center">
                                    Sets how long ZAP will scan (in seconds)
                                </span>
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Input type="number" :default-value="30" :model-value="value" @update:model-value="handleChange"/>
                        </FormControl>
                    </FormItem>
                </FormField>
            </div>
            <div class="py-4">
                <h2 class="font-bold text-2xl">Modules</h2>
                <span class="text-muted">Modules determine what payloads ZAP will execute</span>
                <Separator/>
            </div>
            <div class="pl-4">
                <h2 class="font-bold">Common Modules</h2>
                <span class="pt-4 text-muted">Common vulnerabilities</span>
                <Separator/>
            </div>
            <div class="grid grid-cols-2 gap-4 p-4">
                <FormField v-slot="{ value, handleChange }" name="cookieFlags">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                Cookie Flags
                            </FormLabel>
                            <FormDescription class="flex">
                                <span class="self-center">
                                    Allow ZAP to evaluate the security of cookies
                                </span>
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :model-value="value"
                                @update:model-value="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>
                <FormField v-slot="{ value, handleChange }" name="csp">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                Content Security Policies
                            </FormLabel>
                            <FormDescription class="flex">
                                <span class="self-center">
                                    Allow ZAP to evaluate the security level of Content Security Policies of the web server
                                </span>
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :model-value="value"
                                @update:model-value="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>
                <FormField v-slot="{ value, handleChange }" name="exec">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                Exec
                            </FormLabel>
                            <FormDescription class="flex">
                                <span class="self-center">
                                    Allow ZAP to detect scripts vulnerable to command and/or code execution
                                </span>
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :model-value="value"
                                @update:model-value="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>
                <FormField v-slot="{ value, handleChange }" name="file">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                File
                            </FormLabel>
                            <FormDescription class="flex">
                                <span class="self-center">
                                    Allow ZAP to detect file-related vulnerabilities such as directory traversal and include() vulnerabilities
                                </span>
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :model-value="value"
                                @update:model-value="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>
                <FormField v-slot="{ value, handleChange }" name="httpHeaders">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                HTTP Headers
                            </FormLabel>
                            <FormDescription>
                                Allow ZAP to evaluate the security of HTTP headers
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :model-value="value"
                                @update:model-value="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>
                <FormField v-slot="{ value, handleChange }" name="permanentXss">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                Permanent CrossSite Scripting
                            </FormLabel>
                            <FormDescription>
                                Allow ZAP to detect stored (aka permanent) Cross-Site Scripting vulnerabilities on the web server
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :model-value="value"
                                @update:model-value="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>
                <FormField v-slot="{ value, handleChange }" name="redirect">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                Redirect
                            </FormLabel>
                            <FormDescription>
                                Allow ZAP to detect Open Redirect vulnerabilities
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :model-value="value"
                                @update:model-value="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>
                <FormField v-slot="{ value, handleChange }" name="sql">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                SQL
                            </FormLabel>
                            <FormDescription>
                                Allow ZAP to detect SQL (also XPath) injection vulnerabilities using error-based or boolean-based (blind) techniques
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :model-value="value"
                                @update:model-value="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>
                <FormField v-slot="{ value, handleChange }" name="ssl">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                SSL
                            </FormLabel>
                            <FormDescription>
                                Allow ZAP to evaluate the security of SSL/TLS certificate configuration
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :model-value="value"
                                @update:model-value="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>
                <FormField v-slot="{ value, handleChange }" name="ssrf">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                Server-Side Request Forgery
                            </FormLabel>
                            <FormDescription>
                                Allow ZAP to detect Server-Side Request Forgery vulnerabilities
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :model-value="value"
                                @update:model-value="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>
                <FormField v-slot="{ value, handleChange }" name="upload">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                Upload
                            </FormLabel>
                            <FormDescription>
                                Allow ZAP to detect unrestricted file upload vulnerabilities
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :model-value="value"
                                @update:model-value="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>
                <FormField v-slot="{ value, handleChange }" name="xss">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                CrossSite Scripting
                            </FormLabel>
                            <FormDescription>
                                Allow ZAP to detect scripts vulnerable to XML external entity injection (also known as XXE)
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :model-value="value"
                                @update:model-value="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>
            </div>
            <div class="pl-4">
                <h2 class="font-bold">Expensive Modules</h2>
                <span class="pt-4 text-muted">
                    Scans uncommon vulnerabilities.
                    <span class="text-yellow-500 italic">
                        Warning: These modules are expensive to run, therefore, take more time.
                    </span>
                </span>
                <Separator/>
            </div>
            <div class="grid grid-cols-2 gap-4 p-4">
                <FormField v-slot="{ value, handleChange }" name="exMode">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                Expensive Module #1
                            </FormLabel>
                            <FormDescription>
                                Allow ZAP to execute expensive module #1
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :model-value="value"
                                @update:model-value="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>
            </div>
            <Button class="my-4" type="submit">
                Save Changes
            </Button>
        </form>
    </div>
</template>
