<script setup lang="ts">
import { computed, ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Sparkles, FileText, Server, Copy, Check } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const props = defineProps<{
    summary: {
        summary: {
            vulnerabilities: string
            tech: string
        }
    }
}>()

const vulnSummary = computed(() => props.summary?.summary?.vulnerabilities || 'No vulnerability analysis provided.')
const techSummary = computed(() => props.summary?.summary?.tech || 'No technical analysis provided.')

const copiedVuln = ref(false)
const copiedTech = ref(false)

function parseMarkdown(text: string) {
    if (!text) return ''

    let html = text
        // 1. Security: Escape HTML first
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    // 2. Code Blocks: ```code```
    // We handle this early to prevent other regex from messing up the code content
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        return `<div class="bg-slate-900 text-slate-100 p-3 rounded-md my-3 text-xs font-mono overflow-x-auto"><pre><code>${code.trim()}</code></pre></div>`
    })

    // 3. Inline Code: `code`
    html = html.replace(/`([^`]+)`/g, '<span class="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-300 font-medium">$1</span>')

    // 4. Headings: ###, ##, #
    html = html
        .replace(/^### (.*$)/gm, '<h3 class="text-sm font-bold text-slate-900 mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 class="text-base font-bold text-slate-900 mt-5 mb-2 border-b pb-1">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 class="text-lg font-bold text-slate-900 mt-6 mb-3">$1</h1>')

    // 5. Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')

    // 6. Lists: * text or - text
    // Using a flex-row div simulates a list item without needing strict <ul> wrapping logic
    html = html.replace(/^\s*[\-\*]\s+(.*)$/gm,
        '<div class="flex items-start gap-2 my-1.5"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"></span><span>$1</span></div>')

    // 7. Paragraphs: Double newlines become spacing
    html = html.replace(/\n\n/g, '<div class="h-2"></div>')

    // 8. Remaining single newlines (optional, purely for soft breaks)
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
    } catch (err) {
        toast.error('Failed to copy to clipboard')
    }
}
</script>

<template>
    <Card>
        <CardHeader>
            <div class="flex items-center justify-between">
                <div>
                    <CardTitle>AI Summary</CardTitle>
                    <CardDescription>Powered by Gemini</CardDescription>
                </div>
                <Sparkles class="h-5 w-5 text-muted-foreground" />
            </div>
        </CardHeader>
        <Separator />
        <CardContent class="pt-6">
            <Tabs default-value="vulns" class="w-full">
                <TabsList class="grid w-full grid-cols-2">
                    <TabsTrigger value="vulns">
                        <FileText class="h-4 w-4 mr-2" />
                        Vulnerability Analysis
                    </TabsTrigger>
                    <TabsTrigger value="tech">
                        <Server class="h-4 w-4 mr-2" />
                        Tech Stack Review
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="vulns" class="mt-4">
                    <div class="flex justify-end mb-2">
                        <Button
                            variant="outline"
                            size="sm"
                            @click="copyToClipboard(vulnSummary, 'vuln')"
                        >
                            <Check v-if="copiedVuln" class="h-4 w-4 mr-2" />
                            <Copy v-else class="h-4 w-4 mr-2" />
                            {{ copiedVuln ? 'Copied!' : 'Copy' }}
                        </Button>
                    </div>
                    <ScrollArea class="h-[400px] rounded-md border p-4">
                        <div
                            class="prose prose-sm prose-slate max-w-none text-muted-foreground font-sans text-sm leading-relaxed"
                            v-html="parseMarkdown(vulnSummary)"
                        ></div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="tech" class="mt-4">
                    <div class="flex justify-end mb-2">
                        <Button
                            variant="outline"
                            size="sm"
                            @click="copyToClipboard(techSummary, 'tech')"
                        >
                            <Check v-if="copiedTech" class="h-4 w-4 mr-2" />
                            <Copy v-else class="h-4 w-4 mr-2" />
                            {{ copiedTech ? 'Copied!' : 'Copy' }}
                        </Button>
                    </div>
                    <ScrollArea class="h-[400px] rounded-md border p-4">
                        <div
                            class="prose prose-sm prose-slate max-w-none text-muted-foreground font-sans text-sm leading-relaxed"
                            v-html="parseMarkdown(techSummary)"
                        ></div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
</template>
