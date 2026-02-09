<script setup lang="ts">
import { ref } from 'vue'
import Navigation from '@/components/custom/Navigation.vue'
import UsersTable from '@/components/custom/Users/UsersTable.vue'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-vue-next'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from '@inertiajs/vue3'
import { useToastFeedback } from '@/composables/useToastFeedback'

interface User {
    id: string
    name: string
    email: string
    is_admin: boolean
    created_at: string
}

const props = defineProps<{
    users: User[]
}>()

const feedback = useToastFeedback()
const isDialogOpen = ref(false)

const form = useForm({
    name: '',
    email: '',
    password: '',
    is_admin: false,
})

const handleCreate = () => {
    form.post(route('users.store'), {
        preserveScroll: true,
        onSuccess: () => {
            feedback.crud.created('User')
            isDialogOpen.value = false
            form.reset()
        },
        onError: (errors) => {
            feedback.showError('Failed to create user')
            console.error(errors)
        }
    })
}

const handleDialogOpenChange = (open: boolean) => {
    isDialogOpen.value = open
    if (!open) {
        form.reset()
    }
}
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="font-bold px-2 text-4xl">Users</h1>
                    <div class="p-1.5">
                        <span>Manage user accounts and permissions.</span>
                    </div>
                </div>

                <Dialog :open="isDialogOpen" @update:open="handleDialogOpenChange">
                    <DialogTrigger as-child>
                        <Button>
                            <UserPlus class="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent class="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>
                                Add a new user account to the system.
                            </DialogDescription>
                        </DialogHeader>

                        <div class="grid gap-4 py-4">
                            <div class="grid gap-2">
                                <Label for="name">Name</Label>
                                <Input
                                    id="name"
                                    v-model="form.name"
                                    placeholder="John Doe"
                                    :disabled="form.processing"
                                />
                                <span v-if="form.errors.name" class="text-sm text-destructive">
                                    {{ form.errors.name }}
                                </span>
                            </div>

                            <div class="grid gap-2">
                                <Label for="email">Email</Label>
                                <Input
                                    id="email"
                                    v-model="form.email"
                                    type="email"
                                    placeholder="john@example.com"
                                    :disabled="form.processing"
                                />
                                <span v-if="form.errors.email" class="text-sm text-destructive">
                                    {{ form.errors.email }}
                                </span>
                            </div>

                            <div class="grid gap-2">
                                <Label for="password">Password</Label>
                                <Input
                                    id="password"
                                    v-model="form.password"
                                    type="password"
                                    placeholder="••••••••"
                                    :disabled="form.processing"
                                />
                                <span v-if="form.errors.password" class="text-sm text-destructive">
                                    {{ form.errors.password }}
                                </span>
                            </div>

                            <div class="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="is_admin"
                                    v-model="form.is_admin"
                                    class="h-4 w-4 rounded border-gray-300"
                                    :disabled="form.processing"
                                />
                                <Label for="is_admin" class="text-sm font-normal cursor-pointer">
                                    Administrator privileges
                                </Label>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                @click="handleDialogOpenChange(false)"
                                :disabled="form.processing"
                            >
                                Cancel
                            </Button>
                            <Button @click="handleCreate" :disabled="form.processing">
                                {{ form.processing ? 'Creating...' : 'Create User' }}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <UsersTable :data="props.users" />
        </div>
    </Navigation>
</template>
