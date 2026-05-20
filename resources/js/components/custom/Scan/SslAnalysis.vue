<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
    ShieldCheck, ShieldAlert, ShieldX,
    Lock, CheckCircle, XCircle, Info,
} from 'lucide-vue-next'

const props = defineProps<{
    data: string | Record<string, any> | null | undefined
}>()

function safeJsonParse(val: any): Record<string, any> | null {
    if (val == null) return null
    if (typeof val === 'object') return val as Record<string, any>
    if (typeof val === 'string') {
        try { return JSON.parse(val) } catch { return null }
    }
    return null
}

// ── Format detection ──────────────────────────────────────────────────────────
//
// The backend stores two possible shapes in ssl_certs:
//
//   Processed (SSLyze.parse_results) — keys: status, target, summary,
//     certificates, supported_suites, findings              ← current backend
//
//   Raw SSLyze JSON — key: server_scan_results              ← legacy / future

const parsed = computed<Record<string, any> | null>(() => {
    if (!props.data) return null
    const outer = safeJsonParse(props.data)
    if (!outer) return null

    // Processed format
    if ('status' in outer && !outer.server_scan_results) return outer
    // Raw SSLyze format
    if (outer.server_scan_results) return outer
    // Nested in a discovery payload
    const nested = outer.ssl_certs ?? outer.sslData ?? outer.ssl_data
    if (!nested) return null
    const inner = safeJsonParse(nested)
    if (!inner) return null
    if (('status' in inner && !inner.server_scan_results) || inner.server_scan_results) return inner
    return null
})

const isProcessed = computed(() =>
    !!(parsed.value && 'status' in parsed.value && !parsed.value.server_scan_results)
)

// Raw SSLyze scan_result node (only valid for raw format)
const rawScanResult = computed(() =>
    !isProcessed.value
        ? (parsed.value?.server_scan_results?.[0]?.scan_result ?? null)
        : null
)

// True when we have meaningful data to render
const hasData = computed(() => {
    if (!parsed.value) return false
    if (isProcessed.value) return parsed.value.status === 'COMPLETED'
    return !!rawScanResult.value
})

// ── Connectivity / scan error ─────────────────────────────────────────────────

const connectivityError = computed((): string | null => {
    if (!parsed.value) return null
    if (isProcessed.value) {
        return parsed.value.status === 'ERROR'
            ? (parsed.value.reason ?? 'SSL/TLS scan failed')
            : null
    }
    const result = parsed.value.server_scan_results?.[0]
    if (result?.scan_status === 'ERROR_NO_CONNECTIVITY') {
        const { hostname, port } = result.server_location ?? {}
        return `Could not establish a TLS connection to ${hostname}:${port}. The server may not support TLS on this port.`
    }
    return null
})

// ── Server location ───────────────────────────────────────────────────────────

const serverLocation = computed(() => {
    if (!parsed.value) return null
    if (isProcessed.value) return parsed.value.target ?? null
    return parsed.value.server_scan_results?.[0]?.server_location ?? null
})

// ── Protocol support ──────────────────────────────────────────────────────────

interface ProtocolStatus {
    label: string
    enabled: boolean
    safe: boolean
    cipherCount: number
}

const PROTOCOLS_META = [
    { key: 'SSL_2_0', label: 'SSL 2.0', safe: false, rawKey: 'ssl_2_0_cipher_suites' },
    { key: 'SSL_3_0', label: 'SSL 3.0', safe: false, rawKey: 'ssl_3_0_cipher_suites' },
    { key: 'TLS_1_0', label: 'TLS 1.0', safe: false, rawKey: 'tls_1_0_cipher_suites' },
    { key: 'TLS_1_1', label: 'TLS 1.1', safe: false, rawKey: 'tls_1_1_cipher_suites' },
    { key: 'TLS_1_2', label: 'TLS 1.2', safe: true,  rawKey: 'tls_1_2_cipher_suites' },
    { key: 'TLS_1_3', label: 'TLS 1.3', safe: true,  rawKey: 'tls_1_3_cipher_suites' },
]

const protocolStatuses = computed<ProtocolStatus[]>(() => {
    if (!parsed.value) return []

    if (isProcessed.value) {
        // supported_suites contains one entry per accepted cipher.
        // Count entries per protocol key (e.g. 'TLS_1_2').
        const counts: Record<string, number> = {}
        for (const s of (parsed.value.supported_suites ?? []) as any[]) {
            counts[s.protocol] = (counts[s.protocol] ?? 0) + 1
        }
        return PROTOCOLS_META.map(({ key, label, safe }) => ({
            label,
            safe,
            enabled: key in counts,
            cipherCount: counts[key] ?? 0,
        }))
    }

    // Raw format
    if (!rawScanResult.value) return []
    return PROTOCOLS_META.map(({ label, safe, rawKey }) => {
        const accepted = rawScanResult.value[rawKey]?.result?.accepted_cipher_suites ?? []
        return { label, safe, enabled: accepted.length > 0, cipherCount: accepted.length }
    })
})

// ── Vulnerability checks ──────────────────────────────────────────────────────

interface VulnStatus {
    label: string
    vulnerable: boolean | null
}

// Maps display labels to finding titles emitted by SSLyze.parse_results().
// Absence of a matching title on a COMPLETED scan means the check passed.
const VULN_FINDING_MAP = [
    {
        label: 'Heartbleed',
        titles: ['Heartbleed vulnerability detected'],
    },
    {
        label: 'OpenSSL CCS Injection',
        titles: ['OpenSSL CCS injection vulnerability detected'],
    },
    {
        label: 'ROBOT Attack',
        titles: [
            'ROBOT vulnerability detected',
            'ROBOT weak oracle detected',
            'ROBOT result is inconclusive',
        ],
    },
    {
        label: 'Session Renegotiation',
        titles: ['Client renegotiation DoS risk detected'],
    },
    {
        label: 'TLS Compression',
        titles: ['TLS compression is enabled'],
    },
    {
        label: 'TLS Fallback SCSV',
        titles: ['TLS_FALLBACK_SCSV not supported'],
    },
]

// Raw-format check definitions (unchanged from original component)
const VULN_CHECKS_RAW = [
    { label: 'Heartbleed',            key: 'heartbleed',            vuln_field: 'is_vulnerable_to_heartbleed',               vuln_value: true  },
    { label: 'OpenSSL CCS Injection', key: 'openssl_ccs_injection', vuln_field: 'is_vulnerable_to_ccs_injection',            vuln_value: true  },
    { label: 'ROBOT Attack',          key: 'robot',                 vuln_field: 'robot_result',                              vuln_value: false },
    { label: 'Session Renegotiation', key: 'session_renegotiation', vuln_field: 'is_vulnerable_to_client_renegotiation_dos', vuln_value: true  },
    { label: 'TLS Compression',       key: 'tls_compression',       vuln_field: 'supports_compression',                     vuln_value: true  },
    { label: 'TLS Fallback SCSV',     key: 'tls_fallback_scsv',     vuln_field: 'supports_fallback_scsv',                   vuln_value: false },
]

const vulnStatuses = computed<VulnStatus[]>(() => {
    if (!parsed.value) return []

    if (isProcessed.value) {
        const findings = (parsed.value.findings ?? []) as any[]
        const titlesFound = new Set(findings.map((f) => f.title as string))
        const completed = parsed.value.status === 'COMPLETED'

        return VULN_FINDING_MAP.map(({ label, titles }) => ({
            label,
            // COMPLETED + no matching finding → the check ran and passed (safe)
            vulnerable: completed ? titles.some((t) => titlesFound.has(t)) : null,
        }))
    }

    // Raw format
    if (!rawScanResult.value) return []
    return VULN_CHECKS_RAW.map((c) => {
        const entry = rawScanResult.value[c.key]
        if (!entry?.result) return { label: c.label, vulnerable: null }

        if (c.key === 'robot') {
            const r = entry.result?.robot_result
            return { label: c.label, vulnerable: r == null ? null : r !== 'NOT_VULNERABLE_NO_ORACLE' }
        }
        if (c.key === 'tls_fallback_scsv') {
            const s = entry.result?.supports_fallback_scsv
            return { label: c.label, vulnerable: s == null ? null : s === false }
        }
        const val = entry.result?.[c.vuln_field]
        return { label: c.label, vulnerable: val == null ? null : val === c.vuln_value }
    })
})

// ── Certificate ───────────────────────────────────────────────────────────────
//
// Normalises both formats into the same shape so the template is unchanged.
// Processed format stores subject/issuer/sig_hash as plain strings;
// raw format stores them as nested objects — we wrap strings to match.

interface DisplayCert {
    subject:                  { rfc4514_string: string }
    issuer:                   { rfc4514_string: string }
    signature_hash_algorithm: { name: string }
    not_valid_before:         string | null
    not_valid_after:          string | null
    _chainValid:              boolean
}

const displayCert = computed<DisplayCert | null>(() => {
    if (!parsed.value) return null

    if (isProcessed.value) {
        const cert = (parsed.value.certificates ?? [])[0]
        if (!cert) return null

        // chain is invalid if there's a trust-store validation failure finding
        const findings = (parsed.value.findings ?? []) as any[]
        const trustFailed = findings.some(
            (f) => f.title === 'Certificate failed one or more trust-store validations'
        )
        const chainValid = !trustFailed && cert.chain_has_valid_order !== false

        return {
            // Wrap strings so the template can use .rfc4514_string / .name as before
            subject:                  { rfc4514_string: cert.subject  ?? 'N/A' },
            issuer:                   { rfc4514_string: cert.issuer   ?? 'N/A' },
            signature_hash_algorithm: { name: cert.signature_hash_algorithm ?? 'N/A' },
            not_valid_before:         cert.not_valid_before ?? null,
            not_valid_after:          cert.not_valid_after  ?? null,
            _chainValid:              chainValid,
        }
    }

    // Raw format
    const deployment =
        rawScanResult.value?.certificate_info?.result?.certificate_deployments?.[0]
    if (!deployment) return null
    const leaf = deployment.received_certificate_chain?.[0]
    if (!leaf) return null

    const pathValid = deployment.path_validation_results?.some(
        (r: any) => r?.was_validation_successful === true
    )
    const chainValid = pathValid === true || deployment.verified_certificate_chain != null

    return {
        subject:                  leaf.subject,
        issuer:                   leaf.issuer,
        signature_hash_algorithm: leaf.signature_hash_algorithm,
        not_valid_before:         leaf.not_valid_before  ?? null,
        not_valid_after:          leaf.not_valid_after   ?? null,
        _chainValid:              chainValid,
    }
})

const certExpiry   = computed(() => {
    const d = displayCert.value?.not_valid_after
    return d ? new Date(d) : null
})
const certExpired  = computed(() => certExpiry.value ? certExpiry.value < new Date() : null)
const certValid    = computed(() => displayCert.value?._chainValid ?? null)

// ── Overall risk ──────────────────────────────────────────────────────────────

const overallRisk = computed<'good' | 'warn' | 'bad'>(() => {
    const expired = certExpired.value === true

    if (isProcessed.value && parsed.value) {
        const findings = (parsed.value.findings ?? []) as any[]
        const hasHighPlus = findings.some((f) => ['CRITICAL', 'HIGH'].includes(f.severity))
        const hasMedium   = findings.some((f) => f.severity === 'MEDIUM')
        if (hasHighPlus || expired) return 'bad'
        if (hasMedium) return 'warn'
        return 'good'
    }

    const legacyEnabled = protocolStatuses.value.some((p) => !p.safe && p.enabled)
    const hasVulns      = vulnStatuses.value.some((v) => v.vulnerable === true)
    if (hasVulns || expired) return 'bad'
    if (legacyEnabled) return 'warn'
    return 'good'
})

const riskMeta = computed(() => {
    switch (overallRisk.value) {
        case 'good': return { label: 'Good',     color: 'text-emerald-500', bg: 'bg-emerald-500/10', Icon: ShieldCheck }
        case 'warn': return { label: 'Warning',  color: 'text-amber-500',   bg: 'bg-amber-500/10',   Icon: ShieldAlert }
        case 'bad':  return { label: 'Critical', color: 'text-red-500',     bg: 'bg-red-500/10',     Icon: ShieldX    }
    }
})
</script>

<template>
    <div v-if="connectivityError" class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <Lock class="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p class="text-sm font-medium">SSL/TLS scan failed</p>
        <p class="text-xs mt-1">{{ connectivityError }}</p>
    </div>

    <div v-else-if="!hasData" class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <Lock class="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p class="text-sm">No SSL/TLS data available for this scan.</p>
    </div>

    <div v-else class="space-y-4">
        <!-- Risk banner -->
        <div :class="['flex items-center gap-4 rounded-lg border p-4', riskMeta!.bg]">
            <component :is="riskMeta!.Icon" :class="['h-8 w-8 shrink-0', riskMeta!.color]" />
            <div>
                <p class="font-semibold" :class="riskMeta!.color">SSL/TLS Security: {{ riskMeta!.label }}</p>
                <p class="text-sm text-muted-foreground">
                    {{ serverLocation?.hostname }}:{{ serverLocation?.port ?? 443 }}
                </p>
            </div>
        </div>

        <!-- Protocol support -->
        <Card>
            <CardHeader class="pb-3">
                <CardTitle class="text-base">Protocol Support</CardTitle>
                <CardDescription>Legacy protocols (SSL/TLS 1.0/1.1) should be disabled</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent class="pt-4">
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div
                        v-for="p in protocolStatuses" :key="p.label"
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

        <!-- Known vulnerabilities -->
        <Card>
            <CardHeader class="pb-3">
                <CardTitle class="text-base">Known Vulnerabilities</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent class="pt-4">
                <div class="divide-y">
                    <div
                        v-for="v in vulnStatuses" :key="v.label"
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

        <!-- Certificate -->
        <Card v-if="displayCert">
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
                                {{ displayCert.subject?.rfc4514_string ?? 'N/A' }}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">Issuer</span>
                            <span class="font-mono text-xs text-right max-w-[60%] truncate">
                                {{ displayCert.issuer?.rfc4514_string ?? 'N/A' }}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">Signature</span>
                            <span class="text-xs">{{ displayCert.signature_hash_algorithm?.name ?? 'N/A' }}</span>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">Valid from</span>
                            <span class="text-xs">
                                {{ displayCert.not_valid_before ? new Date(displayCert.not_valid_before).toLocaleDateString() : 'N/A' }}
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
