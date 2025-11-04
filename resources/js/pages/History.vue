<script setup lang="ts">
import type { TableReport } from '@/components/custom/History/TableReport';
import { columns } from '@/components/custom/History/TableReport';

import HistoryTable from '@/components/custom/History/HistoryTable.vue';
import Navigation from '@/components/custom/Navigation.vue';
import { onMounted, ref } from 'vue';

/* const data = ref<TableReport[]>([]); */

const data = ref<TableReport[]>([
    {
        id: '1',
        date: '2024-05-01 10:30:00',
        scanner: 'Scanner A',
        type: 'Basic Scan',
        target: '192.168.1.1',
    },
    {
        id: '2',
        date: '2024-05-01 11:00:00',
        scanner: 'Scanner B',
        type: 'Basic Scan',
        target: 'example.com',
    },
    {
        id: '3',
        date: '2024-05-02 09:15:00',
        scanner: 'Scanner A',
        type: 'Full Scan',
        target: 'app.example.com',
    },
    {
        id: '4',
        date: '2024-05-02 14:45:00',
        scanner: 'Scanner C',
        type: 'Full Scan',
        target: 'Internal Server',
    },
    {
        id: '5',
        date: '2024-05-03 08:00:00',
        scanner: 'Scanner B',
        type: 'Full Scan',
        target: '10.0.0.5',
    },
    {
        id: '6',
        date: '2024-05-03 16:20:00',
        scanner: 'Scanner A',
        type: 'Full Scan',
        target: '192.168.1.10',
    },
    {
        id: '7',
        date: '2024-05-04 09:00:00',
        scanner: 'Scanner D',
        type: 'Basic Scan',
        target: 'test.example.com',
    },
    {
        id: '8',
        date: '2024-05-04 11:30:00',
        scanner: 'Scanner C',
        type: 'Basic Scan',
        target: 'portal.example.com',
    },
    {
        id: '9',
        date: '2024-05-05 10:00:00',
        scanner: 'Scanner B',
        type: 'Basic Scan',
        target: 'Database Server',
    },
    {
        id: '10',
        date: '2024-05-05 13:00:00',
        scanner: 'Scanner A',
        type: 'Basic Scan',
        target: '172.16.0.1',
    },
    {
        id: '1',
        date: '2024-05-01 10:30:00',
        scanner: 'Scanner A',
        type: 'Basic Scan',
        target: '192.168.1.1',
    },
    {
        id: '7',
        date: '2024-05-04 09:00:00',
        scanner: 'Scanner D',
        type: 'Full Scan',
        target: 'test.example.com',
    },

    {
        id: '2',
        date: '2024-05-01 11:00:00',
        scanner: 'Scanner B',
        type: 'Full Scan',
        target: 'example.com',
    },
    {
        id: '3',
        date: '2024-05-02 09:15:00',
        scanner: 'Scanner A',
        type: 'Full Scan',
        target: 'app.example.com',
    },
    {
        id: '4',
        date: '2024-05-02 14:45:00',
        scanner: 'Scanner C',
        type: 'Full Scan',
        target: 'Internal Server',
    },
    {
        id: '5',
        date: '2024-05-03 08:00:00',
        scanner: 'Scanner B',
        type: 'Full Scan',
        target: '10.0.0.5',
    },
    {
        id: '6',
        date: '2024-05-03 16:20:00',
        scanner: 'Scanner A',
        type: 'Full Scan',
        target: '192.168.1.10',
    },
    {
        id: '9',
        date: '2024-05-05 10:00:00',
        scanner: 'Scanner B',
        type: 'Full Scan',
        target: 'Database Server',
    },

    {
        id: '8',
        date: '2024-05-04 11:30:00',
        scanner: 'Scanner C',
        type: 'Basic Scan',
        target: 'portal.example.com',
    },
]);

async function getData(): Promise<TableReport[]> {
    const reportItems = await fetch('http://localhost:25565/api/v1/history/fetch')
        .then((res) => res.json())
        .then((res) => {
            const list = [];
            for (let i = 0; i < res.length; i++) {
                const temp = res[i];
                list[i] = {
                    id: temp['id'],
                    date: temp['date'],
                    scanner: temp['scanner'],
                    type: temp['type'],
                    target: temp['target'],
                };
            }
            return list;
        });
    return reportItems;
}

onMounted(async () => {
    data.value = await getData();
});
</script>

<template>
    <Navigation>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div><h1 class="px-2 text-4xl font-bold">History</h1></div>
            <div><HistoryTable :columns="columns" :data="data" /></div>
        </div>
    </Navigation>
</template>
