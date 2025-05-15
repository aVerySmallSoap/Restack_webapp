<script setup lang="ts">

import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
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
        <CardContent class="flex justify-center text-4xl">
            <slot name="card-content"></slot>
        </CardContent>
        <CardFooter class="flex justify-center text-[12px] text-muted">
            <slot name="card-footer"></slot>
        </CardFooter>
    </Card>
</template>

<style scoped>

</style>
