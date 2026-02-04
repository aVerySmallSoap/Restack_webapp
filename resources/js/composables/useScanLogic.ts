import { ref, onUnmounted } from 'vue';
import { toast } from 'vue-sonner';
import { parseBasicScan, parseFullScan } from '@/lib/restack/scanParsers';
import type { ScanResult } from '@/lib/restack/restack.types';

const API_BASE_URL = "http://127.0.0.1:25565";
const WS_BASE_URL = "ws://127.0.0.1:25565";

export function useScan() {
    const scanData = ref<ScanResult | null>(null);
    const scanning = ref(false);
    const errorMsg = ref('');
    const scanStatus = ref('');

    let ws: WebSocket | null = null;
    let currentSessionId: string | null = null;
    let targetUrl: string = '';

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

    // ✅ IMPROVED: Normalize URLs for comparison
    const normalizeUrl = (url: string): string => {
        try {
            const normalized = new URL(url);
            // Remove trailing slash, convert to lowercase for comparison
            return normalized.href.replace(/\/$/, '').toLowerCase();
        } catch {
            return url.replace(/\/$/, '').toLowerCase();
        }
    };

    // Connect to WebSocket for real-time progress updates
    const connectWebSocket = () => {
        try {
            ws = new WebSocket(`${WS_BASE_URL}/api/v1/ws/scans/poll`);

            ws.onopen = () => {
                console.log('WebSocket connected for scan tracking');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle "no active scans" message
                    if (data.message === "No active scans") {
                        return;
                    }

                    // Handle error messages
                    if (data.error) {
                        console.error('WebSocket error:', data.error);
                        return;
                    }

                    // Try to find our scan by session ID or URL
                    let scanInfo = null;

                    if (currentSessionId && data[currentSessionId]) {
                        scanInfo = data[currentSessionId];
                    } else {
                        // ✅ IMPROVED: Better URL matching with normalization
                        const normalizedTarget = normalizeUrl(targetUrl);
                        for (const sessionId in data) {
                            const scanTarget = data[sessionId].target;
                            if (normalizeUrl(scanTarget) === normalizedTarget) {
                                scanInfo = data[sessionId];
                                currentSessionId = sessionId;
                                console.log(`Matched scan by URL. Session ID: ${sessionId}`);
                                break;
                            }
                        }
                    }

                    if (scanInfo) {
                        const step = scanInfo.step;
                        scanStatus.value = step;

                        console.log(`Scan status: ${step}`);

                        // If scan is complete or failed, disconnect
                        if (step === "Success" || step === "Failed" || step === "Error") {
                            disconnectWebSocket();
                        }
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
            };

        } catch (e) {
            console.error('Failed to connect WebSocket:', e);
        }
    };

    // Disconnect WebSocket
    const disconnectWebSocket = () => {
        if (ws) {
            ws.close();
            ws = null;
        }
    };

    const runScan = async (rawUrl: string, type: 'basic' | 'full', userId: number, config?: any) => {
        const target = formatUrl(rawUrl);
        if (!target) {
            toast.error('Please enter a valid URL');
            return;
        }

        resetState();
        scanning.value = true;
        targetUrl = target;
        scanStatus.value = 'Initializing...';

        // ✅ IMPROVED: Connect WebSocket with a small delay to ensure it's ready
        connectWebSocket();

        // ✅ IMPROVED: Wait for WebSocket to connect before starting scan
        await new Promise(resolve => setTimeout(resolve, 500));

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

            // ✅ IMPROVED: Extract session ID and log for debugging
            if (data.session_id) {
                currentSessionId = data.session_id;
                console.log(`Session ID received: ${currentSessionId}`);
            } else {
                console.warn('No session_id in response. Using URL matching for status updates.');
            }

            // Parse based on scan type
            if (type === 'basic') {
                scanData.value = parseBasicScan(data, target);
            } else {
                scanData.value = parseFullScan(data, target);
            }

            console.log('Parsed scan data:', scanData.value);

            scanStatus.value = 'Success';

            toast.success(`${type === 'basic' ? 'Basic' : 'Full'} Scan completed!`);

        } catch (e: any) {
            console.error('Scan error:', e);
            errorMsg.value = e.message;
            scanStatus.value = 'Failed';
            toast.error('Scan Failed', { description: e.message });
        } finally {
            scanning.value = false;
            // ✅ IMPROVED: Add small delay before disconnecting to catch final status
            setTimeout(() => {
                disconnectWebSocket();
            }, 1000);
        }
    };

    const resetState = () => {
        scanData.value = null;
        errorMsg.value = '';
        scanStatus.value = '';
        currentSessionId = null;
        targetUrl = '';
    };

    // Cleanup WebSocket on component unmount
    onUnmounted(() => {
        disconnectWebSocket();
    });

    return {
        scanData,
        scanning,
        errorMsg,
        scanStatus,
        runScan,
        resetState
    };
}
