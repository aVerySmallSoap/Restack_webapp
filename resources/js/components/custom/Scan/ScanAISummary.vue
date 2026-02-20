<script setup lang="ts">
import { computed, ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, FileText, Server, Copy, Check, AlertCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const props = defineProps<{
    summary?: {
        summary?: {
            vulnerabilities?: string
            tech?: string
        }
    } | null
}>()

const hasContent = computed(() =>
    props.summary?.summary?.vulnerabilities || props.summary?.summary?.tech
)

const vulnSummary = computed(() => props.summary?.summary?.vulnerabilities || '')
const techSummary = computed(() => props.summary?.summary?.tech || '')

const copiedVuln = ref(false)
const copiedTech = ref(false)

function parseMarkdown(text: string): string {
    if (!text) return ''

    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    // Code blocks
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) =>
        `<div class="markdown-code-block"><pre><code>${code.trim()}</code></pre></div>`
    )

    // Inline code
    html = html.replace(/`([^`]+)`/g,
        '<code class="markdown-inline-code">$1</code>'
    )

    // Headings
    html = html
        .replace(/^### (.*$)/gm, '<h3 class="markdown-h3">$1</h3>')
        .replace(/^## (.*$)/gm,  '<h2 class="markdown-h2">$1</h2>')
        .replace(/^# (.*$)/gm,   '<h1 class="markdown-h1">$1</h1>')

    // Bold + italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="markdown-bold">$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

    // Numbered lists
    html = html.replace(/^\s*(\d+)\.\s+(.*)$/gm,
        '<div class="markdown-list-item"><span class="markdown-list-number">$1.</span><span>$2</span></div>'
    )

    // Bullet lists
    html = html.replace(/^\s*[-*]\s+(.*)$/gm,
        '<div class="markdown-list-item"><span class="markdown-bullet">•</span><span>$1</span></div>'
    )

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr class="markdown-hr" />')

    // Paragraphs
    html = html.replace(/\n\n/g, '<div class="markdown-spacer"></div>')
    html = html.replace(/\n/g, ' ')

    return html
}

async function copyToClipboard(text: string, type: 'vuln' | 'tech') {
    try {
        await navigator.clipboard.writeText(text)
        if (type === 'vuln') {
            copiedVuln.value = true
            setTimeout(() => copiedVuln.value = false, 2000)
        } else {
            copiedTech.value = true
            setTimeout(() => copiedTech.value = false, 2000)
        }
        toast.success('Copied to clipboard')
    } catch {
        toast.error('Failed to copy')
    }
}
</script>

<template>
    <Card>
        <CardHeader>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <CardTitle>AI Summary</CardTitle>
                    <Badge variant="secondary" class="text-xs">Gemini</Badge>
                </div>
                <Sparkles class="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>AI-powered analysis of scan results</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent class="pt-6">

            <!-- No summary available -->
            <div v-if="!hasContent" class="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                <AlertCircle class="h-8 w-8" />
                <p class="text-sm font-medium">AI analysis unavailable</p>
                <p class="text-xs text-center max-w-xs">The AI summary could not be generated for this scan. This is usually due to API quota limits.</p>
            </div>

            <!-- Summary tabs -->
            <Tabs v-else default-value="vulns" class="w-full">
                <TabsList class="grid w-full grid-cols-2">
                    <TabsTrigger value="vulns">
                        <FileText class="h-4 w-4 mr-2" />
                        Vulnerabilities
                    </TabsTrigger>
                    <TabsTrigger value="tech">
                        <Server class="h-4 w-4 mr-2" />
                        Tech Stack
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="vulns" class="mt-4">
                    <div class="flex justify-end mb-2">
                        <Button variant="outline" size="sm" @click="copyToClipboard(vulnSummary, 'vuln')">
                            <Check v-if="copiedVuln" class="h-4 w-4 mr-2" />
                            <Copy v-else class="h-4 w-4 mr-2" />
                            {{ copiedVuln ? 'Copied!' : 'Copy' }}
                        </Button>
                    </div>
                    <ScrollArea class="h-[400px] rounded-md border p-4">
                        <div class="markdown-body" v-html="parseMarkdown(vulnSummary)" />
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="tech" class="mt-4">
                    <div class="flex justify-end mb-2">
                        <Button variant="outline" size="sm" @click="copyToClipboard(techSummary, 'tech')">
                            <Check v-if="copiedTech" class="h-4 w-4 mr-2" />
                            <Copy v-else class="h-4 w-4 mr-2" />
                            {{ copiedTech ? 'Copied!' : 'Copy' }}
                        </Button>
                    </div>
                    <ScrollArea class="h-[400px] rounded-md border p-4">
                        <div class="markdown-body" v-html="parseMarkdown(techSummary)" />
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
</template>

<style scoped>
/* All colors use CSS variables so they adapt to light/dark automatically */
.markdown-body {
    font-size: 0.875rem;
    line-height: 1.7;
    color: hsl(var(--foreground));
}

.markdown-body :deep(.markdown-h1) {
    font-size: 1.125rem;
    font-weight: 700;
    color: hsl(var(--foreground));
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
}

.markdown-body :deep(.markdown-h2) {
    font-size: 1rem;
    font-weight: 700;
    color: hsl(var(--foreground));
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid hsl(var(--border));
}

.markdown-body :deep(.markdown-h3) {
    font-size: 0.875rem;
    font-weight: 600;
    color: hsl(var(--foreground));
    margin-top: 1rem;
    margin-bottom: 0.375rem;
}

.markdown-body :deep(.markdown-bold) {
    font-weight: 600;
    color: hsl(var(--foreground));
}

.markdown-body :deep(.markdown-code-block) {
    background: hsl(var(--muted));
    color: hsl(var(--muted-foreground));
    padding: 0.75rem;
    border-radius: 0.375rem;
    margin: 0.75rem 0;
    font-size: 0.75rem;
    font-family: monospace;
    overflow-x: auto;
    border: 1px solid hsl(var(--border));
}

.markdown-body :deep(.markdown-inline-code) {
    background: hsl(var(--muted));
    color: hsl(var(--foreground));
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-family: monospace;
    border: 1px solid hsl(var(--border));
}

.markdown-body :deep(.markdown-list-item) {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin: 0.375rem 0;
}

.markdown-body :deep(.markdown-bullet) {
    color: hsl(var(--muted-foreground));
    margin-top: 0.1rem;
    flex-shrink: 0;
}

.markdown-body :deep(.markdown-list-number) {
    color: hsl(var(--muted-foreground));
    font-weight: 600;
    flex-shrink: 0;
    min-width: 1.25rem;
}

.markdown-body :deep(.markdown-hr) {
    border: none;
    border-top: 1px solid hsl(var(--border));
    margin: 1rem 0;
}

.markdown-body :deep(.markdown-spacer) {
    height: 0.5rem;
}
</style>