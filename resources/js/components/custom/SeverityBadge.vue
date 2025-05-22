<template>
    <span class="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ring-1 ring-inset" :class="badgeClass">
        <slot>{{ displayText }}</slot>
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    severity: string;
}>();

const SEVERITY_COLORS: Record<string, string> = {
    Critical: 'bg-red-600 text-white ring-red-500',
    High: 'bg-orange-500 text-white ring-orange-400',
    Medium: 'bg-yellow-400 text-black ring-yellow-300',
    Low: 'bg-green-500 text-white ring-green-400',
    Info: 'bg-blue-500 text-white ring-blue-400',
    Unknown: 'bg-gray-400 text-black ring-gray-300',
};

const displayText = computed(() => props.severity.charAt(0).toUpperCase() + props.severity.slice(1));

const badgeClass = computed(() => SEVERITY_COLORS[displayText.value] || SEVERITY_COLORS.Unknown);
</script>
