<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { type DateRange } from 'radix-vue'
import {
    CalendarDate,
    today,
    getLocalTimeZone,
    parseDate,
} from '@internationalized/date'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const df = 'LLL dd, y' // Date format

const emit = defineEmits(['update:range'])

// Helper to convert JS Date to CalendarDate
function toCalendarDate(jsDate: Date) {
    const dateStr = format(jsDate, 'yyyy-MM-dd')
    return parseDate(dateStr)
}

// Store the calendar's value in its required format
const calendarValue = ref({
    start: toCalendarDate(new Date(new Date().setDate(new Date().getDate() - 30))),
    end: toCalendarDate(new Date()),
})

// Store the button's display value as JS Dates
const displayValue = ref({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
})

// Watch for changes from the calendar
function onCalendarUpdate(v: DateRange) {
    if (v.start && v.end) {
        calendarValue.value = { start: v.start, end: v.end }

        // Convert back to JS Date for the emit
        const newStartDate = v.start.toDate(getLocalTimeZone())
        const newEndDate = v.end.toDate(getLocalTimeZone())

        displayValue.value = { start: newStartDate, end: newEndDate }
        emit('update:range', { start: newStartDate, end: newEndDate })
    }
}
</script>

<template>
    <div :class="cn('grid gap-2', $attrs.class ?? '')">
        <Popover>
            <PopoverTrigger as-child>
                <Button
                    id="date"
                    :variant="'outline'"
                    :class="cn(
            'w-[300px] justify-start text-left font-normal',
            !displayValue.start && 'text-muted-foreground',
          )"
                >
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    <span>
            {{ displayValue.start ? (
                        displayValue.end ? `${format(displayValue.start, df)} - ${format(displayValue.end, df)}` : format(displayValue.start, df)
                    ) : 'Pick a date range' }}
          </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" :align="'end'">
                <RangeCalendar
                    :model-value="calendarValue"
                    @update:model-value="onCalendarUpdate"
                    initial-focus
                    :number-of-months="2"
                />
            </PopoverContent>
        </Popover>
    </div>
</template>
