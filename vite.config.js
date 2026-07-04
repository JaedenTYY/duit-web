import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
export default defineConfig({
    plugins: [
        vue(),
        tsconfigPaths()
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8080',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api/, ''); },
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});
