import { parseScanResult } from '@/lib/restack/scanParsers';
import type { ScanResult } from '@/lib/types/scan';
import { onUnmounted, ref } from 'vue';
import { toast } from 'vue-sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const WS_BASE_URL = import.meta.env.VITE_API_SOCKET;

export function useScanLogic() {
    const scanData = ref<ScanResult | null>(null);
    const scanning = ref(false);
    const errorMsg = ref('');
    const scanStatus = ref('');

    let ws: WebSocket | null = null;
    let currentSessionId: string | null = null;
    let scanType: 'basic' | 'full' = 'full';

    function formatUrl(raw: string): string {
        let url = raw.trim();
        if (!url) return '';
        url = url.replace(/localhost|127\.0\.0\.1/g, 'host.docker.internal');
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        if (url.includes('host.docker.internal') && url.startsWith('https://')) url = url.replace('https://', 'http://');
        return url;
    }

    async function fetchResult(sessionId: string) {
        try {
            const res = await fetch(`${API_BASE_URL}/v1/scan/result/${sessionId}`);
            if (!res.ok) throw new Error(res.statusText);

            const raw = await res.json();
            if (raw?.status !== 'success') throw new Error(raw?.reason ?? 'Scan failed');

            scanData.value = parseScanResult(raw); // ← canonical type
            scanStatus.value = 'Success';
            scanning.value = false;
            toast.success('Scan complete');
        } catch (e: any) {
            errorMsg.value = e.message;
            scanStatus.value = 'Failed';
            scanning.value = false;
            toast.error('Failed to fetch results', { description: e.message });
        } finally {
            disconnectWs();
        }
    }

    function connectWs() {
        try {
            ws = new WebSocket(`${WS_BASE_URL}/v1/ws/scans/poll`);

            ws.onmessage = (evt) => {
                try {
                    const data = JSON.parse(evt.data);
                    if (!currentSessionId || data.message === 'No active scans') return;

                    if (data.completed?.[currentSessionId]) {
                        fetchResult(currentSessionId);
                        return;
                    }

                    const info = data[currentSessionId];
                    if (!info) return;

                    const step = info.step;
                    if (!['Success', 'Failed'].includes(scanStatus.value)) scanStatus.value = step;

                    if (step === 'Completed' || step === 'Success') fetchResult(currentSessionId);
                    else if (step === 'Failed' || step === 'Error') {
                        errorMsg.value = 'Scan failed on the server';
                        scanStatus.value = 'Failed';
                        scanning.value = false;
                        toast.error('Scan failed');
                        disconnectWs();
                    }
                } catch {
                    /* ignore parse errors */
                }
            };

            ws.onerror = () => {
                /* reconnect is caller's responsibility */
            };
        } catch (e) {
            console.error('WS connect failed', e);
        }
    }

    function disconnectWs() {
        ws?.close();
        ws = null;
    }

    async function runScan(rawUrl: string, type: 'basic' | 'full', userId: number, config?: any) {
        const url = formatUrl(rawUrl);
        if (!url) {
            toast.error('Enter a valid URL');
            return;
        }

        resetState();
        scanning.value = true;
        scanType = type;
        scanStatus.value = 'Queued';

        const endpoint = type === 'basic' ? '/v1/scan/quick' : '/v1/scan';

        try {
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, user_id: userId, config }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail ?? res.statusText);
            }

            const data = await res.json();
            if (!data.session_id) throw new Error('No session_id from server');

            currentSessionId = data.session_id;
            scanStatus.value = 'Initializing';
            connectWs();
            toast.info('Scan queued', { description: `Tracking ${url}` });
        } catch (e: any) {
            errorMsg.value = e.message;
            scanStatus.value = 'Failed';
            scanning.value = false;
            toast.error('Scan failed', { description: e.message });
        }
    }

    function resetState() {
        scanData.value = null;
        errorMsg.value = '';
        scanStatus.value = '';
        currentSessionId = null;
        disconnectWs();
    }

    onUnmounted(disconnectWs);

    return { scanData, scanning, errorMsg, scanStatus, runScan, resetState };
}
