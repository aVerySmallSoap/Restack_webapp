<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import Threads from '@/components/custom/Threads.vue';
import { ArrowRight } from 'lucide-vue-next';
import { useDark } from '@vueuse/core';
import { computed } from 'vue';

// Determine thread color based on theme
const isDark = useDark();
const threadsColor = computed<[number, number, number]>(() =>
    // White threads for dark mode, Black threads for light mode
    isDark.value ? [1, 1, 1] : [0, 0, 0]
);
</script>

<template>
    <Head title="Welcome to Restack" />

    <div class="fixed inset-0 -z-10 pointer-events-none">
        <Threads
            :color="[1, 1, 1]"
            :amplitude="1"
            :distance="0"
            :enableMouseInteraction="false"
        />
    </div>

    <div id="hero" class="flex min-h-screen flex-col items-center justify-center p-6 text-[#1b1b18] dark:text-[#EDEDEC]">
        <header class="absolute top-0 left-0 right-0 w-full p-6 lg:p-8">
            <nav class="mx-auto flex max-w-7xl items-center justify-between">
                <div class="flex items-center gap-2 font-semibold text-xl">
                    Restack
                </div>
                <div class="flex gap-4">
                    <Link
                        v-if="$page.props.auth.user"
                        :href="route('dashboard')"
                        class="inline-flex items-center rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    >
                        Dashboard
                    </Link>
                    <template v-else>
                        <Link
                            :href="route('login')"
                            class="rounded-md px-4 py-2 text-sm font-medium transition hover:text-black/70 dark:hover:text-white/70"
                        >
                            Log in
                        </Link>
                        <Link
                            :href="route('register')"
                            class="inline-flex items-center rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-50 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                        >
                            Register
                        </Link>
                    </template>
                </div>
            </nav>
        </header>

        <main class="flex w-full max-w-3xl flex-col items-center text-center gap-8">

            <h1 class="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Secure your stack.<br />
                <span class="text-blue-600 dark:text-blue-500">Automate the rest.</span>
            </h1>

            <p class="max-w-xl text-lg text-gray-600 dark:text-gray-400">
                Restack provides comprehensive vulnerability scanning using tools like ZAP and Wapiti.
            </p>

            <div class="flex flex-col gap-4 sm:flex-row">
                <Link
                    v-if="!$page.props.auth.user"
                    :href="route('register')"
                    class="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white transition hover:bg-blue-500 hover:scale-105 active:scale-95"
                >
                    Get Started <ArrowRight class="h-4 w-4" />
                </Link>
                <Link
                    v-else
                    :href="route('scan')"
                    class="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white transition hover:bg-blue-500 hover:scale-105 active:scale-95"
                >
                    Start New Scan <ArrowRight class="h-4 w-4" />
                </Link>
            </div>

        </main>

        <footer class="absolute bottom-6 text-center text-sm text-gray-500 dark:text-gray-600">
            &copy; {{ new Date().getFullYear() }} Restack Security.
        </footer>
    </div>
</template>

<style>
body{
    background: transparent;
}
</style>
