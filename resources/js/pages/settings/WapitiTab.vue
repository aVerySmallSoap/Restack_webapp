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
}))

const { handleSubmit } = useForm({
    validationSchema: formSchema
})

const onSubmit = handleSubmit((values) => {
    console.log(values)
})
</script>

<template>
    <h3>Modules</h3>
    <Separator/>
    <form @submit="onSubmit" class="mt-4">
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
        <Button class="my-4" type="submit">
            Submit
        </Button>
    </form>
</template>
