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
            <span class="grow self-center">{{title}}</span>
            <component style="color: #363636" :is="icon"/>
            <slot></slot>
        </card-title>
        <CardContent>
            <slot></slot>
        </CardContent>
    </Card>
</template>

<style scoped>

</style>
