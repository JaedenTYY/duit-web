import { nextTick, onMounted, onUnmounted, type Ref } from 'vue'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

interface DialogFocusOptions {
  onEscape: () => void
  canClose?: () => boolean
}

export function useDialogFocusManagement(
  dialogRef: Ref<HTMLElement | null>,
  options: DialogFocusOptions,
): void {
  const previouslyFocused = typeof document === 'undefined'
    ? null
    : document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

  function focusableElements(): HTMLElement[] {
    const dialog = dialogRef.value
    if (!dialog) return []
    return [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
      .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true')
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (options.canClose?.() === false) return
      event.preventDefault()
      options.onEscape()
      return
    }

    if (event.key !== 'Tab') return
    const focusable = focusableElements()
    if (!focusable.length) {
      event.preventDefault()
      dialogRef.value?.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  onMounted(async () => {
    await nextTick()
    const focusTarget = focusableElements()[0] ?? dialogRef.value
    focusTarget?.focus()
    dialogRef.value?.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    dialogRef.value?.removeEventListener('keydown', handleKeydown)
    previouslyFocused?.focus()
  })
}
