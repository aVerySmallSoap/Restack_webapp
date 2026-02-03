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
import { toast } from 'vue-sonner'

// --- Props ---
const props = defineProps<{
    scans: ScheduledScan[];
    users: { label: string; value: string }[];
}>()

// --- UI State (Fixing the "undefined on instance" error) ---
const isLoading = ref(false) // Data is passed via props, so default to false
const isSubmitting = computed(() => form.processing)

const isDialogOpen = ref(false)
const editingScheduleId = ref<string | null>(null)

// --- Form (Inertia) ---
const form = useForm({
    codename: '',
    url: '',
    type: 'interval',

    // Interval Config
    intervalWeeks: 0,
    intervalDays: 1,
    intervalHours: 0,
    intervalMinutes: 0,
    intervalSeconds: 0,

    // Cron Config
    cronDate: '',
    cronTime: '',
    cronRecurring: true,
})

// --- Helpers ---
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

// --- API Actions ---

const handleCreate = () => {
    if (!form.url || !form.codename) {
        toast.error('Please fill in required fields'); return;
    }
    if (form.type === 'cron' && (!validateDate() || !validateTime())) {
        toast.error('Invalid date/time format'); return;
    }

    if (!form.url.startsWith('http')) form.url = 'https://' + form.url

    // Build Configuration Object
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

    const options = {
        onSuccess: () => {
            toast.success(editingScheduleId.value ? 'Schedule updated' : 'Schedule created')
            isDialogOpen.value = false
            resetForm()
        },
        onError: (err: any) => {
            toast.error('Failed to save schedule')
            console.error(err)
        }
    }

    // Transform form data to match your requested keys
    const transform = (data: any) => ({
        url: data.url,
        codename: data.codename,

        // 1. Map type -> schedule_type
        job_type: data.type,

        // 2. Map config -> configuration
        configuration: schedulerConfig
    })

    if (editingScheduleId.value) {
        form.transform(transform).put(route('scheduled.update', editingScheduleId.value), options)
    } else {
        form.transform(transform).post(route('scheduled.store'), options)
    }
}

const handleEdit = (scan: ScheduledScan) => {
    // Check if configuration is a string (JSON) or already an object
    const config = typeof scan.configuration === 'string'
        ? JSON.parse(scan.configuration)
        : scan.configuration

    resetForm()

    form.codename = scan.codename
    form.url = scan.url

    // SAFETY CHECK: Look for 'job_type' (DB) OR 'jobType' (Frontend Type)
    // This ensures it works regardless of how Laravel serializes the model.
    const typeFromDb = (scan as any).job_type || (scan as any).jobType;
    form.type = typeFromDb || 'interval';

    if (form.type === 'interval') {
        form.intervalWeeks = config.weeks || 0
        form.intervalDays = config.days || 0
        form.intervalHours = config.hours || 0
        form.intervalMinutes = config.minutes || 0
        form.intervalSeconds = config.seconds || 0
    } else {
        parseCronConfig(config)
    }

    editingScheduleId.value = scan.id
    isDialogOpen.value = true
}
const handleDelete = (id: string) => {
    if (confirm('Are you sure?')) {
        router.delete(route('scheduled.destroy', id), {
            onSuccess: () => toast.success('Schedule deleted'),
            onError: () => toast.error('Failed to delete')
        })
    }
}

const handleDialogOpenChange = (open: boolean) => {
    isDialogOpen.value = open
    if (!open) resetForm()
    else if (!editingScheduleId.value) resetForm()
}

// Initial setup
resetForm()
</script>
<template>
    <Head title="Scheduled Scans" />

    <Navigation>
        <div class="flex flex-1 flex-col gap-6 p-4 pt-0">
            <div class="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
                <div class="space-y-1">
                    <h1 class="font-bold px-2 text-4xl">Scheduled Scans</h1>
                    <p class="px-2 text-muted-foreground">
                        Manage automated vulnerability scans for your targets.
                    </p>
                </div>

                <Dialog :open="isDialogOpen" @update:open="handleDialogOpenChange">
                    <DialogTrigger as-child>
                        <Button>
                            <Plus class="mr-2 h-4 w-4" /> Add Schedule
                        </Button>
                    </DialogTrigger>
                    <DialogContent class="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                {{ editingScheduleId ? 'Edit' : 'Create' }} Scheduled Scan
                            </DialogTitle>
                            <DialogDescription>
                                Configure a recurring scan job with a simple or date/time schedule.
                            </DialogDescription>
                        </DialogHeader>

                        <div class="grid gap-4 py-4">
                            <div class="grid gap-2">
                                <Label>Codename</Label>
                                <Input v-model="form.codename" placeholder="e.g. Production Nightly" />
                            </div>

                            <div class="grid gap-2">
                                <Label>Target URL</Label>
                                <Input v-model="form.url" placeholder="https://example.com" />
                            </div>

                            <div class="grid gap-2">
                                <Label>Schedule Type</Label>
                                <Select v-model="form.type">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="interval">Interval (Run every X time)</SelectItem>
                                        <SelectItem value="cron">Date/Time (Run at specific date/time)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div class="border-t my-2"></div>

                            <!-- INTERVAL CONFIGURATION -->
                            <div v-if="form.type === 'interval'" class="space-y-4 animate-in fade-in slide-in-from-top-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <Clock class="h-4 w-4 text-primary" />
                                    <h4 class="font-medium text-sm">Run every...</h4>
                                </div>

                                <!-- Quick Presets -->
                                <div class="grid gap-2">
                                    <Label>Quick Presets</Label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            @click="() => { form.intervalWeeks = 0; form.intervalDays = 0; form.intervalHours = 1; form.intervalMinutes = 0; form.intervalSeconds = 0 }"
                                            class="justify-start"
                                        >
                                            <Clock class="mr-2 h-4 w-4" />
                                            Every Hour
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            @click="() => { form.intervalWeeks = 0; form.intervalDays = 0; form.intervalHours = 6; form.intervalMinutes = 0; form.intervalSeconds = 0 }"
                                            class="justify-start"
                                        >
                                            <Clock class="mr-2 h-4 w-4" />
                                            Every 6 Hours
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            @click="() => { form.intervalWeeks = 0; form.intervalDays = 1; form.intervalHours = 0; form.intervalMinutes = 0; form.intervalSeconds = 0 }"
                                            class="justify-start"
                                        >
                                            <Calendar class="mr-2 h-4 w-4" />
                                            Daily
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            @click="() => { form.intervalWeeks = 1; form.intervalDays = 0; form.intervalHours = 0; form.intervalMinutes = 0; form.intervalSeconds = 0 }"
                                            class="justify-start"
                                        >
                                            <Calendar class="mr-2 h-4 w-4" />
                                            Weekly
                                        </Button>
                                    </div>
                                </div>

                                <div class="relative">
                                    <div class="absolute inset-0 flex items-center">
                                        <span class="w-full border-t" />
                                    </div>
                                    <div class="relative flex justify-center text-xs uppercase">
                                        <span class="bg-background px-2 text-muted-foreground">Or Custom</span>
                                    </div>
                                </div>

                                <!-- Custom Interval -->
                                <div class="grid grid-cols-3 gap-3">
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Days</Label>
                                        <Input type="number" min="0" v-model.number="form.intervalDays" />
                                    </div>
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Hours</Label>
                                        <Input type="number" min="0" max="23" v-model.number="form.intervalHours" />
                                    </div>
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Minutes</Label>
                                        <Input type="number" min="0" max="59" v-model.number="form.intervalMinutes" />
                                    </div>
                                </div>

                                <!-- Preview -->
                                <div class="rounded-lg bg-muted p-3 mt-2">
                                    <p class="text-xs text-muted-foreground mb-1">Interval Preview:</p>
                                    <p class="text-sm font-medium">{{ getIntervalDescription }}</p>
                                </div>
                            </div>

                            <!-- DATE/TIME CONFIGURATION -->
                            <div v-else class="space-y-4 animate-in fade-in slide-in-from-top-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <CalendarClock class="h-4 w-4 text-primary" />
                                    <h4 class="font-medium text-sm">Date & Time Configuration</h4>
                                </div>

                                <!-- Date Input -->
                                <div class="grid gap-2">
                                    <Label>Date (MM/DD/YYYY)</Label>
                                    <div class="flex items-center gap-2">
                                        <Calendar class="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            v-model="form.cronDate"
                                            placeholder="MM/DD/YYYY"
                                            :class="{ 'border-destructive': form.cronDate && !validateDate() }"
                                        />
                                    </div>
                                    <p class="text-[11px] text-muted-foreground">
                                        Example: 12/25/2025 for December 25, 2025
                                    </p>
                                </div>

                                <!-- Time Input -->
                                <div class="grid gap-2">
                                    <Label>Time (HH:MM:SS)</Label>
                                    <div class="flex items-center gap-2">
                                        <Clock class="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            v-model="form.cronTime"
                                            placeholder="HH:MM:SS"
                                            :class="{ 'border-destructive': form.cronTime && !validateTime() }"
                                        />
                                    </div>
                                    <p class="text-[11px] text-muted-foreground">
                                        Example: 14:30:00 for 2:30 PM (24-hour format)
                                    </p>
                                </div>

                                <!-- Recurring Toggle -->
                                <div class="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="recurring"
                                        v-model="form.cronRecurring"
                                        class="h-4 w-4 rounded border-gray-300"
                                    />
                                    <Label for="recurring" class="text-sm font-normal cursor-pointer">
                                        Repeat every month on this day
                                    </Label>
                                </div>

                                <!-- Preview -->
                                <div class="rounded-lg bg-muted p-3 mt-2">
                                    <p class="text-xs text-muted-foreground mb-1">Schedule Preview:</p>
                                    <p class="text-sm font-medium">{{ getCronDescription }}</p>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" @click="handleDialogOpenChange(false)" :disabled="isSubmitting">
                                Cancel
                            </Button>
                            <Button @click="handleCreate" :disabled="isSubmitting">
                                <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                                {{ isSubmitting ? (editingScheduleId ? 'Updating...' : 'Scheduling...') : (editingScheduleId ? 'Update Schedule' : 'Save Schedule') }}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <ScheduledScansTable
                :data="props.scans"
                :users="props.users"  @delete="handleDelete"
                @edit="handleEdit"
            />

            <div v-if="isLoading && scans.length === 0" class="flex justify-center p-8 text-muted-foreground">
                <Loader2 class="h-6 w-6 animate-spin mr-2" /> Loading schedules...
            </div>
        </div>
    </Navigation>
</template>
