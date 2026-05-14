import { ref, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'
import { parseBasicScan, parseFullScan } from '@/lib/restack/scanParsers'
import type { ScanResult } from '@/lib/restack/restack.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const WS_BASE_URL = import.meta.env.VITE_API_SOCKET

export function useScan() {
    const scanData = ref<ScanResult | null>(null)
    const scanning = ref(false)
    const errorMsg = ref('')
    const scanStatus = ref('')

    let ws: WebSocket | null = null
    let currentSessionId: string | null = null
    let targetUrl: string = ''
    let scanType: 'basic' | 'full' = 'full'

    const formatUrl = (inputUrl: string) => {
        let formatted = inputUrl.trim()
        if (!formatted) return ''

        if (inputUrl.includes('localhost') || inputUrl.includes('127.0.0.1')) {
            formatted = formatted.replace(/localhost|127\.0\.0\.1/g, 'host.docker.internal')
        }

        if (!/^https?:\/\//i.test(formatted)) {
            formatted = 'https://' + formatted
        }

        if (formatted.includes('host.docker.internal') && formatted.startsWith('https://')) {
            formatted = formatted.replace('https://', 'http://')
        }

        return formatted
    }

    const fetchScanResults = async (sessionId: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/v1/scan/result/${sessionId}`)

            if (!res.ok) {
                let errorMessage = res.statusText
                try {
                    const err = await res.json()
                    if (err.detail) errorMessage = err.detail
                } catch {
                    // ignore
                }
                throw new Error(errorMessage)
            }

            const response = await res.json()
            if (response?.status !== 'success') {
                throw new Error(response?.reason || 'Scan failed (unexpected response)')
            }

            // Parse based on scan type (parsers expect the WHOLE response now)
            const parsedResults =
                scanType === 'basic'
                    ? parseBasicScan(response, targetUrl)
                    : parseFullScan(response, targetUrl)

            // Attach report ID if present (API shape: response.data.report.id)
            const reportId = response?.data?.report?.id
            if (reportId) {
                ; (parsedResults as any).id = reportId
            }

            // Also attach session_id if you want (optional)
            ; (parsedResults as any).session_id = response?.data?.id ?? sessionId

            scanData.value = parsedResults
            scanStatus.value = 'Success'
            scanning.value = false

            toast.success(`${scanType === 'basic' ? 'Basic' : 'Full'} Scan completed!`)
        } catch (e: any) {
            console.error('❌ Failed to fetch scan results:', e)
            errorMsg.value = e.message
            scanStatus.value = 'Failed'
            scanning.value = false
            toast.error('Failed to retrieve scan results', { description: e.message })
        } finally {
            disconnectWebSocket()
        }
    }

    const connectWebSocket = () => {
        try {
            ws = new WebSocket(`${WS_BASE_URL}/v1/ws/scans/poll`)

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)

                    if (data.message === 'No active scans') return
                    if (data.error) {
                        console.error('WebSocket error:', data.error)
                        return
                    }

                    if (!currentSessionId) return

                    // NOTE: backend sometimes sends { completed: { sessionId: {...}} }
                    if (data.completed?.[currentSessionId]) {
                        fetchScanResults(currentSessionId)
                        return
                    }

                    const scanInfo = data[currentSessionId]
                    if (!scanInfo) return

                    const step = scanInfo.step

                    if (scanStatus.value !== 'Success' && scanStatus.value !== 'Failed') {
                        scanStatus.value = step
                    }

                    // Your backend websocket uses "Completed" message in main.py
                    if (step === 'Completed' || step === 'Success') {
                        fetchScanResults(currentSessionId)
                    } else if (step === 'Failed' || step === 'Error') {
                        errorMsg.value = 'Scan failed on the server'
                        scanStatus.value = 'Failed'
                        scanning.value = false
                        toast.error('Scan Failed', { description: 'An error occurred during scanning' })
                        disconnectWebSocket()
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e)
                }
            }

            ws.onerror = (error) => {
                console.error('WebSocket error:', error)
            }
        } catch (e) {
            console.error('Failed to connect WebSocket:', e)
        }
    }

    const disconnectWebSocket = () => {
        if (ws) {
            ws.close()
            ws = null
        }
    }

    const runScan = async (rawUrl: string, type: 'basic' | 'full', userId: number, config?: any) => {
        const target = formatUrl(rawUrl)
        if (!target) {
            toast.error('Please enter a valid URL')
            return
        }

        resetState()
        scanning.value = true
        targetUrl = target
        scanType = type
        scanStatus.value = 'Queued'

        const endpoint = type === 'basic' ? '/v1/scan/quick' : '/v1/scan/'

        try {
            const payload: any = { url: target, user_id: userId }
            if (config) payload.config = config

            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                let errorMessage = res.statusText
                try {
                    const err = await res.json()
                    if (err.detail) {
                        errorMessage = Array.isArray(err.detail)
                            ? err.detail.map((e: any) => e.msg || e).join(', ')
                            : err.detail
                    }
                } catch {
                    // ignore
                }
                throw new Error(errorMessage)
            }

            const data = await res.json()

            if (!data.session_id) {
                throw new Error('No session_id received from server')
            }

            currentSessionId = data.session_id
            scanStatus.value = 'Initializing...'

            connectWebSocket()

            toast.info(`${type === 'basic' ? 'Basic' : 'Full'} Scan queued`, {
                description: 'Tracking progress...',
            })
        } catch (e: any) {
            console.error('❌ Scan error:', e)
            errorMsg.value = e.message
            scanStatus.value = 'Failed'
            scanning.value = false
            toast.error('Scan Failed', { description: e.message })
        }
    }

    const resetState = () => {
        scanData.value = null
        errorMsg.value = ''
        scanStatus.value = ''
        currentSessionId = null
        targetUrl = ''
        disconnectWebSocket()
    }

    onUnmounted(() => {
        disconnectWebSocket()
    })

    return {
        scanData,
        scanning,
        errorMsg,
        scanStatus,
        runScan,
        resetState,
    }
}
