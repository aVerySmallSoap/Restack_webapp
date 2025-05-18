<script setup lang="ts">
import {
    SidebarGroup, SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type LucideIcon } from 'lucide-vue-next'

defineProps<{
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
}>()
</script>

<template>
  <SidebarGroup>
      <SidebarGroupLabel>Scanning</SidebarGroupLabel>
      <SidebarGroupContent>
          <SidebarMenu>
              <SidebarMenuItem v-for="item in items" :key="item.title">
                  <SidebarMenuButton as-child>
                      <a :href="item.url">
                          <component :is="item.icon"/>
                          <span>{{item.title}}</span>
                      </a>
                  </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
      </SidebarGroupContent>
  </SidebarGroup>
</template>
