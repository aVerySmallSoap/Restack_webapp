<script setup lang="ts">
import Navigation from '@/components/custom/Navigation.vue'
import ScanForm from '@/components/custom/Scan/ScanForm.vue'
import ScanResults from '@/components/custom/Scan/ScanResults.vue'
import { useScan } from '@/composables/useScanLogic'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePage } from '@inertiajs/vue3'

// Destructure 'scanStatus' instead of 'progress'
const { scanData, scanning, errorMsg, scanStatus, runScan, resetState } = useScan()
const page = usePage()

function  handleScanSubmit(payload: { url: string; type: 'basic' | 'full'; config?: any }) {
    const userId = page.props.auth.user.id;
    runScan(payload.url, payload.type, userId, payload.config)
}
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div>
                <h1 class="px-2 text-4xl font-bold">New Scan</h1>
                <div class="p-1.5"><span>Run scans to probe websites for vulnerabilities.</span></div>
            </div>

            <ScanForm
                :scanning="scanning"
                :scan-status="scanStatus"
                @submit="handleScanSubmit"
                @clear="resetState"
            />

            <div v-if="errorMsg && !scanning" class="p-2 text-center font-bold text-red-600">
                {{ errorMsg }}
            </div>

            <div v-if="scanning" class="mt-2 animate-pulse space-y-4">
                <Card>
                    <CardHeader><Skeleton class="h-6 w-48" /></CardHeader>
                    <CardContent class="space-y-4">
                        <Skeleton class="h-4 w-full" />
                        <Skeleton class="h-4 w-3/4" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><Skeleton class="h-8 w-64" /></CardHeader>
                    <CardContent>
                        <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div v-for="i in 4" :key="i" class="space-y-2 rounded-lg border p-4">
                                <Skeleton class="h-4 w-20" />
                                <Skeleton class="h-8 w-12" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <ScanResults v-else-if="scanData" :data="scanData" />
        </div>
    </Navigation>
</template>
