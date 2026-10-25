<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, SwitchButton } from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'
import { useOrdersStore } from '@/stores/orders'
import { useUserStore } from '@/stores/user'
import { resolveAsset } from '@/utils/asset'
import { formatMoney } from '@/utils/format'

const router = useRouter()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()
const userStore = useUserStore()

const username = computed(() => userStore.profile?.username || '')
const myOrders = computed(() => ordersStore.ordersOf(username.value))
const summary = computed(() => ordersStore.summaryOf(username.value))

const dateFormat = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date)
}

function itemsSummary(order) {
  const list = Array.isArray(order.items) ? order.items : []
  return list.map((item) => `${item.name} ×${item.quantity}`).join('、')
}

function handleSignOut() {
  userStore.signOut()
  cartStore.clearCart()
  ElMessage.success('已退出登录，期待下次见')
  router.replace({ name: 'login' })
}
</script>

<template>
  <main class="profile-page">
    <div class="page-container">
      <header class="profile-header">
        <p class="eyebrow">MY PROFILE · {{ userStore.tableNo }} 号桌</p>
        <h1>个人中心</h1>
        <p class="profile-sub">这里记录着你点过的每一道菜。</p>
      </header>

      <div class="profile-grid">
        <section class="identity-card" aria-label="顾客资料">
          <span class="identity-avatar">{{ userStore.avatarText }}</span>
          <div class="identity-copy">
            <h2>{{ userStore.displayName }}</h2>
            <p>
              <span class="level-chip">{{ userStore.level }}</span>
              <span class="table-chip">{{ userStore.tableNo }} 号桌</span>
            </p>
            <small>{{ userStore.profile?.greeting || '今天也要好好吃饭' }}</small>
          </div>

          <div class="identity-stats">
            <div>
              <strong>{{ summary.count }}</strong>
              <span>下单次数</span>
            </div>
            <div>
              <strong>{{ summary.dishes }}</strong>
              <span>累计份数</span>
            </div>
            <div>
              <strong>¥{{ formatMoney(summary.total) }}</strong>
              <span>累计消费</span>
            </div>
          </div>
        </section>

        <section class="history-card" aria-label="历史订单">
          <header class="history-head">
            <div>
              <p class="eyebrow">ORDER HISTORY</p>
              <h2>订单记录</h2>
            </div>
            <span class="history-count">{{ myOrders.length }} 单</span>
          </header>

          <div v-if="myOrders.length" class="history-list">
            <article v-for="order in myOrders" :key="order.orderNo" class="history-item">
              <header>
                <strong>{{ order.orderNo }}</strong>
                <time :datetime="order.createdAt">{{ formatDate(order.createdAt) }}</time>
              </header>

              <p class="history-dishes">{{ itemsSummary(order) }}</p>

              <div v-if="order.items?.length" class="history-thumbs" aria-hidden="true">
                <img
                  v-for="item in order.items.slice(0, 5)"
                  :key="item.id"
                  :src="resolveAsset(item.image)"
                  :alt="item.name"
                  loading="lazy"
                />
              </div>

              <footer>
                <span>{{ order.count }} 份 · 本桌 {{ order.tableNo }}</span>
                <em>¥{{ formatMoney(order.total) }}</em>
              </footer>
            </article>
          </div>

          <div v-else class="history-empty">
            <span class="history-empty-mark">灶</span>
            <h3>还没有点过菜</h3>
            <p>下单成功后，每一单都会记在这里。</p>
            <RouterLink class="empty-link" :to="{ name: 'home' }">
              去点几道菜
              <el-icon><ArrowRight /></el-icon>
            </RouterLink>
          </div>
        </section>
      </div>

      <section class="profile-actions">
        <el-button class="sign-out" round @click="handleSignOut">
          <el-icon><SwitchButton /></el-icon>
          退出登录
        </el-button>
        <small>账号信息仅保存在本机，不会上传到服务器。</small>
      </section>
    </div>
  </main>
</template>

<style scoped>
.profile-page {
  padding-bottom: 40px;
}

.page-container {
  width: min(1040px, 100%);
  margin: 0 auto;
  padding: 20px 28px 0;
}

.profile-header {
  margin-bottom: 20px;
}

.profile-header h1 {
  margin: 6px 0 8px;
  font-family: var(--font-serif);
  font-size: 40px;
  letter-spacing: 0.06em;
}

.profile-sub {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
}

.profile-grid {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.identity-card {
  position: sticky;
  top: 96px;
  padding: 22px;
  border: 1px solid rgba(23, 61, 47, 0.09);
  border-radius: 22px;
  background: linear-gradient(150deg, rgba(232, 238, 228, 0.78), rgba(255, 253, 248, 0.94));
  box-shadow: 0 16px 36px rgba(48, 39, 27, 0.06);
}

.identity-avatar {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  color: #7b4a25;
  background: radial-gradient(circle at 30% 25%, #fff3dd, transparent 45%), #ecd4ae;
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 700;
}

.identity-copy {
  margin-top: 14px;
}

.identity-copy h2 {
  margin: 0 0 8px;
  font-family: var(--font-serif);
  font-size: 22px;
}

.identity-copy p {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 6px;
}

.level-chip,
.table-chip {
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10px;
  letter-spacing: 0.04em;
}

.level-chip {
  color: #7b4a25;
  background: rgba(233, 226, 210, 0.62);
}

.table-chip {
  color: var(--jade);
  background: rgba(23, 61, 47, 0.08);
}

.identity-copy small {
  color: var(--text-faint);
  font-size: 11px;
}

.identity-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px dashed rgba(37, 52, 42, 0.14);
}

.identity-stats > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: center;
}

.identity-stats > div + div {
  border-left: 1px dashed rgba(37, 52, 42, 0.12);
}

.identity-stats strong {
  font-family: var(--font-display);
  font-size: 18px;
}

.identity-stats span {
  color: var(--text-faint);
  font-size: 10px;
  letter-spacing: 0.05em;
}

.history-card {
  padding: 22px;
  border: 1px solid rgba(37, 52, 42, 0.08);
  border-radius: 22px;
  background: rgba(255, 253, 248, 0.86);
  box-shadow: 0 16px 36px rgba(48, 39, 27, 0.05);
}

.history-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.history-head h2 {
  margin: 4px 0 0;
  font-family: var(--font-serif);
  font-size: 22px;
}

.history-count {
  color: var(--text-faint);
  font-size: 11px;
}

.history-item {
  padding: 16px 18px;
  border: 1px solid rgba(37, 52, 42, 0.08);
  border-radius: 16px;
  background: rgba(255, 253, 248, 0.94);
}

.history-item + .history-item {
  margin-top: 12px;
}

.history-item header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.history-item header strong {
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 0.04em;
}

.history-item time {
  color: var(--text-faint);
  font-size: 10px;
}

.history-dishes {
  margin: 8px 0 10px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.history-thumbs {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.history-thumbs img {
  width: 44px;
  height: 44px;
  border-radius: 9px;
  object-fit: cover;
  background: var(--cream-deep);
}

.history-item footer {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px dashed rgba(37, 52, 42, 0.12);
  color: var(--text-faint);
  font-size: 10px;
}

.history-item footer em {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 15px;
  font-style: normal;
  font-weight: 700;
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 44px 20px 40px;
  text-align: center;
}

.history-empty-mark {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border: 1px solid rgba(30, 58, 48, 0.42);
  border-radius: 13px;
  color: var(--accent);
  font-family: var(--font-serif);
  font-size: 22px;
  transform: rotate(-4deg);
}

.history-empty h3 {
  margin: 6px 0 0;
  font-family: var(--font-serif);
  font-size: 16px;
}

.history-empty p {
  margin: 0;
  color: var(--text-faint);
  font-size: 12px;
}

.empty-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  color: var(--jade);
  font-size: 12px;
}

.empty-link:hover {
  color: var(--accent);
}

.profile-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 26px;
}

.sign-out {
  width: min(260px, 100%);
  height: 44px;
  border-color: rgba(30, 58, 48, 0.3);
  color: var(--accent);
  background: rgba(255, 253, 248, 0.9);
}

.sign-out:hover {
  border-color: var(--accent);
  color: #fff;
  background: var(--accent);
}

.profile-actions small {
  color: var(--text-faint);
  font-size: 10px;
}

@media (max-width: 900px) {
  .profile-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .identity-card {
    position: static;
  }
}

@media (max-width: 620px) {
  .page-container {
    padding: 18px 16px 0;
  }

  .profile-header h1 {
    font-size: 32px;
  }

  .history-card,
  .identity-card {
    padding: 18px;
    border-radius: 18px;
  }
}
</style>
