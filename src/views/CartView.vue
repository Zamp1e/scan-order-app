<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Delete,
  ShoppingBag,
} from '@element-plus/icons-vue'
import CartQuantity from '@/components/CartQuantity.vue'
import { useCartStore } from '@/stores/cart'
import { useOrdersStore } from '@/stores/orders'
import { useUserStore } from '@/stores/user'
import { resolveAsset } from '@/utils/asset'
import { lineTotalOf } from '@/utils/cart'
import { createOrderNo, formatMoney, formatPrice } from '@/utils/format'

const router = useRouter()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()
const userStore = useUserStore()

const orderVisible = ref(false)
const lastOrder = ref(null)

const cartItems = computed(() => cartStore.items)
const isEmpty = computed(() => cartStore.isEmpty)
const totalCount = computed(() => cartStore.totalCount)
const cartSummaryText = computed(() =>
  totalCount.value ? `共 ${totalCount.value} 份菜，慢慢吃。` : '还没有选菜，先去逛逛菜单。',
)

function maxQuantity(item) {
  return Math.max(1, Math.floor(Number(item.stock) || 1))
}

function handleQuantityChange(item, value) {
  const next = Math.floor(Number(value))
  if (!Number.isFinite(next)) return

  if (next <= 0) {
    cartStore.removeItem(item.id)
    ElMessage.info(`${item.name} 已从购物车移除`)
    return
  }

  const stock = Math.floor(Number(item.stock) || 0)
  if (next > stock) {
    cartStore.setQuantity(item.id, stock)
    ElMessage.warning(`${item.name} 仅剩 ${stock} ${item.unit || '份'}`)
    return
  }

  cartStore.setQuantity(item.id, next)
}

function removeItem(item) {
  cartStore.removeItem(item.id)
  ElMessage({
    message: `${item.name} 已移除`,
    type: 'success',
    duration: 1400,
  })
}

function clearCart() {
  cartStore.clearCart()
  ElMessage.info('购物车已清空')
}

function submitOrder() {
  if (isEmpty.value) return

  const orderNo = createOrderNo()

  // 先把购物车快照写进订单历史，“我的”主页据此展示点过的菜。
  ordersStore.addOrder({
    orderNo,
    owner: userStore.profile?.username || '',
    tableNo: userStore.tableNo,
    count: cartStore.totalCount,
    total: cartStore.subtotal,
    items: cartStore.items,
  })

  lastOrder.value = {
    orderNo,
    total: cartStore.subtotal,
    count: cartStore.totalCount,
    tableNo: userStore.tableNo,
  }
  cartStore.clearCart()
  orderVisible.value = true
}

function continueOrdering() {
  orderVisible.value = false
  router.push({ name: 'home' })
}
</script>

<template>
  <main class="cart-page">
    <div class="page-container">
      <header class="cart-header">
        <div class="cart-heading">
          <p class="eyebrow">YOUR TABLE · {{ userStore.tableNo }}</p>
          <h1>我的购物车</h1>
          <p class="cart-subtitle">{{ cartSummaryText }} 本桌 {{ userStore.tableNo }} 号。</p>
        </div>

        <div v-if="!isEmpty" class="cart-counter" aria-label="购物车商品数量">
          <strong>{{ totalCount }}</strong>
          <span>份已选</span>
          <i></i>
          <small>{{ cartStore.items.length }} 种菜品</small>
        </div>
      </header>

      <Transition name="cart-fade" mode="out-in">
        <section v-if="isEmpty" key="empty" class="empty-cart">
          <div class="empty-visual" aria-hidden="true">
            <svg viewBox="0 0 280 236" class="bowl-illustration">
              <defs>
                <linearGradient
                  id="bowlBody"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0" stop-color="#f8f0e1" />
                  <stop offset="1" stop-color="#e7d7c0" />
                </linearGradient>
                <linearGradient
                  id="bowlRim"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0" stop-color="#fffdf8" />
                  <stop offset="1" stop-color="#eee1cd" />
                </linearGradient>
              </defs>
              <ellipse
                cx="140"
                cy="202"
                rx="84"
                ry="17"
                fill="#d9c8b1"
                opacity=".35"
              />
              <path
                d="M53 102h174c-5 56-39 87-87 87s-82-31-87-87Z"
                fill="url(#bowlBody)"
                stroke="#d2bea3"
                stroke-width="1.5"
              />
              <ellipse
                cx="140"
                cy="102"
                rx="87"
                ry="28"
                fill="url(#bowlRim)"
                stroke="#cdb99f"
                stroke-width="1.5"
              />
              <ellipse
                cx="140"
                cy="103"
                rx="69"
                ry="19"
                fill="#f8efdf"
              />
              <path
                d="M75 117c13 18 35 28 65 28s52-10 65-28"
                fill="none"
                stroke="#c9b293"
                stroke-width="1.2"
                opacity=".55"
              />
              <path
                d="M52 33 209 12"
                fill="none"
                stroke="#b89e7d"
                stroke-width="5"
                stroke-linecap="round"
              />
              <path
                d="M58 48 210 30"
                fill="none"
                stroke="#c7ae8b"
                stroke-width="4"
                stroke-linecap="round"
              />
              <g
                fill="none"
                stroke="#b4c7ba"
                stroke-width="2.5"
                stroke-linecap="round"
                opacity=".8"
              >
                <path d="M126 63c-8-12 8-19 1-31" />
                <path d="M154 59c-7-10 7-16 1-26" />
              </g>
              <g fill="#d3bb99" opacity=".6">
                <circle cx="220" cy="147" r="3" />
                <circle cx="235" cy="167" r="2" />
                <circle cx="214" cy="181" r="1.8" />
                <circle cx="52" cy="158" r="2.4" />
              </g>
            </svg>
            <span class="empty-visual-seal">待<br />点</span>
          </div>

          <div class="empty-copy">
            <p class="eyebrow">YOUR CART IS EMPTY</p>
            <h2>购物车空空如也</h2>
            <p>还没有点菜。去今日菜单挑几道合胃口的，灶台随时准备开火。</p>
            <el-button
              class="empty-action"
              type="primary"
              size="large"
              round
              @click="router.push('/home')"
            >
              去点餐
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </section>

        <div v-else key="cart" class="cart-layout">
          <section class="cart-list" aria-label="购物车菜品列表">
            <header class="cart-list-head">
              <span>菜品</span>
              <span>单价</span>
              <span>数量</span>
              <span>小计</span>
              <span class="head-remove"></span>
            </header>

            <article v-for="item in cartItems" :key="item.id" class="cart-item">
              <div class="item-main">
                <RouterLink class="item-image-link" :to="`/dish/${item.id}`">
                  <img :src="resolveAsset(item.image)" :alt="item.name" />
                </RouterLink>
                <div class="item-copy">
                  <RouterLink class="item-name" :to="`/dish/${item.id}`">{{ item.name }}</RouterLink>
                  <p>{{ item.spec }}</p>
                  <div class="item-mobile-price">
                    <span>¥{{ formatPrice(item.price) }}</span>
                    <del v-if="Number(item.originalPrice) > Number(item.price)">
                      ¥{{ formatPrice(item.originalPrice) }}
                    </del>
                  </div>
                  <span class="item-note">库存 {{ item.stock }} {{ item.unit || '份' }}</span>
                </div>
              </div>

              <div class="unit-price">
                <strong>¥{{ formatPrice(item.price) }}</strong>
                <del v-if="Number(item.originalPrice) > Number(item.price)">
                  ¥{{ formatPrice(item.originalPrice) }}
                </del>
              </div>

              <div class="quantity-cell">
                <CartQuantity
                  :model-value="item.quantity"
                  :min="1"
                  :max="maxQuantity(item)"
                  :label="`${item.name}数量`"
                  @change="handleQuantityChange(item, $event)"
                />
              </div>

              <div class="line-total">
                <small>小计</small>
                <strong>¥{{ lineTotalOf(item) }}</strong>
              </div>

              <el-popconfirm
                :title="`移除「${item.name}」？`"
                confirm-button-text="移除"
                cancel-button-text="保留"
                width="210"
                @confirm="removeItem(item)"
              >
                <template #reference>
                  <button class="remove-button" type="button" :aria-label="`移除${item.name}`">
                    <el-icon><Delete /></el-icon>
                    <span>移除</span>
                  </button>
                </template>
              </el-popconfirm>
            </article>

            <footer class="cart-list-footer">
              <button class="continue-link" type="button" @click="router.push('/home')">
                <el-icon><ArrowLeft /></el-icon>
                继续点餐
              </button>
              <el-popconfirm
                title="清空整个购物车？"
                confirm-button-text="清空"
                cancel-button-text="取消"
                width="200"
                @confirm="clearCart"
              >
                <template #reference>
                  <button class="clear-button" type="button">清空购物车</button>
                </template>
              </el-popconfirm>
            </footer>
          </section>

          <aside class="summary-column">
            <div class="summary-card">
              <div class="summary-head">
                <div>
                  <p class="eyebrow">ORDER SUMMARY</p>
                  <h2>订单摘要</h2>
                </div>
                <span class="summary-table">{{ userStore.tableNo }} 桌</span>
              </div>

              <div class="summary-lines">
                <div class="summary-line">
                  <span>菜品数量</span>
                  <span>{{ totalCount }} 份</span>
                </div>
                <div class="summary-line">
                  <span>商品原价</span>
                  <span>¥{{ formatMoney(cartStore.originalTotal) }}</span>
                </div>
                <div class="summary-line discount-line">
                  <span>优惠金额</span>
                  <span>- ¥{{ formatMoney(cartStore.savings) }}</span>
                </div>
                <div class="summary-line">
                  <span>堂食餐位费</span>
                  <span>¥0.00</span>
                </div>
              </div>

              <div class="summary-total">
                <div>
                  <span>合计</span>
                  <small>已含全部优惠</small>
                </div>
                <strong><small>¥</small>{{ formatMoney(cartStore.subtotal) }}</strong>
              </div>

              <el-button
                class="checkout-button"
                type="primary"
                size="large"
                :disabled="isEmpty"
                @click="submitOrder"
              >
                提交订单
                <el-icon><ArrowRight /></el-icon>
              </el-button>

              <p class="checkout-tip">
                <el-icon><ShoppingBag /></el-icon>
                下单后厨房即刻开火，高峰时段约 15 分钟上齐
              </p>
            </div>

            <div class="table-service">
              <span class="service-mark">灶</span>
              <p>
                需要餐具或忌口调整？<br />
                请随时呼唤店员。
              </p>
              <small>{{ userStore.level }} · {{ userStore.displayName }}</small>
            </div>
          </aside>
        </div>
      </Transition>
    </div>

    <el-dialog
      v-model="orderVisible"
      class="order-dialog"
      width="420px"
      align-center
      :show-close="false"
      :close-on-click-modal="false"
    >
      <div class="order-success">
        <div class="success-mark">
          <el-icon><Check /></el-icon>
        </div>
        <p class="eyebrow">ORDER CONFIRMED</p>
        <h3>下单成功</h3>
        <p class="success-copy">厨房已经收到你的订单，请耐心等待热菜上桌。</p>

        <div class="order-receipt">
          <div>
            <span>订单号</span>
            <strong>{{ lastOrder?.orderNo }}</strong>
          </div>
          <div>
            <span>桌号</span>
            <strong>{{ lastOrder?.tableNo }} 桌</strong>
          </div>
          <div>
            <span>共点</span>
            <strong>{{ lastOrder?.count }} 份</strong>
          </div>
          <div class="receipt-total">
            <span>支付金额</span>
            <strong>¥{{ formatMoney(lastOrder?.total) }}</strong>
          </div>
        </div>

        <el-button class="success-button" type="primary" round @click="continueOrdering">
          继续点餐
        </el-button>
        <p class="success-footnote">本页面为课程演示，未发生真实支付。</p>
      </div>
    </el-dialog>
  </main>
</template>

<style scoped>
.cart-page {
  padding-bottom: 8px;
}

.page-container {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 33px 28px 0;
}

.cart-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 28px;
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.cart-heading h1 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(36px, 4vw, 47px);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.cart-subtitle {
  margin: 12px 0 0;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.8;
}

.cart-counter {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding: 12px 16px;
  border: 1px solid rgba(37, 52, 42, 0.08);
  border-radius: 14px;
  background: rgba(255, 253, 248, 0.55);
  white-space: nowrap;
}

.cart-counter strong {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 25px;
  font-weight: 700;
  line-height: 1;
}

.cart-counter span {
  color: var(--text-muted);
  font-size: 9px;
}

.cart-counter i {
  width: 1px;
  height: 14px;
  margin: 0 4px;
  background: rgba(37, 52, 42, 0.1);
}

.cart-counter small {
  color: var(--text-faint);
  font-size: 8px;
}

.cart-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 326px;
  gap: 25px;
  align-items: start;
}

.cart-list {
  overflow: hidden;
  border: 1px solid rgba(37, 52, 42, 0.07);
  border-radius: 22px;
  background: rgba(255, 253, 248, 0.8);
  box-shadow: 0 18px 50px rgba(67, 48, 27, 0.055);
}

.cart-list-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 74px 122px 84px 38px;
  align-items: center;
  gap: 12px;
  padding: 14px 21px;
  border-bottom: 1px solid rgba(37, 52, 42, 0.065);
  color: var(--text-faint);
  background: rgba(239, 233, 221, 0.34);
  font-size: 8px;
  letter-spacing: 0.07em;
}

.cart-list-head span:nth-child(2),
.cart-list-head span:nth-child(3),
.cart-list-head span:nth-child(4) {
  text-align: center;
}

.cart-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 74px 122px 84px 38px;
  align-items: center;
  gap: 12px;
  padding: 18px 21px;
  border-bottom: 1px solid rgba(37, 52, 42, 0.06);
  transition: background 0.2s ease;
}

.cart-item:hover {
  background: rgba(255, 253, 248, 0.65);
}

.item-main {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
}

.item-image-link {
  flex-shrink: 0;
  width: 78px;
  height: 68px;
  overflow: hidden;
  border-radius: 11px;
  background: #ead8c0;
}

.item-image-link img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.item-image-link:hover img {
  transform: scale(1.05);
}

.item-copy {
  min-width: 0;
}

.item-name {
  display: inline-block;
  overflow: hidden;
  max-width: 100%;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-name:hover {
  color: var(--accent);
}

.item-copy p {
  overflow: hidden;
  margin: 5px 0 6px;
  color: var(--text-muted);
  font-size: 9px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-note {
  color: var(--text-faint);
  font-size: 8px;
}

.item-mobile-price {
  display: none;
}

.unit-price {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.unit-price strong {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 500;
}

.unit-price del {
  color: var(--text-faint);
  font-family: var(--font-display);
  font-size: 8px;
}

.quantity-cell {
  display: flex;
  justify-content: center;
}

.line-total {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.line-total small {
  display: none;
  color: var(--text-faint);
  font-size: 7px;
}

.line-total strong {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
}

.remove-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 100%;
  padding: 7px 0;
  border: 0;
  border-radius: 7px;
  color: var(--text-faint);
  background: transparent;
  font-family: var(--font-sans);
  font-size: 8px;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.remove-button:hover {
  color: var(--accent);
  background: rgba(207, 77, 43, 0.07);
}

.remove-button .el-icon {
  font-size: 12px;
}

.remove-button span {
  display: none;
}

.cart-list-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 15px 21px;
  background: rgba(239, 233, 221, 0.2);
}

.continue-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  color: var(--text-muted);
  background: transparent;
  font-family: var(--font-sans);
  font-size: 9px;
  cursor: pointer;
}

.continue-link:hover {
  color: var(--accent);
}

.clear-button {
  padding: 0;
  border: 0;
  color: var(--text-faint);
  background: transparent;
  font-family: var(--font-sans);
  font-size: 8px;
  cursor: pointer;
}

.clear-button:hover {
  color: var(--accent);
}

.summary-column {
  position: sticky;
  top: 98px;
}

.summary-card {
  padding: 25px 23px 21px;
  border: 1px solid rgba(37, 52, 42, 0.07);
  border-radius: 22px;
  background:
    linear-gradient(145deg, rgba(255, 253, 248, 0.92), rgba(244, 237, 225, 0.72));
  box-shadow: 0 18px 45px rgba(67, 48, 27, 0.065);
}

.summary-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 17px;
  border-bottom: 1px solid rgba(37, 52, 42, 0.07);
}

.summary-head h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 23px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.summary-table {
  padding: 5px 8px;
  border: 1px solid rgba(37, 52, 42, 0.09);
  border-radius: 6px;
  color: var(--text-muted);
  font-family: var(--font-display);
  font-size: 8px;
  white-space: nowrap;
}

.summary-lines {
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 17px 0;
}

.summary-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  color: var(--text-muted);
  font-size: 9px;
}

.summary-line span:last-child {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 10px;
}

.discount-line span:last-child {
  color: var(--accent);
}

.summary-total {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0 19px;
  border-top: 1px dashed rgba(37, 52, 42, 0.12);
}

.summary-total > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.summary-total span {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 600;
}

.summary-total small {
  color: var(--text-faint);
  font-family: var(--font-sans);
  font-size: 8px;
  font-weight: 400;
}

.summary-total strong {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 31px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
}

.summary-total strong small {
  margin-right: 2px;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
}

.checkout-button {
  width: 100%;
  height: 45px;
  border: 0;
  border-radius: 11px;
  background: var(--jade);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  box-shadow: 0 11px 22px rgba(23, 61, 47, 0.16);
}

.checkout-button:hover {
  background: var(--accent);
  box-shadow: 0 12px 24px rgba(180, 68, 36, 0.2);
}

.checkout-button .el-icon {
  margin-left: 7px;
  font-size: 12px;
}

.checkout-tip {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin: 11px 0 0;
  color: var(--text-faint);
  font-size: 8px;
  line-height: 1.7;
  text-align: center;
}

.checkout-tip .el-icon {
  flex-shrink: 0;
  margin-top: 1px;
  font-size: 10px;
}

.table-service {
  position: relative;
  margin-top: 15px;
  overflow: hidden;
  padding: 16px 17px;
  border: 1px solid rgba(37, 52, 42, 0.07);
  border-radius: 16px;
  background: rgba(255, 253, 248, 0.42);
}

.service-mark {
  position: absolute;
  right: 13px;
  top: 9px;
  color: rgba(37, 52, 42, 0.07);
  font-family: var(--font-serif);
  font-size: 46px;
}

.table-service p {
  position: relative;
  margin: 0;
  color: var(--text-muted);
  font-family: var(--font-serif);
  font-size: 11px;
  line-height: 1.8;
  letter-spacing: 0.035em;
}

.table-service small {
  display: block;
  margin-top: 7px;
  color: var(--text-faint);
  font-size: 8px;
}

.empty-cart {
  position: relative;
  display: flex;
  align-items: center;
  gap: clamp(36px, 8vw, 100px);
  min-height: 440px;
  overflow: hidden;
  padding: 50px clamp(30px, 8vw, 100px);
  border: 1px solid rgba(37, 52, 42, 0.07);
  border-radius: 27px;
  background:
    radial-gradient(circle at 85% 15%, rgba(211, 181, 137, 0.15), transparent 30%),
    rgba(255, 253, 248, 0.64);
}

.empty-cart::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(37, 52, 42, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37, 52, 42, 0.035) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: linear-gradient(90deg, transparent 30%, rgba(0, 0, 0, 0.7));
  pointer-events: none;
}

.empty-visual {
  position: relative;
  flex-shrink: 0;
  width: 250px;
}

.bowl-illustration {
  display: block;
  width: 100%;
  height: auto;
}

.empty-visual-seal {
  position: absolute;
  right: 27px;
  bottom: 4px;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(193, 124, 82, 0.3);
  border-radius: 8px;
  color: #b06e4a;
  font-family: var(--font-serif);
  font-size: 11px;
  line-height: 1.3;
  text-align: center;
  transform: rotate(7deg);
}

.empty-copy {
  position: relative;
  z-index: 1;
  max-width: 390px;
}

.empty-copy h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(30px, 3.8vw, 43px);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0.04em;
}

.empty-copy > p:not(.eyebrow) {
  margin: 13px 0 23px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.95;
}

.empty-action {
  min-width: 134px;
  height: 43px;
  border: 0;
  border-radius: 10px;
  background: var(--jade);
  font-size: 11px;
  letter-spacing: 0.08em;
  box-shadow: 0 10px 22px rgba(23, 61, 47, 0.15);
}

.empty-action:hover {
  background: var(--accent);
}

.empty-action .el-icon {
  margin-left: 7px;
  font-size: 12px;
}

.cart-fade-enter-active,
.cart-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.cart-fade-enter-from,
.cart-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.order-dialog :deep(.el-dialog) {
  overflow: hidden;
  border-radius: 24px;
  background: #fbf7ef;
  box-shadow: 0 30px 90px rgba(31, 35, 28, 0.24);
}

.order-dialog :deep(.el-dialog__header) {
  display: none;
}

.order-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.order-success {
  padding: 34px 30px 24px;
  text-align: center;
}

.success-mark {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin: 0 auto 18px;
  border-radius: 50%;
  color: #f8f1e1;
  background: var(--jade);
  font-size: 24px;
  box-shadow: 0 0 0 8px rgba(23, 61, 47, 0.07);
}

.order-success .eyebrow {
  margin-bottom: 8px;
}

.order-success h3 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 31px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.success-copy {
  margin: 10px auto 22px;
  color: var(--text-muted);
  font-size: 10px;
  line-height: 1.8;
}

.order-receipt {
  padding: 15px 17px;
  border: 1px dashed rgba(37, 52, 42, 0.16);
  border-radius: 13px;
  background: rgba(255, 253, 248, 0.62);
  text-align: left;
}

.order-receipt > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 5px 0;
}

.order-receipt span {
  color: var(--text-faint);
  font-size: 9px;
}

.order-receipt strong {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.receipt-total {
  margin-top: 6px;
  padding-top: 11px !important;
  border-top: 1px solid rgba(37, 52, 42, 0.09);
}

.receipt-total strong {
  color: var(--accent);
  font-size: 18px;
  font-weight: 700;
}

.success-button {
  width: 100%;
  height: 43px;
  margin-top: 19px;
  border: 0;
  border-radius: 10px;
  background: var(--jade);
  font-size: 11px;
  letter-spacing: 0.08em;
}

.success-button:hover {
  background: var(--accent);
}

.success-footnote {
  margin: 12px 0 0;
  color: var(--text-faint);
  font-size: 8px;
}

@media (max-width: 1060px) {
  .cart-layout {
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 18px;
  }

  .cart-list-head,
  .cart-item {
    grid-template-columns: minmax(0, 1fr) 62px 102px 74px 34px;
    gap: 9px;
    padding-left: 16px;
    padding-right: 16px;
  }

  .item-image-link {
    width: 66px;
    height: 61px;
  }

  .item-name {
    font-size: 16px;
  }
}

@media (max-width: 860px) {
  .page-container {
    padding: 24px 20px 0;
  }

  .cart-layout {
    grid-template-columns: 1fr;
  }

  .summary-column {
    position: static;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 0.7fr;
    gap: 15px;
    align-items: start;
  }

  .summary-card {
    order: 1;
  }

  .table-service {
    order: 2;
    margin-top: 0;
  }

  .empty-cart {
    flex-direction: column;
    gap: 12px;
    padding: 38px 24px;
    text-align: center;
  }

  .empty-visual {
    width: 190px;
  }

  .empty-copy > p:not(.eyebrow) {
    max-width: 380px;
    margin-left: auto;
    margin-right: auto;
  }
}

@media (max-width: 700px) {
  /* 底部悬浮购物球会盖住最后的按钮，页面预留一点下边距 */
  .cart-page {
    padding-bottom: 96px;
  }

  .page-container {
    padding: 18px 15px 0;
  }

  .cart-header {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 20px;
  }

  .cart-counter {
    display: none;
  }

  .cart-list {
    border-radius: 18px;
  }

  .cart-list-head {
    display: none;
  }

  .cart-item {
    position: relative;
    grid-template-columns: minmax(0, 1fr) 92px;
    grid-template-areas:
      'main main'
      'quantity total';
    gap: 13px;
    padding: 15px;
  }

  .item-main {
    grid-area: main;
  }

  .item-image-link {
    width: 82px;
    height: 74px;
  }

  .item-copy p {
    margin-bottom: 4px;
  }

  .item-name {
    font-size: 18px;
  }

  .item-mobile-price {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 4px;
  }

  .item-mobile-price span {
    color: var(--accent);
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 600;
  }

  .item-mobile-price del {
    color: var(--text-faint);
    font-family: var(--font-display);
    font-size: 8px;
  }

  .unit-price {
    display: none;
  }

  .quantity-cell {
    grid-area: quantity;
    justify-content: flex-start;
  }

  .line-total {
    grid-area: total;
    flex-direction: row;
    justify-content: flex-end;
    align-items: baseline;
    gap: 5px;
  }

  .line-total small {
    display: inline;
  }

  .line-total strong {
    font-size: 16px;
  }

  .remove-button {
    position: absolute;
    right: 11px;
    top: 11px;
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 50%;
    background: rgba(239, 232, 220, 0.65);
  }

  .remove-button .el-icon {
    font-size: 13px;
  }

  .cart-list-footer {
    padding: 13px 15px;
  }

  .summary-column {
    grid-template-columns: 1fr;
  }

  .table-service {
    order: 2;
  }
}

@media (max-width: 430px) {
  .item-image-link {
    width: 68px;
    height: 64px;
  }

  .item-copy p {
    display: none;
  }

  .empty-cart {
    padding: 32px 18px;
    border-radius: 22px;
  }

  .empty-visual {
    width: 160px;
  }

  .empty-copy h2 {
    font-size: 29px;
  }

  .order-dialog {
    width: calc(100vw - 24px) !important;
  }

  .order-success {
    padding: 28px 20px 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cart-fade-enter-active,
  .cart-fade-leave-active {
    transition: none;
  }
}
</style>
