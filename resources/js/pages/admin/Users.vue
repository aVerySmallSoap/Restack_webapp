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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/InputError.vue';
import { MoreHorizontal, LoaderCircle, Trash2, Plus } from 'lucide-vue-next';

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

const form = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
});

const submitCreate = () => {
    form.post(route('register'), {
        onSuccess: () => {
            form.reset();
            isDialogOpen.value = false;
        },
        onFinish: () => form.reset('password', 'password_confirmation'),
    });
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
                    <p class="text-muted-foreground">Manage access for your team members.</p>
                </div>

                <Dialog v-model:open="isDialogOpen">
                    <DialogTrigger as-child>
                        <Button>
                            <Plus class="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent class="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>
                                Create a new account for a team member.
                            </DialogDescription>
                        </DialogHeader>

                        <form @submit.prevent="submitCreate" class="grid gap-4 py-4">
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
                            <div class="grid gap-2">
                                <Label for="password">Password</Label>
                                <Input id="password" type="password" v-model="form.password" required />
                                <InputError :message="form.errors.password" />
                            </div>
                            <div class="grid gap-2">
                                <Label for="confirm">Confirm Password</Label>
                                <Input id="confirm" type="password" v-model="form.password_confirmation" required />
                                <InputError :message="form.errors.password_confirmation" />
                            </div>

                            <div class="flex justify-end pt-4">
                                <Button type="submit" :disabled="form.processing">
                                    <LoaderCircle v-if="form.processing" class="mr-2 h-4 w-4 animate-spin" />
                                    Create Account
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
                            <TableHead>Email</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead class="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow v-for="user in users" :key="user.id">
                            <TableCell class="font-medium">
                                {{ user.name }}
                                <span v-if="user.is_admin" class="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Admin</span>
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
