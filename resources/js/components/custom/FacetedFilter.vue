<script setup lang="ts">
import { computed } from 'vue'
import { Check, PlusCircle } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Column } from '@tanstack/vue-table'

interface FacetedFilterProps {
    column?: Column<any, any>
    title?: string
    options: {
        label: string
        value: string
        icon?: any
    }[]
}

const props = defineProps<FacetedFilterProps>()

const facets = computed(() => props.column?.getFacetedUniqueValues())
const selectedValues = computed(() => new Set(props.column?.getFilterValue() as string[]))

function handleSelect(value: string) {
    const newSelectedValues = new Set(selectedValues.value)
    if (newSelectedValues.has(value)) {
        newSelectedValues.delete(value)
    } else {
        newSelectedValues.add(value)
    }
    const filterValues = Array.from(newSelectedValues)
    props.column?.setFilterValue(filterValues.length ? filterValues : undefined)
}

function clearFilters() {
    props.column?.setFilterValue(undefined)
}
</script>

<template>
    <Popover>
        <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="h-8 border-dashed">
                <PlusCircle class="mr-2 h-4 w-4" />
                {{ title }}
                <template v-if="selectedValues.size > 0">
                    <Separator orientation="vertical" class="mx-2 h-4" />
                    <Badge variant="secondary" class="rounded-sm px-1 font-normal lg:hidden">
                        {{ selectedValues.size }}
                    </Badge>
                    <div class="hidden space-x-1 lg:flex">
                        <Badge
                            v-if="selectedValues.size > 2"
                            variant="secondary"
                            class="rounded-sm px-1 font-normal"
                        >
                            {{ selectedValues.size }} selected
                        </Badge>
                        <template v-else>
                            <Badge
                                v-for="value in Array.from(selectedValues).slice(0, 2)"
                                :key="value"
                                variant="secondary"
                                class="rounded-sm px-1 font-normal"
                            >
                                {{ options.find(option => option.value === value)?.label }}
                            </Badge>
                        </template>
                    </div>
                </template>
            </Button>
        </PopoverTrigger>
        <PopoverContent class="w-[200px] p-0" align="start">
            <Command>
                <CommandInput :placeholder="title" />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                        <CommandItem
                            v-for="option in options"
                            :key="option.value"
                            :value="option.value"
                            @select="handleSelect(option.value)"
                        >
                            <div
                                :class="cn(
                  'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                  selectedValues.has(option.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50 [&_svg]:invisible'
                )"
                            >
                                <Check :class="cn('h-4 w-4')" />
                            </div>
                            <component v-if="option.icon" :is="option.icon" class="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{{ option.label }}</span>
                            <span
                                v-if="facets?.get(option.value)"
                                class="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs"
                            >
                {{ facets.get(option.value) }}
              </span>
                        </CommandItem>
                    </CommandGroup>
                    <template v-if="selectedValues.size > 0">
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem
                                :value="{ label: 'Clear filters' }"
                                class="justify-center text-center"
                                @select="clearFilters"
                            >
                                Clear filters
                            </CommandItem>
                        </CommandGroup>
                    </template>
                </CommandList>
            </Command>
        </PopoverContent>
    </Popover>
</template>
