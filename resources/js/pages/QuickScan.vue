<script setup lang="ts">
import { ref, computed } from 'vue'
import Navigation from '@/components/custom/Navigation.vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import VulnerabilityDetailDrawer from '@/components/custom/VulnerabilityDetailDrawer.vue'

// ---------- State ----------
const url = ref('')
const scanning = ref(false)
const progress = ref(0)
const errorMsg = ref('')
const feedbackMsg = ref('')
const feedbackType = ref('info')
const drawerOpen = ref(false)
const selectedVuln = ref(null)

// API response structure
const scanMeta = ref(null)
const categories = ref([])
const whatWebPlugins = ref([])

// ---------- Derived States ----------
const allVulnerabilities = computed(() => {
  // Flatten all vulnerabilities with category info
  return categories.value.flatMap(cat =>
    cat.vulns.map(vuln => ({
      ...vuln,
      category: cat.name,
    }))
  )
})

// WhatWeb: Get all possible plugin keys for columns
const whatWebColumns = computed(() => {
  const keys = new Set<string>()
  for (const plugin of whatWebPlugins.value) {
    const pluginObj = plugin[Object.keys(plugin)[0]]
    Object.keys(pluginObj).forEach(key => keys.add(key))
  }
  return Array.from(keys)
})

// ---------- Helpers ----------
function resetState() {
  scanMeta.value = null
  categories.value = []
  whatWebPlugins.value = []
  progress.value = 0
  errorMsg.value = ''
  feedbackMsg.value = ''
  selectedVuln.value = null
}

function parseApiResponse(data) {
  if (!data || !data.data) return

  scanMeta.value = {
    target: data.extra?.target || '',
    scan_time: Math.round(data.scan_time || 0),
    date: data.extra?.date || '',
    version: data.extra?.version || '',
    crawled_pages_nbr: data.extra?.crawled_pages_nbr || 0,
    totalCategories: data.data.categories?.length || 0,
    totalVulns: Array.isArray(data.data.vulnerabilities)
      ? data.data.vulnerabilities.reduce((sum, vcat) => sum + vcat.length, 0)
      : 0,
  }

  categories.value = (data.data.categories || []).map((cat, idx) => ({
    name: cat,
    desc: data.data.descriptions[idx]?.desc ?? '',
    solution: data.data.descriptions[idx]?.sol ?? '',
    refs: data.data.descriptions[idx]?.ref ?? {},
    wstg: data.data.descriptions[idx]?.wstg ?? [],
    vulns: Array.isArray(data.data.vulnerabilities?.[idx])
      ? data.data.vulnerabilities[idx]
      : [],
  }))

  whatWebPlugins.value = Array.isArray(data.plugins) ? data.plugins : []
}

function showVulnDetail(vuln) {
  selectedVuln.value = vuln
  drawerOpen.value = true
}

function onScan() {
  if (!url.value) return
  resetState()
  scanning.value = true
  progress.value = 0
  errorMsg.value = ''
  let interval = setInterval(() => {
    if (progress.value < 100) progress.value = Math.min(progress.value + 15, 100)
  }, 200)

  fetch('http://127.0.0.1:25565/api/v1/wapiti/scan', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ url: url.value }),
  })
    .then(res => res.json())
    .then(data => {
      parseApiResponse(data)
      scanning.value = false
      progress.value = 100
      clearInterval(interval)
      feedbackMsg.value = 'Scan completed successfully!'
      feedbackType.value = 'success'
      setTimeout(() => (feedbackMsg.value = ''), 2000)
    })
    .catch(() => {
      scanning.value = false
      progress.value = 0
      clearInterval(interval)
      errorMsg.value = 'Scan failed. Please try again.'
      feedbackMsg.value = errorMsg.value
      feedbackType.value = 'error'
      setTimeout(() => (feedbackMsg.value = ''), 2500)
    })
}

function onClear() {
  url.value = ''
  resetState()
  feedbackMsg.value = 'Results have been cleared.'
  feedbackType.value = 'info'
  setTimeout(() => (feedbackMsg.value = ''), 1500)
}
</script>

<template>
  <Navigation>
    <div class="flex flex-1 flex-col gap-4 p-4 pt-0">

      <!-- Toast/Feedback -->
      <transition name="fade">
        <div
          v-if="feedbackMsg"
          class="bg-background fixed top-6 right-6 z-50 rounded border px-4 py-2 text-sm shadow"
          :class="{
            'border-green-600 bg-green-50 text-green-700': feedbackType === 'success',
            'border-red-600 bg-red-50 text-red-700': feedbackType === 'error',
            'border-neutral-400 bg-neutral-50 text-neutral-700': feedbackType === 'info',
          }"
          style="min-width: 240px; text-align: center"
        >
          {{ feedbackMsg }}
        </div>
      </transition>

      <!-- Title & Scan Form -->
      <div>
        <h1 class="font-bold px-2 text-4xl">Quick Scan</h1>
        <div class="p-1.5">
          <span>
            Run a preconfigured Wapiti scan to quickly probe websites.<br />
            <span class="text-sm text-red-600 italic">
              WARNING: This scan tries to probe websites as quickly as possible, therefore, it may not produce accurate results.
            </span>
          </span>
        </div>
      </div>
      <form @submit.prevent="onScan">
        <div class="mb-4 flex flex-col gap-2 p-1.5 md:flex-row md:gap-4">
          <Input v-model="url" placeholder="Enter site URL..." class="w-full md:w-80" />
          <div class="flex flex-col gap-2">
            <div class="flex flex-1 flex-col items-end gap-2 md:flex-row md:gap-4">
              <Button type="submit" :disabled="scanning">Quick Scan</Button>
              <Button variant="secondary" type="button" @click="onClear" :disabled="scanning || !scanMeta">
                Clear
              </Button>
            </div>
          </div>
        </div>
      </form>

      <!-- Progress Bar -->
      <div v-if="scanning" class="my-4 flex justify-center">
        <Progress :value="progress > 100 ? 100 : progress" class="w-2/3" />
      </div>

      <!-- Error Message -->
      <div v-if="errorMsg" class="text-red-600 text-center font-bold p-2">
        {{ errorMsg }}
      </div>

      <!-- Scan Summary Card -->
      <div v-if="scanMeta && !scanning" class="animate-fadein">
        <Card>
          <CardHeader>
            <CardTitle>Scan Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
              <div>
                <div><strong>Target:</strong> {{ scanMeta.target }}</div>
                <div><strong>Scan Time:</strong> {{ scanMeta.scan_time }} seconds</div>
                <div><strong>Date:</strong> {{ scanMeta.date }}</div>
                <div><strong>Pages Crawled:</strong> {{ scanMeta.crawled_pages_nbr }}</div>
                <div><strong>Wapiti Version:</strong> {{ scanMeta.version }}</div>
              </div>
              <div>
                <div><strong>Total Issue Categories:</strong> {{ scanMeta.totalCategories }}</div>
                <div><strong>Total Vulnerabilities:</strong> {{ scanMeta.totalVulns }}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Vulnerabilities Table -->
      <div v-if="allVulnerabilities.length && !scanning" class="animate-fadein">
        <h2 class="text-2xl font-bold mb-2">Vulnerabilities</h2>
        <Card>
          <CardHeader>
            <CardTitle>All Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Info</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(vuln, idx) in allVulnerabilities" :key="idx">
                  <TableCell>{{ vuln.category }}</TableCell>
                  <TableCell>{{ vuln.level }}</TableCell>
                  <TableCell>{{ vuln.module }}</TableCell>
                  <TableCell>{{ vuln.info }}</TableCell>
                  <TableCell>{{ vuln.path }}</TableCell>
                  <TableCell>{{ vuln.method }}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" @click="showVulnDetail(vuln)">Details</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div v-else-if="categories.length && !scanning" class="animate-fadein">
        <div class="text-muted-foreground">No vulnerabilities found.</div>
      </div>

      <!-- Vulnerability Detail Drawer -->
      <VulnerabilityDetailDrawer v-if="selectedVuln" :vuln="selectedVuln" :open="drawerOpen" @update:open="drawerOpen = $event" />

      <!-- WhatWeb Plugins Table -->
      <div v-if="whatWebPlugins.length && !scanning" class="animate-fadein">
        <h2 class="text-2xl font-bold mb-2">WhatWeb Results</h2>
        <Card>
          <CardHeader>
            <CardTitle>Plugin Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plugin</TableHead>
                  <TableHead v-for="col in whatWebColumns" :key="col">{{ col }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(plugin, idx) in whatWebPlugins" :key="idx">
                  <TableCell>{{ Object.keys(plugin)[0] }}</TableCell>
                  <TableCell v-for="col in whatWebColumns" :key="col">
                    <template v-if="plugin[Object.keys(plugin)[0]][col]">
                      <span v-if="Array.isArray(plugin[Object.keys(plugin)[0]][col])">
                        {{ plugin[Object.keys(plugin)[0]][col].join(', ') }}
                      </span>
                      <span v-else>
                        {{ plugin[Object.keys(plugin)[0]][col] }}
                      </span>
                    </template>
                    <template v-else>-</template>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  </Navigation>
</template>

<style scoped>
.animate-fadein {
  animation: fadein 0.5s;
}
@keyframes fadein {
  from { opacity: 0; transform: translateY(10px);}
  to { opacity: 1; transform: translateY(0);}
}
</style>
