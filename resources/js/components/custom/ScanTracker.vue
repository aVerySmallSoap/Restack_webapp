<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Activity, Loader2 } from 'lucide-vue-next';
import { onMounted, onUnmounted, ref } from 'vue';

const WEBSOCKET_URI = 'ws://localhost:25565/api/v1/ws/scans/poll';
const STEPS = ["Initializing", "Scanning", "ZAP Scanning", "Wapiti Scanning", "WhatWeb Scanning", "Querying Search_vulns", "Parsing", "Analyzing", "Generating report", "Saving", "Cleaning"]
interface ScanTask {
    session: string;
    target: string;
    step: string;
    type?: string;
}

const activeScans = ref<ScanTask[]>([]);
const isConnected = ref(false);
const error = ref(false);
let socket: WebSocket | null = null;
let reconnectInterval: any = null;

const connect = () => {
    try {
        socket = new WebSocket(WEBSOCKET_URI);

        socket.onopen = () => {
            isConnected.value = true;
            error.value = false;
        };

        socket.onclose = () => {
            isConnected.value = false;
        };

        socket.onerror = () => {
            error.value = true;
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);



                activeScans.value = Array.isArray(data) ? data : data;
            } catch (e) {
                console.error('Failed to parse scan data', e);
            }
        };
    } catch (e) {
        error.value = true;
    }
};

onMounted(() => {
    connect();
    reconnectInterval = setInterval(() => {
        if (!socket || socket.readyState === WebSocket.CLOSED) {
            connect();
        }
    }, 5000);
});

onUnmounted(() => {
    if (socket) socket.close();
    if (reconnectInterval) clearInterval(reconnectInterval);
});

function getStatusColor(status: string) {
    switch (status?.toLowerCase()) {
        case 'running': return 'default';
        case 'completed': return 'success'; // Assuming you have a success variant, or use default
        case 'failed': return 'destructive';
        case 'pending': return 'secondary';
        default: return 'outline';
    }
}
</script>

<template>
    <div class="flex h-full flex-col">
        <Separator class="my-6" />

        <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm font-medium">
                <Activity class="text-primary h-4 w-4" />
                <h3>Active Scans</h3>
            </div>
            <Badge
                variant="outline"
                class="text-[10px] font-normal"
                :class="
                    isConnected
                        ? 'border-emerald-500/50 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400'
                "
            >
                {{ isConnected ? 'Live' : 'Connecting...' }}
            </Badge>
        </div>

        <div v-if="!isConnected && !activeScans.length" class="text-muted-foreground flex flex-col items-center justify-center space-y-2 py-8">
            <Loader2 class="h-5 w-5 animate-spin opacity-50" />
            <span class="text-xs">Connecting to scanner service...</span>
        </div>

        <div
            v-else-if="activeScans.length === 0"
            class="text-muted-foreground bg-muted/30 flex flex-col items-center justify-center rounded-lg border border-dashed py-8"
        >
            <span class="text-sm">No active scans</span>
            <span class="text-xs opacity-70">New scans will appear here</span>
        </div>

        <div v-else class="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
            <div v-for="scan in activeScans" :key="scan.session" class="bg-card flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div class="flex min-w-0 flex-col gap-1">
                    <span class="block truncate text-sm font-medium" :title="scan.target">{{ scan.target }}</span>
                    <div class="text-muted-foreground flex items-center gap-2 text-xs">
                        <Badge variant="secondary" class="h-5 px-1.5 text-[10px]">{{ scan.type || 'Scan' }}</Badge>
                        <span class="capitalize">{{ scan.step }}</span>
                    </div>
                </div>
                <Loader2
                    v-if="STEPS.some(s => s.toLowerCase() === scan.step?.toLowerCase())"
                    class="text-primary h-4 w-4 shrink-0 animate-spin"
                />
            </div>
        </div>
    </div>
</template>
