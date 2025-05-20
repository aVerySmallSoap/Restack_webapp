<template>
  <div class="flex flex-col items-center justify-center">
    <svg
      class="animate-spin h-10 w-10 text-green-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      ></path>
    </svg>
    <span v-if="message" class="mt-2 text-white">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message?: string }>()
</script>
