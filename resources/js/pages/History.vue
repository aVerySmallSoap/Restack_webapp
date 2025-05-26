<script setup lang="ts">
import type { TableReport } from '@/components/custom/History/TableReport';
import { columns } from '@/components/custom/History/TableReport';

import Navigation from '@/components/custom/Navigation.vue';
import HistoryTable from '@/components/custom/History/HistoryTable.vue';
import { onMounted, ref } from 'vue';

const data = ref<TableReport[]>([])

async function getData(): Promise<TableReport[]>{

    const reportItems = await fetch("http://localhost:5000/v1/history/load")
        .then(res => res.json())
        .then(res => {
            const list = []
            for (let i = 0; i < res.length; i++) {
                const temp = res[i]
                list[i] = {
                    id: temp["id"],
                    date: temp["date"],
                    scanner: temp["scanner"],
                    type: temp["type"],
                    target: temp["target"],
                };
            }
           return list;
        });
    console.log(reportItems);
    return reportItems;
}

onMounted(async () => {
    data.value = await getData()
    console.log(data.value);
})

</script>

<template>
    <Navigation>
        <div class="container py-10 mx-auto">
            <HistoryTable :columns="columns" :data="data" />
        </div>
    </Navigation>
</template>
