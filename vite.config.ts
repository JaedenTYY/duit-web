import { copyFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolveApiBaseUrl } from './src/lib/apiBaseUrl'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  resolveApiBaseUrl(env.VITE_API_BASE_URL, mode === 'production')

  return {
    plugins: [
      vue(),
      tsconfigPaths(),
      {
        name: 'copy-azure-static-web-apps-config',
        apply: 'build',
        closeBundle() {
          copyFileSync(
            path.resolve(__dirname, 'staticwebapp.config.json'),
            path.resolve(__dirname, 'dist/staticwebapp.config.json')
          )
        },
      },
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
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
