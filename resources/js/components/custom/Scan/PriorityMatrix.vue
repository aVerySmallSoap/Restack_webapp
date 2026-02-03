<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
            <CardTitle>Priority Matrix</CardTitle>
            <CardDescription>Actionable insights based on risk & certainty</CardDescription>
        </CardHeader>
        <CardContent class="flex-1 min-h-0 pt-0">
            <div class="grid grid-cols-2 gap-3 h-[230px]">

                <div class="flex flex-col items-center justify-center rounded-lg border-2 border-red-100 bg-red-50/50 p-2 text-center transition-all hover:border-red-200">
                    <h4 class="text-[11px] font-extrabold uppercase tracking-wide text-red-800 mb-1">Critical Actions</h4>
                    <span class="text-3xl font-black text-red-600">{{ counts.high_severity_high_confidence }}</span>
                    <p class="text-[10px] text-red-600/80 font-medium mt-1">Confirmed Threats</p>
                </div>

                <div class="flex flex-col items-center justify-center rounded-lg border-2 border-orange-100 bg-orange-50/30 p-2 text-center transition-all hover:border-orange-200">
                    <h4 class="text-[11px] font-extrabold uppercase tracking-wide text-orange-800 mb-1">Needs Check</h4>
                    <span class="text-3xl font-black text-orange-500">{{ counts.high_severity_low_confidence }}</span>
                    <p class="text-[10px] text-orange-600/80 font-medium mt-1">Potential Risks</p>
                </div>

                <div class="flex flex-col items-center justify-center rounded-lg border-2 border-blue-100 bg-blue-50/30 p-2 text-center transition-all hover:border-blue-200">
                    <h4 class="text-[11px] font-extrabold uppercase tracking-wide text-blue-800 mb-1">Quick Fixes</h4>
                    <span class="text-3xl font-black text-blue-500">{{ counts.low_severity_high_confidence }}</span>
                    <p class="text-[10px] text-blue-600/80 font-medium mt-1">Compliance / Best Practice</p>
                </div>

                <div class="flex flex-col items-center justify-center rounded-lg border-2 border-slate-100 bg-slate-50/50 p-2 text-center transition-all hover:border-slate-200">
                    <h4 class="text-[11px] font-extrabold uppercase tracking-wide text-slate-700 mb-1">Audit Log</h4>
                    <span class="text-3xl font-black text-slate-500">{{ counts.low_severity_low_confidence }}</span>
                    <p class="text-[10px] text-slate-500/80 font-medium mt-1">Informational</p>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
