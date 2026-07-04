<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { useRouter } from 'vue-router'

const router = useRouter()
const heroTitle = ref<HTMLElement | null>(null)
const heroSubtitle = ref<HTMLElement | null>(null)
const ctaButton = ref<HTMLElement | null>(null)
const features = ref<HTMLElement | null>(null)
const appPreview = ref<HTMLElement | null>(null)

// For spotlight hover effect
const featuresRef = ref<HTMLElement | null>(null)

const handleMouseMove = (e: MouseEvent) => {
  if (!featuresRef.value) return
  const cards = featuresRef.value.querySelectorAll('.feature-card')
  for (const card of cards) {
    const rect = (card as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ;(card as HTMLElement).style.setProperty('--mouse-x', `${x}px`)
    ;(card as HTMLElement).style.setProperty('--mouse-y', `${y}px`)
  }
}

onMounted(() => {
  const ctx = gsap.context(() => {
    // Entrance animations
    const tl = gsap.timeline()

    tl.from(heroTitle.value, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    })
    .from(heroSubtitle.value, {
      y: 20,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out'
    }, "-=0.4")
    .from(ctaButton.value, {
      scale: 0.9,
      opacity: 0,
      duration: 0.5,
      ease: 'back.out(1.5)'
    }, "-=0.3")
    .from(appPreview.value, {
      y: 60,
      opacity: 0,
      rotationX: 15,
      duration: 1,
      ease: 'power3.out'
    }, "-=0.2")
    .from(features.value?.children || [], {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    }, "-=0.6")

    // Continuous floating animation for the app preview
    gsap.to(appPreview.value, {
      y: "-=15",
      duration: 3,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    })
  })

  window.addEventListener('mousemove', handleMouseMove)

  return () => {
    ctx.revert()
    window.removeEventListener('mousemove', handleMouseMove)
  }
})

const navigateToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 overflow-hidden relative selection:bg-blue-500/20 selection:text-blue-900" style="font-family: Helvetica, Arial, sans-serif;">
    <!-- Ambient Background Gradients -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />
    <div class="absolute top-1/4 -right-64 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] opacity-40 pointer-events-none" />
    <div class="absolute -bottom-64 -left-64 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] opacity-40 pointer-events-none" />

    <!-- Navigation -->
    <nav class="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto md:px-12">
      <div class="text-2xl font-bold tracking-tight text-slate-900">
        duit<span class="text-blue-500">.</span>
      </div>
      <button
        class="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        @click="navigateToLogin"
      >
        Log In
      </button>
    </nav>

    <!-- Hero Section -->
    <main class="relative z-10 flex flex-col items-center justify-center pt-20 pb-32 px-6 text-center">
      <div class="max-w-4xl mx-auto perspective-1000">
        <h1
          ref="heroTitle"
          class="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.1] text-slate-900"
        >
          Automated Receipt<br>Tracking.
        </h1>
        
        <p
          ref="heroSubtitle"
          class="text-lg md:text-2xl text-slate-500 mb-12 max-w-2xl mx-auto font-medium"
        >
          Upload receipts to instantly extract, categorize, and prepare them for LHDN tax season.
        </p>

        <div
          ref="ctaButton"
          class="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            class="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden group"
            @click="navigateToLogin"
          >
            <span class="relative z-10 flex items-center gap-2">
              Get Started
              <svg
                class="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              /></svg>
            </span>
            <div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
          </button>
        </div>
      </div>

      <!-- App Preview -->
      <div
        ref="appPreview"
        class="mt-24 relative w-full max-w-5xl mx-auto rounded-[2.5rem] border border-slate-200 bg-white/80 backdrop-blur-3xl shadow-2xl shadow-slate-200/50 overflow-hidden transform-gpu"
      >
        <div class="h-12 border-b border-slate-100 flex items-center px-6 gap-2 bg-white">
          <div class="w-3 h-3 rounded-full bg-red-400" />
          <div class="w-3 h-3 rounded-full bg-yellow-400" />
          <div class="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div class="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 bg-slate-50/50">
          <div class="col-span-1 space-y-4">
            <div class="h-8 w-32 bg-slate-200 rounded-lg" />
            <div class="h-24 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-2xl border border-blue-100 relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-slow" />
            </div>
            <div class="h-24 bg-white border border-slate-100 rounded-2xl shadow-sm" />
            <div class="h-24 bg-white border border-slate-100 rounded-2xl shadow-sm" />
          </div>
          <div class="col-span-1 md:col-span-2 bg-white rounded-3xl border border-slate-100 p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-500">
              <svg
                class="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              /></svg>
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-2">
              Categorized
            </h3>
            <p class="text-slate-500">
              Receipts are automatically organized for tax reporting.
            </p>
          </div>
        </div>
        
        <div class="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-20 pointer-events-none" />
      </div>

      <!-- Features Grid -->
      <div
        id="features-container"
        ref="featuresRef"
        class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 px-6"
      >
        <div
          ref="features"
          class="contents"
        >
          <div class="feature-card relative text-left p-8 rounded-[2rem] bg-white border border-slate-100 backdrop-blur-xl overflow-hidden group shadow-lg shadow-slate-200/40">
            <div class="feature-spotlight" />
            <div class="relative z-10">
              <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  class="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 12h10M7 8h10M7 16h5"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-3">
                Data Extraction
              </h3>
              <p class="text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                Extract merchant, items, amount, and taxes instantly from photos.
              </p>
            </div>
          </div>
          
          <div class="feature-card relative text-left p-8 rounded-[2rem] bg-white border border-slate-100 backdrop-blur-xl overflow-hidden group shadow-lg shadow-slate-200/40">
            <div class="feature-spotlight" />
            <div class="relative z-10">
              <div class="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  class="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-3">
                LHDN Tax Ready
              </h3>
              <p class="text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                Tag receipts for Business or Personal to prepare your Borang BE / C.
              </p>
            </div>
          </div>
          
          <div class="feature-card relative text-left p-8 rounded-[2rem] bg-white border border-slate-100 backdrop-blur-xl overflow-hidden group shadow-lg shadow-slate-200/40">
            <div class="feature-spotlight" />
            <div class="relative z-10">
              <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#25D366] mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  class="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-3">
                WhatsApp Bot
              </h3>
              <p class="text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                Forward receipts to our WhatsApp bot for automatic processing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- Footer -->
    <footer class="border-t border-slate-200 py-12 text-center text-slate-500 relative z-10">
      <p>© 2026 Project Duit.</p>
    </footer>
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

/* Hover Spotlight Effect */
.feature-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  padding: 1px;
  background: radial-gradient(
    800px circle at var(--mouse-x) var(--mouse-y),
    rgba(255, 255, 255, 0.1),
    transparent 40%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.feature-spotlight {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: radial-gradient(
    600px circle at var(--mouse-x) var(--mouse-y),
    rgba(59, 130, 246, 0.1),
    transparent 40%
  );
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.feature-card:hover .feature-spotlight {
  opacity: 1;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 1.5s infinite;
}

.animate-shimmer-slow {
  animation: shimmer 3s infinite linear;
}
</style>
