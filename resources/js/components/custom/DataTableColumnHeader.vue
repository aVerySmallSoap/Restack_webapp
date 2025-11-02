<script setup lang="ts">
import { type Column } from '@tanstack/vue-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DataTableColumnHeaderProps {
  column: Column<any, any>
  title: string
  class?: string
}

// FIX: Assign the result of defineProps to a variable
const props = defineProps<DataTableColumnHeaderProps>()
</script>

<template>
  <div v-if="column.getCanSort()" :class="cn('flex items-center space-x-2', props.class)">
    <Button
      variant="ghost"
      size="sm"
      class="-ml-3 h-8 data-[state=open]:bg-accent"
      @click="column.toggleSorting(column.getIsSorted() === 'asc')"
    >
      <span>{{ title }}</span>
      <ArrowDown v-if="column.getIsSorted() === 'desc'" class="ml-2 h-4 w-4" />
      <ArrowUp v-else-if="column.getIsSorted() === 'asc'" class="ml-2 h-4 w-4" />
      <ArrowUpDown v-else class="ml-2 h-4 w-4" />
    </Button>
  </div>

  <div v-else :class="props.class">
    {{ title }}
  </div>
</template>
