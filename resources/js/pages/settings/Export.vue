<template>
    <Navigation>
        <div class="p-4">
            <div>
                <h2 class="font-bold text-2xl">Export Settings</h2>
            </div>
        <Card class="mt-10 max-w-md">
            <CardHeader>
                <CardTitle>Export File Type</CardTitle>
                <CardDescription> Choose how you want scan results to be exported. </CardDescription>
            </CardHeader>
            <CardContent>
                <FormField label="Export Format">
                    <RadioGroup default-value="option-one">
                        <div class="flex items-center space-x-2">
                            <RadioGroupItem id="option-one" value="option-one" />
                            <Label for="option-one">CSV (.csv)</Label>
                        </div>
                        <div class="flex items-center space-x-2">
                            <RadioGroupItem id="option-two" value="option-two" />
                            <Label for="option-two">JSON (.json)</Label>
                        </div>
                    </RadioGroup>
                </FormField>
            </CardContent>
            <CardFooter>
                <Button @click="saveSettings">Save</Button>
            </CardFooter>
        </Card>
        </div>
    </Navigation>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
} from '@/components/ui/card'
import { FormField } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import Navigation from '@/components/custom/Navigation.vue'

const exportFormat = ref<'csv' | 'json'>('csv')

function saveSettings() {

    alert(`Export format saved as: ${exportFormat.value.toUpperCase()}`)
}
</script>
