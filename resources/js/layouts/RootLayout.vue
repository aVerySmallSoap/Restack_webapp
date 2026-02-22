<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>

<template>
    <div class="font-sans">
        <slot />

        <!-- Global Toaster - works on ALL pages -->
        <Toaster
            position="top-right"
            :duration="3000"
            richColors
            closeButton
        />
    </div>
</template>
