<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

defineOptions({
    inheritAttrs: false,
});

interface Props {
    className?: HTMLAttributes['class'];
}

defineProps<Props>();
</script>

<template>
    <img
        src="/favico.svg"
        alt="Restack Logo"
        :class="className"
        v-bind="$attrs"
    />
</template>
