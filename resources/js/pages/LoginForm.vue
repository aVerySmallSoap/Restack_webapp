<template>
  <div class="min-h-screen flex items-center justify-center">
    <Card class="w-full max-w-md p-6">
      <form class="space-y-6">
        <CardTitle class="text-2xl font-semibold text-center">
          Sign In
        </CardTitle>

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

        <div class="flex items-center justify-between">
          <label class="inline-flex items-center space-x-2 text-sm">
            <Checkbox v-model="remember" />
            <span>Remember me</span>
          </label>
          <Link href="/forgot-password" class="text-sm hover:underline text-blue-600">
            Forgot password?
          </Link>
        </div>

        <Link href="/dashboard" as="button" class="w-full">
          <Button type="button" class="w-full">
            Log In
          </Button>
        </Link>

        <p class="text-center text-sm mt-4">
          Don’t have an account?
          <Link href="/reg" class="text-blue-600 hover:underline">Register</Link>
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
import Input    from '@/components/ui/input/Input.vue'
import Checkbox from '@/components/ui/checkbox/Checkbox.vue'
import Button   from '@/components/ui/button/Button.vue'

import { ref } from 'vue'
import { Link } from '@inertiajs/vue3'

const email    = ref('')
const password = ref('')
const remember = ref(false)
</script>
