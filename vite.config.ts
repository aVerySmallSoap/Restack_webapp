import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import path from 'path';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig({
    server: {
        host: true,
        port: 5174,
        strictPort: true,
        hmr: {
            clientPort: 443,
            port: 5174,
            host: "dev.restack.bar",
        },
    },
    plugins: [
        laravel({
            input: ['resources/js/app.ts', 'resources/css/app.css'],
            ssr: 'resources/js/ssr.ts',
            refresh: true,
        }),
        tailwindcss(),
        vue({
            template: {
                transformAssetUrls: {
                    base: null,
                    includeAbsolute: false,
                },
            },
        }),
        vueDevTools({
            appendTo: 'app.ts',
        }),
        Icons({
            autoInstall: true, // optional: auto-installs icon sets
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
});
