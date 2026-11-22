<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="landing">
    <!-- Navigation -->
    <header class="landing-nav">
      <RouterLink to="/" class="wordmark" aria-label="Duit home">
        du<span class="wordmark-i" aria-hidden="true">ı</span>t
      </RouterLink>
      <nav>
        <RouterLink to="/login" class="landing-nav-link">Sign in</RouterLink>
        <RouterLink to="/register" class="landing-nav-primary"
          >Get started</RouterLink
        >
      </nav>
    </header>

    <main>
      <!-- Hero Section -->
      <section class="landing-hero">
        <div class="landing-hero-copy">
          <span class="landing-kicker">Spending, understood.</span>
          <h1>See where your money goes, without the spreadsheet.</h1>
          <p class="landing-lead">
            A friendly AI spending companion for everyday money in Southeast
            Asia. Snap receipts, spot unusual changes, and split bills without
            forcing friends to create an account.
          </p>

          <div
            style="
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
              align-items: center;
            "
          >
            <button
              type="button"
              class="landing-hero-btn"
              @click="router.push('/register')"
            >
              Get started with Duit <span>→</span>
            </button>
            <button
              type="button"
              class="landing-hero-secondary-btn"
              @click="router.push('/login')"
            >
              Sign in
            </button>
          </div>

          <small class="landing-note">
            Built for young Southeast Asians · Gaji-to-gaji pay cycles · No
            spreadsheets needed.
          </small>
        </div>

        <!-- Realistic App Preview Matching Foundations -->
        <div class="landing-preview" aria-label="Preview of Duit mobile home">
          <div class="preview-top">
            <div>
              <strong>November</strong>
              <small>25 Oct – 24 Nov · day 9 of 31</small>
            </div>
            <span class="preview-bell" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a2 2 0 0 0 3.4 0"
                />
              </svg>
              <span class="preview-dot" />
            </span>
          </div>

          <div class="preview-hero">
            <span class="preview-eyebrow">Spent so far</span>
            <div class="preview-amount num">
              <span>RM</span> 1,386<small>.40</small>
            </div>
            <p class="preview-sub">RM 96 more than this point last cycle</p>

            <!-- Segmented Category Bar -->
            <div
              class="preview-bar"
              role="img"
              aria-label="Spending breakdown: Food 30%, Shopping 28%, Groceries 16%, Transport 12%, Other 14%"
            >
              <div style="flex: 30; background: #c9772e" />
              <div style="flex: 28; background: #a0566e" />
              <div style="flex: 16; background: #4c8466" />
              <div style="flex: 12; background: #3f6c98" />
              <div style="flex: 14; background: #b5afa4" />
            </div>
            <div class="preview-legend num">
              <span><strong>Food</strong> 30%</span>
              <span><strong>Shopping</strong> 28%</span>
              <span><strong>Groceries</strong> 16%</span>
              <span><strong>Transport</strong> 12%</span>
            </div>
          </div>

          <!-- To Review Queue Preview -->
          <div class="preview-section">
            <div class="preview-sec-head">
              <strong>To review</strong>
              <span class="preview-tag num">2</span>
            </div>
            <div class="preview-grp">
              <div class="preview-row">
                <div
                  class="preview-av"
                  style="background: #f9e6dc; color: #a3421a"
                >
                  !
                </div>
                <div class="preview-rt">
                  <b>Shopee · RM 389.00</b>
                  <span>Unusual for you</span>
                </div>
                <span class="preview-link">Review</span>
              </div>
              <div class="preview-row">
                <div
                  class="preview-av"
                  style="background: #e2eeea; color: #0a4540"
                >
                  HK
                </div>
                <div class="preview-rt">
                  <b>Hakka Kitchen split</b>
                  <span>2 people waiting</span>
                </div>
                <span class="preview-link">Open</span>
              </div>
            </div>
          </div>

          <!-- Mobile Nav Preview -->
          <div class="preview-nav">
            <span class="active">Home</span>
            <span>Activity</span>
            <b class="preview-add-fab">＋</b>
            <span>Split</span>
            <span>You</span>
          </div>
        </div>
      </section>

      <!-- 3 Value Proposition Steps -->
      <section class="landing-steps">
        <div class="landing-steps-inner">
          <h2>Everyday money, made clearer</h2>
          <div class="landing-steps-grid">
            <article>
              <span>01</span>
              <h3>Snap & Sort</h3>
              <p>
                Snap a receipt or import a bank statement. Duit suggests
                categories and stores every detail cleanly.
              </p>
            </article>

            <article>
              <span>02</span>
              <h3>Spot Changes</h3>
              <p>
                Online anomaly detection notices when a purchase is unusual for
                your patterns. You always decide what's right.
              </p>
            </article>

            <article>
              <span>03</span>
              <h3>Split Fairly</h3>
              <p>
                Split a dinner receipt. Friends join directly in their browser
                without an account and claim their dishes.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="landing-footer-inner">
        <div class="wordmark" aria-label="Duit">
          du<span class="wordmark-i" aria-hidden="true">ı</span>t
        </div>
        <small
          >Agentic AI-driven spending intelligence for Southeast Asia.</small
        >
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100dvh;
  background: var(--paper);
  color: var(--ink);
}

.landing-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1140px;
  min-height: 80px;
  margin: auto;
  padding: 0 24px;
}

.landing-nav nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

.landing-nav-link {
  color: #0e5a52;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  padding: 8px 12px;
}

.landing-nav-primary {
  display: grid;
  place-items: center;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  background: #0e5a52;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 150ms ease;
}

.landing-nav-primary:hover {
  background: #0a4540;
}

.landing-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  align-items: center;
  gap: 72px;
  max-width: 1140px;
  min-height: 640px;
  margin: auto;
  padding: 60px 24px 90px;
}

.landing-hero-copy {
  display: flex;
  flex-direction: column;
}

.landing-kicker {
  margin: 0 0 16px;
  color: #0e5a52;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.landing-hero h1 {
  margin: 0;
  font-size: clamp(38px, 5vw, 60px);
  line-height: 1.1;
  letter-spacing: -0.04em;
  font-weight: 700;
  color: #1c1b19;
}

.landing-lead {
  max-width: 500px;
  margin: 24px 0 32px;
  color: #57534c;
  font-size: 17px;
  line-height: 1.55;
}

.landing-hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  height: 52px;
  padding: 0 24px;
  border: 0;
  border-radius: 12px;
  background: #0e5a52;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.landing-hero-btn:hover {
  background: #0a4540;
}

.landing-hero-secondary-btn {
  display: inline-flex;
  align-items: center;
  height: 52px;
  padding: 0 20px;
  border: 1px solid #d6d1c6;
  border-radius: 12px;
  background: #ffffff;
  color: #1c1b19;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.landing-note {
  display: block;
  margin-top: 18px;
  color: #6e6a62;
  font-size: 13px;
}

/* Phone Mockup Preview */
.landing-preview {
  position: relative;
  width: 390px;
  max-width: 100%;
  padding: 20px 20px 84px;
  border: 1px solid #e4e0d7;
  border-radius: 28px;
  background: #f7f5f0;
  box-shadow: 0 20px 60px rgba(28, 27, 25, 0.08);
  box-sizing: border-box;
}

.preview-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.preview-top strong {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #1c1b19;
}

.preview-top small {
  display: block;
  font-size: 12px;
  color: #6e6a62;
}

.preview-bell {
  position: relative;
  color: #1c1b19;
}

.preview-dot {
  position: absolute;
  top: -1px;
  right: -1px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d9a23a;
  box-shadow: 0 0 0 2px #f7f5f0;
}

.preview-hero {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-eyebrow {
  font-size: 13px;
  color: #57534c;
}

.preview-amount {
  font-size: 38px;
  line-height: 42px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #1c1b19;
}

.preview-amount span {
  font-size: 22px;
  color: #57534c;
  margin-right: 4px;
}

.preview-amount small {
  font-size: 28px;
  color: #6e6a62;
}

.preview-sub {
  margin: 4px 0 0;
  color: #57534c;
  font-size: 12px;
}

.preview-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  gap: 2px;
  margin-top: 14px;
}

.preview-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 11px;
  color: #57534c;
  margin-top: 6px;
}

.preview-section {
  margin-top: 24px;
}

.preview-sec-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.preview-sec-head strong {
  font-size: 14px;
  font-weight: 600;
}

.preview-tag {
  background: #1c1b19;
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  padding: 0 6px;
  border-radius: 999px;
  height: 18px;
  display: inline-flex;
  align-items: center;
}

.preview-grp {
  background: #ffffff;
  border-radius: 14px;
  padding: 0 12px;
  border: 1px solid #e4e0d7;
}

.preview-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #efece5;
  font-size: 13px;
}

.preview-row:last-child {
  border-bottom: 0;
}

.preview-av {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  flex: none;
}

.preview-rt {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.preview-rt b {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-rt span {
  font-size: 11px;
  color: #57534c;
}

.preview-link {
  color: #0e5a52;
  font-size: 12px;
  font-weight: 600;
}

.preview-nav {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 64px;
  border-top: 1px solid #e4e0d7;
  border-radius: 0 0 28px 28px;
  background: #ffffff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  color: #57534c;
}

.preview-nav .active {
  color: #0e5a52;
  font-weight: 600;
}

.preview-add-fab {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #0e5a52;
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 20px;
}

/* Steps Section */
.landing-steps {
  padding: 80px 24px;
  border-top: 1px solid #e4e0d7;
  background: #ffffff;
}

.landing-steps-inner {
  max-width: 1140px;
  margin: auto;
}

.landing-steps h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1c1b19;
  margin-bottom: 40px;
}

.landing-steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}

.landing-steps-grid article {
  display: flex;
  flex-direction: column;
  padding-top: 20px;
  border-top: 1px solid #e4e0d7;
}

.landing-steps-grid article span {
  color: #0e5a52;
  font-size: 14px;
  font-weight: 700;
}

.landing-steps-grid article h3 {
  margin: 16px 0 8px;
  font-size: 19px;
  font-weight: 600;
  color: #1c1b19;
}

.landing-steps-grid article p {
  margin: 0;
  color: #57534c;
  font-size: 14px;
  line-height: 22px;
}

/* Footer */
.landing-footer {
  border-top: 1px solid #e4e0d7;
  padding: 36px 24px;
  background: #f7f5f0;
}

.landing-footer-inner {
  max-width: 1140px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.landing-footer-inner small {
  color: #6e6a62;
  font-size: 13px;
}

@media (max-width: 860px) {
  .landing-hero {
    grid-template-columns: 1fr;
    gap: 48px;
    padding: 40px 20px 60px;
  }
  .landing-preview {
    margin: auto;
  }
  .landing-steps-grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}
</style>
