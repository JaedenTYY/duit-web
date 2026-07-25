import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig(async (env) => {
  const baseConfig = typeof viteConfig === 'function' ? await viteConfig(env) : viteConfig
  return mergeConfig(
    baseConfig,
    {
    test: {
      environment: 'jsdom',
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**', '**/e2e/**'],
      passWithNoTests: false,
    },
    },
  )
})
