<script setup lang="ts">
// import Icon from '@/components/ui/icon/Icon.vue' // Replace with your icon system or shadcn-vue icon
defineProps<{
    title: string
    value: number | string
    icon: string
}>()
</script>

<template>
    <div
        class="stat-card flex items-center gap-4 bg-white dark:bg-neutral-900 rounded-lg shadow p-4"
        role="region"
        :aria-label="title"
        tabindex="0"
    >
    <span class="icon text-3xl" :aria-hidden="true">
      <Icon :name="icon" />
    </span>
        <div>
            <div class="text-lg font-semibold">{{ value }}</div>
            <div class="text-sm text-neutral-500">{{ title }}</div>
        </div>
    </div>
</template>

<style scoped>

</style>
