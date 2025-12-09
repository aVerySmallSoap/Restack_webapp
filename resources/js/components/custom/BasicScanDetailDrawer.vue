<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Copy, ExternalLink } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Vulnerability } from '@/lib/restack/restack.types'
import { getSeverityColor } from '@/lib/colors'

const props = defineProps<{
    vuln: Vulnerability | null
    open: boolean
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
}>()

// Use centralized color logic
const severityStyle = computed(() => {
    return {
        backgroundColor: getSeverityColor(props.vuln?.severity || 'informational'),
        color: '#ffffff',
        border: 'none'
    }
})

// Robust title resolution: Name -> Category -> Type -> Fallback
const vulnTitle = computed(() => {
    if (props.vuln?.name && props.vuln.name !== 'Vulnerability') return props.vuln.name
    if (props.vuln?.category && props.vuln.category !== 'Vulnerability') return props.vuln.category
    if (props.vuln?.type && props.vuln.type !== 'Vulnerability') return props.vuln.type
    return 'Vulnerability'
})

const parsedReferences = computed(() => {
    if (!props.vuln?.reference) return []
    try {
        const refs = JSON.parse(props.vuln.reference)
        return Object.entries(refs).map(([title, url]) => ({ title, url: String(url) }))
    } catch {
        return []
    }
})

const wstgTags = computed(() => props.vuln?.wstg || [])

function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
}
</script>

<template>
    <Sheet :open="open" @update:open="emit('update:open', $event)">
        <SheetContent class="w-full sm:max-w-2xl bg-background text-foreground p-0 gap-0">
            <div class="p-6 pb-2">
                <SheetHeader>
                    <SheetTitle class="flex items-center gap-2 text-2xl break-words">
                        <Badge :style="severityStyle">{{ vuln?.severity || 'Unknown' }}</Badge>
                        <span class="truncate">{{ vulnTitle }}</span>
                    </SheetTitle>
                    <SheetDescription>
                        <div class="flex flex-wrap items-center gap-4 text-sm mt-2">
                            <div><strong>Scanner:</strong> {{ vuln?.scanner || 'wapiti' }}</div>
                            <div v-if="vuln?.method"><strong>Method:</strong> {{ vuln?.method }}</div>
                            <div class="truncate max-w-[300px]" v-if="vuln?.endpoint"><strong>Endpoint:</strong> {{ vuln?.endpoint }}</div>
                        </div>
                    </SheetDescription>
                </SheetHeader>
            </div>
            <Separator class="my-2" />
            <ScrollArea class="h-[calc(100vh-140px)] px-6">
                <div class="pb-6">
                    <Tabs default-value="overview" class="w-full">
                        <TabsList class="grid w-full grid-cols-4 mb-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="technical">Technical</TabsTrigger>
                            <TabsTrigger value="solution">Solution</TabsTrigger>
                            <TabsTrigger value="references">References</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" class="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p class="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                        {{ vuln?.description || 'No description available.' }}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card v-if="wstgTags.length">
                                <CardHeader>
                                    <CardTitle>WSTG Categories</CardTitle>
                                    <CardDescription>Web Security Testing Guide classifications</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div class="flex flex-wrap gap-2">
                                        <Badge v-for="tag in wstgTags" :key="tag" variant="outline">
                                            {{ tag }}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="technical" class="space-y-4">
                            <Card v-if="vuln?.http_request">
                                <CardHeader>
                                    <div class="flex items-center justify-between">
                                        <CardTitle>HTTP Request</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            @click="copyToClipboard(vuln.http_request!, 'HTTP Request')"
                                        >
                                            <Copy class="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <pre class="text-xs bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-all font-mono">{{ vuln.http_request }}</pre>
                                </CardContent>
                            </Card>
                            <Card v-if="vuln?.curl_command">
                                <CardHeader>
                                    <div class="flex items-center justify-between">
                                        <CardTitle>cURL Command</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            @click="copyToClipboard(vuln.curl_command!, 'cURL Command')"
                                        >
                                            <Copy class="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <pre class="text-xs bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-all font-mono">{{ vuln.curl_command }}</pre>
                                </CardContent>
                            </Card>
                            <Card v-if="!vuln?.http_request && !vuln?.curl_command">
                                <CardContent class="pt-6">
                                    <p class="text-sm text-muted-foreground text-center">No technical details available.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="solution" class="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recommended Solution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p class="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                        {{ vuln?.solution || 'No solution provided.' }}
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="references" class="space-y-4">
                            <Card v-if="parsedReferences.length">
                                <CardHeader>
                                    <CardTitle>External References</CardTitle>
                                    <CardDescription>Additional resources and documentation</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div class="space-y-2">
                                        <a
                                            v-for="(ref, idx) in parsedReferences"
                                            :key="idx"
                                            :href="ref.url"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                                        >
                                            <span class="text-sm font-medium">{{ ref.title }}</span>
                                            <ExternalLink class="h-4 w-4 text-muted-foreground" />
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card v-else>
                                <CardContent class="pt-6">
                                    <p class="text-sm text-muted-foreground text-center">No references available.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </ScrollArea>
        </SheetContent>
    </Sheet>
</template>
