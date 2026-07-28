import { computed, onScopeDispose, ref } from 'vue'

export function useRetryAfterCooldown() {
  const deadlineMs = ref<number | null>(null)
  const remainingSeconds = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  const active = computed(() => remainingSeconds.value > 0)
  const accessibleMessage = computed(() =>
    active.value
      ? `Please wait ${remainingSeconds.value} second${remainingSeconds.value === 1 ? '' : 's'} before trying again.`
      : ''
  )

  function start(seconds: number | null): void {
    clear()
    if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return
    const boundedSeconds = Math.min(Math.ceil(seconds), MAX_COOLDOWN_SECONDS)
    deadlineMs.value = Date.now() + boundedSeconds * 1000
    update()
    timer = setInterval(update, 250)
  }

  function update(): void {
    if (deadlineMs.value === null) return
    remainingSeconds.value = Math.max(
      0,
      Math.ceil((deadlineMs.value - Date.now()) / 1000)
    )
    if (remainingSeconds.value === 0) clear()
  }

  function clear(): void {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
    deadlineMs.value = null
    remainingSeconds.value = 0
  }

  onScopeDispose(clear)

  return {
    active,
    remainingSeconds,
    accessibleMessage,
    start,
    clear,
  }
}

const MAX_COOLDOWN_SECONDS = 24 * 60 * 60
