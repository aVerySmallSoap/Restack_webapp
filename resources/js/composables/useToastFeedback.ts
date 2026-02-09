import { toast } from 'vue-sonner'

export function useToastFeedback() {
    const showSuccess = (message: string) => {
        toast.success(message)
    }

    const showError = (message: string, error?: any) => {
        console.error(error)
        toast.error(message)
    }

    const showInfo = (message: string) => {
        toast.info(message)
    }

    const showWarning = (message: string) => {
        toast.warning(message)
    }

    const showLoading = (message: string) => {
        return toast.loading(message)
    }

    // Helpers for common CRUD operations
    const crud = {
        created: (resource: string) => showSuccess(`${resource} created successfully`),
        updated: (resource: string) => showSuccess(`${resource} updated successfully`),
        deleted: (resource: string) => showSuccess(`${resource} deleted successfully`),
        createError: (resource: string) => showError(`Failed to create ${resource}`),
        updateError: (resource: string) => showError(`Failed to update ${resource}`),
        deleteError: (resource: string) => showError(`Failed to delete ${resource}`),
    }

    return {
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showLoading,
        crud
    }
}
