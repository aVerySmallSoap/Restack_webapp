<script setup lang="ts">
import { computed } from 'vue'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import CodeBlock from '@/components/custom/CodeBlock.vue'

// 1. Updated Interface to match Scan.vue's parser output
interface FullVulnerability {
    id: string
    type: string      // Name/Rule ID
    severity: string
    scanner: string
    confidence: string
    method: string
    endpoint: string
    exploit: string
    description: string
    solution: string
    reference: string // Markdown or Text links
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

// Helper to parse markdown links if present, otherwise return as string
// This is a simple heuristic since the API returns raw markdown in 'reference'
const parsedReferences = computed(() => {
    if (!props.vuln?.reference || props.vuln.reference === 'N/A') return []

    // Regex to find [Title](URL) or just URLs
    const markdownRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const links = []
    let match

    // Try to match Markdown links
    while ((match = markdownRegex.exec(props.vuln.reference)) !== null) {
        links.push({ title: match[1], url: match[2] })
    }

    // If no markdown links found, but text exists, try to split by newlines and find http
    if (links.length === 0) {
        const lines = props.vuln.reference.split('\n')
        lines.forEach(line => {
            if (line.includes('http')) {
                links.push({ title: line, url: line.trim() }) // formatting could be improved here
            }
        })
    }

    return links
})

function getSeverityVariant(severity: string | undefined): 'destructive' | 'default' | 'secondary' | 'outline' {
    switch (severity?.toLowerCase()) {
        case 'critical':
        case 'high':
            return 'destructive'
        case 'medium':
            return 'default'
        case 'low':
            return 'secondary'
        default:
            return 'outline'
    }
}
</script>

<template>
    <Sheet :open="openState" @update:open="openState = $event">
        <SheetContent class="w-full sm:max-w-2xl overflow-y-auto bg-background text-foreground">
            <div v-if="vuln" class="mx-auto w-full">
                <SheetHeader>
                    <SheetTitle class="text-2xl break-words">{{ vuln.type }}</SheetTitle>
                    <SheetDescription>
                        <div class="flex flex-wrap items-center gap-2 pt-2">
                            <Badge :variant="getSeverityVariant(vuln.severity)">
                                {{ vuln.severity }}
                            </Badge>
                            <Badge variant="outline">
                                Scanner: {{ vuln.scanner }}
                            </Badge>
                            <Badge variant="outline" v-if="vuln.confidence && vuln.confidence !== 'Unknown'">
                                Confidence: {{ vuln.confidence }}
                            </Badge>
                        </div>
                    </SheetDescription>
                </SheetHeader>

                <div class="p-4 pb-0">
                    <Accordion type="single" collapsible default-value="item-1">

                        <AccordionItem value="item-1">
                            <AccordionTrigger>Description</AccordionTrigger>
                            <AccordionContent class="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {{ vuln.description }}
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2">
                            <AccordionTrigger>Technical Details</AccordionTrigger>
                            <AccordionContent class="space-y-3">
                                <div>
                                    <div class="text-xs font-semibold mb-1">Location / Endpoint</div>
                                    <CodeBlock :code="vuln.endpoint" lang="text" class="text-xs" />
                                </div>
                                <div v-if="vuln.method && vuln.method !== 'GET'">
                                    <div class="text-xs font-semibold mb-1">Method</div>
                                    <CodeBlock :code="vuln.method" lang="text" class="text-xs" />
                                </div>
                                <div v-if="vuln.exploit">
                                    <div class="text-xs font-semibold mb-1">Evidence / Payload</div>
                                    <CodeBlock :code="vuln.exploit" lang="text" class="text-xs" />
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3">
                            <AccordionTrigger>Solution</AccordionTrigger>
                            <AccordionContent class="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {{ vuln.solution }}
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-4" v-if="parsedReferences.length > 0">
                            <AccordionTrigger>References</AccordionTrigger>
                            <AccordionContent>
                                <ul class="list-disc space-y-1 pl-4 text-sm">
                                    <li v-for="(ref, idx) in parsedReferences" :key="idx">
                                        <a :href="ref.url" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline break-all">
                                            {{ ref.title }}
                                        </a>
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-4-raw" v-else-if="vuln.reference && vuln.reference !== 'N/A'">
                            <AccordionTrigger>References</AccordionTrigger>
                            <AccordionContent class="text-xs whitespace-pre-wrap font-mono">
                                {{ vuln.reference }}
                            </AccordionContent>
                        </AccordionItem>

                    </Accordion>
                </div>
            </div>
        </SheetContent>
    </Sheet>
</template>
