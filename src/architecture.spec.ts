import { describe, expect, expectTypeOf, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import type {
  ConfirmExtractionRequest,
  CreateTransactionRequest,
  UpdateTransactionRequest,
} from '@/api/generated/model'

const sourceRoot = join(process.cwd(), 'src')

describe('frontend architecture boundaries', () => {
  it('components and views do not import raw HTTP transports or call fetch directly', () => {
    const violations = sourceFiles(['components', 'views'])
      .flatMap((file) => {
        const text = readFileSync(file, 'utf8')
        const relativePath = relative(process.cwd(), file)
        const importsRawTransport = /from ['"](@\/lib\/api|axios)['"]/.test(text)
        const callsFetch = /\bfetch\s*\(/.test(text)
        return [
          importsRawTransport ? `${relativePath} imports a raw HTTP transport` : null,
          callsFetch ? `${relativePath} calls fetch()` : null,
        ].filter(Boolean)
      })

    expect(violations).toEqual([])
  })

  it('generated API code does not depend upward on app state or UI layers', () => {
    const violations = sourceFiles(['api/generated'])
      .flatMap((file) => {
        const text = readFileSync(file, 'utf8')
        const relativePath = relative(process.cwd(), file)
        return [
          /from ['"]@\/stores\//.test(text) ? `${relativePath} imports stores` : null,
          /from ['"]@\/views\//.test(text) ? `${relativePath} imports views` : null,
          /from ['"]@\/components\//.test(text) ? `${relativePath} imports components` : null,
        ].filter(Boolean)
      })

    expect(violations).toEqual([])
  })

  it('active production stores do not carry numeric receipt money mutation contracts', () => {
    const inboxStore = join(sourceRoot, 'stores', 'inbox.ts')
    expect(() => statSync(inboxStore)).toThrow()
  })

  it('active feature code does not cast generated response.data into handwritten transport mirrors', () => {
    const violations = sourceFiles(['stores', 'components', 'composables'])
      .flatMap((file) => {
        const text = readFileSync(file, 'utf8')
        const relativePath = relative(process.cwd(), file)
        return [...text.matchAll(/\bresponse\.data\s+as\s+([A-Za-z_$][\w$]*)/g)]
          .map((match) => `${relativePath} casts response.data as ${match[1]}`)
      })

    expect(violations).toEqual([])
  })

  it('generated monetary mutation contracts remain decimal-string owned', () => {
    expectTypeOf<CreateTransactionRequest['amount']>().toEqualTypeOf<string>()
    expectTypeOf<CreateTransactionRequest['fxRate']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<UpdateTransactionRequest['amount']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<UpdateTransactionRequest['fxRate']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<ConfirmExtractionRequest['amount']>().toEqualTypeOf<string>()
    expectTypeOf<ConfirmExtractionRequest['fxRate']>().toEqualTypeOf<string | undefined>()
  })
})

function sourceFiles(relativeDirs: string[]): string[] {
  return relativeDirs.flatMap((dir) => walk(join(sourceRoot, dir)))
    .filter((file) => /\.(ts|vue)$/.test(file) && !/\.spec\.ts$/.test(file))
}

function walk(path: string): string[] {
  const stat = statSync(path)
  if (stat.isFile()) return [path]
  return readdirSync(path).flatMap((entry) => walk(join(path, entry)))
}
