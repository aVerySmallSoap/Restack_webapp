<template>
    <Navigation>
        <div class="flexflex-1 flex-col gap-4 p-4 pt-0">
        <section>
            <h1 class="mb-2 text-4xl font-bold">Changelog</h1>
            <p>All notable changes to this project will be documented in this section.</p>
            <h2 class="text-xl font-semibold mt-4 mb-1">[Unreleased]</h2>
            <ul class="list-disc ml-6">
                <li>Initial draft of documentation</li>
                <li>Placeholder for future changes</li>
            </ul>
            <h2 class="text-xl font-semibold mt-4 mb-1">[2025-05-26]</h2>
            <ul class="list-disc ml-6">
                <li>Project structure established</li>
                <li>Vue.js frontend scaffolded</li>
                <li>PHP backend integration started</li>
                <li>Added basic routing and authentication</li>
            </ul>
            <hr class="my-4" />
            <em>Older changes will appear here as the project evolves.</em>
        </section>
        </div>
    </Navigation>
</template>

<script setup lang="ts">
import Navigation from '@/components/custom/Navigation.vue';
</script>
