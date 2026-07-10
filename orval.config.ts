import { defineConfig } from 'orval'

export default defineConfig({
  duitApi: {
    input: {
      target: 'http://127.0.0.1:8080/v3/api-docs',
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/generated/duit-api.ts',
      schemas: 'src/api/generated/model',
      client: 'vue-query',
      prettier: true,
      override: {
        mutator: {
          path: 'src/lib/orvalMutator.ts',
          name: 'orvalMutator',
        },
      },
    },
  },
})
