<script setup lang="ts">
import { ref } from 'vue';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const reportItems = ref();

fetch("http://localhost:5000/v1/history/load")
    .then(res => res.json())
    .then(res => {
        const list = []
        let iter = 1;
        for (let i = 0; i < res.length; i++) {
            const temp = res[i]
            console.log(temp);
            iter++;
            list[i] = {
                id: iter,
                date: temp["date"],
                scanner: temp["scanner"],
                target: temp["target"],
                type: temp["type"]
            };
        }
        reportItems.value = list;
    });

</script>

<template>
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Scanner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target URL</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            <TableRow v-for="item in reportItems" :key="item">
                <TableCell>{{item.date}}</TableCell>
                <TableCell>{{item.scanner}}</TableCell>
                <TableCell>{{item.type}}</TableCell>
                <TableCell>{{item.target}}</TableCell>
            </TableRow>
        </TableBody>
    </Table>
</template>
