<script setup lang="ts">
import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'
const page = usePage()
const vulnerabilities = computed(() => page.props.vulnerabilities)

console.log(typeof vulnerabilities.value)
const only = JSON.parse(vulnerabilities.value);
</script>

<template>
    <div class="container">
        <h1>I am rendered using Laravel and Vue!</h1>
        <div class="content">
            {{only}}
        </div>
    </div>

</template>

<style scoped>
.container{
    display: flex;
    flex-direction: column;
}

.container h1{
    text-align: center;
    font-size: 48px;
}
</style>
