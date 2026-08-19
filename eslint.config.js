import eslint from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'

export default defineConfigWithVueTs(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'src/api/generated/**',
    ],
  },
  eslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      // Keep the pre-upgrade lint contract; tightening these rules is a
      // separate source-code cleanup rather than a dependency-security change.
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    files: ['src/components/**/*.{js,ts,vue}', 'src/views/**/*.{js,ts,vue}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          {
            name: 'axios',
            message: 'Components and views must use feature stores/composables, not raw HTTP clients.',
          },
          {
            name: '@/lib/api',
            message: 'Components and views must use feature stores/composables, not the shared API transport.',
          },
        ],
      }],
      'no-restricted-globals': ['error', {
        name: 'fetch',
        message: 'Components and views must not issue raw HTTP requests.',
      }],
    },
  },
)
