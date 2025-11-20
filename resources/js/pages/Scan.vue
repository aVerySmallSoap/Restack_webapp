<script setup lang="ts">
import { h, ref, computed } from 'vue'
import {
    useVueTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    FlexRender,
    type ColumnDef,
    type SortingState,
} from '@tanstack/vue-table'
import { Sparkles } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import Navigation from '@/components/custom/Navigation.vue'
import FullScanDetailDrawer from '@/components/custom/FullScanDetailDrawer.vue'
import BasicScanDetailDrawer from '@/components/custom/BasicScanDetailDrawer.vue'
import DataTableColumnHeader from '@/components/custom/DataTableColumnHeader.vue'
import DataTablePagination from '@/components/custom/DataTablePagination.vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import SeverityPieChart from '@/components/custom/Charts/SeverityPieChart.vue'
import ScannerBarChart from '@/components/custom/Charts/ScannerBarChart.vue'

// ---------- CONFIGURATION ----------
const API_BASE_URL = 'http://127.0.0.1:25565'

// ---------- TYPES ----------
interface FullVulnerability {
    id: string
    type: string
    severity: string
    scanner: string
    confidence: string
    method: string
    endpoint: string
    exploit: string
    description: string
    solution: string
    reference: string
}

interface BasicVulnerability {
    level: number
    method: string
    path: string
    info: string
    module: string
    category: string
    description: string
    solution: string
    references: Record<string, string>
    wstg: string[]
    severity: string
}

interface Technology {
    name: string
    version: string
    vulnerable: boolean
    cve: string
    fix: string
}

interface PriorityItem {
    type: string
    severity: string
    endpoint: string
}

// ---------- STATE ----------
const url = ref('')
const scanning = ref(false)
const progress = ref(0)
const errorMsg = ref('')
const activeScanType = ref('basic')

// Full Scan Options
const useZap = ref(true)
const useSearchVuln = ref(true)

// Data Storage
const basicScanData = ref(null)
const fullScanData = ref(null)

// Drawers
const basicDrawerOpen = ref(false)
const fullDrawerOpen = ref(false)
const selectedBasicVuln = ref<BasicVulnerability | null>(null)
const selectedFullVuln = ref<FullVulnerability | null>(null)

// ---------- PARSERS ----------

function processPlugins(rawPlugins: any[]) {
    const flatPlugins = Array.isArray(rawPlugins) ? rawPlugins.flat() : []
    let country = 'Unknown', ip = 'Unknown'
    const technologies: Technology[] = []
    const excludedTech = ['Country', 'IP', 'HTML5', 'HTTPServer']

    flatPlugins.forEach((p: any) => {
        const name = Object.keys(p)[0], details = p[name]
        if (name === 'Country') country = Array.isArray(details) ? details.join(', ') : (details || 'Unknown')
        else if (name === 'IP') ip = Array.isArray(details) ? details.join(', ') : (details || 'Unknown')
        else if (!excludedTech.includes(name)) {
            let version = '-'
            if (Array.isArray(details)) version = details.length ? details.join(', ') : '-'
            else if (typeof details === 'object' && details?.version) version = details.version
            else if (typeof details === 'string') version = details
            technologies.push({ name, version, vulnerable: false, cve: 'N/A', fix: 'N/A' })
        }
    })
    return { technologies, country, ip }
}

function parseBasicApiResponse(data: any, targetUrl: string) {
    const run = data.data?.runs?.[0]
    if (!run) return { scanMeta: {}, categories: [], technologies: [], aiSummary: null }
    const rules = run.tool?.driver?.rules || [], results = run.results || []
    const rulesMap = new Map(); rules.forEach((r: any) => rulesMap.set(r.id, r))
    const mapLevel = (lvl: string) => { switch (lvl?.toLowerCase()) { case 'error': return 3; case 'warning': return 2; case 'note': return 1; default: return 0 } }
    const grouped: Record<string, any> = {}
    let totalVulns = 0
    results.forEach((res: any) => {
        totalVulns++
        const ruleId = res.ruleId, rule = rulesMap.get(ruleId), categoryName = rule?.shortDescription?.text || ruleId
        if (!grouped[categoryName]) {
            grouped[categoryName] = { name: categoryName, desc: rule?.fullDescription?.text || 'No description.', solution: rule?.help?.text || 'No solution.', refs: rule?.help?.markdown || {}, wstg: rule?.properties?.tags || [], vulns: [] }
        }
        grouped[categoryName].vulns.push({ level: mapLevel(res.level), method: res.properties?.method || 'GET', path: res.locations?.[0]?.physicalLocation?.artifactLocation?.uri || '/', info: res.message?.text || '', module: res.properties?.module || 'Wapiti', category: categoryName, description: rule?.fullDescription?.text || '' })
    })
    const categories = Object.values(grouped)
    const { technologies, country, ip } = processPlugins(data.plugins?.fingerprinted || [])
    const scanMeta = { target: targetUrl, scan_time: Math.round(data.scan_time || 0), date: new Date().toISOString(), version: run.tool?.driver?.name || 'Wapiti', totalVulns, country, ip }
    const aiSummary = { assessment: `Scan completed successfully against ${targetUrl} (${ip}).`, keyFindings: categories.slice(0, 3).map((c:any) => c.name), recommendations: ["Review Critical findings.", "Validate inputs."] }
    return { scanMeta, categories, technologies, aiSummary }
}

function parseAggregatedApiResponse(data: any, targetUrl: string) {
    const allVulnerabilities: FullVulnerability[] = []
    const unionFindings = data.data?.union || [], ruleDefinitions = data.data?.rules || []
    const getRuleDetail = (ruleId: string) => { const entry = ruleDefinitions.find((r: any) => r[ruleId]); return entry ? entry[ruleId] : null }
    const mapSeverity = (level: string) => { switch (level?.toLowerCase()) { case 'error': return 'High'; case 'warning': return 'Medium'; case 'note': return 'Low'; default: return 'Informational' } }
    unionFindings.flat().forEach((finding: any, index: number) => {
        const ruleId = finding.ruleId, ruleDetail = getRuleDetail(ruleId), scanner = finding.properties?.zapId ? 'ZAP' : 'Wapiti'
        allVulnerabilities.push({ id: `vuln-${index}`, type: ruleDetail?.name || ruleId, severity: mapSeverity(finding.level), scanner, confidence: finding.properties?.confidence || 'Unknown', method: finding.properties?.method || 'GET', endpoint: finding.locations?.[0]?.physicalLocation?.artifactLocation?.uri || '/', exploit: finding.properties?.evidence || '', description: finding.message?.text || ruleDetail?.fullDescription?.text || '', solution: ruleDetail?.help?.text || 'No solution.', reference: ruleDetail?.help?.markdown ? (typeof ruleDetail.help.markdown === 'string' ? ruleDetail.help.markdown : JSON.stringify(ruleDetail.help.markdown)) : 'N/A' })
    })
    const { technologies, country, ip } = processPlugins(data.plugins?.fingerprinted || [])
    const criticalCount = allVulnerabilities.filter(v => ['High', 'Critical'].includes(v.severity)).length

    const priorities = allVulnerabilities.filter(v => ['High', 'Medium'].includes(v.severity)).sort((a,b) => mapSeverityToNumber(b.severity) - mapSeverityToNumber(a.severity)).slice(0, 5).map(v => ({ type: v.type, severity: v.severity, endpoint: v.endpoint }))

    const aiSummary = { assessment: "Comprehensive multi-tool scan completed.", keyFindings: [`${allVulnerabilities.length} Total Vulnerabilities`, `${technologies.length} Technologies identified`], recommendations: ["Prioritize Critical issues", "Update detected technologies"] }
    return { site: targetUrl, tools: ['ZAP', 'Wapiti', 'WhatWeb'], duration: Math.round(data.scan_time || 0), totalVulns: allVulnerabilities.length, criticalVulns: criticalCount, priorities, vulnerabilities: allVulnerabilities, technologies, aiSummary, country, ip }
}

// ---------- API CALLS ----------
let progressInterval: any = null
const startMockProgress = (duration: number) => { progress.value = 0; const step = 100 / (duration / 500); progressInterval = setInterval(() => { if (progress.value < 90) progress.value += step }, 500) }
const stopMockProgress = () => { clearInterval(progressInterval); progress.value = 100 }

function formatUrl(inputUrl: string) {
    let formatted = inputUrl.trim()
    if (!formatted) return ''
    if (!/^https?:\/\//i.test(formatted)) {
        formatted = 'http://' + formatted
    }
    return formatted
}

async function handleFetchError(res: Response) {
    let message = res.statusText
    try {
        const errorBody = await res.json()
        if (errorBody.detail && Array.isArray(errorBody.detail)) {
            message = `Validation Error: ${errorBody.detail.map((e: any) => e.msg).join(', ')}`
        } else if (errorBody.detail) {
            message = errorBody.detail
        }
    } catch (e) { }
    throw new Error(message)
}

async function onBasicScan() {
    const target = formatUrl(url.value)
    if (!target) return toast.error('Please enter a URL')
    url.value = target
    resetState(); scanning.value = true; startMockProgress(15000)
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/wapiti/scan/quick`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: target }) })
        if (!res.ok) await handleFetchError(res)
        const data = await res.json()
        basicScanData.value = parseBasicApiResponse(data, target); toast.success('Basic scan completed!')
    } catch (e: any) { errorMsg.value = e.message; toast.error('Scan Failed', { description: e.message }) } finally { scanning.value = false; stopMockProgress() }
}

async function onFullScan() {
    const target = formatUrl(url.value)
    if (!target) return toast.error('Please enter a URL')
    url.value = target
    resetState(); scanning.value = true; startMockProgress(45000)
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/scan/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: target, config: { useZap: useZap.value } }) })
        if (!res.ok) await handleFetchError(res)
        const data = await res.json()
        fullScanData.value = parseAggregatedApiResponse(data, target); toast.success('Full scan completed!')
    } catch (e: any) { errorMsg.value = e.message; toast.error('Scan Failed', { description: e.message }) } finally { scanning.value = false; stopMockProgress() }
}

function handleScanSubmit() { activeScanType.value === 'basic' ? onBasicScan() : onFullScan() }
function resetState() { basicScanData.value = null; fullScanData.value = null; progress.value = 0; errorMsg.value = '' }
function onClear() { resetState(); url.value = '' }

// Helpers
function getSeverityBadge(level: any) { if (typeof level === 'number') { if (level >= 3) return 'destructive'; if (level === 2) return 'default'; return 'secondary' } switch (level?.toLowerCase()) { case 'critical': case 'high': return 'destructive'; case 'medium': return 'default'; default: return 'secondary' } }
function getBasicSeverityText(level: number) { if (level >= 3) return 'High'; if (level === 2) return 'Medium'; return 'Low' }
function mapSeverityToNumber(sev: string) { switch (sev?.toLowerCase()) { case 'critical': return 4; case 'high': return 3; case 'medium': return 2; default: return 1 } }

// ---------- COMPUTED ----------
const allBasicVulnerabilities = computed((): BasicVulnerability[] => {
    if (!basicScanData.value) return []
    return basicScanData.value.categories.flatMap((cat: any) => cat.vulns.map((vuln: any) => ({ ...vuln, category: cat.name, description: cat.desc, solution: cat.solution, references: cat.refs, wstg: cat.wstg, severity: getBasicSeverityText(vuln.level) }))).sort((a: any, b: any) => b.level - a.level)
})
const basicSummaryData = computed(() => {
    if (!basicScanData.value) return null
    const meta = basicScanData.value.scanMeta
    const highCount = allBasicVulnerabilities.value.filter(v => v.level >= 3).length
    const mediumCount = allBasicVulnerabilities.value.filter(v => v.level === 2).length
    return { site: meta.target, tools: [meta.version.split(' ')[0] || 'Wapiti', 'WhatWeb'], duration: meta.scan_time, totalVulns: meta.totalVulns, criticalHighVulns: highCount + mediumCount, topRisk: allBasicVulnerabilities.value[0]?.category || 'N/A', country: meta.country, ip: meta.ip }
})
const basicPriorities = computed((): PriorityItem[] => {
    if (!basicScanData.value) return []
    return allBasicVulnerabilities.value.filter(v => v.level >= 2).slice(0, 5).map(v => ({ type: v.category, severity: v.severity, endpoint: v.path }))
})
const flattenedBasicTechData = computed((): any[] => { if (!basicScanData.value?.technologies) return []; return basicScanData.value.technologies })

// ---------- TABLE COLUMNS (DEFINED FIRST) ----------
const priorityColumns: ColumnDef<PriorityItem>[] = [
    { accessorKey: 'type', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }), cell: ({ row }) => h('div', { class: 'font-medium truncate max-w-[200px]' }, row.getValue('type')) },
    { accessorKey: 'severity', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Severity' }), cell: ({ row }) => h(Badge, { variant: getSeverityBadge(row.getValue('severity')) }, () => row.getValue('severity')) },
    { accessorKey: 'endpoint', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Endpoint' }), cell: ({ row }) => h('div', { class: 'truncate max-w-[150px]' }, row.getValue('endpoint')) },
]
const basicVulnerabilityColumns: ColumnDef<BasicVulnerability>[] = [
    { accessorKey: 'category', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Category' }), cell: ({ row }) => h('div', { class: 'font-medium max-w-[200px] truncate' }, row.getValue('category')) },
    { accessorKey: 'severity', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Severity' }), cell: ({ row }) => h(Badge, { variant: getSeverityBadge(row.getValue('severity')) }, () => row.getValue('severity')), sortingFn: (a, b) => b.original.level - a.original.level },
    { accessorKey: 'path', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Path' }), cell: ({ row }) => h('div', { class: 'max-w-[250px] truncate font-mono text-xs' }, row.getValue('path')) },
    { id: 'actions', cell: ({ row }) => h(Button, { variant: 'ghost', size: 'sm', type: 'button', onClick: () => showBasicVulnDetail(row.original) }, () => 'Details') },
]
const fullVulnerabilityColumns: ColumnDef<FullVulnerability>[] = [
    { accessorKey: 'type', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }), cell: ({ row }) => h('div', { class: 'font-medium max-w-[200px] truncate' }, row.getValue('type')) },
    { accessorKey: 'severity', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Severity' }), cell: ({ row }) => h(Badge, { variant: getSeverityBadge(row.getValue('severity')) }, () => row.getValue('severity')) },
    { accessorKey: 'scanner', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Scanner' }) },
    { accessorKey: 'endpoint', header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Endpoint' }), cell: ({ row }) => h('div', { class: 'max-w-[150px] truncate' }, row.getValue('endpoint')) },
    { id: 'actions', cell: ({ row }) => h(Button, { variant: 'ghost', size: 'sm', type: 'button', onClick: () => showFullVulnDetail(row.original) }, () => 'Details') },
]
// Fixed: Renamed to fullTechColumns to match template expectation
const fullTechColumns: ColumnDef<Technology>[] = [
    { accessorKey: 'name', header: 'Technology' }, { accessorKey: 'version', header: 'Version' },
    { accessorKey: 'vulnerable', header: 'Vulnerable', cell: ({ row }) => h(Badge, { variant: row.getValue('vulnerable') ? 'destructive' : 'secondary' }, () => row.getValue('vulnerable') ? 'YES' : 'NO') }
]
const basicTechColumns: ColumnDef<Technology>[] = [
    { accessorKey: 'name', header: 'Technology' },
    { accessorKey: 'version', header: 'Version/Details' },
    { accessorKey: 'fix', header: 'Fix', cell: ({row}) => row.getValue('fix') === 'N/A' ? h('span', {class:'text-muted-foreground italic'}, 'N/A') : row.getValue('fix') }
]

// ---------- TABLES ----------
const basicPriorityTable = useVueTable({ get data() { return basicPriorities.value }, get columns() { return priorityColumns }, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })
const basicVulnerabilitiesTable = useVueTable({ get data() { return allBasicVulnerabilities.value }, get columns() { return basicVulnerabilityColumns }, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), state: { get globalFilter() { return basicGlobalFilter.value } }, onGlobalFilterChange: (u) => basicGlobalFilter.value = typeof u === 'function' ? u(basicGlobalFilter.value) : u })
const basicTechTable = useVueTable({ get data() { return basicScanData.value?.technologies || [] }, get columns() { return basicTechColumns }, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), state: { get globalFilter() { return basicTechGlobalFilter.value } }, onGlobalFilterChange: (u) => basicTechGlobalFilter.value = typeof u === 'function' ? u(basicTechGlobalFilter.value) : u })

const fullPriorityTable = useVueTable({ get data() { return fullScanData.value?.priorities || [] }, get columns() { return priorityColumns }, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })
const fullVulnerabilitiesTable = useVueTable({ get data() { return fullScanData.value?.vulnerabilities || [] }, get columns() { return fullVulnerabilityColumns }, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), state: { get globalFilter() { return fullVulnerabilityGlobalFilter.value } }, onGlobalFilterChange: (u) => fullVulnerabilityGlobalFilter.value = typeof u === 'function' ? u(fullVulnerabilityGlobalFilter.value) : u })
// Fixed: Uses fullTechColumns now
const fullTechTable = useVueTable({ get data() { return fullScanData.value?.technologies || [] }, get columns() { return fullTechColumns }, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), state: { get globalFilter() { return fullTechGlobalFilter.value } }, onGlobalFilterChange: (u) => fullTechGlobalFilter.value = typeof u === 'function' ? u(fullTechGlobalFilter.value) : u })

const basicGlobalFilter = ref(''), basicTechGlobalFilter = ref(''), fullVulnerabilityGlobalFilter = ref(''), fullTechGlobalFilter = ref('')
const showBasicVulnDetail = (vuln: BasicVulnerability) => { selectedBasicVuln.value = vuln; basicDrawerOpen.value = true }
const showFullVulnDetail = (vuln: FullVulnerability) => { selectedFullVuln.value = vuln; fullDrawerOpen.value = true }
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div><h1 class="font-bold px-2 text-4xl">New Scan</h1><div class="p-1.5"><span>Run scans to probe websites for vulnerabilities.</span></div></div>
            <Tabs v-model="activeScanType" default-value="basic" class="w-full" @update:model-value="resetState">
                <TabsList class="grid w-full grid-cols-2 md:w-[400px]"><TabsTrigger value="basic">Basic Scan</TabsTrigger><TabsTrigger value="full">Full Scan</TabsTrigger></TabsList>

                <TabsContent value="basic">
                    <form @submit.prevent="handleScanSubmit"><Card><CardHeader><CardTitle>Basic Scan</CardTitle><CardContent class="pt-4 px-0 pb-0"><span class="text-sm text-muted-foreground">Runs a preconfigured Wapiti and WhatWeb scan. Quick, but may not find all issues.</span></CardContent></CardHeader><CardContent class="flex flex-col gap-4 md:flex-row md:items-start pt-6"><Input v-model="url" placeholder="Enter site URL" class="w-full md:w-80" :disabled="scanning" /><div class="flex gap-2"><Button type="submit" :disabled="scanning"><svg v-if="scanning" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{{ scanning ? 'Scanning...' : 'Run Scan' }}</Button><Button variant="secondary" type="button" @click="onClear" :disabled="scanning">Clear</Button></div></CardContent><div v-if="scanning" class="px-6 pb-6"><Progress :model-value="progress" class="h-2" /></div></Card></form>
                </TabsContent>

                <TabsContent value="full">
                    <form @submit.prevent="handleScanSubmit"><Card><CardHeader><CardTitle>Full Scan</CardTitle><CardContent class="pt-4 px-0 pb-0"><span class="text-sm text-muted-foreground">A comprehensive scan using Wapiti, ZAP, WhatWeb, and SearchVuln.</span></CardContent></CardHeader><CardContent class="flex flex-col gap-4 pt-6"><div class="flex flex-col gap-4 md:flex-row md:items-start"><Input v-model="url" placeholder="Enter site URL" class="w-full md:w-80" :disabled="scanning" /><div class="flex gap-2"><Button type="submit" :disabled="scanning"><svg v-if="scanning" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{{ scanning ? 'Scanning...' : 'Run Scan' }}</Button><Button variant="secondary" type="button" @click="onClear" :disabled="scanning">Clear</Button></div></div><Separator /><div class="flex flex-col md:flex-row gap-4 items-center space-x-2"><div class="flex items-center space-x-2"><Switch id="zap-switch" v-model:checked="useZap" :disabled="scanning" /><Label for="zap-switch">Enable ZAP Active Scan</Label></div><div class="flex items-center space-x-2"><Switch id="searchvuln-switch" v-model:checked="useSearchVuln" :disabled="scanning" /><Label for="searchvuln-switch">Enable SearchVuln (Tech Scan)</Label></div></div></CardContent><div v-if="scanning" class="px-6 pb-6"><Progress :model-value="progress" class="h-2" /></div></Card></form>
                </TabsContent>
            </Tabs>

            <div v-if="errorMsg && !scanning" class="text-red-600 text-center font-bold p-2">{{ errorMsg }}</div>

            <div v-if="scanning" class="space-y-4 animate-pulse mt-2">
                <Card><CardHeader><Skeleton class="h-6 w-48" /></CardHeader><CardContent class="space-y-4"><Skeleton class="h-4 w-full" /><Skeleton class="h-4 w-3/4" /><div class="space-y-2 pt-4"><Skeleton class="h-4 w-1/3" /><Skeleton class="h-4 w-1/2" /></div></CardContent></Card>
                <Card><CardHeader><Skeleton class="h-8 w-64" /></CardHeader><CardContent><div class="grid grid-cols-2 md:grid-cols-4 gap-4"><div v-for="i in 4" :key="i" class="p-4 border rounded-lg space-y-2"><Skeleton class="h-4 w-20" /><Skeleton class="h-8 w-12" /></div></div></CardContent></Card>
                <Card><CardHeader><Skeleton class="h-6 w-48" /></CardHeader><CardContent><div class="space-y-2"><Skeleton class="h-8 w-full" /><Skeleton v-for="j in 5" :key="j" class="h-12 w-full" /></div></CardContent></Card>
            </div>

            <div v-else-if="(basicScanData && activeScanType === 'basic') || (fullScanData && activeScanType === 'full')" class="space-y-4 animate-fadein mt-2">

                <template v-if="activeScanType === 'basic' && basicSummaryData">
                    <Card><CardHeader><CardTitle class="text-2xl">Basic Scan Report</CardTitle><CardDescription class="pt-2"><div class="grid grid-cols-1 md:grid-cols-4 gap-1 text-sm"><div class="truncate"><strong>Target:</strong> {{ basicSummaryData.site }}</div><div class="truncate"><strong>Tools:</strong> {{ basicSummaryData.tools.join(', ') }}</div><div class="truncate"><strong>Location:</strong> {{ basicSummaryData.country }}</div><div class="truncate"><strong>IP:</strong> {{ basicSummaryData.ip }}</div></div></CardDescription></CardHeader><Separator /><CardContent class="pt-6"><div class="grid grid-cols-2 md:grid-cols-4 gap-4"><div class="p-4 border rounded-lg"><h3 class="text-sm font-medium text-muted-foreground">Total Findings</h3><p class="text-3xl font-bold">{{ basicSummaryData.totalVulns }}</p></div><div class="p-4 border rounded-lg"><h3 class="text-sm font-medium text-muted-foreground">High/Medium</h3><p class="text-3xl font-bold text-destructive">{{ basicSummaryData.criticalHighVulns }}</p></div><div class="p-4 border rounded-lg"><h3 class="text-sm font-medium text-muted-foreground">Technologies</h3><p class="text-3xl font-bold">{{ basicScanData.technologies.length }}</p></div><div class="p-4 border rounded-lg"><h3 class="text-sm font-medium text-muted-foreground">Top Vulnerability</h3><p class="text-2xl md:text-3xl font-bold">{{ basicSummaryData.topRisk }}</p></div></div></CardContent></Card>
                    <Card v-if="basicScanData.aiSummary"><CardHeader><CardTitle class="flex items-center gap-2"><Sparkles class="h-5 w-5 text-primary" /><span>AI Summary & Recommendations</span></CardTitle></CardHeader><CardContent class="space-y-4 text-sm"><div><h4 class="font-semibold mb-2">Overall Assessment</h4><p class="text-muted-foreground">{{ basicScanData.aiSummary.assessment }}</p></div><div><h4 class="font-semibold mb-2">Key Findings</h4><ul class="list-disc pl-5 space-y-1 text-muted-foreground"><li v-for="(finding, idx) in basicScanData.aiSummary.keyFindings" :key="`bf-${idx}`">{{ finding }}</li></ul></div><div><h4 class="font-semibold mb-2">Recommended Actions</h4><ol class="list-decimal pl-5 space-y-1 text-muted-foreground"><li v-for="(rec, idx) in basicScanData.aiSummary.recommendations" :key="`br-${idx}`">{{ rec }}</li></ol></div></CardContent></Card>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6"><Card><CardHeader><CardTitle>Top Vulnerabilities</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow v-for="headerGroup in basicRiskPriorityTable.getHeaderGroups()" :key="headerGroup.id"><TableHead v-for="header in headerGroup.headers" :key="header.id"><FlexRender :render="header.column.columnDef.header" :props="header.getContext()" /></TableHead></TableRow></TableHeader><TableBody><TableRow v-if="!basicRiskPriorityTable.getRowModel().rows.length"><TableCell :colSpan="priorityColumns.length" class="h-24 text-center">No high or medium risks found.</TableCell></TableRow><TableRow v-for="row in basicRiskPriorityTable.getRowModel().rows" :key="row.id"><TableCell v-for="cell in row.getVisibleCells()" :key="cell.id"><FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()"/></TableCell></TableRow></TableBody></Table></CardContent></Card><Card><CardHeader><CardTitle>Severity Distribution</CardTitle></CardHeader><CardContent><SeverityPieChart :vulnerabilities="allBasicVulnerabilities" /></CardContent></Card></div>
                    <Card><CardHeader><CardTitle>Vulnerabilities Detected</CardTitle></CardHeader><CardContent class="space-y-2"><Input placeholder="Filter vulnerabilities..." :model-value="basicGlobalFilter" @update:modelValue="basicGlobalFilter = $event" class="h-8" /><div class="border rounded-md"><Table><TableHeader><TableRow v-for="headerGroup in basicVulnerabilitiesTable.getHeaderGroups()" :key="headerGroup.id"><TableHead v-for="header in headerGroup.headers" :key="header.id"><FlexRender :render="header.column.columnDef.header" :props="header.getContext()" /></TableHead></TableRow></TableHeader><TableBody><TableRow v-if="!basicVulnerabilitiesTable.getRowModel().rows.length"><TableCell :colSpan="basicVulnerabilityColumns.length" class="h-24 text-center">No results.</TableCell></TableRow><TableRow v-for="row in basicVulnerabilitiesTable.getRowModel().rows" :key="row.id" class="cursor-pointer" @click="showBasicVulnDetail(row.original)"><TableCell v-for="cell in row.getVisibleCells()" :key="cell.id"><FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" /></TableCell></TableRow></TableBody></Table></div><DataTablePagination :table="basicVulnerabilitiesTable" /></CardContent></Card>
                    <Card v-if="basicTechTable.getRowModel().rows.length"><CardHeader><CardTitle>Technologies & Services</CardTitle></CardHeader><CardContent class="space-y-2"><Input placeholder="Filter technologies..." :model-value="basicTechGlobalFilter" @update:modelValue="basicTechGlobalFilter = $event" class="h-8" /><div class="border rounded-md overflow-x-auto"><Table><TableHeader><TableRow v-for="headerGroup in basicTechTable.getHeaderGroups()" :key="headerGroup.id"><TableHead v-for="header in headerGroup.headers" :key="header.id"><FlexRender :render="header.column.columnDef.header" :props="header.getContext()" /></TableHead></TableRow></TableHeader><TableBody><TableRow v-for="row in basicTechTable.getRowModel().rows" :key="row.id"><TableCell v-for="cell in row.getVisibleCells()" :key="cell.id"><FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" /></TableCell></TableRow></TableBody></Table></div><DataTablePagination :table="basicTechTable" /></CardContent></Card>
                </template>

                <template v-if="activeScanType === 'full' && fullScanData">
                    <Card><CardHeader><CardTitle class="text-2xl">Full Scan Report</CardTitle><CardDescription class="pt-2"><div class="grid grid-cols-1 md:grid-cols-4 gap-1 text-sm"><div class="truncate"><strong>Target:</strong> {{ fullScanData.site }}</div><div class="truncate"><strong>Tools:</strong> {{ fullScanData.tools.join(', ') }}</div><div class="truncate"><strong>Location:</strong> {{ fullScanData.country }}</div><div class="truncate"><strong>IP:</strong> {{ fullScanData.ip }}</div></div></CardDescription></CardHeader><Separator /><CardContent class="pt-6"><div class="grid grid-cols-2 md:grid-cols-4 gap-4"><div class="p-4 border rounded-lg"><h3 class="text-sm font-medium text-muted-foreground">Total Vulns</h3><p class="text-3xl font-bold">{{ fullScanData.totalVulns }}</p></div><div class="p-4 border rounded-lg"><h3 class="text-sm font-medium text-muted-foreground">Critical/High</h3><p class="text-3xl font-bold text-destructive">{{ fullScanData.criticalVulns }}</p></div><div class="p-4 border rounded-lg"><h3 class="text-sm font-medium text-muted-foreground">Technologies</h3><p class="text-3xl font-bold">{{ fullScanData.technologies.length }}</p></div><div class="p-4 border rounded-lg"><h3 class="text-sm font-medium text-muted-foreground">Top Vulnerability</h3><p class="text-2xl md:text-3xl font-bold">{{ fullScanData.priorities[0]?.type || 'N/A' }}</p></div></div></CardContent></Card>
                    <Card v-if="fullScanData.aiSummary"><CardHeader><CardTitle class="flex items-center gap-2"><Sparkles class="h-5 w-5 text-primary" /><span>AI Summary & Recommendations</span></CardTitle></CardHeader><CardContent class="space-y-4 text-sm"><div><h4 class="font-semibold mb-2">Overall Assessment</h4><p class="text-muted-foreground">{{ fullScanData.aiSummary.assessment }}</p></div><div><h4 class="font-semibold mb-2">Key Findings</h4><ul class="list-disc pl-5 space-y-1 text-muted-foreground"><li v-for="(finding, idx) in fullScanData.aiSummary.keyFindings" :key="`ff-${idx}`">{{ finding }}</li></ul></div></CardContent></Card>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6"><Card><CardHeader><CardTitle>Severity Distribution</CardTitle></CardHeader><CardContent><SeverityPieChart :vulnerabilities="fullScanData.vulnerabilities" /></CardContent></Card><Card><CardHeader><CardTitle>Findings by Scanner</CardTitle></CardHeader><CardContent><ScannerBarChart :vulnerabilities="fullScanData.vulnerabilities" /></CardContent></Card></div>
                    <Card><CardHeader><CardTitle>Top Vulnerabilities</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow v-for="hg in fullPriorityTable.getHeaderGroups()" :key="hg.id"><TableHead v-for="h in hg.headers" :key="h.id"><FlexRender :render="h.column.columnDef.header" :props="h.getContext()"/></TableHead></TableRow></TableHeader><TableBody><TableRow v-if="!fullPriorityTable.getRowModel().rows.length"><TableCell :colSpan="priorityColumns.length" class="h-24 text-center">No high risks found.</TableCell></TableRow><TableRow v-for="row in fullPriorityTable.getRowModel().rows" :key="row.id"><TableCell v-for="cell in row.getVisibleCells()" :key="cell.id"><FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()"/></TableCell></TableRow></TableBody></Table></CardContent></Card>
                    <Card><CardHeader><CardTitle>Vulnerabilities Detected</CardTitle></CardHeader><CardContent class="space-y-2"><Input placeholder="Filter vulnerabilities..." :model-value="fullVulnerabilityGlobalFilter" @update:modelValue="fullVulnerabilityGlobalFilter = $event" class="h-8" /><div class="border rounded-md"><Table><TableHeader><TableRow v-for="headerGroup in fullVulnerabilitiesTable.getHeaderGroups()" :key="headerGroup.id"><TableHead v-for="header in headerGroup.headers" :key="header.id"><FlexRender :render="header.column.columnDef.header" :props="header.getContext()" /></TableHead></TableRow></TableHeader><TableBody><TableRow v-if="!fullVulnerabilitiesTable.getRowModel().rows.length"><TableCell :colSpan="fullVulnerabilityColumns.length" class="h-24 text-center">No results.</TableCell></TableRow><TableRow v-for="row in fullVulnerabilitiesTable.getRowModel().rows" :key="row.id"><TableCell v-for="cell in row.getVisibleCells()" :key="cell.id"><FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()"/></TableCell></TableRow></TableBody></Table></div><DataTablePagination :table="fullVulnerabilitiesTable" /></CardContent></Card>
                    <Card><CardHeader><CardTitle>Technologies</CardTitle></CardHeader><CardContent class="space-y-2"><Input placeholder="Filter technologies..." :model-value="fullTechGlobalFilter" @update:modelValue="fullTechGlobalFilter = $event" class="h-8" /><div class="border rounded-md"><Table><TableHeader><TableRow v-for="headerGroup in fullTechTable.getHeaderGroups()" :key="headerGroup.id"><TableHead v-for="header in headerGroup.headers" :key="header.id"><FlexRender :render="header.column.columnDef.header" :props="header.getContext()" /></TableHead></TableRow></TableHeader><TableBody><TableRow v-if="!fullTechTable.getRowModel().rows.length"><TableCell :colSpan="fullTechColumns.length" class="h-24 text-center">No technologies detected.</TableCell></TableRow><TableRow v-for="row in fullTechTable.getRowModel().rows" :key="row.id"><TableCell v-for="cell in row.getVisibleCells()" :key="cell.id"><FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()"/></TableCell></TableRow></TableBody></Table></div><DataTablePagination :table="fullTechTable" /></CardContent></Card>
                </template>

            </div>

            <BasicScanDetailDrawer v-if="selectedBasicVuln" :vuln="selectedBasicVuln" :open="basicDrawerOpen" @update:open="basicDrawerOpen = $event" />
            <FullScanDetailDrawer v-if="selectedFullVuln" :vuln="selectedFullVuln" :open="fullDrawerOpen" @update:open="fullDrawerOpen = $event" />

        </div>
    </Navigation>
</template>

<style scoped>
.animate-fadein { animation: fadein 0.5s; }
@keyframes fadein { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }
th { position: sticky; top: 0; z-index: 1; }
</style>
