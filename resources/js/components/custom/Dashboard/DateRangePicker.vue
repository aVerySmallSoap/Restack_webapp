<script setup lang="ts">
import { ref, watch } from 'vue'
import { type DateRange } from 'radix-vue'
import {
    CalendarDate,
    getLocalTimeZone,
    parseDate,
} from '@internationalized/date'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const props = defineProps<{
    startDate?: string | null,
    endDate?: string | null
}>()

const df = 'LLL dd, y'
const emit = defineEmits(['update'])

// Helper: Convert JS Date -> CalendarDate
function toCalendarDate(jsDate: Date) {
    const dateStr = format(jsDate, 'yyyy-MM-dd')
    return parseDate(dateStr)
}

// Helper: Parse prop strings (YYYY-MM-DD) -> CalendarDate
function getInitialCalendarValue() {
    if (props.startDate && props.endDate) {
        try {
            // FIX: Split on 'T' to remove the time part (e.g., 2026-01-04T00:00:00Z -> 2026-01-04)
            const cleanStart = props.startDate.split('T')[0]
            const cleanEnd = props.endDate.split('T')[0]

            return {
                start: parseDate(cleanStart),
                end: parseDate(cleanEnd)
            }
        } catch (e) {
            console.error("Date parse error", e)
        }
    }

    // Default fallback: Last 30 Days
    return {
        start: toCalendarDate(new Date(new Date().setDate(new Date().getDate() - 30))),
        end: toCalendarDate(new Date()),
    }
}

// State
const calendarValue = ref(getInitialCalendarValue())

// Sync with Parent (e.g. Reset Filters)
watch(() => [props.startDate, props.endDate], () => {
    calendarValue.value = getInitialCalendarValue()
})

// Handle Update
function onCalendarUpdate(v: DateRange) {
    calendarValue.value = v

    if (v.start && v.end) {
        // Convert to standard JS Dates for the parent
        const newStartDate = v.start.toDate(getLocalTimeZone())
        const newEndDate = v.end.toDate(getLocalTimeZone())

        emit('update', { start: newStartDate, end: newEndDate })
    }
}
</script>

<template>
    <div :class="cn('grid gap-2', $attrs.class ?? '')">
        <Popover>
            <PopoverTrigger as-child>
                <Button
                    id="date"
                    variant="outline"
                    :class="cn(
                        'w-[300px] justify-start text-left font-normal',
                        !calendarValue.start && 'text-muted-foreground'
                    )"
                >
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    <span>
                        <template v-if="calendarValue.start">
                            <template v-if="calendarValue.end">
                                {{ format(calendarValue.start.toDate(getLocalTimeZone()), df) }} -
                                {{ format(calendarValue.end.toDate(getLocalTimeZone()), df) }}
                            </template>
                            <template v-else>
                                {{ format(calendarValue.start.toDate(getLocalTimeZone()), df) }}
                            </template>
                        </template>
                        <template v-else>
                            Pick a date range
                        </template>
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="end">
                <RangeCalendar
                    v-model="calendarValue"
                    @update:model-value="onCalendarUpdate"
                    :number-of-months="2"
                    initial-focus
                />
            </PopoverContent>
        </Popover>
    </div>
</template>
