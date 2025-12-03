<script setup lang="ts">
import { computed } from 'vue'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Copy, ExternalLink } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import CodeBlock from '@/components/custom/CodeBlock.vue'

// Extend interface to support fields from Automated/Basic scans
interface FullVulnerability {
    id: string
    type: string
    severity: string
    scanner: string
    confidence: string
    method: string
    endpoint: string
    exploit: string
    description: string
    solution: string
    reference: string
    http_request?: string
    curl_command?: string
    module?: string
}

const props = defineProps<{
    vuln: FullVulnerability | null
    open: boolean
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
}>()

const openState = computed({
    get: () => props.open,
    set: (value: boolean) => emit('update:open', value),
})

const parsedReferences = computed(() => {
    if (!props.vuln?.reference || props.vuln.reference === 'N/A') return []

    const markdownRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const links = []
    let match

    while ((match = markdownRegex.exec(props.vuln.reference)) !== null) {
        links.push({ title: match[1], url: match[2] })
    }

    if (links.length === 0) {
        const lines = props.vuln.reference.split('\n')
        lines.forEach(line => {
            if (line.includes('http')) {
                links.push({ title: line, url: line.trim() })
            }
        })
    }
    return links
})

function getSeverityVariant(severity: string | undefined): 'destructive' | 'default' | 'secondary' | 'outline' {
    switch (severity?.toLowerCase()) {
        case 'critical': case 'high': return 'destructive'
        case 'medium': return 'default'
        case 'low': return 'secondary'
        default: return 'outline'
    }
}

function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
}
</script>

<template>
    <Sheet :open="openState" @update:open="openState = $event">
        <SheetContent class="w-full sm:max-w-2xl bg-background text-foreground p-0 gap-0">
            <div class="p-6 pb-2">
                <SheetHeader>
                    <SheetTitle class="flex items-center gap-2 text-2xl break-words">
                        <Badge :variant="getSeverityVariant(vuln?.severity)">{{ vuln?.severity || 'Unknown' }}</Badge>
                        <span class="truncate">{{ vuln?.type || 'Vulnerability' }}</span>
                    </SheetTitle>
                    <SheetDescription>
                        <div class="flex flex-wrap items-center gap-4 text-sm mt-2">
                            <div v-if="vuln?.scanner"><strong>Scanner:</strong> {{ vuln.scanner }}</div>
                            <div v-if="vuln?.confidence && vuln.confidence !== 'Unknown'"><strong>Confidence:</strong> {{ vuln.confidence }}</div>
                            <div v-if="vuln?.module"><strong>Module:</strong> {{ vuln.module }}</div>
                        </div>
                    </SheetDescription>
                </SheetHeader>
            </div>
            <Separator class="my-2" />
            <ScrollArea class="h-[calc(100vh-140px)] px-6">
                <Tabs default-value="overview" class="w-full pb-6">
                    <TabsList class="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="technical">Technical</TabsTrigger>
                        <TabsTrigger value="solution">Solution</TabsTrigger>
                        <TabsTrigger value="references">References</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" class="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                            <CardContent>
                                <p class="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{{ vuln?.description || 'No description available.' }}</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="technical" class="space-y-4">
                        <Card v-if="vuln?.http_request">
                            <CardHeader>
                                <div class="flex items-center justify-between">
                                    <CardTitle>HTTP Request</CardTitle>
                                    <Button variant="ghost" size="sm" @click="copyToClipboard(vuln.http_request!, 'HTTP Request')"><Copy class="h-4 w-4" /></Button>
                                </div>
                            </CardHeader>
                            <CardContent><CodeBlock :code="vuln.http_request" lang="http" class="text-xs" /></CardContent>
                        </Card>

                        <Card v-if="vuln?.curl_command">
                            <CardHeader>
                                <div class="flex items-center justify-between">
                                    <CardTitle>cURL Command</CardTitle>
                                    <Button variant="ghost" size="sm" @click="copyToClipboard(vuln.curl_command!, 'cURL Command')"><Copy class="h-4 w-4" /></Button>
                                </div>
                            </CardHeader>
                            <CardContent><CodeBlock :code="vuln.curl_command" lang="bash" class="text-xs" /></CardContent>
                        </Card>

                        <Card v-if="vuln?.exploit && vuln.exploit !== 'N/A'">
                            <CardHeader><CardTitle>Evidence / Payload</CardTitle></CardHeader>
                            <CardContent><CodeBlock :code="vuln.exploit" lang="text" class="text-xs" /></CardContent>
                        </Card>

                        <Card v-if="vuln?.endpoint">
                            <CardHeader><CardTitle>Location / Endpoint</CardTitle></CardHeader>
                            <CardContent><CodeBlock :code="vuln.endpoint" lang="text" class="text-xs" /></CardContent>
                        </Card>

                        <Card v-if="!vuln?.http_request && !vuln?.curl_command && (!vuln?.exploit || vuln.exploit === 'N/A')">
                            <CardContent class="pt-6"><p class="text-sm text-muted-foreground text-center">No technical details available.</p></CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="solution" class="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Recommended Solution</CardTitle></CardHeader>
                            <CardContent><p class="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{{ vuln?.solution || 'No solution provided.' }}</p></CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="references" class="space-y-4">
                        <Card v-if="parsedReferences.length">
                            <CardHeader><CardTitle>External References</CardTitle><CardDescription>Additional resources and documentation</CardDescription></CardHeader>
                            <CardContent>
                                <div class="space-y-2">
                                    <a v-for="(ref, idx) in parsedReferences" :key="idx" :href="ref.url" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors">
                                        <span class="text-sm font-medium truncate pr-4">{{ ref.title }}</span>
                                        <ExternalLink class="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                        <Card v-else-if="vuln?.reference && vuln.reference !== 'N/A'">
                            <CardHeader><CardTitle>Raw References</CardTitle></CardHeader>
                            <CardContent><pre class="text-xs whitespace-pre-wrap font-mono">{{ vuln.reference }}</pre></CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </ScrollArea>
        </SheetContent>
    </Sheet>
</template>
