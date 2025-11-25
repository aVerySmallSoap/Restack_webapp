<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { onMounted, ref } from 'vue';

import HeadingSmall from '@/components/HeadingSmall.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import AppLayout from '@/layouts/AppLayout.vue';
import SettingsLayout from '@/layouts/settings/Layout.vue';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Info',
        href: '/settings/user-info',
    },
];

const formSchema = toTypedSchema(z.object({
    jobTitle: z.string().min(2, 'Job title must be at least 2 characters.').default(''),
    department: z.string().optional().default(''),
    location: z.string().optional().default(''),
    website: z.string().url('Please enter a valid URL.').optional().or(z.literal('')).default(''),
}));

const { handleSubmit, setValues } = useForm({
    validationSchema: formSchema,
});

const showSuccess = ref(false);

onMounted(() => {
    const saved = localStorage.getItem('settings_user_info');
    if (saved) {
        try {
            setValues(JSON.parse(saved));
        } catch (e) {
            console.error('Failed to parse user info', e);
        }
    }
});

const onSubmit = handleSubmit((values) => {
    localStorage.setItem('settings_user_info', JSON.stringify(values));
    showSuccess.value = true;
    setTimeout(() => showSuccess.value = false, 2000);
});
</script>

<template>
    <AppLayout :breadcrumbs="breadcrumbs">
        <Head title="User Info Settings" />

        <SettingsLayout>
            <div class="flex flex-col space-y-6">
                <HeadingSmall title="User Information" description="Manage your public profile details" />

                <form @submit="onSubmit" class="space-y-6">
                    <FormField v-slot="{ componentField }" name="jobTitle">
                        <FormItem>
                            <Label>Job Title</Label>
                            <FormControl>
                                <Input type="text" placeholder="e.g. Security Engineer" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" name="department">
                        <FormItem>
                            <Label>Department</Label>
                            <FormControl>
                                <Input type="text" placeholder="e.g. IT Security" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" name="location">
                        <FormItem>
                            <Label>Location</Label>
                            <FormControl>
                                <Input type="text" placeholder="e.g. New York, USA" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" name="website">
                        <FormItem>
                            <Label>Website</Label>
                            <FormControl>
                                <Input type="text" placeholder="https://example.com" v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <div class="flex items-center gap-4">
                        <Button type="submit">Save</Button>

                        <Transition
                            enter-active-class="transition ease-in-out"
                            enter-from-class="opacity-0"
                            leave-active-class="transition ease-in-out"
                            leave-to-class="opacity-0"
                        >
                            <p v-show="showSuccess" class="text-sm text-neutral-600">Saved.</p>
                        </Transition>
                    </div>
                </form>
            </div>
        </SettingsLayout>
    </AppLayout>
</template>
