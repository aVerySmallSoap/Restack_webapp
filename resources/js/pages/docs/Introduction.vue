<template>
    <Navigation>
        <div class="flexflex-1 flex-col gap-4 p-4 pt-0">
        <section>
            <h1 class="mb-2 text-4xl font-bold">Introduction</h1>
            <p>
                Restack Web Application is the frontend interface for Restack, designed to provide a seamless user experience for managing and interacting with Restack's features.
            </p>
            <h2 class="text-xl font-semibold mt-4 mb-1">Key Features</h2>
            <ul class="list-disc ml-6">
                <li>Modern UI built with Vue.js</li>
                <li>Integration with backend services (PHP)</li>
                <li>Modular and scalable architecture</li>
                <li>Responsive design for both desktop and mobile devices</li>
            </ul>
            <h2 class="text-xl font-semibold mt-4 mb-1">Technologies Used</h2>
            <ul class="list-disc ml-6">
                <li><strong>Vue.js</strong> (main frontend framework)</li>
                <li><strong>TypeScript</strong> (for type safety)</li>
                <li><strong>PHP</strong> (backend integration)</li>
                <li><strong>CSS</strong> (styling)</li>
                <li>Additional libraries and tools as required</li>
            </ul>
            <h2 class="text-xl font-semibold mt-4 mb-1">Project Structure</h2>
            <ul class="list-disc ml-6">
                <li><code>/src</code> - Main source code (components, views, store, etc.)</li>
                <li><code>/public</code> - Static assets</li>
                <li><code>/backend</code> - PHP backend code (if applicable)</li>
                <li><code>/docs</code> - Project documentation</li>
            </ul>
            <h2 class="text-xl font-semibold mt-4 mb-1">Contributing</h2>
            <p>
                We welcome contributions! Please see our contributing guidelines or open an issue if you have suggestions or bug reports.
            </p>
            <h2 class="text-xl font-semibold mt-4 mb-1">License</h2>
            <p>
                This project is licensed under the MIT License.
            </p>
        </section>
        </div>
    </Navigation>
</template>

<script setup lang="ts">
import Navigation from '@/components/custom/Navigation.vue';
</script>
