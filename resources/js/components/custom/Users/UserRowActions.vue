<script setup lang="ts">
import { ref } from 'vue'
import { MoreHorizontal, Edit, Trash2, Key, Shield, ShieldOff } from 'lucide-vue-next'
import { router, useForm } from '@inertiajs/vue3'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import ConfirmDialog from '@/components/custom/ConfirmDialog.vue'

interface UserData {
    id: string
    name: string
    email: string
    is_admin: boolean
    created_at: string
}

const props = defineProps<{
    rowData: UserData
}>()

const feedback = useToastFeedback()
const { isOpen, options, confirm, handleConfirm, handleCancel, handleOpenChange } = useConfirmDialog()

// Edit dialog state
const isEditDialogOpen = ref(false)
const editForm = useForm({
    name: props.rowData.name,
    email: props.rowData.email,
    is_admin: props.rowData.is_admin,
})

// Reset password dialog state
const isResetPasswordOpen = ref(false)
const passwordForm = useForm({
    password: '',
    password_confirmation: '',
})

// Handle edit user
const handleEdit = () => {
    isEditDialogOpen.value = true
    editForm.name = props.rowData.name
    editForm.email = props.rowData.email
    editForm.is_admin = props.rowData.is_admin
}

const submitEdit = () => {
    editForm.put(route('users.update', props.rowData.id), {
        preserveScroll: true,
        onSuccess: () => {
            feedback.crud.updated('User')
            isEditDialogOpen.value = false
        },
        onError: () => {
            feedback.crud.updateError('user')
        }
    })
}

// Handle toggle admin
const handleToggleAdmin = () => {
    router.put(
        route('users.toggle-admin', props.rowData.id),
        {},
        {
            preserveScroll: true,
            onSuccess: () => {
                feedback.showSuccess(
                    props.rowData.is_admin
                        ? 'Administrator privileges removed'
                        : 'Administrator privileges granted'
                )
            },
            onError: () => {
                feedback.showError('Failed to update user role')
            }
        }
    )
}

// Handle reset password
const handleResetPassword = () => {
    isResetPasswordOpen.value = true
    passwordForm.reset()
}

const submitResetPassword = () => {
    passwordForm.put(route('users.reset-password', props.rowData.id), {
        preserveScroll: true,
        onSuccess: () => {
            feedback.showSuccess('Password reset successfully')
            isResetPasswordOpen.value = false
            passwordForm.reset()
        },
        onError: () => {
            feedback.showError('Failed to reset password')
        }
    })
}

// Handle delete
async function handleDelete() {
    const confirmed = await confirm({
        title: 'Delete User',
        description: `Are you sure you want to delete ${props.rowData.name}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'destructive'
    })

    if (confirmed) {
        router.delete(route('users.destroy', props.rowData.id), {
            preserveScroll: true,
            onSuccess: () => {
                feedback.crud.deleted('User')
            },
            onError: () => {
                feedback.crud.deleteError('user')
            }
        })
    }
}
</script>

<template>
    <div>
        <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <Button variant="ghost" class="h-8 w-8 p-0">
                    <span class="sr-only">Open menu</span>
                    <MoreHorizontal class="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                <DropdownMenuItem @click="handleEdit">
                    <Edit class="mr-2 h-4 w-4" />
                    Edit User
                </DropdownMenuItem>

                <DropdownMenuItem @click="handleResetPassword">
                    <Key class="mr-2 h-4 w-4" />
                    Reset Password
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem @click="handleToggleAdmin">
                    <component :is="rowData.is_admin ? ShieldOff : Shield" class="mr-2 h-4 w-4" />
                    {{ rowData.is_admin ? 'Remove Admin' : 'Make Admin' }}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    @click="handleDelete"
                    class="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                    <Trash2 class="mr-2 h-4 w-4" />
                    Delete User
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <!-- Edit User Dialog -->
        <Dialog :open="isEditDialogOpen" @update:open="isEditDialogOpen = $event">
            <DialogContent class="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user information.
                    </DialogDescription>
                </DialogHeader>

                <div class="grid gap-4 py-4">
                    <div class="grid gap-2">
                        <Label for="edit-name">Name</Label>
                        <Input
                            id="edit-name"
                            v-model="editForm.name"
                            :disabled="editForm.processing"
                        />
                        <span v-if="editForm.errors.name" class="text-sm text-destructive">
                            {{ editForm.errors.name }}
                        </span>
                    </div>

                    <div class="grid gap-2">
                        <Label for="edit-email">Email</Label>
                        <Input
                            id="edit-email"
                            v-model="editForm.email"
                            type="email"
                            :disabled="editForm.processing"
                        />
                        <span v-if="editForm.errors.email" class="text-sm text-destructive">
                            {{ editForm.errors.email }}
                        </span>
                    </div>

                    <div class="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="edit-is_admin"
                            v-model="editForm.is_admin"
                            class="h-4 w-4 rounded border-gray-300"
                            :disabled="editForm.processing"
                        />
                        <Label for="edit-is_admin" class="text-sm font-normal cursor-pointer">
                            Administrator privileges
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        @click="isEditDialogOpen = false"
                        :disabled="editForm.processing"
                    >
                        Cancel
                    </Button>
                    <Button @click="submitEdit" :disabled="editForm.processing">
                        {{ editForm.processing ? 'Saving...' : 'Save Changes' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Reset Password Dialog -->
        <Dialog :open="isResetPasswordOpen" @update:open="isResetPasswordOpen = $event">
            <DialogContent class="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Set a new password for {{ rowData.name }}.
                    </DialogDescription>
                </DialogHeader>

                <div class="grid gap-4 py-4">
                    <div class="grid gap-2">
                        <Label for="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            v-model="passwordForm.password"
                            type="password"
                            :disabled="passwordForm.processing"
                        />
                        <span v-if="passwordForm.errors.password" class="text-sm text-destructive">
                            {{ passwordForm.errors.password }}
                        </span>
                    </div>

                    <div class="grid gap-2">
                        <Label for="confirm-password">Confirm Password</Label>
                        <Input
                            id="confirm-password"
                            v-model="passwordForm.password_confirmation"
                            type="password"
                            :disabled="passwordForm.processing"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        @click="isResetPasswordOpen = false"
                        :disabled="passwordForm.processing"
                    >
                        Cancel
                    </Button>
                    <Button @click="submitResetPassword" :disabled="passwordForm.processing">
                        {{ passwordForm.processing ? 'Resetting...' : 'Reset Password' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Confirm Delete Dialog -->
        <ConfirmDialog
            :open="isOpen"
            :title="options.title"
            :description="options.description"
            :confirm-text="options.confirmText"
            :cancel-text="options.cancelText"
            :variant="options.variant"
            @update:open="handleOpenChange"
            @confirm="handleConfirm"
            @cancel="handleCancel"
        />
    </div>
</template>
