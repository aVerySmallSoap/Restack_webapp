<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CalendarIcon, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { RangeCalendar } from '@/components/ui/range-calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Column } from '@tanstack/vue-table'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'

interface DateRangeFilterProps {
    column?: Column<any, any>
    title?: string
}

const props = defineProps<DateRangeFilterProps>()

const dateRange = ref({
    start: undefined,
    end: undefined,
})

const df = new DateFormatter('en-US', {
    dateStyle: 'medium',
})

const displayValue = computed(() => {
    if (dateRange.value?.start) {
        if (dateRange.value?.end) {
            return `${df.format(dateRange.value.start.toDate(getLocalTimeZone()))} - ${df.format(dateRange.value.end.toDate(getLocalTimeZone()))}`
        }
        return df.format(dateRange.value.start.toDate(getLocalTimeZone()))
    }
    return 'Pick a date range'
})

// Watch for changes and apply filter
watch(dateRange, (newRange) => {
    if (newRange?.start || newRange?.end) {
        const fromDate = newRange.start ? newRange.start.toDate(getLocalTimeZone()) : undefined
        const toDate = newRange.end ? newRange.end.toDate(getLocalTimeZone()) : undefined
        props.column?.setFilterValue([fromDate, toDate])
    } else {
        props.column?.setFilterValue(undefined)
    }
}, { deep: true })

function clearFilter() {
    dateRange.value = {
        start: undefined,
        end: undefined,
    }
}

const hasFilter = computed(() => dateRange.value?.start || dateRange.value?.end)
</script>

<template>
    <div class="flex items-center gap-2">
        <Popover>
            <PopoverTrigger as-child>
                <Button
                    variant="outline"
                    size="sm"
                    :class="cn(
            'h-8 border-dashed justify-start text-left font-normal min-w-[240px]',
            !hasFilter && 'text-muted-foreground'
          )"
                >
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    <span>{{ displayValue }}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
                <RangeCalendar
                    v-model="dateRange"
                    :number-of-months="2"
                    initial-focus
                />
            </PopoverContent>
        </Popover>

        <Button
            v-if="hasFilter"
            variant="ghost"
            size="sm"
            @click="clearFilter"
            class="h-8 w-8 p-0"
        >
            <X class="h-4 w-4" />
        </Button>
    </div>
</template>
