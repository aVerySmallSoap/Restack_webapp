<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import AppLayout from '@/layouts/AppLayout.vue'
import ScanResultView from '@/components/custom/Scan/ScanResultView.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft } from 'lucide-vue-next'
import type { ScanResult } from '@/lib/types/scan'

// Inertia passes the transformer output as `report`
const props = defineProps<{
    report: ScanResult | null
    error?: string
}>()
</script>

<template>
    <AppLayout>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">

            <div class="flex items-center gap-3">
                <Button variant="ghost" size="sm" as-child>
                    <Link :href="route('history.index')">
                        <ArrowLeft class="h-4 w-4 mr-1" />
                        History
                    </Link>
                </Button>
            </div>

            <Alert v-if="error" variant="destructive">
                <AlertCircle class="h-4 w-4" />
                <AlertDescription>{{ error }}</AlertDescription>
            </Alert>

            <ScanResultView v-else-if="report" :result="report" />

            <div
                v-else
                class="rounded-lg border border-dashed p-12 text-center text-muted-foreground"
            >
                <p>Report not found.</p>
            </div>

        </div>
    </AppLayout>
</template>
