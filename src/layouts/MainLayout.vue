<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { Menu as MenuIcon, User } from '@element-plus/icons-vue'
import AppHeader from '@/components/AppHeader.vue'
import CartDock from '@/components/CartDock.vue'

const mobileQuery = window.matchMedia('(max-width: 760px)')

// 手机端固定点单栏会遮住页脚最后一行，给 body 预留等高的下内边距。
function syncDockPadding(event) {
  document.body.classList.toggle('has-dock', event.matches)
}

onMounted(() => {
  syncDockPadding(mobileQuery)
  mobileQuery.addEventListener('change', syncDockPadding)
})

onBeforeUnmount(() => {
  document.body.classList.remove('has-dock')
  mobileQuery.removeEventListener('change', syncDockPadding)
})
</script>

<template>
  <div class="app-shell">
    <AppHeader />

    <main class="app-main">
      <RouterView v-slot="{ Component, route: currentRoute }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" :key="currentRoute.path" />
        </Transition>
      </RouterView>
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="footer-stamp">灶</span>
          <div>
            <strong>灶边小馆</strong>
            <small>ZAOBIAN KITCHEN</small>
          </div>
        </div>
        <p>好好吃饭，慢慢生活。</p>
        <small class="footer-copy">© 2026 ZAOBIAN · 扫码点餐课程演示项目</small>
      </div>
    </footer>

    <!-- 购物车始终是右下角的悬浮窗入口 -->
    <CartDock />

    <!-- 手机端底部点单栏：菜单 / 我的（我的进入独立页面） -->
    <div class="mobile-dock" aria-label="手机端点单栏">
      <RouterLink class="dock-link" to="/home">
        <el-icon><MenuIcon /></el-icon>
        菜单
      </RouterLink>
      <RouterLink class="dock-link" to="/profile">
        <el-icon><User /></el-icon>
        我的
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  width: 100%;
}

.site-footer {
  margin-top: 48px;
  padding: 32px 28px 36px;
  border-top: 1px solid var(--line-soft);
  background: rgba(247, 241, 230, 0.7);
}

.footer-inner {
  width: min(1240px, 100%);
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 28px;
  color: var(--text-muted);
  font-size: 13px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
}

.footer-brand > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.footer-brand strong {
  font-family: var(--font-serif);
  font-size: 15px;
  letter-spacing: 0.06em;
}

.footer-brand small {
  color: var(--text-muted);
  font-size: 8px;
  letter-spacing: 0.18em;
}

.footer-stamp {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(30, 58, 48, 0.55);
  color: var(--accent);
  font-family: var(--font-serif);
  font-size: 17px;
  border-radius: 9px;
  transform: rotate(-4deg);
}

.footer-inner p {
  margin: 0;
  font-family: var(--font-serif);
  letter-spacing: 0.08em;
}

.footer-copy {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-faint);
}

.mobile-dock {
  display: none;
}

@media (max-width: 760px) {
  .site-footer {
    padding: 24px 18px 28px;
    margin-top: 28px;
  }

  .footer-inner {
    flex-wrap: wrap;
    gap: 14px;
  }

  .footer-copy {
    width: 100%;
    margin-left: 0;
  }

  .mobile-dock {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 90;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    padding: 7px 12px calc(7px + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid rgba(23, 61, 47, 0.09);
    background: rgba(250, 246, 238, 0.95);
    backdrop-filter: blur(16px);
  }

  .dock-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 6px 0;
    border-radius: 12px;
    color: var(--text-muted);
    font-size: 11px;
    letter-spacing: 0.04em;
  }

  .dock-link .el-icon {
    font-size: 18px;
  }

  .dock-link.router-link-active {
    color: var(--jade);
    background: rgba(23, 61, 47, 0.07);
  }
}
</style>
