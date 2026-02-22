<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
    scanning?: boolean
    scanStatus?: string
}>(), {
    scanning: false,
    scanStatus: ''
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

// Helper to get badge variant based on status
const statusVariant = computed(() => {
    if (!props.scanStatus) return 'secondary'
    if (props.scanStatus.includes('Success')) return 'default'
    if (props.scanStatus.includes('Failed') || props.scanStatus.includes('Error')) return 'destructive'
    return 'secondary'
})

// Helper to get status color
const statusColor = computed(() => {
    if (props.scanStatus.includes('Success')) return 'text-green-600'
    if (props.scanStatus.includes('Failed') || props.scanStatus.includes('Error')) return 'text-red-600'
    return 'text-blue-600'
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
                                placeholder="Enter site URL (e.g., example.com)"
                                class="w-full"
                                :disabled="props.scanning"
                            />
                            <div class="flex gap-2">
                                <Button
                                    type="submit"
                                    :disabled="props.scanning || !url"
                                    class="flex-1"
                                >
                                    {{ props.scanning ? 'Scanning...' : 'Run Scan' }}
                                </Button>
                                <Button
                                    variant="outline"
                                    type="button"
                                    @click="$emit('clear')"
                                    :disabled="props.scanning"
                                >
                                    Clear
                                </Button>
                            </div>

                            <!-- Improved Status Display - Single Spinner Here -->
                            <div
                                v-if="props.scanning && props.scanStatus"
                                class="mt-2 rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 p-4"
                            >
                                <div class="flex items-center gap-3">
                                    <!-- Single Animated Spinner -->
                                    <Loader2 class="h-5 w-5 animate-spin text-primary" />

                                    <!-- Status Info -->
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm font-semibold">Scan in Progress</span>
                                            <Badge :variant="statusVariant" class="text-xs">
                                                {{ props.scanStatus }}
                                            </Badge>
                                        </div>
                                        <p class="text-xs text-muted-foreground mt-1">
                                            This may take a few minutes...
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- URL Preview Info -->
                            <div v-if="url && !props.scanning" class="text-xs text-muted-foreground">
                                <span class="font-medium">Target:</span>
                                <span class="font-mono">{{ previewUrl }}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Preview Panel -->
                    <div class="row-span-2 col-span-3">
                        <Card class="sticky top-4 h-full">
                            <CardHeader class="pb-2">
                                <CardTitle class="text-lg">Target Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div class="bg-muted relative aspect-video w-full overflow-hidden rounded-md border">
                                    <iframe
                                        v-if="previewUrl && !props.scanning"
                                        :src="previewUrl"
                                        class="h-full w-full border-0"
                                        sandbox="allow-scripts allow-same-origin"
                                    ></iframe>

                                    <!-- Placeholder when scanning -->
                                    <div
                                        v-else-if="props.scanning"
                                        class="flex h-full flex-col items-center justify-center p-4 text-center"
                                    >
                                        <Loader2 class="h-12 w-12 animate-spin text-primary mb-4" />
                                        <span class="text-sm font-medium">Scanning {{ url }}</span>
                                        <span class="text-xs text-muted-foreground mt-1">
                                            {{ props.scanStatus }}
                                        </span>
                                    </div>

                                    <!-- Empty state -->
                                    <div
                                        v-else
                                        class="text-muted-foreground flex h-full flex-col items-center justify-center p-4 text-center"
                                    >
                                        <svg
                                            class="h-16 w-16 mb-4 opacity-20"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                                            />
                                        </svg>
                                        <span class="text-sm font-medium">Enter a URL to preview</span>
                                        <span class="text-xs mt-1">Site preview will appear here</span>
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
