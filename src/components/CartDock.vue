<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Close, Delete, Minus, Plus, ShoppingBag } from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'
import { useOrdersStore } from '@/stores/orders'
import { useUserStore } from '@/stores/user'
import { resolveAsset } from '@/utils/asset'
import { lineTotalOf } from '@/utils/cart'
import { formatMoney } from '@/utils/format'

const router = useRouter()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()
const userStore = useUserStore()

const open = ref(false)
const items = computed(() => cartStore.items)
const totalCount = computed(() => cartStore.totalCount)
const latestOrder = computed(() => ordersStore.ordersOf(userStore.profile?.username)[0] || null)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function changeQuantity(item, delta) {
  const stock = Math.max(1, Math.floor(Number(item.stock) || 1))
  const next = Math.floor(Number(item.quantity)) + delta

  if (next <= 0) {
    cartStore.removeItem(item.id)
    ElMessage.info(`${item.name} 已从购物车移除`)
    return
  }

  if (next > stock) {
    ElMessage.warning(`${item.name} 仅剩 ${stock} ${item.unit || '份'}`)
    return
  }

  cartStore.setQuantity(item.id, next)
}

function removeItem(item) {
  cartStore.removeItem(item.id)
  ElMessage({ message: `${item.name} 已移除`, type: 'success', duration: 1400 })
}

function clearCart() {
  cartStore.clearCart()
  ElMessage.info('购物车已清空')
}

function goCheckout() {
  close()
  router.push({ name: 'cart' })
}

function goMenu() {
  close()
  if (router.currentRoute.value.name !== 'home') {
    router.push({ name: 'home' })
  }
}

// 打开时锁住页面滚动、支持 Esc 关闭，关闭后恢复。
function handleKeydown(event) {
  if (event.key === 'Escape') close()
}

watch(open, (value) => {
  document.body.style.overflow = value ? 'hidden' : ''
  if (value) {
    window.addEventListener('keydown', handleKeydown)
  } else {
    window.removeEventListener('keydown', handleKeydown)
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <!-- 悬浮购物车：圆形球 + 点击展开的悬浮窗，页面本身不跳转 -->
  <button
    class="cart-fab"
    :class="{ 'is-open': open, 'is-empty': !totalCount }"
    type="button"
    aria-haspopup="dialog"
    :aria-expanded="open"
    :aria-label="`打开购物车悬浮窗，${userStore.tableNo} 桌，共 ${totalCount} 件，合计 ${formatMoney(cartStore.subtotal)} 元`"
    @click="toggle"
  >
    <span v-if="totalCount" class="cart-fab-badge">{{ totalCount > 99 ? '99+' : totalCount }}</span>
    <el-icon class="cart-fab-icon"><ShoppingBag /></el-icon>
    <span class="cart-fab-table">{{ userStore.tableNo }} 桌</span>
    <span class="cart-fab-amount">¥{{ formatMoney(cartStore.subtotal) }}</span>
  </button>

  <Transition name="cart-pop">
    <div v-if="open" class="cart-layer">
      <div class="cart-scrim" @click="close"></div>

      <section class="cart-panel" role="dialog" aria-modal="true" aria-label="购物详情">
        <header class="panel-head">
          <div>
            <p class="panel-eyebrow">YOUR CART · {{ userStore.tableNo }}</p>
            <h2>购物详情</h2>
            <p class="panel-sub">
              {{ totalCount ? `已点 ${totalCount} 份 · ${items.length} 种菜品` : '还没有选菜，先去逛逛菜单。' }}
            </p>
          </div>
          <button class="panel-close" type="button" aria-label="关闭购物详情" @click="close">
            <el-icon><Close /></el-icon>
          </button>
        </header>

        <div v-if="items.length" class="panel-list">
          <article v-for="item in items" :key="item.id" class="panel-item">
            <img class="item-thumb" :src="resolveAsset(item.image)" :alt="item.name" loading="lazy" />
            <div class="item-main">
              <div class="item-title">
                <h3>{{ item.name }}</h3>
                <button
                  class="item-remove"
                  type="button"
                  :aria-label="`移除 ${item.name}`"
                  @click="removeItem(item)"
                >
                  <el-icon><Delete /></el-icon>
                </button>
              </div>
              <p class="item-spec">{{ item.spec }}</p>
              <div class="item-bottom">
                <span class="item-price">¥{{ formatMoney(item.price) }}</span>
                <div class="stepper" role="group" :aria-label="`${item.name} 数量`">
                  <button type="button" aria-label="减少一份" @click="changeQuantity(item, -1)">
                    <el-icon><Minus /></el-icon>
                  </button>
                  <strong>{{ item.quantity }}</strong>
                  <button type="button" aria-label="增加一份" @click="changeQuantity(item, 1)">
                    <el-icon><Plus /></el-icon>
                  </button>
                </div>
                <span class="item-total">¥{{ lineTotalOf(item) }}</span>
              </div>
            </div>
          </article>

          <button class="panel-clear" type="button" @click="clearCart">清空购物车</button>
        </div>

        <div v-else class="panel-empty">
          <span class="empty-mark">
            <el-icon><ShoppingBag /></el-icon>
          </span>
          <h3>购物车空空如也</h3>
          <p>挑几道热菜，让厨房现在就开火。</p>
          <el-button type="primary" round @click="goMenu">去点餐</el-button>
        </div>

        <footer v-if="items.length" class="panel-foot">
          <div class="foot-line">
            <span>菜品合计</span>
            <strong>¥{{ formatMoney(cartStore.subtotal) }}</strong>
          </div>
          <div class="foot-line muted">
            <span>已优惠</span>
            <em>-¥{{ formatMoney(cartStore.savings) }}</em>
          </div>
          <p v-if="latestOrder" class="foot-hint">
            上一单 {{ latestOrder.orderNo.slice(-6) }} · ¥{{ formatMoney(latestOrder.total) }}
          </p>
          <div class="foot-actions">
            <el-button round @click="goMenu">继续点餐</el-button>
            <el-button type="primary" round @click="goCheckout">
              去结算 · ¥{{ formatMoney(cartStore.subtotal) }}
            </el-button>
          </div>
        </footer>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.cart-fab {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 80;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: 88px;
  height: 88px;
  padding: 0;
  border: 1px solid rgba(255, 253, 248, 0.34);
  border-radius: 50%;
  color: #f8f0e1;
  background:
    radial-gradient(circle at 32% 22%, rgba(255, 255, 255, 0.24), transparent 58%),
    var(--jade);
  box-shadow:
    0 16px 32px rgba(23, 61, 47, 0.28),
    0 2px 0 rgba(255, 253, 248, 0.18) inset;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease;
}

.cart-fab:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow:
    0 22px 42px rgba(23, 61, 47, 0.34),
    0 2px 0 rgba(255, 253, 248, 0.18) inset;
}

.cart-fab.is-open {
  background:
    radial-gradient(circle at 32% 22%, rgba(255, 255, 255, 0.24), transparent 58%),
    var(--accent);
  box-shadow:
    0 18px 38px rgba(201, 78, 43, 0.34),
    0 2px 0 rgba(255, 253, 248, 0.18) inset;
}

.cart-fab:active {
  transform: translateY(0) scale(0.99);
}

.cart-fab.is-empty {
  color: rgba(248, 240, 225, 0.82);
  background:
    radial-gradient(circle at 32% 22%, rgba(255, 255, 255, 0.18), transparent 58%),
    #3d5a4c;
}

.cart-fab-icon {
  font-size: 19px;
}

.cart-fab-table {
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.82;
}

.cart-fab-amount {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.cart-fab-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  display: grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border: 2px solid var(--cream);
  border-radius: 999px;
  color: #fff;
  background: var(--accent);
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 4px 10px rgba(201, 78, 43, 0.38);
}

/* 悬浮窗本体：固定在悬浮球上方，圆角卡片 + 阴影，不遮挡整页 */
.cart-layer {
  position: fixed;
  inset: 0;
  z-index: 79;
}

.cart-scrim {
  position: absolute;
  inset: 0;
  background: rgba(28, 40, 33, 0.22);
  backdrop-filter: blur(2px);
}

.cart-panel {
  position: absolute;
  right: 28px;
  bottom: 128px;
  display: flex;
  flex-direction: column;
  width: min(392px, calc(100vw - 32px));
  max-height: min(72vh, 588px);
  overflow: hidden;
  border: 1px solid rgba(255, 253, 248, 0.6);
  border-radius: 24px;
  background: var(--paper);
  box-shadow:
    0 30px 70px rgba(23, 40, 30, 0.28),
    0 2px 0 rgba(255, 255, 255, 0.6) inset;
  transform-origin: 92% 100%;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 14px;
  border-bottom: 1px solid rgba(37, 52, 42, 0.07);
}

.panel-eyebrow {
  margin: 0 0 5px;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 9px;
  letter-spacing: 0.22em;
}

.panel-head h2 {
  margin: 0 0 5px;
  font-family: var(--font-serif);
  font-size: 19px;
  letter-spacing: 0.05em;
}

.panel-sub {
  margin: 0;
  color: var(--text-muted);
  font-size: 11px;
}

.panel-close {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border: 1px solid rgba(37, 52, 42, 0.1);
  border-radius: 50%;
  color: var(--text-muted);
  background: rgba(255, 253, 248, 0.9);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.panel-close:hover {
  color: var(--accent);
  border-color: rgba(201, 78, 43, 0.35);
}

.panel-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 18px 6px;
}

.panel-item {
  display: flex;
  gap: 11px;
  padding: 12px 0;
  border-bottom: 1px dashed rgba(37, 52, 42, 0.12);
}

.item-thumb {
  width: 58px;
  height: 58px;
  border-radius: 11px;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--cream-deep);
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-title h3 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 14px;
  font-weight: 600;
}

.item-remove {
  padding: 2px;
  border: 0;
  color: var(--text-faint);
  background: transparent;
  cursor: pointer;
}

.item-remove:hover {
  color: var(--accent);
}

.item-spec {
  margin: 3px 0 7px;
  overflow: hidden;
  color: var(--text-faint);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-price {
  color: var(--text-muted);
  font-size: 11px;
}

.stepper {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  padding: 2px;
  border: 1px solid rgba(23, 61, 47, 0.13);
  border-radius: 999px;
  background: rgba(255, 253, 248, 0.9);
}

.stepper button {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 50%;
  color: var(--jade);
  background: transparent;
  cursor: pointer;
}

.stepper button:hover {
  background: var(--jade-soft);
}

.stepper strong {
  min-width: 18px;
  font-family: var(--font-display);
  font-size: 12px;
  text-align: center;
}

.item-total {
  min-width: 54px;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}

.panel-clear {
  display: block;
  margin: 10px auto 4px;
  padding: 0;
  border: 0;
  color: var(--text-faint);
  background: transparent;
  font-size: 11px;
  cursor: pointer;
}

.panel-clear:hover {
  color: var(--accent);
}

.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 34px 22px 38px;
  text-align: center;
}

.empty-mark {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: 4px;
  border-radius: 50%;
  color: var(--jade);
  background: var(--jade-soft);
  font-size: 24px;
}

.panel-empty h3 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 16px;
}

.panel-empty p {
  margin: 0 0 10px;
  color: var(--text-muted);
  font-size: 11px;
}

.panel-foot {
  padding: 12px 18px 16px;
  border-top: 1px solid rgba(37, 52, 42, 0.08);
  background: rgba(247, 242, 232, 0.6);
}

.foot-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  color: var(--text-muted);
  font-size: 11px;
}

.foot-line strong {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 18px;
}

.foot-line.muted em {
  color: var(--accent);
  font-style: normal;
}

.foot-hint {
  margin: 5px 0 0;
  color: var(--text-faint);
  font-size: 10px;
}

.foot-actions {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 9px;
  margin-top: 11px;
}

.foot-actions :deep(.el-button) {
  height: 40px;
  border-radius: 999px;
}

.cart-pop-enter-active,
.cart-pop-leave-active {
  transition: opacity 0.2s ease;
}

.cart-pop-enter-active .cart-panel,
.cart-pop-leave-active .cart-panel {
  transition:
    transform 0.24s cubic-bezier(0.2, 0.8, 0.25, 1),
    opacity 0.2s ease;
}

.cart-pop-enter-from,
.cart-pop-leave-to {
  opacity: 0;
}

.cart-pop-enter-from .cart-panel,
.cart-pop-leave-to .cart-panel {
  opacity: 0;
  transform: translateY(14px) scale(0.94);
}

@media (max-width: 760px) {
  .cart-fab {
    right: 16px;
    bottom: 84px;
    width: 74px;
    height: 74px;
  }

  .cart-fab-badge {
    min-width: 22px;
    height: 22px;
    font-size: 10px;
  }

  .cart-panel {
    right: 12px;
    bottom: 170px;
    width: calc(100vw - 24px);
    max-height: min(66vh, 560px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cart-pop-enter-active .cart-panel,
  .cart-pop-leave-active .cart-panel {
    transition: opacity 0.15s ease;
  }

  .cart-pop-enter-from .cart-panel,
  .cart-pop-leave-to .cart-panel {
    transform: none;
  }
}
</style>
