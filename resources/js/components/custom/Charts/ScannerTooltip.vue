<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

defineProps<{
    title?: string
    data: {
        color: string
        value: any
    }[]
}>()
</script>

<template>
    <Card class="text-sm">
        <CardHeader class="border-b p-3">
            <CardTitle>{{ title }}</CardTitle>
        </CardHeader>
        <CardContent class="p-3">
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-[2px]" :style="{ background: data[0]?.color }" />
                    <span class="font-medium text-muted-foreground">{{ title }}</span>
                </div>
                <span class="font-bold font-mono">{{ data[0]?.value }}</span>
            </div>
        </CardContent>
    </Card>
</template>
