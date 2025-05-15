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

const formSchema = toTypedSchema(z.object({
    http: z.boolean().default(true),
    xxe: z.boolean().default(true),
    bruteLogin: z.boolean().default(true),
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
        <h3>Modules</h3>
        <Separator/>
        <form @submit="onSubmit" class="mt-4">
            <h2 class="font-bold">Common Modules</h2>
            <span class="pt-4 text-muted">scans common vulnerabilities</span>
            <Separator/>
            <div class="grid grid-cols-2 gap-4 p-4">
                <FormField v-slot="{ value, handleChange }" name="http">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                Http
                            </FormLabel>
                            <FormDescription>
                                Allow wapiti to use its HTTP module to detect missing HTTP headers
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
                <FormField v-slot="{ value, handleChange }" name="xxe">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                CrossSite Scripting Execution
                            </FormLabel>
                            <FormDescription>
                                Allow wapiti to use its CrossSite Scripting Execution module to detect endpoints that are vulnerable to XXS
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
                <FormField v-slot="{ value, handleChange }" name="bruteLogin">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                Brute Login
                            </FormLabel>
                            <FormDescription>
                                Allow wapiti to use its bruteLogin module to detect brute force login pages
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
            <h2 class="font-bold">Expensive Modules</h2>
            <span class="pt-4 text-muted">scans uncommon vulnerabilities.
            <span class="text-yellow-500 italic">Warning: These modules are expensive to run, therefore, take more time.</span>
        </span>
            <Separator/>
            <div></div>
            <Button class="my-4" type="submit">
                Save changes
            </Button>
        </form>
    </div>
</template>
