import { defineConfig } from 'orval'

export default defineConfig({
  duitApi: {
    input: 'openapi.json',
    output: {
      mode: 'tags-split',
      target: 'src/api/generated/duit-api.ts',
      schemas: 'src/api/generated/model',
      client: 'vue-query',
      httpClient: 'axios',
      headers: true,
      // Orval 8 tags-split appends to existing controller files unless the
      // generated directory is cleaned first. The mutator lives outside this
      // directory, so this cannot delete handwritten source.
      clean: true,
      override: {
        mutator: {
          path: 'src/lib/orvalMutator.ts',
          name: 'orvalMutator',
        },
      },
    },
  },
})
