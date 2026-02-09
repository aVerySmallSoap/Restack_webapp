<script setup lang="ts">
import { MoreHorizontal, FileText, FileSpreadsheet } from 'lucide-vue-next'
import { Link, router } from '@inertiajs/vue3'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'vue-sonner'

defineProps({
    rowData: {
        type: Object,
        required: true,
    },
})

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function downloadReport(id: string, format: 'excel' | 'pdf') {
    const url = `${API_BASE_URL}/api/v1/report/${id}/export/${format}`
    window.open(url, '_blank')
    toast.info(`Generating ${format.toUpperCase()} report...`)
}

function handleDelete(scanId: string) {
    if (confirm('Are you sure you want to delete this scan report?')) {
        router.delete(route('history.destroy', scanId), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Report deleted successfully');
            }
        })
    }
}
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="ghost" class="h-8 w-8 p-0">
                <span class="sr-only">Open menu</span>
                <MoreHorizontal class="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            <DropdownMenuItem as-child>
                <Link :href="`/history/${rowData.id}`">
                    View Report
                </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem @click="downloadReport(rowData.id, 'pdf')">
                <FileText class="mr-2 h-4 w-4" />
                Export PDF
            </DropdownMenuItem>

            <DropdownMenuItem @click="downloadReport(rowData.id, 'excel')">
                <FileSpreadsheet class="mr-2 h-4 w-4" />
                Export Excel
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem @click="handleDelete(rowData.id)" class="text-destructive focus:text-destructive">
                Delete Scan
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
