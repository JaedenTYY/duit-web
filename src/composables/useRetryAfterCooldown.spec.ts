import { effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRetryAfterCooldown } from './useRetryAfterCooldown'

describe('useRetryAfterCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-28T08:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down and safely enables retry at the deadline', () => {
    const scope = effectScope()
    const cooldown = scope.run(useRetryAfterCooldown)!
    cooldown.start(3)

    expect(cooldown.active.value).toBe(true)
    expect(cooldown.remainingSeconds.value).toBe(3)
    vi.advanceTimersByTime(2_000)
    expect(cooldown.remainingSeconds.value).toBe(1)
    vi.advanceTimersByTime(1_000)
    expect(cooldown.active.value).toBe(false)
    scope.stop()
  })

  it('replaces the previous timer and cleans it up on scope disposal', () => {
    const scope = effectScope()
    const cooldown = scope.run(useRetryAfterCooldown)!
    cooldown.start(20)
    cooldown.start(2)
    expect(vi.getTimerCount()).toBe(1)
    scope.stop()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('ignores invalid retry windows', () => {
    const scope = effectScope()
    const cooldown = scope.run(useRetryAfterCooldown)!
    cooldown.start(Number.NaN)
    expect(cooldown.active.value).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    scope.stop()
  })
})
