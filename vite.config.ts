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
        host: '127.0.0.1', // local-only; change to true if you want LAN access
        port: 5174,
        strictPort: true,

        // For local dev, don't force HMR to use your remote domain or port 443.
        hmr: {
            host: '127.0.0.1',
            port: 5174,
            protocol: 'ws',
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
            // This should generally be a file path, not just 'app.ts'
            // If you intended to append to your entry file, use the full path:
            appendTo: 'resources/js/app.ts',
        }),
        Icons({
            autoInstall: true,
        }),
    ],

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
});
