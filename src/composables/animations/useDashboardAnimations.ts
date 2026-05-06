import { gsap } from 'gsap'
import { onUnmounted } from 'vue'

export function useDashboardAnimations() {
  let ctx: gsap.Context | null = null

  const animateStatsIn = (elements: HTMLElement[]) => {
    ctx = gsap.context(() => {
      gsap.from(elements, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
      })
    })
  }

  const animateSpendCounter = (el: HTMLElement, from: number, to: number) => {
    const counter = { val: from }
    ctx = gsap.context(() => {
      gsap.to(counter, {
        val: to,
        duration: 1.5,
        ease: 'power3.inOut',
        onUpdate: () => {
          el.innerText = `RM ${counter.val.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        },
      })
    })
  }

  const animateInsightCard = (el: HTMLElement) => {
    ctx = gsap.context(() => {
      gsap.from(el, {
        scale: 0.95,
        opacity: 0,
        duration: 0.8,
        ease: 'back.out(1.7)',
      })
    })
  }

  onUnmounted(() => {
    if (ctx) ctx.revert()
  })

  return {
    animateStatsIn,
    animateSpendCounter,
    animateInsightCard,
  }
}
