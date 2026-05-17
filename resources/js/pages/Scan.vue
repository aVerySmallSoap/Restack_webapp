<script setup lang="ts">
import { usePage } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import ScanForm from '@/components/custom/Scan/ScanForm.vue';
import ScanResultView from '@/components/custom/Scan/ScanResultView.vue';
import { useScanLogic } from '@/composables/useScanLogic';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-vue-next';

const page = usePage();
const userId = page.props.auth.user.id;

const { scanData, scanning, scanStatus, errorMsg, runScan, resetState } = useScanLogic();

function handleSubmit(payload: { url: string; type: 'basic' | 'full'; config?: any }) {
    runScan(payload.url, payload.type, userId, payload.config);
}
</script>

<template>
    <AppLayout>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div>
                <h1 class="text-2xl font-bold">New Scan</h1>
                <p class="text-muted-foreground mt-1 text-sm">Scan a target URL for vulnerabilities and misconfigurations.</p>
            </div>

            <ScanForm :scanning="scanning" :scan-status="scanStatus" @submit="handleSubmit" @clear="resetState" />

            <Alert v-if="errorMsg" variant="destructive">
                <AlertCircle class="h-4 w-4" />
                <AlertDescription>{{ errorMsg }}</AlertDescription>
            </Alert>

            <template v-if="scanData">
                <div class="border-t pt-8">
                    <h2 class="mb-6 text-lg font-semibold">Results</h2>
                    <ScanResultView :result="scanData" />
                </div>
            </template>
        </div>
    </AppLayout>
</template>
