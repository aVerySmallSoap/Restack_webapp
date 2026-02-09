<script setup lang="ts">
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
    open: boolean
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
}

const props = withDefaults(defineProps<Props>(), {
    title: 'Are you sure?',
    description: 'This action cannot be undone.',
    confirmText: 'Continue',
    cancelText: 'Cancel',
    variant: 'default'
})

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'confirm'): void
    (e: 'cancel'): void
}>()

// Prevent the dialog from auto-closing
const handleOpenChange = (value: boolean) => {
    // Only allow closing via explicit cancel/confirm actions
    // Don't propagate the close event automatically
    if (!value) {
        // Dialog is trying to close - ignore unless it's from our buttons
        return
    }
    emit('update:open', value)
}
</script>

<template>
    <AlertDialog :open="open" @update:open="handleOpenChange">
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{{ title }}</AlertDialogTitle>
                <AlertDialogDescription>
                    {{ description }}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel @click="emit('cancel')">
                    {{ cancelText }}
                </AlertDialogCancel>
                <AlertDialogAction
                    @click="emit('confirm')"
                    :class="variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''"
                >
                    {{ confirmText }}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
