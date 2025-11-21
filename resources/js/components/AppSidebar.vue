<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar';
import { usePage } from '@inertiajs/vue3';
import { computed } from 'vue';

import NavMain from '@/components/NavMain.vue';
import NavUser from '@/components/NavUser.vue';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar/utils';
import { BookOpen, Settings2, SquareTerminal, Search, Zap } from 'lucide-vue-next';
import NavScan from '@/components/custom/NavScan.vue';
import { useDark } from '@vueuse/core';

const { state } = useSidebar();

const props = withDefaults(defineProps<SidebarProps>(), {
    collapsible: 'icon',
});

const isDark = useDark();

// Fetch real user from Inertia props
const page = usePage();
const user = computed(() => page.props.auth.user);

// Removed hardcoded 'user' object from data
const data = {
    navScan: [
        {
            title: 'Scan',
            url: '/scan',
            icon: Zap
        }
    ],
    navMain: [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: SquareTerminal,
            items: [
                {
                    title: 'Metrics',
                    url: '/dashboard',
                },
                {
                    title: 'History',
                    url: '/history',
                },
            ],
        },
        {
            title: 'Settings',
            url: '/settings/scanner',
            icon: Settings2,
            items: [
                {
                    title: 'Scanners',
                    url: '/settings/scanner',
                },
                {
                    title: 'Export',
                    url: '/settings/export',
                },
            ],
        },
        {
            title: 'Documentation',
            url: '/docs',
            icon: BookOpen,
            items: [
                {
                    title: 'Get Started',
                    url: '/docs/get-started',
                },
                {
                    title: 'Introduction',
                    url: '/docs/introduction',
                },
                {
                    title: 'Changelog',
                    url: '/docs/changelog',
                },
            ],
        },
    ],
};
</script>

<template>
    <Sidebar v-bind="props">
        <SidebarHeader>
            <div class="text-center self-center items-center text-3xl flex flex-row" v-if="state != 'collapsed'">
                <img v-if="isDark" src="/ico_white.svg" alt="icon" width="32" height="32">
                <img v-if="!isDark" src="/ico.svg" alt="icon" width="32" height="32">
                Restack
            </div>
            <div class="text-center self-center items-center text-3xl flex flex-row" v-if="state == 'collapsed'">
                <img v-if="isDark" src="/ico_white.svg" alt="icon" width="60" height="60">
                <img v-if="!isDark" src="/ico.svg" alt="icon" width="60" height="60">
            </div>
        </SidebarHeader>

        <SidebarContent>
            <NavScan :items="data.navScan"/>
            <NavMain :items="data.navMain"/>
        </SidebarContent>

        <SidebarFooter>
            <NavUser :user="user" />
        </SidebarFooter>

        <SidebarRail />
    </Sidebar>
</template>
