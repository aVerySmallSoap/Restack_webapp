<script setup lang="ts">
import { computed } from 'vue'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet' // Use Sheet for consistency
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import CodeBlock from '@/components/custom/CodeBlock.vue'

// Define the structure of the basic vulnerability
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
}

// Component props and emits
const props = defineProps<{
  vuln: BasicVulnerability | null
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

// Computed properties for cleanliness
const openState = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

const referencesList = computed(() => {
  if (!props.vuln?.references)
    return []
  return Object.entries(props.vuln.references).map(([key, value]) => ({ key, value }))
})

// Helper for severity badge
function getSeverityBadge(level: number) {
    if (level >= 3) return 'destructive'
    if (level === 2) return 'default'
    return 'secondary'
}
</script>

<template>
  <Sheet :open="openState" @update:open="openState = $event">
    <SheetContent class="w-full sm:max-w-2xl overflow-y-auto">
      <div v-if="vuln" class="mx-auto w-full">
        <SheetHeader>
          <SheetTitle>{{ vuln.category }}</SheetTitle>
          <SheetDescription>
            <div class="flex items-center gap-2 pt-2">
              <Badge :variant="getSeverityBadge(vuln.level)">
                {{ vuln.severity }}
              </Badge>
              <span class="text-xs text-muted-foreground">Module: {{ vuln.module }}</span>
            </div>
          </SheetDescription>
        </SheetHeader>
        <div class="p-4 pb-0">
          <Accordion type="single" collapsible default-value="'item-1'">
            <AccordionItem value="item-1">
              <AccordionTrigger>Description</AccordionTrigger>
              <AccordionContent>
                {{ vuln.description }}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Details</AccordionTrigger>
              <AccordionContent class="space-y-2">
                <CodeBlock :code="`Path: ${vuln.path}`" lang="text" />
                <CodeBlock :code="`Info: ${vuln.info}`" lang="text" />
                <CodeBlock :code="`Method: ${vuln.method}`" lang="text" />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Solution</AccordionTrigger>
              <AccordionContent>
                {{ vuln.solution }}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>References</AccordionTrigger>
              <AccordionContent>
                <ul v-if="referencesList.length > 0" class="list-disc space-y-1 pl-4">
                  <li v-for="ref in referencesList" :key="ref.key">
                    <a :href="ref.value" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">
                      {{ ref.key }}
                    </a>
                  </li>
                </ul>
                <span v-else>No references provided.</span>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
