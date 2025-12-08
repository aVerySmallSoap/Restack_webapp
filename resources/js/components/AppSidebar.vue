<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar';
import { usePage } from '@inertiajs/vue3';
import { computed } from 'vue'; // Ensure this is imported

import NavMain from '@/components/NavMain.vue';
import NavUser from '@/components/NavUser.vue';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar/utils';
import { BookOpen, Settings2, SquareTerminal, Search, Zap, CalendarSync, Users } from 'lucide-vue-next';
import NavScan from '@/components/custom/NavScan.vue';
import { useDark } from '@vueuse/core';

const { state } = useSidebar();

const props = withDefaults(defineProps<SidebarProps>(), {
    collapsible: 'icon',
});

const isDark = useDark();
const page = usePage();

// 1. Fetch user safely
const user = computed(() => page.props.auth.user);

// 2. Wrap 'data' in computed() so it can use logic
const data = computed(() => ({
    navScan: [
        {
            title: 'Scan',
            url: '/scan',
            icon: Zap
        },
        {
            title: 'Scheduled Scan',
            url: '/scheduled',
            icon: CalendarSync
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

        // 3. LOGIC: Only add this object if is_admin is true
        ...(page.props.auth.user?.is_admin ? [{
            title: 'Users',
            url: '/users',
            icon: Users,
        }] : []),

        {
            title: 'Settings',
            url: '/settings/profile',
            icon: Settings2,
            items: [
                {
                    title: 'Profile',
                    url: '/settings/profile',
                },
                {
                    title: 'Password',
                    url: '/settings/password',
                },
                {
                    title: 'Appearance',
                    url: '/settings/appearance',
                },
            ],
        },
    ],
}));
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
