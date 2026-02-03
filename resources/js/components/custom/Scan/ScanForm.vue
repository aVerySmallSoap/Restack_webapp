<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

const props = withDefaults(defineProps<{
    scanning?: boolean
    progress?: number
}>(), {
    scanning: false,
    progress: 0
})

const emit = defineEmits<{
    (e: 'submit', payload: { url: string; type: 'basic' | 'full'; config?: any }): void
    (e: 'clear'): void
}>()

const url = ref('')
const activeScanType = ref<'basic' | 'full'>('basic')

// Full scan options
const useZap = ref(true)

const previewUrl = computed(() => {
    if (!url.value) return ''
    return /^https?:\/\//i.test(url.value) ? url.value : `http://${url.value}`
})

function onSubmit() {
    const config = activeScanType.value === 'full' ? { useZap: useZap.value } : undefined
    emit('submit', {
        url: url.value,
        type: activeScanType.value,
        config
    })
}

function onTabChange(value: string) {
    activeScanType.value = value as 'basic' | 'full'
    emit('clear')
}
</script>

<template>
    <Tabs v-model="activeScanType" class="w-full" @update:model-value="onTabChange">
        <TabsList class="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="basic">Basic Scan</TabsTrigger>
            <TabsTrigger value="full">Full Scan</TabsTrigger>
        </TabsList>

        <TabsContent v-for="type in ['basic', 'full']" :key="type" :value="type">
            <form @submit.prevent="onSubmit">
                <div class="grid grid-rows-2 grid-cols-5 gap-4">
                    <Card class="row-span-2 col-span-2 flex flex-col">
                        <CardHeader class="flex">
                            <div>
                                <CardTitle>{{ type === 'basic' ? 'Basic' : 'Full' }} Scan</CardTitle>
                                <CardContent class="px-0 pt-4 pb-0">
                                    <span class="text-muted-foreground text-sm">
                                        {{ type === 'basic'
                                        ? 'Runs a fast, preconfigured Wapiti scan.'
                                        : 'Comprehensive scan using Wapiti, ZAP, and Nuclei.'
                                        }}
                                    </span>
                                </CardContent>
                            </div>
                        </CardHeader>
                        <CardContent class="flex flex-col gap-4 pt-6">
                            <Input
                                v-model="url"
                                placeholder="Enter site URL"
                                class="w-full"
                                :disabled="props.scanning"
                            />
                            <div class="flex gap-2">
                                <Button type="submit" :disabled="props.scanning">
                                    <svg v-if="props.scanning" class="mr-3 -ml-1 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {{ props.scanning ? 'Scanning...' : 'Run Scan' }}
                                </Button>
                                <Button variant="secondary" type="button" @click="$emit('clear')" :disabled="props.scanning">
                                    Clear
                                </Button>
                            </div>
                            <div v-if="props.scanning && props.progress !== undefined" class="mt-2">
                                <Progress :model-value="props.progress" class="h-2" />
                                <p class="text-xs text-muted-foreground mt-1 text-center">
                                    {{ Math.round(props.progress) }}%
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <div class="row-span-2 col-span-3">
                        <Card class="sticky top-4">
                            <CardHeader class="pb-2">
                                <CardTitle class="text-lg">Target Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div class="bg-muted relative aspect-video w-full overflow-hidden rounded-md border">
                                    <iframe
                                        v-if="previewUrl"
                                        :src="previewUrl"
                                        class="h-full w-full border-0"
                                        sandbox="allow-scripts allow-same-origin"
                                    ></iframe>
                                    <div v-else class="text-muted-foreground flex h-full flex-col items-center justify-center p-4 text-center">
                                        <span class="text-xs">Enter a URL to see a preview</span>
                                    </div>
                                </div>
                                <p class="text-muted-foreground mt-2 text-center text-[10px]">
                                    Preview may not load if blocked by site policy (X-Frame-Options).
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </TabsContent>
    </Tabs>
</template>
