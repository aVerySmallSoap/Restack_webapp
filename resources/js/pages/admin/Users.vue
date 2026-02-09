<script setup lang="ts">
import  { ref, computed } from 'vue'
import { Head, useForm, router } from '@inertiajs/vue3'
import Navigation from '@/components/custom/Navigation.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import InputError from '@/components/InputError.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import ConfirmDialog from '@/components/custom/ConfirmDialog.vue'

// Props
const props = defineProps<{
    users: any[]
}>()

const feedback = useToastFeedback()
// FIXED: Added handleOpenChange to the destructured returns
const { isOpen: confirmOpen, options: confirmOptions, confirm, handleConfirm: onConfirmDelete, handleCancel: onCancelDelete, handleOpenChange } = useConfirmDialog()

const isDialogOpen = ref(false)
const isEditing = ref(false)
const editingUserId = ref<number | null>(null)

const form = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    is_admin: false
})

const openCreateDialog = () => {
    form.reset()
    form.clearErrors()
    isEditing.value = false
    editingUserId.value = null
    isDialogOpen.value = true
}

const openEditDialog = (user: any) => {
    form.name = user.name
    form.email = user.email
    form.password = ''
    form.password_confirmation = ''
    form.is_admin = user.is_admin
    form.clearErrors()
    isEditing.value = true
    editingUserId.value = user.id
    isDialogOpen.value = true
}

const handleSubmit = () => {
    if (isEditing.value && editingUserId.value) {
        form.put(route('admin.users.update', editingUserId.value), {
            onSuccess: () => {
                feedback.crud.updated('User')
                isDialogOpen.value = false
                form.reset()
            },
            onError: () => {
                feedback.crud.updateError('user')
            }
        })
    } else {
        form.post(route('admin.users.store'), {
            onSuccess: () => {
                feedback.crud.created('User')
                isDialogOpen.value = false
                form.reset()
            },
            onError: () => {
                feedback.crud.createError('user')
            }
        })
    }
}

const handleDelete = async (userId: number, userName: string) => {
    console.log('🔴 Delete clicked for user:', userId, userName)

    const confirmed = await confirm({
        title: 'Delete User',
        description: `Are you sure you want to delete ${userName}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'destructive'
    })

    console.log('🔴 Confirm result:', confirmed)

    if (confirmed) {
        console.log('🔴 Proceeding with delete...')
        router.delete(route('admin.users.destroy', userId), {
            onSuccess: () => {
                console.log('🔴 Delete success')
                feedback.crud.deleted('User')
            },
            onError: () => {
                console.log('🔴 Delete error')
                feedback.crud.deleteError('user')
            }
        })
    } else {
        console.log('🔴 Delete cancelled')
    }
}
</script>

<template>
    <Head title="Manage Users" />

    <Navigation>
        <div class="flex flex-1 flex-col gap-6 p-4 pt-0">
            <div class="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
                <div class="space-y-1">
                    <h1 class="font-bold px-2 text-4xl">Manage Users</h1>
                    <p class="px-2 text-muted-foreground">
                        Create and manage user accounts
                    </p>
                </div>

                <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
                    <DialogTrigger as-child>
                        <Button @click="openCreateDialog">
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent class="w-[95vw] max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{{ isEditing ? 'Edit User' : 'Create New User' }}</DialogTitle>
                            <DialogDescription>
                                {{ isEditing ? 'Update user information' : 'Add a new user to the system' }}
                            </DialogDescription>
                        </DialogHeader>

                        <form @submit.prevent="handleSubmit">
                            <div class="grid gap-4 py-4">
                                <div class="grid gap-2">
                                    <Label for="name">Name</Label>
                                    <Input id="name" v-model="form.name" required />
                                    <InputError :message="form.errors.name" />
                                </div>

                                <div class="grid gap-2">
                                    <Label for="email">Email</Label>
                                    <Input id="email" type="email" v-model="form.email" required />
                                    <InputError :message="form.errors.email" />
                                </div>

                                <div class="flex items-center space-x-2 py-2">
                                    <Checkbox id="is_admin" :checked="form.is_admin" @update:checked="val => form.is_admin = val" />
                                    <Label for="is_admin" class="font-normal cursor-pointer">
                                        Grant Admin Privileges
                                    </Label>
                                </div>

                                <div class="grid gap-2">
                                    <Label for="password">{{ isEditing ? 'New Password (Optional)' : 'Password' }}</Label>
                                    <Input id="password" type="password" v-model="form.password" :required="!isEditing" />
                                    <InputError :message="form.errors.password" />
                                </div>

                                <div class="grid gap-2">
                                    <Label for="confirm">Confirm Password</Label>
                                    <Input id="confirm" type="password" v-model="form.password_confirmation" :required="!isEditing && form.password.length > 0" />
                                    <InputError :message="form.errors.password_confirmation" />
                                </div>
                            </div>

                            <DialogFooter class="flex-col sm:flex-row gap-2">
                                <Button type="button" variant="outline" @click="isDialogOpen = false" class="w-full sm:w-auto">
                                    Cancel
                                </Button>
                                <Button type="submit" :disabled="form.processing" class="w-full sm:w-auto">
                                    {{ isEditing ? 'Update User' : 'Create User' }}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <!-- Users Table -->
            <div class="rounded-md border">
                <table class="w-full">
                    <thead>
                    <tr class="border-b bg-muted/50">
                        <th class="p-4 text-left">Name</th>
                        <th class="p-4 text-left">Email</th>
                        <th class="p-4 text-left">Role</th>
                        <th class="p-4 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="user in users" :key="user.id" class="border-b">
                        <td class="p-4">{{ user.name }}</td>
                        <td class="p-4">{{ user.email }}</td>
                        <td class="p-4">
                                <span v-if="user.is_admin" class="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">
                                    Admin
                                </span>
                            <span v-else class="px-2 py-1 text-xs rounded bg-muted">
                                    User
                                </span>
                        </td>
                        <td class="p-4 text-right space-x-2">
                            <Button size="sm" variant="outline" @click="openEditDialog(user)">
                                Edit
                            </Button>
                            <Button size="sm" variant="destructive" @click="handleDelete(user.id, user.name)">
                                Delete
                            </Button>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- FIXED: Changed @update:open to use handleOpenChange -->
        <ConfirmDialog
            :open="confirmOpen"
            :title="confirmOptions.title"
            :description="confirmOptions.description"
            :confirm-text="confirmOptions.confirmText"
            :cancel-text="confirmOptions.cancelText"
            :variant="confirmOptions.variant"
            @update:open="handleOpenChange"
            @confirm="onConfirmDelete"
            @cancel="onCancelDelete"
        />
    </Navigation>
</template>
