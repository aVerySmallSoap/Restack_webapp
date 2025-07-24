<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import Navigation from '@/components/custom/Navigation.vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import SeverityPieChartFullscan from '@/components/custom/Charts/SeverityPieChartFullscan.vue'
import VulnerabilityDetailDrawer from '@/components/custom/VulnerabilityDetailDrawer.vue'
const url = ref('')
const scanData = ref({
  site: 'http://sample.web',
  tools: ['Wapiti', 'ZAP', 'WhatWeb'],
  duration: 224,
  totalVulns: 15,
  criticalVulns: 4,
  risks: [
    { type: 'Cross Site Scripting', risk: 'Critical', endpoint: '/payments' },
    { type: 'SQLInjection', risk: 'Critical', endpoint: '/login' },
  ],
  vulnerabilities: [
    {
      type: 'XXS',
      severity: 'Medium',
      scanner: 'ZAP',
      confidence: 'Medium',
      method: 'POST',
      endpoint: '/login',
      exploit: '/login',
      description: 'Reflected XSS in /login',
      solution: 'Sanitize inputs',
      reference: 'https://owasp.org/www-community/attacks/xss/',
    },
    {
      type: 'SQLInjection',
      severity: 'Critical',
      scanner: 'Wapiti',
      confidence: 'High',
      method: 'GET',
      endpoint: '/payments',
      exploit: '/payments',
      description: 'SQL Injection in /payments',
      solution: 'Use parameterized queries',
      reference: 'https://owasp.org/www-community/attacks/SQL_Injection',
    },
  ],
  technologies: [
    {
      name: 'PHP',
      version: '2.3',
      vulnerable: true,
      cve: 'CVE-2003-something',
      fix: 'Update',
    },
  ],
})

const drawerOpen = ref(false)
const selectedVuln = ref({})
const progress = ref(0)
const scanning = ref(false)

function showVulnDetail(vuln: any) {
  selectedVuln.value = vuln
  drawerOpen.value = true
}

function onScan() {
  scanning.value = true
  progress.value = 0
  const interval = setInterval(() => {
    if (progress.value < 100) {
      progress.value += 10
    } else {
      clearInterval(interval)
      scanning.value = false
    }
  }, 300)
}

  setTimeout(() => {
    clearInterval(interval)
    progress.value = 100
    scanning.value = false
    toast('Full Scan Complete', {
      description: `Scan completed for ${url.value || scanData.value.site}`,
      action: {
        label: 'View Report',
        onClick: () => {
        },
      },
    })
  }, 2500)
</script>

<template>
  <Navigation>
    <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
      <!-- Title & Scan Input -->
      <div>
        <h1 class="font-bold px-2 text-4xl">Full Scan</h1>
        <div class="p-1.5">
          <span>
            Run a comprehensive scan using Wapiti, ZAP, and WhatWeb to probe websites for vulnerabilities.<br />
            <span class="text-sm text-red-600 italic">
              WARNING: This scan may take longer and produce more accurate, but more extensive, results.
            </span>
          </span>
        </div>
      </div>
      <form @submit.prevent="onScan">
        <div class="mb-4 flex flex-col gap-2 p-1.5 md:flex-row md:gap-4">
          <Input v-model="url" placeholder="Enter site URL..." class="w-full md:w-80" />
          <div class="flex flex-col gap-2">
            <div class="flex flex-1 flex-col items-end gap-2 md:flex-row md:gap-4">
              <Button type="submit" :disabled="scanning">Full Scan</Button>
            </div>
          </div>
        </div>
      </form>
    <div v-if="scanning" class="my-4 flex justify-center">
        <Progress v-model="progress" class="w-2/3" />
      </div>
      <!-- Main scan report (show only if not scanning) -->
      <div v-if="!scanning && progress === 100" class="space-y-4">
        <h2 class="text-2xl font-bold">Full scan report</h2>
        <div class="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-2 md:space-y-0">
          <div>
            <div class="text-sm text-muted-foreground">
              <div>{{ scanData.site }}</div>
              <div>Tools: {{ scanData.tools.join(', ') }}</div>
              <div>Scan duration: {{ scanData.duration }} seconds</div>
            </div>
          </div>
          <div class="flex space-x-4 mt-2 md:mt-0">
            <Button variant="outline">Total vulnerabilities: {{ scanData.totalVulns }}</Button>
            <Button variant="outline">Critical: {{ scanData.criticalVulns }}</Button>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Risk Priorities -->
          <Card>
            <CardHeader>
              <CardTitle>Risk priorities</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Endpoint</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="(risk, i) in scanData.risks" :key="i">
                    <TableCell>{{ i+1 }}. {{ risk.type }}</TableCell>
                    <TableCell>{{ risk.risk }}</TableCell>
                    <TableCell>{{ risk.endpoint }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <!-- Severity Pie Chart -->
          <Card>
            <CardHeader>
              <CardTitle>Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="w-full h-64 flex items-center justify-center">
                <SeverityPieChartFullscan />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- Vulnerabilities Detected -->
    <div v-if="!scanning && progress === 100">
      <Card>
        <CardHeader>
          <CardTitle>Vulnerabilities detected</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Scanner</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Exploit</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="(vuln, idx) in scanData.vulnerabilities" :key="idx">
                <TableCell>{{ vuln.type }}</TableCell>
                <TableCell>{{ vuln.severity }}</TableCell>
                <TableCell>{{ vuln.scanner }}</TableCell>
                <TableCell>{{ vuln.confidence }}</TableCell>
                <TableCell>{{ vuln.method }}</TableCell>
                <TableCell>{{ vuln.endpoint }}</TableCell>
                <TableCell>{{ vuln.exploit }}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" @click="showVulnDetail(vuln)">Details</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <VulnerabilityDetailDrawer :vuln="selectedVuln" :open="drawerOpen" @update:open="drawerOpen = $event" />
        </CardContent>
      </Card>

      <!-- Technologies Table -->
      <Card class="mt-4">
        <CardHeader>
          <CardTitle>Technologies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Technology</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Vulnerable</TableHead>
                <TableHead>CVE</TableHead>
                <TableHead>Fix</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="(tech, idx) in scanData.technologies" :key="idx">
                <TableCell>{{ tech.name }}</TableCell>
                <TableCell>{{ tech.version }}</TableCell>
                <TableCell>{{ tech.vulnerable ? 'YES' : 'NO' }}</TableCell>
                <TableCell>{{ tech.cve }}</TableCell>
                <TableCell>{{ tech.fix }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
                </div>    </div>
  </Navigation>
</template>
