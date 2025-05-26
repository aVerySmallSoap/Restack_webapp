<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar';

import NavMain from '@/components/NavMain.vue';
import NavUser from '@/components/NavUser.vue';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar/utils';
import { BookOpen, Settings2, SquareTerminal, Search, Zap} from 'lucide-vue-next';
import NavScan from '@/components/custom/NavScan.vue';
import { useDark } from '@vueuse/core';
const {state} = useSidebar();

const props = withDefaults(defineProps<SidebarProps>(), {
    collapsible: 'icon',
});

const isDark = useDark()

const data = {
    user: {
        name: 'aVerySmallSoap',
        email: 'sample@mail.com',
        avatar: '',
    },
    navScan: [
        {
            title: 'Quick Scan',
            url: '/quickscan',
            icon: Zap
        },
        // {
        //     title: 'Full Scan',
        //     url: '/fullscan',
        //     icon: Search
        // }
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
                    url: '/docs',
                },
                {
                    title: 'Introduction',
                    url: '#',
                },
                {
                    title: 'Changelog',
                    url: '#',
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
                <img  v-if="isDark" src="/ico_white.svg" alt="icon" width="32" height="32">
                <img  v-if="!isDark" src="/ico.svg" alt="icon" width="32" height="32">
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
            <NavUser :user="data.user" />
        </SidebarFooter>
    </Sidebar>
</template>
