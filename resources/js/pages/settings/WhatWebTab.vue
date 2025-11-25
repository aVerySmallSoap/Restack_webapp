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
import { onMounted, ref } from 'vue';

const formSchema = toTypedSchema(z.object({
    aggression: z.number().min(1).max(4).default(1),
    userAgent: z.string().default('Mozilla/5.0'),
    verbose: z.boolean().default(false),
    followRedirects: z.boolean().default(true),
    color: z.boolean().default(false),
}))

const showSuccess = ref(false);

const { handleSubmit, setValues } = useForm({
    validationSchema: formSchema
})

onMounted(() => {
    const saved = localStorage.getItem('settings_whatweb');
    if (saved) {
        try {
            setValues(JSON.parse(saved));
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    }
});

const onSubmit = handleSubmit((values) => {
    // Simulate API call/save
    localStorage.setItem('settings_whatweb', JSON.stringify(values));
    console.log('WhatWeb Settings Saved:', values);

    showSuccess.value = true;
    setTimeout(() => showSuccess.value = false, 2000);
})
</script>

<template>
    <div class="p-4">
        <form @submit="onSubmit" class="mt-4">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="font-bold text-2xl">WhatWeb Configuration</h2>
                    <span class="pt-4 text-muted">Next generation web scanner configuration</span>
                </div>
            </div>
            <Separator class="my-4"/>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                <FormField v-slot="{ value, handleChange }" name="aggression">
                    <FormItem class="flex flex-col justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                Aggression Level (1-4)
                            </FormLabel>
                            <FormDescription>
                                Set the aggression level. 1 is stealthy, 3 is aggressive, 4 is heavy.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Input
                                type="number"
                                :min="1"
                                :max="4"
                                :model-value="value"
                                @update:model-value="(v) => handleChange(Number(v))"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>

                <FormField v-slot="{ value, handleChange }" name="userAgent">
                    <FormItem class="flex flex-col justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                User Agent
                            </FormLabel>
                            <FormDescription>
                                Identify as a specific user agent string.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Input :model-value="value" @update:model-value="handleChange"/>
                        </FormControl>
                    </FormItem>
                </FormField>

                <FormField v-slot="{ value, handleChange }" name="verbose">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                Verbose Mode
                            </FormLabel>
                            <FormDescription>
                                Enable detailed output logging.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :checked="value"
                                @update:checked="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>

                <FormField v-slot="{ value, handleChange }" name="followRedirects">
                    <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div class="space-y-0.5">
                            <FormLabel class="text-base">
                                Follow Redirects
                            </FormLabel>
                            <FormDescription>
                                Automatically follow HTTP redirects.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                :checked="value"
                                @update:checked="handleChange"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>
            </div>

            <div class="flex items-center gap-4 mt-4 px-4">
                <Button type="submit">
                    Save Changes
                </Button>
                <Transition
                    enter-active-class="transition ease-in-out"
                    enter-from-class="opacity-0"
                    leave-active-class="transition ease-in-out"
                    leave-to-class="opacity-0"
                >
                    <p v-show="showSuccess" class="text-sm text-green-600 font-medium">Settings saved successfully.</p>
                </Transition>
            </div>
        </form>
    </div>
</template>
