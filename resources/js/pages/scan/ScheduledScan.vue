<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
import { Plus, Loader2, Clock, CalendarClock } from 'lucide-vue-next'
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

    // Cron Config (Singular)
    cronMonth: '*',
    cronDay: '*',
    cronYear: '*',
    cronHour: '0',
    cronMinute: '0',
    cronSecond: '0'
})

// --- Helpers ---
const resetForm = () => {
    form.value = {
        codename: '',
        url: '',
        type: 'interval',
        intervalWeeks: 0,
        intervalDays: 1,
        intervalHours: 0,
        intervalMinutes: 0,
        intervalSeconds: 0,
        cronMonth: '*',
        cronDay: '*',
        cronYear: '*',
        cronHour: '0',
        cronMinute: '0',
        cronSecond: '0'
    }
    editingScheduleId.value = null
}

// --- API Actions ---

const fetchSchedules = async () => {
    isLoading.value = true
    try {
        const res = await fetch(`${API_BASE}/v1/schedules/`)

        if (res.ok) {
            const json = await res.json()
            const dataArray = Array.isArray(json) ? json : (json.data || [])

            if (Array.isArray(dataArray)) {
                scans.value = dataArray.map((s: any) => ({
                    id: s.id,
                    codename: s.codename,
                    url: s.url,
                    jobType: s.job_type || 'interval',
                    configuration: typeof s.configuration === 'string'
                        ? s.configuration
                        : JSON.stringify(s.configuration || {})
                }))
            } else {
                scans.value = []
            }
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
    // Validation
    if (!form.value.url || !form.value.codename) {
        toast.error('Please fill in all required fields')
        return
    }

    // Auto-fix URL if missing protocol
    if (!form.value.url.startsWith('http')) {
        form.value.url = 'https://' + form.value.url
    }

    isSubmitting.value = true

    // 1. Construct the configuration object
    let schedulerConfig: Record<string, any> = {}

    if (form.value.type === 'interval') {
        // Build interval config with only non-zero values
        if (form.value.intervalWeeks > 0) schedulerConfig.weeks = form.value.intervalWeeks
        if (form.value.intervalDays > 0) schedulerConfig.days = form.value.intervalDays
        if (form.value.intervalHours > 0) schedulerConfig.hours = form.value.intervalHours
        if (form.value.intervalMinutes > 0) schedulerConfig.minutes = form.value.intervalMinutes
        if (form.value.intervalSeconds > 0) schedulerConfig.seconds = form.value.intervalSeconds

        // Ensure at least one interval value
        if (Object.keys(schedulerConfig).length === 0) {
            schedulerConfig.days = 1
        }
    } else {
        // Build cron config
        schedulerConfig = {
            year: form.value.cronYear,
            month: form.value.cronMonth,
            day: form.value.cronDay,
            hour: form.value.cronHour,
            minute: form.value.cronMinute,
            second: form.value.cronSecond
        }
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

            // Better error message parsing
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
        // Parse configuration
        const config = typeof scan.configuration === 'string'
            ? JSON.parse(scan.configuration)
            : scan.configuration

        // Reset form first
        resetForm()

        // Set basic values
        form.value.codename = scan.codename
        form.value.url = scan.url
        form.value.type = scan.jobType

        // Set configuration based on type
        if (scan.jobType === 'interval') {
            form.value.intervalWeeks = config.weeks || 0
            form.value.intervalDays = config.days || 0
            form.value.intervalHours = config.hours || 0
            form.value.intervalMinutes = config.minutes || 0
            form.value.intervalSeconds = config.seconds || 0
        } else if (scan.jobType === 'cron') {
            form.value.cronYear = config.year || '*'
            form.value.cronMonth = config.month || '*'
            form.value.cronDay = config.day || '*'
            form.value.cronHour = config.hour || '0'
            form.value.cronMinute = config.minute || '0'
            form.value.cronSecond = config.second || '0'
        }

        // Set editing ID and open dialog
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
            // Remove from local state immediately
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
                                Configure a recurring scan job using Interval or Cron syntax.
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
                                        <SelectItem value="interval">Interval (Simple)</SelectItem>
                                        <SelectItem value="cron">Cron (Advanced)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div class="border-t my-2"></div>

                            <div v-if="form.type === 'interval'" class="space-y-4 animate-in fade-in slide-in-from-top-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <Clock class="h-4 w-4 text-primary" />
                                    <h4 class="font-medium text-sm">Run every...</h4>
                                </div>
                                <div class="grid grid-cols-5 gap-3">
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Weeks</Label>
                                        <Input type="number" min="0" v-model.number="form.intervalWeeks" />
                                    </div>
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Days</Label>
                                        <Input type="number" min="0" v-model.number="form.intervalDays" />
                                    </div>
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Hours</Label>
                                        <Input type="number" min="0" v-model.number="form.intervalHours" />
                                    </div>
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Minutes</Label>
                                        <Input type="number" min="0" v-model.number="form.intervalMinutes" />
                                    </div>
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Seconds</Label>
                                        <Input type="number" min="0" v-model.number="form.intervalSeconds" />
                                    </div>
                                </div>
                                <p class="text-[11px] text-muted-foreground">
                                    Example: 1 Day = Daily scan. 30 Minutes = Every 30 mins.
                                </p>
                            </div>

                            <div v-else class="space-y-4 animate-in fade-in slide-in-from-top-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <CalendarClock class="h-4 w-4 text-primary" />
                                    <h4 class="font-medium text-sm">Cron Configuration</h4>
                                </div>
                                <div class="grid grid-cols-3 gap-3">
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Month</Label>
                                        <Input v-model="form.cronMonth" placeholder="*" />
                                    </div>
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Day</Label>
                                        <Input v-model="form.cronDay" placeholder="*" />
                                    </div>
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Year</Label>
                                        <Input v-model="form.cronYear" placeholder="*" />
                                    </div>
                                </div>
                                <div class="grid grid-cols-3 gap-3">
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Hour (0-23)</Label>
                                        <Input v-model="form.cronHour" placeholder="0" />
                                    </div>
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Minute (0-59)</Label>
                                        <Input v-model="form.cronMinute" placeholder="0" />
                                    </div>
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Second (0-59)</Label>
                                        <Input v-model="form.cronSecond" placeholder="0" />
                                    </div>
                                </div>
                                <p class="text-[11px] text-muted-foreground">
                                    Accepts standard cron syntax (e.g., "*", "*/5", "1,15").
                                </p>
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
