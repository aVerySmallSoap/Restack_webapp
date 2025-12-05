<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import Plotly from 'plotly.js-dist-min';

const props = defineProps<{
    data: any[];
    layout?: any;
    config?: any;
}>();

const chartContainer = ref<HTMLElement | null>(null);
const isInitialized = ref(false);

const drawChart = async () => {
    if (!chartContainer.value) return;

    const defaultConfig = {
        responsive: true,
        displayModeBar: false,
        ...props.config
    };

    try {
        if (!isInitialized.value) {
            // First render: use newPlot
            await Plotly.newPlot(
                chartContainer.value,
                props.data,
                props.layout || {},
                defaultConfig
            );
            isInitialized.value = true;
        } else {
            // Subsequent updates: use react for better performance
            await Plotly.react(
                chartContainer.value,
                props.data,
                props.layout || {},
                defaultConfig
            );
        }
    } catch (error) {
        console.error('Plotly rendering error:', error);
    }
};

watch(() => props.data, async () => {
    await nextTick();
    drawChart();
}, { deep: true });

watch(() => props.layout, async () => {
    await nextTick();
    drawChart();
}, { deep: true });

onMounted(async () => {
    await nextTick();
    drawChart();
    window.addEventListener('resize', drawChart);
});

onUnmounted(() => {
    window.removeEventListener('resize', drawChart);
    if (chartContainer.value) {
        Plotly.purge(chartContainer.value);
    }
});
</script>

<template>
    <div ref="chartContainer" class="w-full h-full min-h-[300px]"></div>
</template>
