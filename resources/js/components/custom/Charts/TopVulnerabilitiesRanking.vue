<script setup lang="ts">
// FIX: Corrected the import syntax
import { computed } from 'vue'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHead,
    TableRow,
} from '@/components/ui/table'
import SeverityBadge from '@/components/custom/SeverityBadge.vue'
import type { FullVulnerability } from '@/lib/restack/historyParsers'

// Define props to accept vulnerability data
const props = defineProps<{
    vulnerabilities: FullVulnerability[]
}>()

// Define the event this component can emit
const emit = defineEmits<{
    (e: 'view-vulnerability', vuln: FullVulnerability): void
}>()

// Rank vulnerabilities by count
const rankedVulnerabilities = computed(() => {
    const vulnMap = new Map<string, { count: number; vuln: FullVulnerability }>()

    props.vulnerabilities.forEach((vuln) => {
        const key = vuln.type // Group by vulnerability type/name
        if (vulnMap.has(key)) {
            vulnMap.get(key)!.count++
        }
        else {
            vulnMap.set(key, { count: 1, vuln })
        }
    })

    return Array.from(vulnMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Get top 10
})

// Emit the event to the parent component
function handleRowClick(vuln: FullVulnerability) {
    emit('view-vulnerability', vuln)
}
</script>

<template>
    <Card class="h-full">
        <CardHeader>
            <CardTitle>Top 10 Vulnerabilities</CardTitle>
            <CardDescription>
                Most frequently occurring vulnerability types.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead class="w-[50px]">
                            Rank
                        </TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead class="w-[80px]">
                            Count
                        </TableHead>
                        <TableHead class="w-[80px]">
                            Severity
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody v-if="rankedVulnerabilities.length > 0">
                    <TableRow
                        v-for="(item, index) in rankedVulnerabilities"
                        :key="item.vuln.id"
                        class="cursor-pointer"
                        @click="handleRowClick(item.vuln)"
                    >
                        <TableCell class="font-medium">
                            #{{ index + 1 }}
                        </TableCell>
                        <TableCell class="max-w-[250px] truncate font-medium">
                            {{ item.vuln.type }}
                        </TableCell>
                        <TableCell>
                            {{ item.count }}
                        </TableCell>
                        <TableCell>
                            <SeverityBadge :severity="item.vuln.severity" />
                        </TableCell>
                    </TableRow>
                </TableBody>
                <TableBody v-else>
                    <TableRow>
                        <TableCell
                            :colspan="4"
                            class="h-24 text-center text-muted-foreground"
                        >
                            No vulnerabilities found.
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </CardContent>
    </Card>
</template>
