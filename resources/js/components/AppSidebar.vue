<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'

import NavMain from '@/components/NavMain.vue'
import NavUser from '@/components/NavUser.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'

import {
  BookOpen,
  Settings2,
  SquareTerminal,
} from 'lucide-vue-next'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
      {
      title: 'Dashboard',
      url: '#',
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: 'Metrics',
          url: '#',
        },
        {
          title: 'History',
          url: '#',
        },
      ],
    },
      {
          title: 'Settings',
          url: '#',
          icon: Settings2,
          items: [
              {
                  title: 'General',
                  url: '#',
              },
              {
                  title: 'Team',
                  url: '#',
              },
              {
                  title: 'Billing',
                  url: '#',
              },
              {
                  title: 'Limits',
                  url: '#',
              },
          ],
      },
      {
      title: 'Documentation',
      url: '#',
      icon: BookOpen,
      items: [
        {
          title: 'Introduction',
          url: '#',
        },
        {
          title: 'Get Started',
          url: '#',
        },
        {
          title: 'Tutorials',
          url: '#',
        },
        {
          title: 'Changelog',
          url: '#',
        },
      ],
    },
  ]
}
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
        <!--Logo or App name-->
        <div style="text-align: center; font-size: 32px">
            Restack
        </div>
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="data.navMain" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser :user="data.user" />
    </SidebarFooter>
  </Sidebar>
</template>
