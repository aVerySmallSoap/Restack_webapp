<script setup lang="ts">
import { MoreHorizontal } from 'lucide-vue-next'
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

defineProps({
    rowData: {
        type: Object,
        required: true,
    },
})

function handleDelete(scanId: string) {
    if (confirm('Are you sure you want to delete this scan report?')) {
        router.delete(route('history.destroy', scanId), {
            preserveScroll: true,
            onSuccess: () => {
                console.log('Deleted');
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
            <DropdownMenuItem @click="handleDelete(rowData.id)" class="text-destructive focus:text-destructive">
                Delete Scan
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
