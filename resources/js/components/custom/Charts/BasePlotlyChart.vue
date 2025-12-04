<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import Plotly from 'plotly.js-dist-min';

const props = defineProps<{
    data: any[];
    layout?: any;
    config?: any;
}>();

const chartContainer = ref<HTMLElement | null>(null);

// Fix: Ensure this is a standard function, not top-level await
const drawChart = async () => {
    if (chartContainer.value) {
        await Plotly.react(chartContainer.value, props.data, props.layout || {}, {
            responsive: true,
            displayModeBar: false,
            ...props.config
        });
    }
};

watch(() => props.data, drawChart, { deep: true });
watch(() => props.layout, drawChart, { deep: true });

onMounted(async () => {
    await nextTick();
    // Initialize chart only after DOM is ready
    drawChart();
    window.addEventListener('resize', drawChart);
});

onUnmounted(() => {
    window.removeEventListener('resize', drawChart);
});
</script>

<template>
    <div ref="chartContainer" class="w-full h-full min-h-[300px]"></div>
</template>
