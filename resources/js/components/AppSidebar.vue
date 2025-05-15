<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar';

import NavMain from '@/components/NavMain.vue';
import NavUser from '@/components/NavUser.vue';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar/utils';
import { BookOpen, Settings2, SquareTerminal } from 'lucide-vue-next';
const {state} = useSidebar();

const props = withDefaults(defineProps<SidebarProps>(), {
    collapsible: 'icon',
});

const data = {
    user: {
        name: 'aVerySmallSoap',
        email: 'sample@mail.com',
        avatar: '/avatars/shadcn.jpg',
    },
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
            <div style="text-align: center; font-size: 32px" v-if="state != 'collapsed'">Restack</div>
            <div style="text-align: center; font-size: 32px" v-if="state == 'collapsed'">R</div>
        </SidebarHeader>
        <SidebarContent>
            <NavMain :items="data.navMain" />
        </SidebarContent>
        <SidebarFooter>
            <NavUser :user="data.user" />
        </SidebarFooter>
    </Sidebar>
</template>
