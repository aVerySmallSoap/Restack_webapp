<script setup lang="ts">

import { Button } from '@/components/ui/button';
import { Eye, Download, Trash } from 'lucide-vue-next'

defineProps<{
    TableReport: {
        id: string
    }
}>();

</script>

<template>
    <div>
        <a :href="'http://localhost:5000/v1/report/'+TableReport.id" target="_blank">
            <Button variant="ghost" size="icon">
                <Eye/>
            </Button>
        </a>
        <Button variant="ghost" size="icon">
            <Download/>
        </Button>
        <Button variant="ghost" size="icon">
            <Trash style="color: red"/>
        </Button>
    </div>


</template>
