<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    Lock,
    CheckCircle,
    XCircle,
    Info,
} from 'lucide-vue-next'

const props = defineProps<{
    data: string | Record<string, any> | null | undefined
}>()

function safeJsonParse(val: any): any | null {
    if (val == null) return null
    if (typeof val === 'object') return val
    if (typeof val === 'string') {
        try { return JSON.parse(val) } catch { return null }
    }
    return null
}

/**
 * Supports:
 * - raw sslyze json string/object
 * - discovery json string/object containing ssl_certs
 * - ssl_certs itself being a json string
 */
const parsed = computed<Record<string, any> | null>(() => {
    if (!props.data) return null

    // 1) parse outer
    const outer = safeJsonParse(props.data)
    if (!outer) return null

    // If it looks like sslyze output already, return it
    if (outer.server_scan_results) return outer

    // If it looks like discovery payload, extract ssl_certs and parse again
    const sslMaybe = outer.ssl_certs ?? outer.sslData ?? outer.ssl_data
    if (!sslMaybe) return null

    const inner = safeJsonParse(sslMaybe)
    return inner && inner.server_scan_results ? inner : null
})

const connectivityError = computed(() => {
    const result = parsed.value?.server_scan_results?.[0]
    if (!result) return null
    if (result.scan_status === 'ERROR_NO_CONNECTIVITY') {
        const host = result.server_location?.hostname
        const port = result.server_location?.port
        return `Could not establish a TLS connection to ${host}:${port}. The server may not support TLS on this port.`
    }
    return null
})

const scanResult = computed(() => parsed.value?.server_scan_results?.[0]?.scan_result ?? null)
const serverLocation = computed(() => parsed.value?.server_scan_results?.[0]?.server_location ?? null)

// ── TLS protocol support ──────────────────────────────────────────────────────

interface ProtocolRow {
    label: string
    key: string
    safe: boolean
}

const PROTOCOLS: ProtocolRow[] = [
    { label: 'SSL 2.0', key: 'ssl_2_0_cipher_suites', safe: false },
    { label: 'SSL 3.0', key: 'ssl_3_0_cipher_suites', safe: false },
    { label: 'TLS 1.0', key: 'tls_1_0_cipher_suites', safe: false },
    { label: 'TLS 1.1', key: 'tls_1_1_cipher_suites', safe: false },
    { label: 'TLS 1.2', key: 'tls_1_2_cipher_suites', safe: true },
    { label: 'TLS 1.3', key: 'tls_1_3_cipher_suites', safe: true },
]

interface ProtocolStatus {
    label: string
    enabled: boolean
    safe: boolean
    cipherCount: number
}

const protocolStatuses = computed<ProtocolStatus[]>(() => {
    if (!scanResult.value) return []
    return PROTOCOLS.map(p => {
        const entry = scanResult.value[p.key]
        const accepted = entry?.result?.accepted_cipher_suites ?? []
        return {
            label: p.label,
            enabled: accepted.length > 0,
            safe: p.safe,
            cipherCount: accepted.length,
        }
    })
})

// ── Vulnerability checks ──────────────────────────────────────────────────────

interface VulnCheck {
    label: string
    key: string
    vuln_field: string
    vuln_value: boolean
}

const VULN_CHECKS: VulnCheck[] = [
    { label: 'Heartbleed',            key: 'heartbleed',             vuln_field: 'is_vulnerable_to_heartbleed',               vuln_value: true },
    { label: 'OpenSSL CCS Injection', key: 'openssl_ccs_injection',  vuln_field: 'is_vulnerable_to_ccs_injection',            vuln_value: true },
    { label: 'ROBOT Attack',          key: 'robot',                 vuln_field: 'robot_result',                              vuln_value: false },
    { label: 'Session Renegotiation', key: 'session_renegotiation', vuln_field: 'is_vulnerable_to_client_renegotiation_dos', vuln_value: true },
    { label: 'TLS Compression',       key: 'tls_compression',       vuln_field: 'supports_compression',                     vuln_value: true },
    { label: 'TLS Fallback SCSV',     key: 'tls_fallback_scsv',     vuln_field: 'supports_fallback_scsv',                   vuln_value: false },
]

interface VulnStatus {
    label: string
    vulnerable: boolean | null
}

const vulnStatuses = computed<VulnStatus[]>(() => {
    if (!scanResult.value) return []
    return VULN_CHECKS.map(c => {
        const entry = scanResult.value[c.key]
        if (!entry?.result) return { label: c.label, vulnerable: null }

        if (c.key === 'robot') {
            const robotResult = entry.result?.robot_result
            if (robotResult == null) return { label: c.label, vulnerable: null }
            return { label: c.label, vulnerable: robotResult !== 'NOT_VULNERABLE_NO_ORACLE' }
        }

        if (c.key === 'tls_fallback_scsv') {
            const supported = entry.result?.supports_fallback_scsv
            if (supported == null) return { label: c.label, vulnerable: null }
            return { label: c.label, vulnerable: supported === false }
        }

        const val = entry.result?.[c.vuln_field]
        if (val === undefined || val === null) return { label: c.label, vulnerable: null }
        return { label: c.label, vulnerable: val === c.vuln_value }
    })
})

// ── Certificate info ──────────────────────────────────────────────────────────

const certDeployment = computed(() =>
    scanResult.value?.certificate_info?.result?.certificate_deployments?.[0] ?? null,
)

const leafCert = computed(() =>
    certDeployment.value?.received_certificate_chain?.[0] ?? null,
)

const certExpiry = computed(() => {
    const notAfter = leafCert.value?.not_valid_after
    if (!notAfter) return null
    return new Date(notAfter)
})

const certExpired = computed(() =>
    certExpiry.value ? certExpiry.value < new Date() : null,
)

const certValid = computed(() => {
    // In sslyze output, validations are in `path_validation_results` and/or verified chain.
    // Keep this simple and defensive:
    const ok = certDeployment.value?.path_validation_results?.some((r: any) => r?.was_validation_successful === true)
    if (ok === true) return true
    // fallback older style:
    return certDeployment.value?.verified_certificate_chain != null
})

// ── Overall score ─────────────────────────────────────────────────────────────

const overallRisk = computed<'good' | 'warn' | 'bad'>(() => {
    const legacyEnabled = protocolStatuses.value.some(p => !p.safe && p.enabled)
    const hasVulns = vulnStatuses.value.some(v => v.vulnerable === true)
    const expired = certExpired.value === true
    if (hasVulns || expired) return 'bad'
    if (legacyEnabled) return 'warn'
    return 'good'
})

const riskMeta = computed(() => {
    switch (overallRisk.value) {
        case 'good': return { label: 'Good', color: 'text-emerald-500', bg: 'bg-emerald-500/10', Icon: ShieldCheck }
        case 'warn': return { label: 'Warning', color: 'text-amber-500', bg: 'bg-amber-500/10', Icon: ShieldAlert }
        case 'bad': return { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500/10', Icon: ShieldX }
    }
})
</script>

<template>
    <div v-if="connectivityError" class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <Lock class="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p class="text-sm font-medium">SSL/TLS scan failed</p>
        <p class="text-xs mt-1">{{ connectivityError }}</p>
    </div>

    <div v-else-if="!scanResult" class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <Lock class="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p class="text-sm">No SSL/TLS data available for this scan.</p>
    </div>

    <div v-else class="space-y-4">
        <div :class="['flex items-center gap-4 rounded-lg border p-4', riskMeta!.bg]">
            <component :is="riskMeta!.Icon" :class="['h-8 w-8 shrink-0', riskMeta!.color]" />
            <div>
                <p class="font-semibold" :class="riskMeta!.color">SSL/TLS Security: {{ riskMeta!.label }}</p>
                <p class="text-sm text-muted-foreground">
                    {{ serverLocation?.hostname }}:{{ serverLocation?.port ?? 443 }}
                </p>
            </div>
        </div>

        <Card>
            <CardHeader class="pb-3">
                <CardTitle class="text-base">Protocol Support</CardTitle>
                <CardDescription>Legacy protocols (SSL/TLS 1.0/1.1) should be disabled</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent class="pt-4">
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div
                        v-for="p in protocolStatuses"
                        :key="p.label"
                        class="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center"
                        :class="p.enabled && !p.safe ? 'border-red-300 bg-red-50 dark:bg-red-950/20' :
                                p.enabled && p.safe  ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20' :
                                                       'border-border bg-muted/30'"
                    >
                        <span class="text-xs font-semibold">{{ p.label }}</span>
                        <component
                            :is="p.enabled ? CheckCircle : XCircle"
                            :class="['h-5 w-5',
                                p.enabled && !p.safe ? 'text-red-500' :
                                p.enabled && p.safe  ? 'text-emerald-500' :
                                                       'text-muted-foreground']"
                        />
                        <span class="text-[10px] text-muted-foreground">
                            {{ p.enabled ? `${p.cipherCount} ciphers` : 'Disabled' }}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader class="pb-3">
                <CardTitle class="text-base">Known Vulnerabilities</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent class="pt-4">
                <div class="divide-y">
                    <div
                        v-for="v in vulnStatuses"
                        :key="v.label"
                        class="flex items-center justify-between py-2.5"
                    >
                        <span class="text-sm">{{ v.label }}</span>
                        <div>
                            <Badge v-if="v.vulnerable === null" variant="secondary" class="text-xs">
                                <Info class="h-3 w-3 mr-1" /> Unknown
                            </Badge>
                            <Badge v-else-if="v.vulnerable" class="text-xs bg-red-500 text-white border-0">
                                <XCircle class="h-3 w-3 mr-1" /> Vulnerable
                            </Badge>
                            <Badge v-else class="text-xs bg-emerald-500 text-white border-0">
                                <CheckCircle class="h-3 w-3 mr-1" /> Safe
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card v-if="leafCert">
            <CardHeader class="pb-3">
                <CardTitle class="text-base">Certificate</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent class="pt-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">Subject</span>
                            <span class="font-mono text-xs text-right max-w-[60%] truncate">
                                {{ leafCert.subject?.rfc4514_string ?? 'N/A' }}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">Issuer</span>
                            <span class="font-mono text-xs text-right max-w-[60%] truncate">
                                {{ leafCert.issuer?.rfc4514_string ?? 'N/A' }}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">Signature</span>
                            <span class="text-xs">{{ leafCert.signature_hash_algorithm?.name ?? 'N/A' }}</span>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">Valid from</span>
                            <span class="text-xs">
                                {{ leafCert.not_valid_before ? new Date(leafCert.not_valid_before).toLocaleDateString() : 'N/A' }}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">Expires</span>
                            <span class="text-xs" :class="certExpired ? 'text-red-500 font-semibold' : ''">
                                {{ certExpiry ? certExpiry.toLocaleDateString() : 'N/A' }}
                                <span v-if="certExpired"> (EXPIRED)</span>
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">Chain valid</span>
                            <Badge
                                :class="certValid ? 'bg-emerald-500 text-white border-0' : 'bg-red-500 text-white border-0'"
                                class="text-xs"
                            >
                                {{ certValid ? 'Yes' : 'No' }}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
