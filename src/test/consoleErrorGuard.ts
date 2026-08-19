import { afterEach, beforeEach, expect, vi } from 'vitest'

type ExpectedConsoleError = string | RegExp | ((args: unknown[]) => boolean)

let consoleErrorSpy: ReturnType<typeof vi.spyOn> | null = null
let expectedErrors: ExpectedConsoleError[] = []

export function allowExpectedConsoleError(expected: ExpectedConsoleError) {
  expectedErrors.push(expected)
}

beforeEach(() => {
  expectedErrors = []
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  const calls = consoleErrorSpy?.mock.calls ?? []
  const unexpected = calls.filter((args: unknown[]) => !expectedErrors.some((expected) => matches(expected, args)))

  consoleErrorSpy?.mockRestore()
  consoleErrorSpy = null
  expectedErrors = []

  expect(unexpected.map(formatConsoleError)).toEqual([])
})

function matches(expected: ExpectedConsoleError, args: unknown[]): boolean {
  if (typeof expected === 'function') return expected(args)
  const message = formatConsoleError(args)
  return typeof expected === 'string' ? message.includes(expected) : expected.test(message)
}

function formatConsoleError(args: unknown[]): string {
  return args.map((arg) => {
    if (arg instanceof Error) return `${arg.name}: ${arg.message}`
    if (typeof arg === 'string') return arg
    try {
      return JSON.stringify(arg)
    } catch {
      return String(arg)
    }
  }).join(' ')
}
