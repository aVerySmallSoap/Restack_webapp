<template>
  <div class="min-h-screen flex items-center justify-center">
    <Card class="w-full max-w-md p-6">
      <form class="space-y-6">
        <CardTitle class="text-2xl font-semibold text-center">
          Create an Account
        </CardTitle>

        <Input
          v-model="name"
          type="text"
          label="Name"
          placeholder="John Doe"
          required
        />

        <Input
          v-model="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          required
        />

        <Input
          v-model="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          required
        />

        <Input
          v-model="password_confirmation"
          type="password"
          label="Confirm Password"
          placeholder="••••••••"
          required
        />

        <Link href="/signin" as="button" class="w-full">
          <Button type="button" class="w-full">
            Register
          </Button>
        </Link>

        <p class="text-center text-sm mt-4">
          Already have an account?
          <Link href="/signin" class="text-blue-600 hover:underline">Log in</Link>
        </p>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import {
  Card,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card/'
import Input from '@/components/ui/input/Input.vue'
import Button from '@/components/ui/button/Button.vue'
import { ref } from 'vue'
import { Link } from '@inertiajs/vue3'

const name = ref('')
const email = ref('')
const password = ref('')
const password_confirmation = ref('')
</script>
