<script setup>
import { computed } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const homeLink = computed(() => (userStore.isLoggedIn ? '/home' : '/login'))
</script>

<template>
  <main class="not-found-page">
    <section class="not-found-card">
      <div class="not-found-brand">
        <span class="brand-stamp">灶</span>
        <div>
          <strong>灶边小馆</strong>
          <small>ZAOBIAN KITCHEN</small>
        </div>
      </div>

      <div class="not-found-content">
        <p class="not-found-code">404</p>
        <p class="not-found-eyebrow">PAGE NOT FOUND</p>
        <h1>这道菜，菜单上没有。</h1>
        <p class="not-found-desc">
          你访问的页面可能已经下架，或者地址输错了一个字。不如回菜单看看今天有什么好吃的。
        </p>
        <RouterLink class="not-found-action" :to="homeLink">
          回到{{ userStore.isLoggedIn ? '今日菜单' : '登录页' }}
          <el-icon><ArrowRight /></el-icon>
        </RouterLink>
      </div>

      <div class="not-found-footer">
        <RouterLink :to="homeLink">
          <el-icon><ArrowLeft /></el-icon>
          {{ userStore.isLoggedIn ? '返回菜单' : '返回登录' }}
        </RouterLink>
        <span>© 2026 ZAOBIAN · 好好吃饭，慢慢生活</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
  background:
    radial-gradient(circle at 20% 20%, rgba(197, 154, 94, 0.2), transparent 30%),
    radial-gradient(circle at 82% 75%, rgba(35, 70, 53, 0.12), transparent 28%),
    var(--cream);
}

.not-found-card {
  position: relative;
  width: min(720px, 100%);
  overflow: hidden;
  padding: 37px 41px 31px;
  border: 1px solid rgba(37, 52, 42, 0.08);
  border-radius: 28px;
  background: rgba(255, 253, 248, 0.8);
  box-shadow: 0 28px 75px rgba(65, 47, 27, 0.09);
}

.not-found-card::after {
  content: '食';
  position: absolute;
  right: -24px;
  bottom: -68px;
  color: rgba(23, 61, 47, 0.045);
  font-family: var(--font-serif);
  font-size: 300px;
  line-height: 1;
  pointer-events: none;
}

.not-found-brand {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 11px;
}

.brand-stamp {
  display: grid;
  place-items: center;
  width: 37px;
  height: 37px;
  border-radius: 10px;
  color: #f8e9d3;
  background: var(--jade);
  font-family: var(--font-serif);
  font-size: 20px;
  transform: rotate(-3deg);
}

.not-found-brand > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.not-found-brand strong {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 17px;
  letter-spacing: 0.12em;
}

.not-found-brand small {
  color: var(--text-faint);
  font-size: 7px;
  letter-spacing: 0.19em;
}

.not-found-content {
  position: relative;
  z-index: 1;
  padding: 55px 0 49px;
}

.not-found-code {
  margin: 0;
  color: rgba(30, 58, 48, 0.18);
  font-family: var(--font-display);
  font-size: clamp(80px, 14vw, 140px);
  font-weight: 700;
  line-height: 0.8;
  letter-spacing: -0.08em;
}

.not-found-eyebrow {
  margin: 25px 0 11px;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.23em;
}

.not-found-content h1 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(29px, 4.5vw, 43px);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.not-found-desc {
  max-width: 470px;
  margin: 14px 0 24px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.95;
}

.not-found-action {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  height: 43px;
  padding: 0 18px;
  border-radius: 10px;
  color: #f8f0e1;
  background: var(--jade);
  font-size: 11px;
  letter-spacing: 0.06em;
  box-shadow: 0 11px 22px rgba(23, 61, 47, 0.14);
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.not-found-action:hover {
  background: var(--accent);
  transform: translateY(-1px);
}

.not-found-footer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 18px;
  border-top: 1px solid rgba(37, 52, 42, 0.08);
  color: var(--text-faint);
  font-size: 8px;
}

.not-found-footer a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
}

.not-found-footer a:hover {
  color: var(--accent);
}

@media (max-width: 560px) {
  .not-found-page {
    padding: 15px;
  }

  .not-found-card {
    padding: 26px 21px 23px;
    border-radius: 22px;
  }

  .not-found-content {
    padding: 43px 0 38px;
  }

  .not-found-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
}
</style>
