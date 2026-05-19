<script setup lang="ts">
import { ref, computed } from 'vue'
import Navigation from '@/components/custom/Navigation.vue'
import { Head, useForm, router } from '@inertiajs/vue3'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, Clock, CalendarClock, Calendar } from 'lucide-vue-next'
import type { ScheduledScan } from '@/lib/restack/restack.types'
import ScheduledScansTable from '@/components/custom/Scan/ScheduledScanTable.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import ConfirmDialog from '@/components/custom/ConfirmDialog.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import { CalendarDate } from '@internationalized/date'

const props = defineProps<{
    scans: ScheduledScan[];
    users: { label: string; value: string }[];
}>()

const isLoading = ref(false)
const isSubmitting = computed(() => form.processing)

const isDialogOpen = ref(false)
const editingScheduleId = ref<string | null>(null)

const datePickerOpen = ref(false)

const calendarValue = computed({
    get() {
        if (!form.cronDate) return undefined
        const parts = form.cronDate.split('/')
        if (parts.length !== 3) return undefined
        return new CalendarDate(parseInt(parts[2]), parseInt(parts[0]), parseInt(parts[1]))
    },
    set(val: any) {
        if (!val) return
        form.cronDate = `${String(val.month).padStart(2, '0')}/${String(val.day).padStart(2, '0')}/${val.year}`
        datePickerOpen.value = false
    }
})

const cronTimeInput = computed({
    get() { return form.cronTime || '00:00:00' },
    set(val: string) { form.cronTime = val.length === 5 ? val + ':00' : val }
})

const { isOpen: confirmOpen, options: confirmOptions, confirm, handleConfirm: onConfirmDelete, handleCancel: onCancelDelete, handleOpenChange } = useConfirmDialog()

const form = useForm({
    codename: '',
    url: '',
    type: 'interval',
    intervalWeeks: 0,
    intervalDays: 1,
    intervalHours: 0,
    intervalMinutes: 0,
    intervalSeconds: 0,
    cronDate: '',
    cronTime: '',
    cronRecurring: true,
})

const feedback = useToastFeedback()

const resetForm = () => {
    const now = new Date()
    const date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`

    form.defaults({
        codename: '',
        url: '',
        type: 'interval',
        intervalWeeks: 0,
        intervalDays: 1,
        intervalHours: 0,
        intervalMinutes: 0,
        intervalSeconds: 0,
        cronDate: date,
        cronTime: time,
        cronRecurring: true,
    })
    form.reset()
    editingScheduleId.value = null
}

const parseDateString = (dateStr: string) => {
    const parts = dateStr.split('/')
    if (parts.length !== 3) return { month: '*', day: '*', year: '*' }
    return {
        month: form.cronRecurring ? '*' : parts[0],
        day: parts[1],
        year: form.cronRecurring ? '*' : parts[2]
    }
}

const parseTimeString = (timeStr: string) => {
    const parts = timeStr.split(':')
    if (parts.length < 2) return { hour: '0', minute: '0', second: '0' }
    return { hour: parts[0], minute: parts[1], second: parts[2] || '0' }
}

const buildCronConfig = () => {
    const dateComponents = parseDateString(form.cronDate)
    const timeComponents = parseTimeString(form.cronTime)
    return {
        second: timeComponents.second,
        minute: timeComponents.minute,
        hour: timeComponents.hour,
        day: dateComponents.day,
        month: dateComponents.month,
        year: dateComponents.year
    }
}

const parseCronConfig = (config: any) => {
    const month = config.month !== '*' ? config.month : String(new Date().getMonth() + 1).padStart(2, '0')
    const day = config.day !== '*' ? config.day : String(new Date().getDate()).padStart(2, '0')
    const year = config.year !== '*' ? config.year : new Date().getFullYear()

    form.cronDate = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`

    const hour = String(config.hour || '0').padStart(2, '0')
    const minute = String(config.minute || '0').padStart(2, '0')
    const second = String(config.second || '0').padStart(2, '0')

    form.cronTime = `${hour}:${minute}:${second}`
    form.cronRecurring = config.month === '*' && config.year === '*'
}

const getCronDescription = computed(() => {
    if (form.cronRecurring) {
        return `Every month on day ${parseDateString(form.cronDate).day} at ${form.cronTime}`
    } else {
        return `Once on ${form.cronDate} at ${form.cronTime}`
    }
})

const getIntervalDescription = computed(() => {
    const parts = []
    if (form.intervalWeeks > 0) parts.push(`${form.intervalWeeks} week(s)`)
    if (form.intervalDays > 0) parts.push(`${form.intervalDays} day(s)`)
    if (form.intervalHours > 0) parts.push(`${form.intervalHours} hour(s)`)
    if (form.intervalMinutes > 0) parts.push(`${form.intervalMinutes} minute(s)`)
    if (form.intervalSeconds > 0) parts.push(`${form.intervalSeconds} second(s)`)
    return parts.length > 0 ? `Runs every ${parts.join(', ')}` : 'No interval set'
})

const validateDate = () => /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(form.cronDate)
const validateTime = () => /^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/.test(form.cronTime)

const handleCreate = () => {
    if (!form.url || !form.codename) {
        feedback.showError('Please fill in required fields')
        return
    }
    if (form.type === 'cron' && (!validateDate() || !validateTime())) {
        feedback.showError('Invalid date/time format')
        return
    }

    if (!form.url.startsWith('http')) form.url = 'https://' + form.url

    let schedulerConfig: any = {}
    if (form.type === 'interval') {
        if (form.intervalWeeks > 0) schedulerConfig.weeks = form.intervalWeeks
        if (form.intervalDays > 0) schedulerConfig.days = form.intervalDays
        if (form.intervalHours > 0) schedulerConfig.hours = form.intervalHours
        if (form.intervalMinutes > 0) schedulerConfig.minutes = form.intervalMinutes
        if (form.intervalSeconds > 0) schedulerConfig.seconds = form.intervalSeconds
        if (Object.keys(schedulerConfig).length === 0) schedulerConfig.days = 1
    } else {
        schedulerConfig = buildCronConfig()
    }

    const payload = {
        codename: form.codename,
        url: form.url,
        job_type: form.type,
        configuration: schedulerConfig
    }

    const isEditing = !!editingScheduleId.value

    if (isEditing) {
        router.put(route('scheduled.update', editingScheduleId.value), payload, {
            onSuccess: () => {
                feedback.crud.updated('Scheduled scan')
                handleDialogOpenChange(false)
                resetForm()
            },
            onError: () => {
                feedback.crud.updateError('scheduled scan')
            }
        })
    } else {
        router.post(route('scheduled.store'), payload, {
            onSuccess: () => {
                feedback.crud.created('Scheduled scan')
                handleDialogOpenChange(false)
                resetForm()
            },
            onError: () => {
                feedback.crud.createError('scheduled scan')
            }
        })
    }
}

const handleEdit = (scan: ScheduledScan) => {
    editingScheduleId.value = scan.id
    form.codename = scan.codename
    form.url = scan.url
    form.type = scan.job_type

    if (scan.job_type === 'interval') {
        const config = scan.configuration as any
        form.intervalWeeks = config.weeks || 0
        form.intervalDays = config.days || 0
        form.intervalHours = config.hours || 0
        form.intervalMinutes = config.minutes || 0
        form.intervalSeconds = config.seconds || 0
    } else {
        parseCronConfig(scan.configuration)
    }

    handleDialogOpenChange(true)
}

const handleDelete = async (scanId: string) => {
    const confirmed = await confirm({
        title: 'Delete Scheduled Scan',
        description: 'Are you sure you want to delete this scheduled scan? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'destructive'
    })

    if (confirmed) {
        router.delete(route('scheduled.destroy', scanId), {
            preserveScroll: true,
            onSuccess: () => {
                feedback.crud.deleted('Scheduled scan')
            },
            onError: () => {
                feedback.crud.deleteError('scheduled scan')
            }
        })
    }
}

const handleDialogOpenChange = (open: boolean) => {
    isDialogOpen.value = open
    if (!open) {
        resetForm()
    }
}
</script>

<template>
    <Head title="Scheduled Scans" />
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="px-2 text-4xl font-bold">Scheduled Scans</h1>
                    <div class="p-1.5">
                        <span>Automate vulnerability scans on a schedule.</span>
                    </div>
                </div>

                <Dialog :open="isDialogOpen" @update:open="handleDialogOpenChange">
                    <DialogTrigger as-child>
                        <Button>
                            <Plus class="mr-2 h-4 w-4" />
                            New Schedule
                        </Button>
                    </DialogTrigger>

                    <DialogContent class="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {{ editingScheduleId ? 'Edit Schedule' : 'New Scheduled Scan' }}
                            </DialogTitle>
                            <DialogDescription>
                                {{ editingScheduleId ? 'Update your scan schedule.' : 'Automate vulnerability scanning for a target.' }}
                            </DialogDescription>
                        </DialogHeader>

                        <div class="space-y-6 py-2">
                            <div class="space-y-3">
                                <div class="flex items-center gap-2">
                                    <span class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">1</span>
                                    <h4 class="text-sm font-medium">Target</h4>
                                </div>
                                <div class="space-y-3 pl-7">
                                    <div class="space-y-1.5">
                                        <Label for="url" class="text-xs text-muted-foreground">URL</Label>
                                        <Input id="url" v-model="form.url" placeholder="https://example.com" />
                                    </div>
                                    <div class="space-y-1.5">
                                        <Label for="codename" class="text-xs text-muted-foreground">Codename</Label>
                                        <Input id="codename" v-model="form.codename" placeholder="e.g., prod-daily" />
                                        <p class="text-[11px] text-muted-foreground">A unique name to identify this schedule</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div class="space-y-3">
                                <div class="flex items-center gap-2">
                                    <span class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">2</span>
                                    <h4 class="text-sm font-medium">Schedule Type</h4>
                                </div>
                                <div class="grid grid-cols-2 gap-3 pl-7">
                                    <button
                                        type="button"
                                        @click="form.type = 'interval'"
                                        :class="[
                                            'rounded-lg border-2 p-4 text-left transition-all hover:bg-muted/50',
                                            form.type === 'interval' ? 'border-primary bg-primary/5' : 'border-border'
                                        ]"
                                    >
                                        <Clock class="h-5 w-5 mb-2" :class="form.type === 'interval' ? 'text-primary' : 'text-muted-foreground'" />
                                        <p class="text-sm font-medium">Interval</p>
                                        <p class="text-[11px] text-muted-foreground mt-0.5">Every X hours, days...</p>
                                    </button>
                                    <button
                                        type="button"
                                        @click="form.type = 'cron'"
                                        :class="[
                                            'rounded-lg border-2 p-4 text-left transition-all hover:bg-muted/50',
                                            form.type === 'cron' ? 'border-primary bg-primary/5' : 'border-border'
                                        ]"
                                    >
                                        <CalendarClock class="h-5 w-5 mb-2" :class="form.type === 'cron' ? 'text-primary' : 'text-muted-foreground'" />
                                        <p class="text-sm font-medium">Scheduled</p>
                                        <p class="text-[11px] text-muted-foreground mt-0.5">Specific date & time</p>
                                    </button>
                                </div>
                            </div>

                            <Separator />

                            <div class="space-y-3">
                                <div class="flex items-center gap-2">
                                    <span class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">3</span>
                                    <h4 class="text-sm font-medium">Configuration</h4>
                                </div>

                                <div v-if="form.type === 'interval'" class="space-y-4 pl-7">
                                    <div class="grid grid-cols-4 gap-2">
                                        <Button
                                            v-for="preset in [
                                                { label: 'Hourly',  hours: 1, days: 0, weeks: 0, minutes: 0, seconds: 0 },
                                                { label: '6 Hours', hours: 6, days: 0, weeks: 0, minutes: 0, seconds: 0 },
                                                { label: 'Daily',   hours: 0, days: 1, weeks: 0, minutes: 0, seconds: 0 },
                                                { label: 'Weekly',  hours: 0, days: 0, weeks: 1, minutes: 0, seconds: 0 },
                                            ]"
                                            :key="preset.label"
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            class="text-xs"
                                            @click="() => {
                                                form.intervalHours   = preset.hours
                                                form.intervalDays    = preset.days
                                                form.intervalWeeks   = preset.weeks
                                                form.intervalMinutes = preset.minutes
                                                form.intervalSeconds = preset.seconds
                                            }"
                                        >
                                            {{ preset.label }}
                                        </Button>
                                    </div>
                                    <div class="grid grid-cols-3 gap-3">
                                        <div class="space-y-1.5">
                                            <Label class="text-xs text-muted-foreground">Days</Label>
                                            <Input type="number" min="0" max="365" v-model.number="form.intervalDays" />
                                        </div>
                                        <div class="space-y-1.5">
                                            <Label class="text-xs text-muted-foreground">Hours</Label>
                                            <Input type="number" min="0" max="23" v-model.number="form.intervalHours" />
                                        </div>
                                        <div class="space-y-1.5">
                                            <Label class="text-xs text-muted-foreground">Minutes</Label>
                                            <Input type="number" min="0" max="59" v-model.number="form.intervalMinutes" />
                                        </div>
                                    </div>
                                </div>

                                <div v-else class="space-y-4 pl-7">
                                    <div class="grid grid-cols-2 gap-3">
                                        <div class="space-y-1.5">
                                            <Label class="text-xs text-muted-foreground">Date</Label>
                                            <Popover v-model:open="datePickerOpen">
                                                <PopoverTrigger as-child>
                                                    <Button
                                                        variant="outline"
                                                        class="w-full justify-start text-left font-normal"
                                                        :class="{ 'text-muted-foreground': !form.cronDate }"
                                                    >
                                                        <Calendar class="mr-2 h-4 w-4" />
                                                        {{ form.cronDate || 'Pick a date' }}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent class="w-auto p-0">
                                                    <CalendarPicker v-model="calendarValue" />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div class="space-y-1.5">
                                            <Label class="text-xs text-muted-foreground">Time (24h)</Label>
                                            <Input type="time" step="1" v-model="cronTimeInput" />
                                        </div>
                                    </div>

                                    <div class="flex items-center justify-between rounded-lg border p-3">
                                        <div class="space-y-0.5">
                                            <p class="text-sm font-medium">Repeat monthly</p>
                                            <p class="text-[11px] text-muted-foreground">Run on this day every month</p>
                                        </div>
                                        <Switch v-model:checked="form.cronRecurring" />
                                    </div>
                                </div>
                            </div>

                            <div class="rounded-lg border bg-muted/30 p-4">
                                <div class="flex items-center gap-2 mb-1.5">
                                    <div class="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Schedule Preview</p>
                                </div>
                                <p class="text-sm font-medium">
                                    {{ form.type === 'interval' ? getIntervalDescription : getCronDescription }}
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" @click="handleDialogOpenChange(false)" :disabled="isSubmitting">
                                Cancel
                            </Button>
                            <Button @click="handleCreate" :disabled="isSubmitting">
                                <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                                {{ isSubmitting
                                ? (editingScheduleId ? 'Updating...' : 'Scheduling...')
                                : (editingScheduleId ? 'Update Schedule' : 'Save Schedule') }}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <ScheduledScansTable
                :data="props.scans"
                :users="props.users"
                @delete="handleDelete"
                @edit="handleEdit"
            />

            <div v-if="isLoading && scans.length === 0" class="flex justify-center p-8 text-muted-foreground">
                <Loader2 class="h-6 w-6 animate-spin mr-2" /> Loading schedules...
            </div>
        </div>

        <ConfirmDialog
            :open="confirmOpen"
            :title="confirmOptions.title"
            :description="confirmOptions.description"
            :confirm-text="confirmOptions.confirmText"
            :cancel-text="confirmOptions.cancelText"
            :variant="confirmOptions.variant"
            @update:open="handleOpenChange"
            @confirm="onConfirmDelete"
            @cancel="onCancelDelete"
        />
    </Navigation>
</template>
