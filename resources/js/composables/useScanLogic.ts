import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { parseBasicScan, parseFullScan } from '@/lib/restack/scanParsers';
import type { ScanResult } from '@/lib/restack/restack.types';

const API_BASE_URL = "http://127.0.0.1:25565";

export function useScan() {
    const scanData = ref<ScanResult | null>(null);
    const scanning = ref(false);
    const errorMsg = ref('');
    const progress = ref(0);

    let progressInterval: any = null;

    // Formatter to handle localhost/docker environments
    const formatUrl = (inputUrl: string) => {
        let formatted = inputUrl.trim();
        if (!formatted) return '';

        // Replace localhost with docker host
        if (inputUrl.includes('localhost') || inputUrl.includes('127.0.0.1')) {
            formatted = formatted.replace(/localhost|127\.0\.0\.1/g, "host.docker.internal");
        }

        // Add protocol if missing
        if (!/^https?:\/\//i.test(formatted)) {
            formatted = 'https://' + formatted;
        }

        // Use http for docker internal
        if (formatted.includes("host.docker.internal") && formatted.startsWith("https://")) {
            formatted = formatted.replace("https://", "http://");
        }

        return formatted;
    };

    // Mock progress animation
    const startMockProgress = (duration: number) => {
        progress.value = 0;
        const step = 100 / (duration / 500);
        progressInterval = setInterval(() => {
            if (progress.value < 90) {
                progress.value += step;
            }
        }, 500);
    };

    const stopMockProgress = () => {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        progress.value = 100;
    };

    const runScan = async (rawUrl: string, type: 'basic' | 'full', userId: number, config?: any) => {
        const target = formatUrl(rawUrl);
        if (!target) {
            toast.error('Please enter a valid URL');
            return;
        }

        resetState();
        scanning.value = true;

        const estimatedDuration = type === 'basic' ? 15000 : 45000;
        startMockProgress(estimatedDuration);

        const endpoint = type === 'basic' ? '/api/v1/wapiti/scan/quick' : '/api/v1/scan/';

        try {
            const payload: any = {
                url: target,
                user_id: userId
            };

            if (type === 'full' && config) {
                payload.config = config;
            }

            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let errorMessage = res.statusText;
                try {
                    const err = await res.json();
                    if (err.detail) {
                        errorMessage = Array.isArray(err.detail)
                            ? err.detail.map((e: any) => e.msg || e).join(', ')
                            : err.detail;
                    }
                } catch (e) {
                    // Failed to parse error JSON
                }
                throw new Error(errorMessage);
            }

            const data = await res.json();

            console.log('Raw scan response:', data);

            // Parse based on scan type
            if (type === 'basic') {
                scanData.value = parseBasicScan(data, target);
            } else {
                scanData.value = parseFullScan(data, target);
            }

            console.log('Parsed scan data:', scanData.value);

            toast.success(`${type === 'basic' ? 'Basic' : 'Full'} Scan completed!`);

        } catch (e: any) {
            console.error('Scan error:', e);
            errorMsg.value = e.message;
            toast.error('Scan Failed', { description: e.message });
        } finally {
            scanning.value = false;
            stopMockProgress();
        }
    };

    const resetState = () => {
        scanData.value = null;
        errorMsg.value = '';
        progress.value = 0;
    };

    return {
        scanData,
        scanning,
        errorMsg,
        progress,
        runScan,
        resetState
    };
}
