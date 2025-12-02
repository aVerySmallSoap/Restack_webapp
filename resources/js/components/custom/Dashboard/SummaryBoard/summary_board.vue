<script setup lang="ts">

import { ref } from 'vue';
import ScannerStats from '@/components/custom/Dashboard/SummaryBoard/ScannerStats.vue';

const API_ENDPOINT = "http://localhost:25565/test/poll/data/summary/30"
const live_data = ref()

fetch(API_ENDPOINT, {
    method: "GET"
}).then( res => res.json()).then( data => {
    console.log(data)
    live_data.value = data
})

setInterval(async () => {
    fetch(API_ENDPOINT, {
        method: "GET"
    }).then( res => res.json()).then( data => {
        console.log(data)
        live_data.value = data
    })
}, 30_000)

</script>

<template>
    <div>
        Test data for summary:
        <div>
            {{live_data}}
        </div>
        <ScannerStats :data="live_data"/>
    </div>
</template>

<style scoped>

</style>
