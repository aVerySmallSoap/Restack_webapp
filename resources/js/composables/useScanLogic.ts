import { ref, onUnmounted } from 'vue';
import { toast } from 'vue-sonner';
import { parseBasicScan, parseFullScan } from '@/lib/restack/scanParsers';
import type { ScanResult } from '@/lib/restack/restack.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const WS_BASE_URL = import.meta.env.VITE_API_SOCKET;

export function useScan() {
    const scanData = ref<ScanResult | null>(null);
    const scanning = ref(false);
    const errorMsg = ref('');
    const scanStatus = ref('');

    let ws: WebSocket | null = null;
    let currentSessionId: string | null = null;
    let targetUrl: string = '';
    let scanType: 'basic' | 'full' = 'full';

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

    // Fetch scan results from the backend after completion
    const fetchScanResults = async (sessionId: string) => {
        try {

            const res = await fetch(`${API_BASE_URL}/api/v1/scan/result/${sessionId}`);

            if (!res.ok) {
                let errorMessage = res.statusText;
                try {
                    const err = await res.json();
                    if (err.detail) {
                        errorMessage = err.detail;
                    }
                } catch (e) {
                    // Failed to parse error JSON
                }
                throw new Error(errorMessage);
            }

            const data = await res.json();

            // Parse based on scan type
            let parsedResults: any;
            if (scanType === 'basic') {
                parsedResults = parseBasicScan(data, targetUrl);
            } else {
                parsedResults = parseFullScan(data, targetUrl);
            }

            // Attach report ID if present
            if (data.id) {
                parsedResults.id = data.id;
            }

            scanData.value = parsedResults;
            scanStatus.value = 'Success';
            scanning.value = false;

            toast.success(`${scanType === 'basic' ? 'Basic' : 'Full'} Scan completed!`);

        } catch (e: any) {
            console.error('❌ Failed to fetch scan results:', e);
            errorMsg.value = e.message;
            scanStatus.value = 'Failed';
            scanning.value = false;
            toast.error('Failed to retrieve scan results', { description: e.message });
        } finally {
            disconnectWebSocket();
        }
    };

    // Connect to WebSocket for real-time progress updates
    const connectWebSocket = () => {
        try {
            ws = new WebSocket(`${WS_BASE_URL}/api/v1/ws/scans/poll`);

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

                    // STRICT session ID matching - ignore updates for other scans
                    if (!currentSessionId) {
                        console.warn('No current session ID set, ignoring WebSocket update');
                        return;
                    }

                    const scanInfo = data[currentSessionId];

                    if (!scanInfo) {
                        // This update is for a different scan, ignore it silently
                        return;
                    }

                    const step = scanInfo.step;

                    // Update status (but don't overwrite terminal states)
                    if (scanStatus.value !== 'Success' && scanStatus.value !== 'Failed') {
                        scanStatus.value = step;
                    }

                    // Handle completion
                    if (step === "Success") {
                        fetchScanResults(currentSessionId);
                    } else if (step === "Failed" || step === "Error") {
                        console.error(`Scan ${currentSessionId} failed with step: ${step}`);
                        errorMsg.value = 'Scan failed on the server';
                        scanStatus.value = 'Failed';
                        scanning.value = false;
                        toast.error('Scan Failed', { description: 'An error occurred during scanning' });
                        disconnectWebSocket();
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
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

        // Reset state for new scan
        resetState();
        scanning.value = true;
        targetUrl = target;
        scanType = type;
        scanStatus.value = 'Queued';

        const endpoint = type === 'basic' ? '/api/v1/wapiti/scan/quick' : '/api/v1/scan/';

        try {
            const payload: any = {
                url: target,
                user_id: userId,
            };

            if (config) {
                payload.config = config;
            }

            console.log(`🚀 Starting ${type} scan for ${target}...`);

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
            console.log('📨 Scan queued response:', data);

            // Validate session_id is present
            if (!data.session_id) {
                throw new Error('No session_id received from server');
            }

            currentSessionId = data.session_id;
            console.log(`🎫 Session ID: ${currentSessionId}`);

            scanStatus.value = 'Initializing...';

            // Connect WebSocket AFTER we have the session ID
            connectWebSocket();

            toast.info(`${type === 'basic' ? 'Basic' : 'Full'} Scan queued`, {
                description: 'Tracking progress...'
            });

        } catch (e: any) {
            console.error('❌ Scan error:', e);
            errorMsg.value = e.message;
            scanStatus.value = 'Failed';
            scanning.value = false;
            toast.error('Scan Failed', { description: e.message });
        }
    };

    const resetState = () => {
        scanData.value = null;
        errorMsg.value = '';
        scanStatus.value = '';
        currentSessionId = null;
        targetUrl = '';
        disconnectWebSocket();
    };
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
