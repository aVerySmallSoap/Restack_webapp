<script setup lang="ts">
import Navigation from '@/components/custom/Navigation.vue'
import HistoryTable from '@/components/custom/History/HistoryTable.vue'
import { ScanHistory } from '@/lib/restack/restack.types'

// Receive real data from Laravel
const props = defineProps<{
    history: ScanHistory[]
}>()
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div>
                <h1 class="font-bold px-2 text-4xl">Scan History</h1>
                <div class="p-1.5">
                    <span>Review, filter, and search all past scan reports.</span>
                </div>
            </div>

            <HistoryTable :data="props.history" />

        </div>
    </Navigation>
</template>
