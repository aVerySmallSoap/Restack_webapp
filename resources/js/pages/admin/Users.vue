<script setup lang="ts">
import Navigation from '@/components/custom/Navigation.vue';
import { Head, useForm, router } from '@inertiajs/vue3';
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/InputError.vue';
import { MoreHorizontal, LoaderCircle, Trash2, Plus, Pencil, ShieldCheck } from 'lucide-vue-next';

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
    is_admin: boolean;
}

defineProps<{
    users: User[];
}>();

const isDialogOpen = ref(false);
const isEditing = ref(false);
const editingUserId = ref<number | null>(null);

const form = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    is_admin: false,
});

const openCreateDialog = () => {
    isEditing.value = false;
    form.reset();
    form.clearErrors();
    isDialogOpen.value = true;
};

const openEditDialog = (user: User) => {
    isEditing.value = true;
    editingUserId.value = user.id;
    form.clearErrors();

    // Populate form but leave passwords empty
    form.name = user.name;
    form.email = user.email;
    form.is_admin = !!user.is_admin;
    form.password = '';
    form.password_confirmation = '';

    isDialogOpen.value = true;
};

const submit = () => {
    if (isEditing.value && editingUserId.value) {
        form.put(route('admin.users.update', editingUserId.value), {
            onSuccess: () => {
                form.reset();
                isDialogOpen.value = false;
            },
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    } else {
        form.post(route('admin.users.store'), {
            onSuccess: () => {
                form.reset();
                isDialogOpen.value = false;
            },
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    }
};

const deleteUser = (user: User) => {
    if (confirm('Are you sure you want to delete this user?')) {
        router.delete(route('admin.users.destroy', user.id));
    }
};
</script>

<template>
    <Navigation>
        <Head title="User Management" />

        <div class="p-6 space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold tracking-tight">User Management</h1>
                    <p class="text-muted-foreground">Manage access and roles for your team.</p>
                </div>

                <Dialog v-model:open="isDialogOpen">
                    <DialogTrigger as-child>
                        <Button @click="openCreateDialog">
                            <Plus class="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent class="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{{ isEditing ? 'Edit User' : 'Add New User' }}</DialogTitle>
                            <DialogDescription>
                                {{ isEditing ? 'Update user details and permissions.' : 'Create a new account for a team member.' }}
                            </DialogDescription>
                        </DialogHeader>

                        <form @submit.prevent="submit" class="grid gap-4 py-4">
                            <div class="grid gap-2">
                                <Label for="name">Name</Label>
                                <Input id="name" v-model="form.name" placeholder="Full Name" required />
                                <InputError :message="form.errors.name" />
                            </div>

                            <div class="grid gap-2">
                                <Label for="email">Email</Label>
                                <Input id="email" type="email" v-model="form.email" placeholder="email@example.com" required />
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

                            <div class="flex justify-end pt-4">
                                <Button type="submit" :disabled="form.processing">
                                    <LoaderCircle v-if="form.processing" class="mr-2 h-4 w-4 animate-spin" />
                                    {{ isEditing ? 'Save Changes' : 'Create Account' }}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div class="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead class="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow v-for="user in users" :key="user.id">
                            <TableCell class="font-medium">{{ user.name }}</TableCell>
                            <TableCell>
                                <div v-if="user.is_admin" class="flex items-center text-xs font-medium text-primary">
                                    <ShieldCheck class="w-3 h-3 mr-1" />
                                    Admin
                                </div>
                                <div v-else class="text-xs text-muted-foreground">User</div>
                            </TableCell>
                            <TableCell>{{ user.email }}</TableCell>
                            <TableCell>{{ new Date(user.created_at).toLocaleDateString() }}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger as-child>
                                        <Button variant="ghost" class="h-8 w-8 p-0">
                                            <span class="sr-only">Open menu</span>
                                            <MoreHorizontal class="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem @click="openEditDialog(user)">
                                            <Pencil class="mr-2 h-4 w-4" />
                                            Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem @click="deleteUser(user)" class="text-red-600">
                                            <Trash2 class="mr-2 h-4 w-4" />
                                            Delete User
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    </Navigation>
</template>
