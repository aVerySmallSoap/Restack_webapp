<script setup lang="ts">
import TextType from '@/components/custom/TextType.vue';
import Threads from '@/components/custom/Threads.vue';
import { Head, Link } from '@inertiajs/vue3';
import { useDark } from '@vueuse/core';
import { ArrowRight } from 'lucide-vue-next';
import { computed } from 'vue';

// Determine thread color based on theme
const isDark = useDark();
const threadsColor = computed<[number, number, number]>(() => (isDark.value ? [1, 1, 1] : [0, 0, 0]));
const textTypeColors = computed(() => (isDark.value ? ['#EDEDEC'] : ['#1b1b18']));
</script>

<template>
    <Head title="Welcome to Restack" />

    <div class="pointer-events-none fixed inset-0 -z-10">
        <Threads :color="threadsColor" :amplitude="1" :distance="0" :enableMouseInteraction="false" />
    </div>

    <div id="hero" class="flex min-h-screen flex-col items-center justify-center p-6 text-[#1b1b18] dark:text-[#EDEDEC]">
        <header class="absolute top-0 right-0 left-0 w-full p-6 lg:p-8">
            <nav class="mx-auto flex max-w-7xl items-center justify-between">
                <div class="flex items-center gap-2 text-xl font-bold tracking-tighter">Restack</div>
                <div class="flex gap-4">
                    <Link
                        v-if="$page.props.auth.user"
                        :href="route('dashboard')"
                        class="text-sm font-medium hover:text-black/70 dark:hover:text-white/70"
                    >
                        Dashboard
                    </Link>
                    <template v-else>
                        <Link :href="route('login')" class="text-sm font-medium hover:text-black/70 dark:hover:text-white/70"> Log in </Link>
                    </template>
                </div>
            </nav>
        </header>

        <main class="flex w-full flex-col items-center justify-center gap-12 text-center">
            <div class="flex flex-col items-center justify-center gap-2 sm:gap-4">
                <h1 class="text-4xl font-bold tracking-tighter sm:text-6xl lg:text-8xl">Secure your stack.</h1>

                <div class="flex items-center gap-2 text-4xl font-bold tracking-tighter sm:text-6xl lg:text-8xl">
                    <span class="text-blue-500 dark:text-blue-500">Scan. </span>
                    <TextType
                        :text="['Analyze.', 'Prioritize.', 'Report.', 'Restack.']"
                        :typingSpeed="75"
                        :pauseDuration="1500"
                        :showCursor="true"
                        cursorCharacter="_"
                        :text-colors="textTypeColors"
                    />
                </div>
            </div>

            <div class="mt-8">
                <Link
                    v-if="!$page.props.auth.user"
                    :href="route('register')"
                    class="group inline-flex items-center justify-center gap-2 border-b-2 border-black pb-1 text-lg font-semibold transition-all hover:border-blue-600 hover:text-blue-600 dark:border-white dark:hover:border-blue-500 dark:hover:text-blue-500"
                >
                    Get Started <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                    v-else
                    :href="route('scan')"
                    class="group inline-flex items-center justify-center gap-2 border-b-2 border-black pb-1 text-lg font-semibold transition-all hover:border-blue-600 hover:text-blue-600 dark:border-white dark:hover:border-blue-500 dark:hover:text-blue-500"
                >
                    Start New Scan <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
        </main>

        <footer class="absolute bottom-6 text-center text-xs text-gray-400 dark:text-gray-600">
            &copy; {{ new Date().getFullYear() }} Restack.
        </footer>
    </div>
</template>

<style>
body {
    background: transparent;
}
</style>
