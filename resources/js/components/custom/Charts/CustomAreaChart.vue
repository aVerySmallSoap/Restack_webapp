<script setup lang="ts">
import { VisXYContainer, VisArea, VisLine, VisAxis, VisTooltip } from '@unovis/vue'
import { defineProps } from 'vue'

const props = defineProps<{
    data: any[]
}>()

const x = (d: any) => new Date(d.date).getTime()
const y = (d: any) => d.Total

// Gradient ID
const gradientId = 'area-gradient'

const tickFormat = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>

<template>
    <div class="h-[300px] w-full">
        <VisXYContainer :data="data" :height="300" :margin="{ top: 20, right: 20, bottom: 20, left: 20 }">
            <svg height="0" width="0" class="absolute">
                <defs>
                    <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#ef4444" stop-opacity="0.4" />
                        <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
                    </linearGradient>
                </defs>
            </svg>

            <VisArea :x="x" :y="y" :fill="`url(#${gradientId})`" />
            <VisLine :x="x" :y="y" color="#ef4444" :strokeWidth="2" />
            <VisAxis type="x" :tickFormat="tickFormat" />
            <VisAxis type="y" />
            <VisTooltip />
        </VisXYContainer>
    </div>
</template>
