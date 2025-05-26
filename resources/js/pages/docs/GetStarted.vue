<template>
    <Navigation>
        <div class="flexflex-1 flex-col gap-4 p-4 pt-0">
            <section>
                <h1 class="mb-2 text-4xl font-bold">Get Started</h1>
                <p>Welcome to the Restack Web Application!</p>
                <p>This guide will help you get up and running with the Restack web app quickly.</p>
                <h2 class="mt-4 mb-1 text-xl font-semibold">Prerequisites</h2>
                <ul class="ml-6 list-disc">
                    <li>Node.js (v14 or higher recommended)</li>
                    <li>npm or yarn</li>
                    <li>PHP (for backend integration, if required)</li>
                    <li>Git</li>
                    <li>Composer</li>
                    <li>Python</li>
                </ul>
                <h2 class="mt-4 mb-1 text-xl font-semibold">Installation</h2>
                <ol class="ml-6 list-decimal">
                    <li>
                        <strong>Clone the repository:</strong>
                        <CodeBlock>git clone https://github.com/aVerySmallSoap/Restack_webapp.git cd Restack_webapp</CodeBlock>
                    </li>
                    <li>
                        <strong>Install dependencies:</strong>
                        <CodeBlock>npm install & composer install</CodeBlock>
                    </li>
                    <li>
                        <strong>Configuration:</strong>
                        <ul class="ml-6 list-disc">
                            <li>
                                Copy the example environment file and adjust settings as needed:
                                <CodeBlock>cp .env.example .env</CodeBlock>
                            </li>
                            <li>Update <code>.env</code> with your environment variables.</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Run the application:</strong>
                        <CodeBlock>npm run serve # or yarn serve </CodeBlock>
                    </li>
                    <li>
                        <strong>Access the app:</strong>
                        <ul class="ml-6 list-disc">
                            <li>Open your browser and go to <code>http://localhost:8080</code></li>
                        </ul>
                    </li>
                </ol>
                <h2 class="mt-4 mb-1 text-xl font-semibold">Additional Resources</h2>
                <ul class="ml-6 list-disc">
                    <li>See the <strong>Introduction</strong> page for more about the project.</li>
                    <li>See the <strong>Changelog</strong> page for recent updates.</li>
                </ul>
            </section>
        </div>
    </Navigation>
</template>

<script setup lang="ts">
import CodeBlock from '@/components/custom/CodeBlock.vue';
import Navigation from '@/components/custom/Navigation.vue';
</script>
