<script setup lang="ts">
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

defineProps<{
    vuln: Record<string, any>
    open: boolean
}>()

defineEmits(['update:open'])

function getSeverityBadge(severity: string) {
    switch (severity?.toLowerCase()) {
        case 'critical':
            return 'destructive'
        case 'high':
            return 'destructive'
        case 'medium':
            return 'default'
        default:
            return 'secondary'
    }
}
</script>

<template>
    <Sheet :open="open" @update:open="(val) => $emit('update:open', val)">
        <SheetContent class="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
                <SheetTitle class="text-2xl">{{ vuln.type }}</SheetTitle>
                <SheetDescription>
                    {{ vuln.description }}
                </SheetDescription>
            </SheetHeader>

            <div class="px-4 space-y-4 py-4">
                <div class="flex flex-wrap gap-2">
                    <Badge :variant="getSeverityBadge(vuln.severity)">
                        Severity: {{ vuln.severity }}
                    </Badge>
                    <Badge variant="outline">
                        Scanner: {{ vuln.scanner }}
                    </Badge>
                    <Badge variant="outline">
                        Confidence: {{ vuln.confidence }}
                    </Badge>
                </div>

                <Separator />

                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 class="font-semibold">Method</h4>
                        <p class="text-muted-foreground">{{ vuln.method }}</p>
                    </div>
                    <div>
                        <h4 class="font-semibold">Endpoint</h4>
                        <p class="text-muted-foreground truncate">{{ vuln.endpoint }}</p>
                    </div>
                </div>

                <div v-if="vuln.exploit" class="space-y-2">
                    <h4 class="font-semibold">Exploit / Parameter</h4>
                    <pre class="text-sm bg-muted p-2 rounded-md overflow-x-auto"><code>{{ vuln.exploit }}</code></pre>
                </div>

                <Separator />

                <div class="space-y-2">
                    <h4 class="font-semibold">Solution</h4>
                    <p class="text-sm text-muted-foreground">
                        {{ vuln.solution }}
                    </p>
                </div>

                <div v-if="vuln.reference" class="space-y-2">
                    <h4 class="font-semibold">Reference</h4>
                    <a :href="vuln.reference" target="_blank" class="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all">
                        {{ vuln.reference }}
                    </a>
                </div>
            </div>
        </SheetContent>
    </Sheet>
</template>
