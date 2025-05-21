<script setup lang="ts">
import Navigation from '@/components/custom/Navigation.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, Pencil, Trash2 } from 'lucide-vue-next';
import { ref } from 'vue';

// Dummy data for scan history
const scanHistory = ref([
    {
        id: 1,
        date: '2025-05-21 14:23',
        target: 'https://example.com',
        scanner: 'Wapiti',
        severity: 'Critical',
        summary: 'SQL Injection vulnerability found',
        status: 'Completed',
    },
    {
        id: 2,
        date: '2025-05-20 10:13',
        target: 'https://demoapp.com',
        scanner: 'Arachni',
        severity: 'High',
        summary: 'Cross-Site Scripting detected',
        status: 'Completed',
    },
    {
        id: 3,
        date: '2025-05-19 08:42',
        target: 'https://testsite.org',
        scanner: 'Zap',
        severity: 'Medium',
        summary: 'Sensitive data exposed via headers',
        status: 'In Progress',
    },
    {
        id: 4,
        date: '2025-05-18 17:05',
        target: 'https://mywebapp.net',
        scanner: 'Wapiti',
        severity: 'Low',
        summary: 'Missing security headers',
        status: 'Completed',
    },
]);

function getSeverityColor(severity: string) {
    switch (severity) {
        case 'Critical':
            return 'bg-red-600 text-white';
        case 'High':
            return 'bg-orange-500 text-white';
        case 'Medium':
            return 'bg-yellow-400 text-black';
        case 'Low':
            return 'bg-green-400 text-black';
        default:
            return 'bg-gray-400 text-black';
    }
}
</script>

<template>
    <Navigation>
        <div class="p-6">
            <h1 class="mb-6 text-2xl font-bold">Scan History</h1>
            <div class="overflow-x-auto rounded-lg shadow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Target URL</TableHead>
                            <TableHead>Scanner</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Summary</TableHead>
                            <TableHead class="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow v-for="entry in scanHistory" :key="entry.id">
                            <TableCell>{{ entry.date }}</TableCell>
                            <TableCell>
                                <span class="block max-w-xs truncate" :title="entry.target">{{ entry.target }}</span>
                            </TableCell>
                            <TableCell>{{ entry.scanner }}</TableCell>
                            <TableCell>
                                <Badge :class="getSeverityColor(entry.severity)">
                                    {{ entry.severity }}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span
                                    :class="{
                                        'font-semibold text-green-600': entry.status === 'Completed',
                                        'font-semibold text-yellow-500': entry.status === 'In Progress',
                                    }"
                                >
                                    {{ entry.status }}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span class="block max-w-xs truncate" :title="entry.summary">{{ entry.summary }}</span>
                            </TableCell>
                            <TableCell class="space-x-2 text-right whitespace-nowrap">
                                <Button size="icon" variant="ghost" :aria-label="'View ' + entry.id">
                                    <Eye class="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" :aria-label="'Edit ' + entry.id">
                                    <Pencil class="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" :aria-label="'Delete ' + entry.id">
                                    <Trash2 class="h-4 w-4 text-red-500" />
                                </Button>
                                <Button size="icon" variant="ghost" :aria-label="'Download ' + entry.id">
                                    <Download class="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    </Navigation>
</template>
