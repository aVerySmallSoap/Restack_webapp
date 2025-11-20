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

// 1. Updated Interface to match Scan.vue exactly
interface BasicVulnerability {
    level: number
    method: string
    path: string
    info: string
    module: string
    category: string
    description: string
    solution: string
    references: Record<string, string>
    wstg: string[]
    severity: string
    http_request?: string
    curl_command?: string
}

const props = defineProps<{
    vuln: BasicVulnerability | null
    open: boolean
}>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
}>()

const openState = computed({
    get: () => props.open,
    set: (value: boolean) => emit('update:open', value),
})

// 2. Updated to use flat 'references' property
const referencesList = computed(() => {
    if (!props.vuln?.references) return []
    return Object.entries(props.vuln.references).map(([key, value]) => ({ key, value }))
})

// 3. Updated Badge Logic for 'High', 'Medium', 'Low'
function getSeverityVariant(severity: string): 'destructive' | 'default' | 'secondary' | 'outline' {
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
                    <SheetTitle>{{ vuln.category }}</SheetTitle>
                    <SheetDescription>
                        <div class="flex items-center gap-2 pt-2">
                            <Badge :variant="getSeverityVariant(vuln.severity)">
                                {{ vuln.severity }}
                            </Badge>
                            <span v-if="vuln.module" class="text-xs text-muted-foreground">
                                Module: {{ vuln.module }}
                            </span>
                        </div>
                    </SheetDescription>
                </SheetHeader>

                <div class="p-4 pb-0">
                    <Accordion type="single" collapsible default-value="item-1">

                        <AccordionItem value="item-1">
                            <AccordionTrigger>Description</AccordionTrigger>
                            <AccordionContent class="text-sm text-muted-foreground leading-relaxed">
                                {{ vuln.description || 'No description provided.' }}
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2">
                            <AccordionTrigger>Details</AccordionTrigger>
                            <AccordionContent class="space-y-3">
                                <div>
                                    <div class="text-xs font-semibold mb-1">Path</div>
                                    <CodeBlock :code="vuln.path" lang="text" class="text-xs" />
                                </div>
                                <div v-if="vuln.info">
                                    <div class="text-xs font-semibold mb-1">Info</div>
                                    <CodeBlock :code="vuln.info" lang="text" class="text-xs" />
                                </div>
                                <div v-if="vuln.method">
                                    <div class="text-xs font-semibold mb-1">Method</div>
                                    <CodeBlock :code="vuln.method" lang="text" class="text-xs" />
                                </div>
                                <div v-if="vuln.http_request">
                                    <div class="text-xs font-semibold mb-1">Request Dump</div>
                                    <CodeBlock :code="vuln.http_request" lang="http" class="text-xs" />
                                </div>
                                <div v-if="vuln.curl_command">
                                    <div class="text-xs font-semibold mb-1">cURL Reproduction</div>
                                    <CodeBlock :code="vuln.curl_command" lang="bash" class="text-xs" />
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3">
                            <AccordionTrigger>Solution</AccordionTrigger>
                            <AccordionContent class="text-sm text-muted-foreground leading-relaxed">
                                {{ vuln.solution || 'No solution provided.' }}
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-4">
                            <AccordionTrigger>References</AccordionTrigger>
                            <AccordionContent>
                                <ul v-if="referencesList.length > 0" class="list-disc space-y-1 pl-4 text-sm">
                                    <li v-for="ref in referencesList" :key="ref.key">
                                        <a :href="ref.value" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline break-all">
                                            {{ ref.key }}
                                        </a>
                                    </li>
                                </ul>
                                <span v-else class="text-sm text-muted-foreground">No references provided.</span>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-5" v-if="vuln.wstg && vuln.wstg.length">
                            <AccordionTrigger>Tags / WSTG</AccordionTrigger>
                            <AccordionContent>
                                <div class="flex flex-wrap gap-2">
                                    <Badge variant="outline" v-for="tag in vuln.wstg" :key="tag">{{ tag }}</Badge>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                    </Accordion>
                </div>
            </div>
        </SheetContent>
    </Sheet>
</template>
