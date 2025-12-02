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

// --- Configuration ---
const API_BASE = 'http://127.0.0.1:25565';

// --- State ---
const scans = ref<ScheduledScan[]>([])
const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const isLoading = ref(true)

// --- Form State ---
const form = ref({
    codename: '',
    url: '',
    type: 'interval',
    profile: 'basic',

    // Interval Config
    intervalWeeks: 0,
    intervalDays: 1,
    intervalHours: 0,

    // Cron Config
    cronMonth: '*',
    cronDay: '*',
    cronYear: '*',
    cronHour: '0',
    cronMinute: '0'
})

// --- API Actions ---

const fetchSchedules = async () => {
    isLoading.value = true
    try {
        const res = await fetch(`${API_BASE}/v1/schedules`)

        if (res.ok) {
            const json = await res.json()

            if (json.data && Array.isArray(json.data)) {
                scans.value = json.data.map((s: any) => ({
                    ...s,
                    configuration: typeof s.config === 'string' ? s.config : JSON.stringify(s.config)
                }))
            } else {
                scans.value = []
            }
        } else {
            console.error(`Failed to fetch schedules: ${res.status}`)
        }
    } catch (e) {
        console.error("Network error fetching schedules", e)
    } finally {
        isLoading.value = false
    }
}

const handleCreate = async () => {
    if (!form.value.url || !form.value.codename) return

    if (!form.value.url.startsWith('http')) {
        form.value.url = 'https://' + form.value.url
    }

    isSubmitting.value = true

    let schedulerConfig: Record<string, any> = {}
    if (form.value.type === 'interval') {
        if (form.value.intervalWeeks > 0) schedulerConfig.weeks = form.value.intervalWeeks
        if (form.value.intervalDays > 0) schedulerConfig.days = form.value.intervalDays
        if (form.value.intervalHours > 0) schedulerConfig.hours = form.value.intervalHours
        if (Object.keys(schedulerConfig).length === 0) schedulerConfig.days = 1
    } else {
        schedulerConfig = {
            year: form.value.cronYear,
            month: form.value.cronMonth,
            day: form.value.cronDay,
            hour: form.value.cronHour,
            minute: form.value.cronMinute
        }
    }
    schedulerConfig.profile = form.value.profile

    try {
        const payload = {
            name: form.value.codename,
            target: form.value.url,
            job_type: form.value.type,
            interval: schedulerConfig
        }

        const res = await fetch(`${API_BASE}/v1/schedule/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (res.ok) {
            isDialogOpen.value = false
            form.value = {
                codename: '',
                url: '',
                type: 'interval',
                profile: 'basic',
                intervalWeeks: 0,
                intervalDays: 1,
                intervalHours: 0,
                cronMonth: '*',
                cronDay: '*',
                cronYear: '*',
                cronHour: '0',
                cronMinute: '0'
            }
            fetchSchedules()
        } else {
            // READ THE 422 ERROR DETAILS
            const errorData = await res.json()
            console.error("Validation Error:", errorData)
            alert(`Failed: ${JSON.stringify(errorData.detail)}`)
        }
    } catch (e) {
        console.error("Error creating schedule", e)
        alert("Network error occurred")
    } finally {
        isSubmitting.value = false
    }
}

const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this schedule?')) {
        try {
            // UPDATED: Endpoint changed to /v1/schedule/{id}
            await fetch(`${API_BASE}/v1/schedule/${id}`, { method: 'DELETE' })
            scans.value = scans.value.filter(s => s.id !== id)
        } catch (e) {
            console.error("Error deleting schedule", e)
        }
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

                <Dialog v-model:open="isDialogOpen">
                    <DialogTrigger as-child>
                        <Button>
                            <Plus class="mr-2 h-4 w-4" /> Add Schedule
                        </Button>
                    </DialogTrigger>
                    <DialogContent class="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create Scheduled Scan</DialogTitle>
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

                            <div class="grid grid-cols-2 gap-4">
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

                                <div class="grid gap-2">
                                    <Label>Profile</Label>
                                    <Select v-model="form.profile">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basic">Basic Scan</SelectItem>
                                            <SelectItem value="full">Full Scan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div class="border-t my-2"></div>

                            <div v-if="form.type === 'interval'" class="space-y-4 animate-in fade-in slide-in-from-top-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <Clock class="h-4 w-4 text-primary" />
                                    <h4 class="font-medium text-sm">Run every...</h4>
                                </div>
                                <div class="grid grid-cols-3 gap-4">
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Weeks</Label>
                                        <Input type="number" min="0" v-model="form.intervalWeeks" />
                                    </div>
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Days</Label>
                                        <Input type="number" min="0" v-model="form.intervalDays" />
                                    </div>
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Hours</Label>
                                        <Input type="number" min="0" v-model="form.intervalHours" />
                                    </div>
                                </div>
                                <p class="text-[11px] text-muted-foreground">
                                    Example: 1 Day = Daily scan. 1 Week = Weekly scan.
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
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Hour (0-23)</Label>
                                        <Input v-model="form.cronHour" placeholder="0" />
                                    </div>
                                    <div class="grid gap-1.5">
                                        <Label class="text-xs text-muted-foreground">Minute (0-59)</Label>
                                        <Input v-model="form.cronMinute" placeholder="0" />
                                    </div>
                                </div>
                                <p class="text-[11px] text-muted-foreground">
                                    Accepts standard cron syntax (e.g., "*", "*/5", "1,15").
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" @click="isDialogOpen = false">Cancel</Button>
                            <Button @click="handleCreate" :disabled="isSubmitting">
                                <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                                {{ isSubmitting ? 'Scheduling...' : 'Save Schedule' }}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <ScheduledScansTable
                :data="scans"
                @delete="handleDelete"
            />

            <div v-if="isLoading && scans.length === 0" class="flex justify-center p-8 text-muted-foreground">
                <Loader2 class="h-6 w-6 animate-spin mr-2" /> Loading schedules...
            </div>
        </div>
    </Navigation>
</template>
