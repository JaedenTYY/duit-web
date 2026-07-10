import { defineConfig } from 'orval'

export default defineConfig({
  duitApi: {
    input: 'openapi.json',
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
