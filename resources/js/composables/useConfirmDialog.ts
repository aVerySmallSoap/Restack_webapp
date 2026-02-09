import { ref } from 'vue'

export interface ConfirmOptions {
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
}

export function useConfirmDialog() {
    const isOpen = ref(false)
    const options = ref<ConfirmOptions>({
        title: 'Are you sure?',
        description: 'This action cannot be undone.',
        confirmText: 'Continue',
        cancelText: 'Cancel',
        variant: 'default'
    })

    let resolvePromise: ((value: boolean) => void) | null = null

    const confirm = (customOptions?: ConfirmOptions): Promise<boolean> => {

        options.value = {
            ...options.value,
            ...customOptions
        }

        isOpen.value = true

        return new Promise((resolve) => {
            resolvePromise = resolve
        })
    }

    const handleConfirm = () => {
        isOpen.value = false
        resolvePromise?.(true)
        resolvePromise = null // Clean up
    }

    const handleCancel = () => {
        isOpen.value = false
        resolvePromise?.(false)
        resolvePromise = null // Clean up
    }

    // Handle dialog close from clicking outside or ESC key
    const handleOpenChange = (value: boolean) => {
        isOpen.value = value
        if (!value && resolvePromise) {
            // If dialog is closed without explicit confirm/cancel, treat as cancel
            resolvePromise(false)
            resolvePromise = null
        }
    }

    return {
        isOpen,
        options,
        confirm,
        handleConfirm,
        handleCancel,
        handleOpenChange // Export this new method
    }
}
