<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Sparkles, FileText, Server } from 'lucide-vue-next'

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
</script>

<template>
    <Card class="border-slate-200 shadow-sm h-full flex flex-col">
        <CardHeader class="bg-slate-50 pb-4 shrink-0">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <Sparkles class="h-5 w-5 text-slate-600" />
                    <CardTitle class="text-slate-900">AI Summary</CardTitle>
                </div>
                <Badge variant="outline" class="bg-white text-slate-600 border-slate-300">
                    Generative Analysis
                </Badge>
            </div>
            <CardDescription>
                Powered by Gemini.
            </CardDescription>
        </CardHeader>

        <CardContent class="pt-0 flex-1 min-h-0">
            <Tabs default-value="vulns" class="w-full h-full flex flex-col">
                <TabsList class="w-full justify-start rounded-none border-b bg-transparent p-0 mb-2 shrink-0">
                    <TabsTrigger value="vulns" class="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-4 pb-2 pt-2">
                        <div class="flex items-center gap-2">
                            <FileText class="h-4 w-4" />
                            Vulnerability Analysis
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="tech" class="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-4 pb-2 pt-2">
                        <div class="flex items-center gap-2">
                            <Server class="h-4 w-4" />
                            Tech Stack Review
                        </div>
                    </TabsTrigger>
                </TabsList>

                <div class="h-[230px]">
                    <TabsContent value="vulns" class="h-full m-0">
                        <ScrollArea class="h-full pr-4">
                            <div
                                class="prose prose-sm prose-slate max-w-none text-muted-foreground font-sans text-sm leading-relaxed pb-4"
                                v-html="parseMarkdown(vulnSummary)"
                            ></div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="tech" class="h-full m-0">
                        <ScrollArea class="h-full pr-4">
                            <div
                                class="prose prose-sm prose-slate max-w-none text-muted-foreground font-sans text-sm leading-relaxed pb-4"
                                v-html="parseMarkdown(techSummary)"
                            ></div>
                        </ScrollArea>
                    </TabsContent>
                </div>
            </Tabs>
        </CardContent>
    </Card>
</template>
