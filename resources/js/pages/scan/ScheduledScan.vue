<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Navigation from '@/components/custom/Navigation.vue'
import { Head } from '@inertiajs/vue3'
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

// --- Configuration ---
const API_BASE = 'http://127.0.0.1:25565';

// --- State ---
const scans = ref<ScheduledScan[]>([])
const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const isLoading = ref(true)
const editingScheduleId = ref<string | null>(null)

// --- Form State ---
const form = ref({
    codename: '',
    url: '',
    type: 'interval', // 'interval' | 'cron'

    // Interval Config (Plural)
    intervalWeeks: 0,
    intervalDays: 1,
    intervalHours: 0,
    intervalMinutes: 0,
    intervalSeconds: 0,

    // Cron Config - Date/Time Format
    cronDate: '', // MM/DD/YYYY
    cronTime: '', // HH:MM:SS
    cronRecurring: true, // If false, runs once at specific date/time
})

// --- Helpers ---
const resetForm = () => {
    const now = new Date()
    const date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`

    form.value = {
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
    }
    editingScheduleId.value = null
}

// Parse MM/DD/YYYY to month and day
const parseDateString = (dateStr: string) => {
    const parts = dateStr.split('/')
    if (parts.length !== 3) return { month: '*', day: '*', year: '*' }

    const [month, day, year] = parts
    return {
        month: form.value.cronRecurring ? '*' : month,
        day: form.value.cronRecurring ? day : day,
        year: form.value.cronRecurring ? '*' : year
    }
}

// Parse HH:MM:SS to hour, minute, second
const parseTimeString = (timeStr: string) => {
    const parts = timeStr.split(':')
    if (parts.length < 2) return { hour: '0', minute: '0', second: '0' }

    const [hour, minute, second = '0'] = parts
    return { hour, minute, second }
}

// Convert user-friendly date/time to cron config
const buildCronConfig = () => {
    const dateComponents = parseDateString(form.value.cronDate)
    const timeComponents = parseTimeString(form.value.cronTime)

    return {
        second: timeComponents.second,
        minute: timeComponents.minute,
        hour: timeComponents.hour,
        day: dateComponents.day,
        month: dateComponents.month,
        year: dateComponents.year
    }
}

// Parse cron config back to date/time format
const parseCronConfig = (config: any) => {
    const month = config.month !== '*' ? config.month : String(new Date().getMonth() + 1).padStart(2, '0')
    const day = config.day !== '*' ? config.day : String(new Date().getDate()).padStart(2, '0')
    const year = config.year !== '*' ? config.year : new Date().getFullYear()

    form.value.cronDate = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`

    const hour = String(config.hour || '0').padStart(2, '0')
    const minute = String(config.minute || '0').padStart(2, '0')
    const second = String(config.second || '0').padStart(2, '0')

    form.value.cronTime = `${hour}:${minute}:${second}`

    // Determine if recurring (day is set but month/year are wildcards)
    form.value.cronRecurring = config.month === '*' && config.year === '*'
}

// Generate human-readable description for cron
const getCronDescription = computed(() => {
    const dateComponents = parseDateString(form.value.cronDate)
    const timeComponents = parseTimeString(form.value.cronTime)

    if (form.value.cronRecurring) {
        return `Every month on day ${dateComponents.day} at ${form.value.cronTime}`
    } else {
        return `Once on ${form.value.cronDate} at ${form.value.cronTime}`
    }
})

// Generate human-readable description for interval
const getIntervalDescription = computed(() => {
    const parts = []
    if (form.value.intervalWeeks > 0) parts.push(`${form.value.intervalWeeks} week${form.value.intervalWeeks > 1 ? 's' : ''}`)
    if (form.value.intervalDays > 0) parts.push(`${form.value.intervalDays} day${form.value.intervalDays > 1 ? 's' : ''}`)
    if (form.value.intervalHours > 0) parts.push(`${form.value.intervalHours} hour${form.value.intervalHours > 1 ? 's' : ''}`)
    if (form.value.intervalMinutes > 0) parts.push(`${form.value.intervalMinutes} minute${form.value.intervalMinutes > 1 ? 's' : ''}`)
    if (form.value.intervalSeconds > 0) parts.push(`${form.value.intervalSeconds} second${form.value.intervalSeconds > 1 ? 's' : ''}`)

    return parts.length > 0 ? `Runs every ${parts.join(', ')}` : 'No interval set'
})

// Validate date format (MM/DD/YYYY)
const validateDate = () => {
    const pattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/
    return pattern.test(form.value.cronDate)
}

// Validate time format (HH:MM:SS)
const validateTime = () => {
    const pattern = /^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/
    return pattern.test(form.value.cronTime)
}

// --- API Actions ---

const fetchSchedules = async () => {
    isLoading.value = true
    try {
        const res = await fetch(`${API_BASE}/v1/schedules/`)

        if (res.ok) {
            const json = await res.json()
            const dataArray = json.schedules || []

            scans.value = dataArray.map((s: any) => ({
                id: s.id,
                codename: s.name,
                url: s.target,
                jobType: s.job_type,
                configuration: s.configuration
            }))
        } else {
            const errorData = await res.json().catch(() => ({}))
            console.error(`Failed to fetch schedules: ${res.status}`, errorData)
            toast.error('Failed to load schedules')
        }
    } catch (e) {
        console.error("Network error fetching schedules", e)
        toast.error('Network error loading schedules')
    } finally {
        isLoading.value = false
    }
}

const handleCreate = async () => {
    if (!form.value.url || !form.value.codename) {
        toast.error('Please fill in all required fields')
        return
    }

    // Validate cron date/time if using cron
    if (form.value.type === 'cron') {
        if (!validateDate()) {
            toast.error('Invalid date format. Use MM/DD/YYYY')
            return
        }
        if (!validateTime()) {
            toast.error('Invalid time format. Use HH:MM:SS')
            return
        }
    }

    if (!form.value.url.startsWith('http')) {
        form.value.url = 'https://' + form.value.url
    }

    isSubmitting.value = true

    let schedulerConfig: Record<string, any> = {}

    if (form.value.type === 'interval') {
        if (form.value.intervalWeeks > 0) schedulerConfig.weeks = form.value.intervalWeeks
        if (form.value.intervalDays > 0) schedulerConfig.days = form.value.intervalDays
        if (form.value.intervalHours > 0) schedulerConfig.hours = form.value.intervalHours
        if (form.value.intervalMinutes > 0) schedulerConfig.minutes = form.value.intervalMinutes
        if (form.value.intervalSeconds > 0) schedulerConfig.seconds = form.value.intervalSeconds

        if (Object.keys(schedulerConfig).length === 0) {
            schedulerConfig.days = 1
        }
    } else {
        schedulerConfig = buildCronConfig()
    }

    try {
        const payload = {
            name: form.value.codename,
            target: form.value.url,
            job_type: form.value.type,
            interval: schedulerConfig
        }

        const isEditing = editingScheduleId.value !== null
        const url = isEditing
            ? `${API_BASE}/v1/schedule/${editingScheduleId.value}`
            : `${API_BASE}/v1/schedule/add`
        const method = isEditing ? 'PUT' : 'POST'

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (res.ok) {
            toast.success(isEditing ? 'Schedule updated successfully' : 'Schedule created successfully')
            isDialogOpen.value = false
            resetForm()
            await fetchSchedules()
        } else {
            const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }))
            console.error("API Error:", errorData)

            const errorMessage = typeof errorData.detail === 'string'
                ? errorData.detail
                : JSON.stringify(errorData.detail || errorData)

            toast.error(`Failed: ${errorMessage}`)
        }
    } catch (e) {
        console.error("Error saving schedule", e)
        toast.error('Network error saving schedule')
    } finally {
        isSubmitting.value = false
    }
}

const handleEdit = (scan: ScheduledScan) => {
    try {
        const config = typeof scan.configuration === 'string'
            ? JSON.parse(scan.configuration)
            : scan.configuration

        resetForm()

        form.value.codename = scan.codename
        form.value.url = scan.url
        form.value.type = scan.jobType

        if (scan.jobType === 'interval') {
            form.value.intervalWeeks = config.weeks || 0
            form.value.intervalDays = config.days || 0
            form.value.intervalHours = config.hours || 0
            form.value.intervalMinutes = config.minutes || 0
            form.value.intervalSeconds = config.seconds || 0
        } else if (scan.jobType === 'cron') {
            parseCronConfig(config)
        }

        editingScheduleId.value = scan.id
        isDialogOpen.value = true

        toast.info('Edit mode: Modify the schedule details')
    } catch (e) {
        console.error('Error parsing schedule for edit', e)
        toast.error('Failed to load schedule data')
    }
}

const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
        return
    }

    try {
        const res = await fetch(`${API_BASE}/v1/schedule/${id}`, {
            method: 'DELETE'
        })

        if (res.ok) {
            toast.success('Schedule deleted successfully')
            scans.value = scans.value.filter(s => s.id !== id)
        } else {
            const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }))
            const errorMessage = typeof errorData.detail === 'string'
                ? errorData.detail
                : JSON.stringify(errorData.detail || errorData)

            console.error("Delete Error:", errorData)
            toast.error(`Failed to delete: ${errorMessage}`)
        }
    } catch (e) {
        console.error("Error deleting schedule", e)
        toast.error('Network error deleting schedule')
    }
}

const handleDialogOpenChange = (open: boolean) => {
    isDialogOpen.value = open
    if (!open) {
        resetForm()
    }
}

onMounted(() => {
    fetchSchedules()
    resetForm() // Initialize with current date/time
})
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
                :data="scans"
                @delete="handleDelete"
                @edit="handleEdit"
            />

            <div v-if="isLoading && scans.length === 0" class="flex justify-center p-8 text-muted-foreground">
                <Loader2 class="h-6 w-6 animate-spin mr-2" /> Loading schedules...
            </div>
        </div>
    </Navigation>
</template>
