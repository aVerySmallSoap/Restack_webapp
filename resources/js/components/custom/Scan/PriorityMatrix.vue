<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

const props = defineProps<{
    matrix: {
        quadrant_counts: {
            high_severity_high_confidence: number
            high_severity_low_confidence: number
            low_severity_high_confidence: number
            low_severity_low_confidence: number
        }
    }
}>()

const counts = computed(() => props.matrix?.quadrant_counts || {
    high_severity_high_confidence: 0,
    high_severity_low_confidence: 0,
    low_severity_high_confidence: 0,
    low_severity_low_confidence: 0
})
</script>

<template>
    <Card class="h-full flex flex-col">
        <CardHeader class="shrink-0 pb-2">
            <CardTitle>Risk Priority</CardTitle>
            <CardDescription>What to fix first based on severity and certainty</CardDescription>
        </CardHeader>
        <CardContent class="flex-1 min-h-0 pt-0">
            <div class="grid grid-cols-2 gap-3 h-[230px]">

                <!-- Critical: Fix Now -->
                <div class="flex flex-col items-center justify-center rounded-lg border-2 border-red-200 bg-red-50 p-2 text-center transition-all hover:shadow-md">
                    <h4 class="text-[11px] font-bold uppercase tracking-wide text-red-900 mb-1">🔴 Fix Now</h4>
                    <span class="text-3xl font-black text-red-600">{{ counts.high_severity_high_confidence }}</span>
                    <p class="text-[10px] text-red-700 font-medium mt-1">Verified threats</p>
                </div>

                <!-- High: Investigate -->
                <div class="flex flex-col items-center justify-center rounded-lg border-2 border-amber-200 bg-amber-50 p-2 text-center transition-all hover:shadow-md">
                    <h4 class="text-[11px] font-bold uppercase tracking-wide text-amber-900 mb-1">🟠 Investigate</h4>
                    <span class="text-3xl font-black text-amber-600">{{ counts.high_severity_low_confidence }}</span>
                    <p class="text-[10px] text-amber-700 font-medium mt-1">Needs review</p>
                </div>

                <!-- Medium: Fix When Possible -->
                <div class="flex flex-col items-center justify-center rounded-lg border-2 border-sky-200 bg-sky-50 p-2 text-center transition-all hover:shadow-md">
                    <h4 class="text-[11px] font-bold uppercase tracking-wide text-sky-900 mb-1">🔵 Fix Later</h4>
                    <span class="text-3xl font-black text-sky-600">{{ counts.low_severity_high_confidence }}</span>
                    <p class="text-[10px] text-sky-700 font-medium mt-1">Minor issues</p>
                </div>

                <!-- Low: For Info -->
                <div class="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50 p-2 text-center transition-all hover:shadow-md">
                    <h4 class="text-[11px] font-bold uppercase tracking-wide text-gray-700 mb-1">⚪ For Info</h4>
                    <span class="text-3xl font-black text-gray-600">{{ counts.low_severity_low_confidence }}</span>
                    <p class="text-[10px] text-gray-600 font-medium mt-1">Low priority</p>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
