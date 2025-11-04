<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { computed } from 'vue';

const props = defineProps<{
    severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational' | string;
}>();

// Determine badge color based on severity
const badgeVariant = computed(() => {
    switch (props.severity?.toLowerCase()) {
        case 'critical':
            return 'destructive';
        case 'high':
            return 'destructive';
        case 'medium':
            return 'default';
        case 'low':
            return 'secondary';
        default:
            return 'outline';
    }
});

// Get a single-letter label for the compact badge
const badgeLabel = computed(() => {
    const s = props.severity?.toLowerCase();
    if (s === 'critical') return 'C';
    if (s === 'high') return 'H';
    if (s === 'medium') return 'M';
    if (s === 'low') return 'L';
    return 'I';
});
</script>

<template>
    <Badge :variant="badgeVariant" class="flex h-6 w-6 items-center justify-center p-0">
        {{ badgeLabel }}
    </Badge>
</template>
