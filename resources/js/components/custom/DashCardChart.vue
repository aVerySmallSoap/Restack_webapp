<script setup lang="ts">

import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { type LucideIcon } from 'lucide-vue-next'

defineProps<{
    title: string,
    icon?: LucideIcon
}>()
</script>

<template>
    <Card>
        <card-title class="flex">
            <span class="grow font-bold text-2xl">{{title}}</span>
            <component style="color: #363636" :is="icon"/>
        </card-title>
        <CardContent>
            <slot name="card-content"></slot>
        </CardContent>
    </Card>
</template>

<style scoped>

</style>
