<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { useRouter } from 'vue-router'
import FeatureCard from '@/components/shared/FeatureCard.vue'
import FriendlyAvatar from '@/components/shared/FriendlyAvatar.vue'

const router = useRouter()
const hero = ref<HTMLElement | null>(null)
const preview = ref<HTMLElement | null>(null)

onMounted(() => {
  const ctx = gsap.context(() => {
    gsap.from(hero.value?.children || [], {
      y: 24,
      opacity: 0,
      duration: 0.65,
      stagger: 0.1,
      ease: 'power3.out'
    })
    gsap.from(preview.value, {
      y: 28,
      opacity: 0,
      scale: 0.98,
      duration: 0.75,
      ease: 'power3.out',
      delay: 0.15
    })
  })

  return () => ctx.revert()
})

const navigateToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen overflow-hidden bg-[#f6f9ff] text-slate-950 selection:bg-blue-500/20 selection:text-blue-900">
    <nav class="fixed inset-x-0 top-0 z-40 border-b border-white/70 bg-white/85 backdrop-blur-2xl">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <button
          type="button"
          class="text-2xl font-black tracking-tight text-slate-950"
          @click="$router.push('/')"
        >
          duit<span class="text-blue-600">.</span>
        </button>
        <button
          class="min-h-10 rounded-2xl bg-slate-950 px-5 py-2 text-sm font-black text-white transition hover:bg-blue-700"
          @click="navigateToLogin"
        >
          Login
        </button>
      </div>
    </nav>

    <main>
      <section class="hero-clean relative px-5 pb-16 pt-28 sm:px-8 lg:px-12">
        <div
          ref="hero"
          class="relative z-10 mx-auto flex min-h-[72vh] max-w-5xl flex-col items-center justify-center text-center"
        >
          <div class="mb-5">
            <FriendlyAvatar
              tone="blue"
              size="md"
            />
          </div>
          <p class="rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700 shadow-sm">
            AI finance companion for Southeast Asian users
          </p>
          <h1 class="mt-6 max-w-4xl text-[3.35rem] font-black leading-[0.95] tracking-tight text-slate-950 sm:text-7xl lg:text-8xl">
            Meet Duit, your AI spending companion
          </h1>
          <p class="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600 sm:text-xl">
            Capture receipts, import bank statements, sync eReceipts, understand spending patterns, detect anomalies, and split bills with friends.
          </p>
          <div class="mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-2">
            <button
              class="inline-flex min-h-13 items-center justify-center rounded-2xl bg-blue-600 px-7 py-4 text-base font-black text-white shadow-xl shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.98]"
              @click="navigateToLogin"
            >
              Get Started
            </button>
            <a
              href="#product-preview"
              class="inline-flex min-h-13 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 px-7 py-4 text-base font-black text-slate-800 shadow-sm transition hover:bg-white"
            >
              View Demo
            </a>
          </div>
        </div>
      </section>

      <section
        id="product-preview"
        class="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-12"
      >
        <div class="mb-8 text-center">
          <p class="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Product preview
          </p>
          <h2 class="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Spending signals, shown clearly
          </h2>
          <p class="mx-auto mt-3 max-w-2xl text-base font-semibold leading-7 text-slate-600">
            Duit is designed as a finance intelligence layer. It captures data, helps users review it, and explains what changed.
          </p>
        </div>

        <div
          ref="preview"
          class="grid gap-5 lg:grid-cols-[1fr_1.1fr]"
        >
          <div class="space-y-4">
            <div class="floating-finance-card rotate-left">
              <span>Nasi Lemak House</span>
              <strong>RM 18.40</strong>
              <small>Food & Dining suggested</small>
            </div>
            <div class="floating-finance-card rotate-right ml-auto">
              <span>Gmail eReceipt</span>
              <strong>RM 74.90</strong>
              <small>Ready to review</small>
            </div>
            <div class="floating-finance-card rotate-left">
              <span>Anomaly check</span>
              <strong>Risk 82%</strong>
              <small>Confirm or dismiss</small>
            </div>
          </div>

          <div class="phone-shell">
            <div class="phone-top">
              <span>duit.</span>
              <small>July</small>
            </div>
            <div class="phone-balance">
              <small>This month</small>
              <strong>RM 1,284.50</strong>
              <span>8 transactions captured</span>
            </div>
            <div class="phone-grid">
              <div class="phone-tile bg-blue-50">
                <span class="bg-blue-500" />
                <strong>Magic Inbox</strong>
                <small>3 import sources</small>
              </div>
              <div class="phone-tile bg-emerald-50">
                <span class="bg-emerald-500" />
                <strong>AI Insight</strong>
                <small>Dining up 12%</small>
              </div>
              <div class="phone-tile bg-amber-50">
                <span class="bg-amber-500" />
                <strong>Split Bill</strong>
                <small>Guest link ready</small>
              </div>
              <div class="phone-tile bg-violet-50">
                <span class="bg-violet-500" />
                <strong>Category</strong>
                <small>Semantic match</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-12">
        <div class="mb-8 text-center">
          <p class="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Feature system
          </p>
          <h2 class="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Comprehensive enough for a real FYP demo
          </h2>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FeatureCard
            title="Smart Receipt Capture"
            description="Upload receipt images and review extracted merchant, amount, date, item, and category details before saving."
            tone="blue"
          >
            <template #icon>01</template>
          </FeatureCard>
          <FeatureCard
            title="Semantic Categorisation"
            description="Merchant context helps Duit suggest sensible categories, so users do not need to organise every record manually."
            tone="mint"
          >
            <template #icon>02</template>
          </FeatureCard>
          <FeatureCard
            title="AI Weekly Insights"
            description="Weekly summaries explain changes, spending risks, and practical recommendations in plain language."
            tone="purple"
          >
            <template #icon>03</template>
          </FeatureCard>
          <FeatureCard
            title="Anomaly Alerts"
            description="Unusual transactions are shown with a risk score, explanation, and confirm or dismiss action."
            tone="peach"
          >
            <template #icon>04</template>
          </FeatureCard>
          <FeatureCard
            title="Magic Inbox"
            description="Receipt Upload, Gmail eReceipts, and Bank Statement Import live together as one central import hub."
            tone="blue"
          >
            <template #icon>05</template>
          </FeatureCard>
          <FeatureCard
            title="Smart Bill Split"
            description="Users scan a receipt, create a split, share a guest link, and manually mark settlement status."
            tone="mint"
          >
            <template #icon>06</template>
          </FeatureCard>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-12">
        <div class="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="story-card bg-blue-600 text-white">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-blue-100">User journey</p>
            <h2>From messy spending to useful signals</h2>
            <p>New users can understand the entire Duit loop: capture, review, categorise, learn, respond, and split.</p>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="mini-step">1. Capture receipts and eReceipts</div>
            <div class="mini-step">2. Import bank statement history</div>
            <div class="mini-step">3. Review categories and anomalies</div>
            <div class="mini-step">4. Split shared bills simply</div>
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-12">
        <div class="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/60 sm:p-10">
          <div class="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] text-blue-300">
                PDPA and compliance framing
              </p>
              <h2 class="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                Designed as a finance intelligence layer, not a payment processor.
              </h2>
              <p class="mt-4 text-base font-medium leading-7 text-slate-300">
                Duit supports the dissertation framing around Malaysia PDPA and MAS TRM principles by keeping the product focused on user-controlled spending records, review, and insight generation.
              </p>
            </div>
            <div class="grid gap-3">
              <div class="compliance-chip">
                <strong>User-provided data</strong>
                <span>Receipts, statements, and eReceipts are imported for review before transaction creation.</span>
              </div>
              <div class="compliance-chip">
                <strong>No payment rails</strong>
                <span>Duit displays user-provided payment QR assets but does not generate, forward, validate, or process payments.</span>
              </div>
              <div class="compliance-chip">
                <strong>Clear user action</strong>
                <span>Imports, anomaly feedback, and bill-settlement status rely on explicit user confirmation.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.hero-clean {
  background:
    linear-gradient(135deg, rgba(219, 234, 254, 0.92), rgba(236, 253, 245, 0.92) 52%, rgba(255, 247, 237, 0.95)),
    linear-gradient(180deg, #f6f9ff 0%, #eef7ff 100%);
}

.floating-finance-card {
  width: min(22rem, 100%);
  border-radius: 1.75rem;
  border: 1px solid rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.86);
  padding: 1.2rem;
  box-shadow: 0 22px 70px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(18px);
}

.floating-finance-card span,
.floating-finance-card strong,
.floating-finance-card small {
  display: block;
}

.floating-finance-card span {
  color: #475569;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.floating-finance-card strong {
  margin-top: 0.55rem;
  color: #0f172a;
  font-size: 1.8rem;
  font-weight: 900;
}

.floating-finance-card small {
  margin-top: 0.2rem;
  color: #64748b;
  font-weight: 700;
}

.rotate-left {
  transform: rotate(-2deg);
}

.rotate-right {
  transform: rotate(2deg);
}

.phone-shell {
  border-radius: 2.5rem;
  border: 10px solid rgba(15, 23, 42, 0.94);
  background: #ffffff;
  padding: 1.2rem;
  box-shadow: 0 28px 90px rgba(37, 99, 235, 0.22);
}

.phone-top,
.phone-grid {
  display: grid;
  gap: 1rem;
}

.phone-top {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.phone-top span {
  font-size: 1.3rem;
  font-weight: 900;
}

.phone-top small {
  color: #64748b;
  font-weight: 800;
}

.phone-balance {
  margin-top: 1rem;
  border-radius: 1.5rem;
  background: linear-gradient(135deg, #2563eb, #0f172a);
  color: #fff;
  padding: 1.2rem;
}

.phone-balance small,
.phone-balance span {
  color: #bfdbfe;
  font-weight: 800;
}

.phone-balance strong {
  display: block;
  margin: 0.35rem 0;
  font-size: 2rem;
  line-height: 1;
}

.phone-grid {
  margin-top: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.phone-tile {
  border-radius: 1.35rem;
  padding: 1rem;
}

.phone-tile span {
  display: block;
  height: 0.7rem;
  width: 0.7rem;
  border-radius: 999px;
}

.phone-tile strong {
  display: block;
  margin-top: 0.8rem;
  color: #0f172a;
  font-weight: 900;
}

.phone-tile small {
  color: #64748b;
  font-weight: 700;
}

.story-card {
  min-height: 18rem;
  border-radius: 2rem;
  padding: 1.5rem;
  box-shadow: 0 20px 70px rgba(15, 23, 42, 0.12);
}

.story-card h2 {
  margin-top: 1rem;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.05;
}

.story-card p:last-child {
  margin-top: 1rem;
  font-weight: 700;
  line-height: 1.7;
  opacity: 0.88;
}

.mini-step {
  min-height: 8rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.86);
  padding: 1.2rem;
  color: #0f172a;
  font-weight: 900;
  box-shadow: 0 14px 45px rgba(15, 23, 42, 0.07);
}

.compliance-chip {
  border-radius: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
  padding: 1.2rem;
}

.compliance-chip strong,
.compliance-chip span {
  display: block;
}

.compliance-chip strong {
  color: #ffffff;
  font-weight: 900;
}

.compliance-chip span {
  margin-top: 0.35rem;
  color: #cbd5e1;
  font-weight: 600;
  line-height: 1.6;
}

@media (max-width: 767px) {
  .phone-grid {
    grid-template-columns: 1fr;
  }
}
</style>
