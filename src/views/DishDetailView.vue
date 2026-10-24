<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  Refresh,
  ShoppingCart,
  StarFilled,
} from '@element-plus/icons-vue'
import DishCard from '@/components/DishCard.vue'
import { useCartStore } from '@/stores/cart'
import { useMenuStore } from '@/stores/menu'
import { resolveAsset } from '@/utils/asset'
import { formatMoney, formatPrice, formatSales } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const menuStore = useMenuStore()
const cartStore = useCartStore()

const quantity = ref(0)

const dish = computed(() => menuStore.dishById(route.params.id))
const category = computed(() =>
  menuStore.categories.find((item) => item.id === dish.value?.categoryId),
)
const imageUrl = computed(() => resolveAsset(dish.value?.image))
const cartQuantity = computed(() => (dish.value ? cartStore.quantityOf(dish.value.id) : 0))
const stockLeft = computed(() => Math.max(0, Math.floor(Number(dish.value?.stock) || 0)))
const soldOut = computed(() => !dish.value || stockLeft.value <= 0)
const maxSelectable = computed(() => Math.max(0, stockLeft.value - cartQuantity.value))
const ratingText = computed(() => Number(dish.value?.rating || 0).toFixed(1))
const salePrice = computed(() => Number(dish.value?.price) || 0)
const originalPrice = computed(() => Number(dish.value?.originalPrice) || salePrice.value)
const hasDiscount = computed(() => originalPrice.value > salePrice.value)
const spicyLevel = computed(() => Math.min(3, Math.max(0, Number(dish.value?.spicyLevel) || 0)))
const dishTags = computed(() =>
  Array.isArray(dish.value?.tags) ? dish.value.tags.filter(Boolean) : [],
)
const specText = computed(() => dish.value?.spec || '每日现做')
const dishDescription = computed(() => dish.value?.description || '今日新鲜食材，厨房现点现做。')
const spiceText = computed(() => {
  const labels = ['不辣', '微辣', '中辣', '特辣']
  return labels[spicyLevel.value]
})
const discountLabel = computed(() => {
  if (!hasDiscount.value) return ''
  const discount = (salePrice.value / originalPrice.value) * 10
  return `${discount.toFixed(1).replace(/\.0$/, '')} 折`
})
const quantitySubtotal = computed(() => formatMoney(salePrice.value * quantity.value))
const relatedDishes = computed(() => {
  if (!dish.value) return []
  return menuStore.dishes
    .filter((item) => item.categoryId === dish.value.categoryId && item.id !== dish.value.id)
    .slice(0, 3)
})
const isLoading = computed(() => !menuStore.loaded && !menuStore.error)
const hasError = computed(() => Boolean(menuStore.error) && !menuStore.loaded)

function goBack() {
  // 优先返回上一页，直接打开分享链接时回退到菜单首页。
  if (window.history.state?.back) {
    router.back()
    return
  }
  router.push({ name: 'home' })
}

function handleAdd() {
  if (!dish.value) return

  if (quantity.value <= 0) {
    ElMessage.warning('请先选择点餐数量')
    return
  }

  const result = cartStore.addItem(dish.value, quantity.value)
  if (!result.ok) {
    ElMessage.warning(
      result.reason === 'sold-out' ? '这道菜今日已售罄' : '购物车数量已达库存上限',
    )
    return
  }

  ElMessage.success(`${dish.value.name} × ${result.added} 已加入购物车`)
  router.push({ name: 'cart' })
}

// 每次进入详情页都从 0 开始；已加购数量通过购物车提示呈现，避免重复计算。
watch(
  () => route.params.id,
  () => {
    quantity.value = 0
  },
)

function handleRelatedAdd(item) {
  const result = cartStore.addItem(item, 1)
  if (result.ok) {
    ElMessage({ message: `${item.name} 已加入购物车`, type: 'success', duration: 1500 })
    return
  }
  ElMessage.warning(
    result.reason === 'sold-out' ? `${item.name} 今日已售罄` : `${item.name} 已达库存上限`,
  )
}

onMounted(() => {
  menuStore.loadMenu()
})
</script>

<template>
  <main class="detail-page">
    <div class="page-container">
      <div class="detail-topbar">
        <button class="back-link" type="button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回菜单
        </button>
        <nav class="breadcrumb" aria-label="面包屑导航">
          <RouterLink to="/home">今日菜单</RouterLink>
          <span>/</span>
          <span>{{ category?.name || '菜品详情' }}</span>
          <span>/</span>
          <em>{{ dish?.name || '详情' }}</em>
        </nav>
      </div>

      <div v-if="isLoading" class="detail-skeleton">
        <div class="detail-skeleton-media shimmer"></div>
        <div class="detail-skeleton-info">
          <span class="skeleton-line eyebrow-line shimmer"></span>
          <span class="skeleton-line heading-line shimmer"></span>
          <span class="skeleton-line text-line shimmer"></span>
          <span class="skeleton-line text-line short shimmer"></span>
          <span class="skeleton-line price-line shimmer"></span>
          <span class="skeleton-block shimmer"></span>
        </div>
      </div>

      <div v-else-if="hasError" class="detail-state" role="alert">
        <div class="state-icon"><el-icon><Refresh /></el-icon></div>
        <h2>菜品信息没有加载出来</h2>
        <p>{{ menuStore.error }}</p>
        <el-button type="primary" round @click="menuStore.loadMenu(true)">重新加载</el-button>
      </div>

      <div v-else-if="!dish" class="detail-state">
        <div class="state-icon"><el-icon><Refresh /></el-icon></div>
        <h2>这道菜暂时不在菜单里</h2>
        <p>菜单可能已经更新，回首页看看今天还有什么好菜。</p>
        <el-button type="primary" round @click="goBack">回到今日菜单</el-button>
      </div>

      <template v-else>
        <section class="detail-card" aria-labelledby="dish-heading">
          <div class="detail-media">
            <img :src="imageUrl" :alt="dish.name" />
            <div class="media-gradient"></div>
            <button class="media-back" type="button" aria-label="返回菜单" @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
            </button>
            <span v-if="dish.badge" class="detail-badge">{{ dish.badge }}</span>
            <div class="media-caption">
              <span class="caption-label">CHEF'S CHOICE</span>
              <strong>{{ dish.name }}</strong>
              <small>{{ specText }}</small>
            </div>
            <span class="media-seal">灶边<br />现做</span>
          </div>

          <div class="detail-info">
            <div class="detail-eyebrow">
              <span class="category-glyph">{{ category?.glyph || '食' }}</span>
              <span>{{ category?.name || '今日菜单' }}</span>
              <i></i>
              <span>ZAOBIAN KITCHEN</span>
            </div>

            <div class="detail-title-row">
              <h1 id="dish-heading">{{ dish.name }}</h1>
              <span v-if="spicyLevel" class="spicy-meter" :title="spiceText">
                <i v-for="index in 3" :key="index" :class="{ on: index <= spicyLevel }"></i>
                <em>{{ spiceText }}</em>
              </span>
            </div>

            <div class="rating-line">
              <span v-if="Number(dish.rating) > 0" class="rating-score">
                <el-icon><StarFilled /></el-icon>
                {{ ratingText }}
              </span>
              <span v-if="Number(dish.rating) > 0" class="rating-divider"></span>
              <span>月售 {{ formatSales(dish.monthlySales) }} 份</span>
              <span class="rating-divider"></span>
              <span>库存 {{ stockLeft }} {{ dish.unit || '份' }}</span>
            </div>

            <p class="spec-line">
              <span>规格</span>
              {{ specText }}
            </p>

            <p class="dish-description">{{ dishDescription }}</p>

            <div v-if="dishTags.length" class="tag-row">
              <span v-for="tag in dishTags" :key="tag" class="dish-tag">{{ tag }}</span>
            </div>

            <div class="detail-divider"></div>

            <div class="price-row">
              <div class="price-main">
                <span class="price-label">今日优惠价</span>
                <div>
                  <strong><small>¥</small>{{ formatPrice(salePrice) }}</strong>
                  <del v-if="hasDiscount">原价 ¥{{ formatPrice(originalPrice) }}</del>
                  <span v-if="discountLabel" class="discount-chip">{{ discountLabel }}</span>
                </div>
              </div>
              <div class="fresh-note">
                <span class="fresh-dot"></span>
                {{ soldOut ? '今日已售罄' : '今日可点' }}
              </div>
            </div>

            <div class="order-panel">
              <div class="quantity-heading">
                <div>
                  <strong>点餐数量</strong>
                  <small v-if="soldOut">今日已售罄</small>
                  <small v-else-if="maxSelectable === 0">
                    购物车已达库存上限（{{ stockLeft }} {{ dish.unit || '份' }}）
                  </small>
                  <small v-else>
                    购物车已有 {{ cartQuantity }} 份，本单最多可加 {{ maxSelectable }} 份
                  </small>
                </div>
                <span class="quantity-subtotal">小计 ¥{{ quantitySubtotal }}</span>
              </div>

              <div class="order-actions">
                <el-input-number
                  v-model="quantity"
                  class="quantity-input"
                  :min="0"
                  :max="maxSelectable"
                  :disabled="soldOut || maxSelectable === 0"
                  size="large"
                  aria-label="点餐数量"
                />
                <el-button
                  class="add-to-cart"
                  type="primary"
                  size="large"
                  :disabled="soldOut || maxSelectable === 0 || quantity === 0"
                  @click="handleAdd"
                >
                  <el-icon><ShoppingCart /></el-icon>
                  {{ soldOut || maxSelectable === 0 ? '暂时无法加购' : '加入购物车' }}
                  <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                </el-button>
              </div>

              <p class="order-tip">加入后将跳转至购物车，可继续调整数量或移除菜品。</p>
            </div>
          </div>
        </section>

        <section class="chef-section">
          <div class="chef-note">
            <span class="chef-mark">“</span>
            <div>
              <p class="section-eyebrow">A NOTE FROM THE KITCHEN</p>
              <h2>主厨的话</h2>
              <p class="chef-copy">
                {{ dishDescription }}
                我们相信好味道不需要太多修饰，食材新鲜、火候准确，就能让人吃得满足。
              </p>
            </div>
            <span class="chef-sign">灶边主厨<br /><i>敬上</i></span>
          </div>

          <div class="benefit-grid">
            <div class="benefit-item">
              <span class="benefit-index">01</span>
              <strong>当日鲜采</strong>
              <p>每日清晨备料，卖完即止，不隔夜。</p>
            </div>
            <div class="benefit-item">
              <span class="benefit-index">02</span>
              <strong>现点现炒</strong>
              <p>下单后厨房开火，把镬气留在盘里。</p>
            </div>
            <div class="benefit-item">
              <span class="benefit-index">03</span>
              <strong>安心用餐</strong>
              <p>明档厨房，食材来源清晰可追溯。</p>
            </div>
          </div>
        </section>

        <section v-if="relatedDishes.length" class="related-section">
          <header class="related-heading">
            <div>
              <p class="section-eyebrow">YOU MAY ALSO LIKE</p>
              <h2>同桌的人还点了</h2>
            </div>
            <RouterLink to="/home" class="related-more">
              查看全部
              <el-icon><ArrowRight /></el-icon>
            </RouterLink>
          </header>

          <div class="related-grid">
            <DishCard
              v-for="item in relatedDishes"
              :key="item.id"
              :dish="item"
              @add="handleRelatedAdd"
            />
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.detail-page {
  padding-bottom: 12px;
}

.page-container {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 26px 28px 0;
}

.detail-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px 7px 7px;
  border: 1px solid rgba(37, 52, 42, 0.09);
  border-radius: 9px;
  color: var(--text-muted);
  background: rgba(255, 253, 248, 0.55);
  font-family: var(--font-sans);
  font-size: 10px;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.back-link:hover {
  color: var(--accent);
  border-color: rgba(207, 77, 43, 0.25);
  transform: translateX(-2px);
}

.back-link .el-icon {
  font-size: 12px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  color: var(--text-faint);
  font-size: 9px;
  white-space: nowrap;
}

.breadcrumb a {
  color: var(--text-muted);
}

.breadcrumb a:hover {
  color: var(--accent);
}

.breadcrumb em {
  overflow: hidden;
  max-width: 120px;
  color: var(--ink);
  font-style: normal;
  text-overflow: ellipsis;
}

.detail-card {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  overflow: hidden;
  border: 1px solid rgba(37, 52, 42, 0.07);
  border-radius: 30px;
  background: rgba(255, 253, 248, 0.85);
  box-shadow: 0 28px 70px rgba(67, 48, 27, 0.09);
}

.detail-media {
  position: relative;
  min-height: 580px;
  overflow: hidden;
  background: #e5ceb1;
}

.detail-media > img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-gradient {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top, rgba(13, 32, 24, 0.7), transparent 45%),
    linear-gradient(140deg, rgba(21, 43, 33, 0.08), transparent 50%);
}

.detail-badge {
  position: absolute;
  top: 24px;
  left: 24px;
  padding: 7px 11px;
  border: 1px solid rgba(255, 249, 238, 0.25);
  border-radius: 8px;
  color: #fff7e8;
  background: rgba(22, 48, 36, 0.66);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  backdrop-filter: blur(9px);
}

.media-back {
  position: absolute;
  top: 20px;
  right: 20px;
  display: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 249, 238, 0.24);
  border-radius: 10px;
  color: #fff7e8;
  background: rgba(22, 48, 36, 0.6);
  font-size: 14px;
  cursor: pointer;
  backdrop-filter: blur(9px);
}

.media-caption {
  position: absolute;
  left: 29px;
  bottom: 27px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: #f9f1e3;
}

.caption-label {
  color: #ddb478;
  font-family: var(--font-display);
  font-size: 8px;
  letter-spacing: 0.2em;
}

.media-caption strong {
  font-family: var(--font-serif);
  font-size: 26px;
  letter-spacing: 0.08em;
}

.media-caption small {
  color: rgba(249, 241, 227, 0.5);
  font-size: 9px;
  letter-spacing: 0.04em;
}

.media-seal {
  position: absolute;
  right: 26px;
  bottom: 26px;
  display: grid;
  place-items: center;
  width: 57px;
  height: 57px;
  border: 1px solid rgba(244, 216, 173, 0.45);
  border-radius: 50%;
  color: #f3d6a9;
  font-family: var(--font-serif);
  font-size: 11px;
  line-height: 1.45;
  text-align: center;
  letter-spacing: 0.1em;
  transform: rotate(8deg);
}

.detail-info {
  display: flex;
  flex-direction: column;
  padding: 36px 39px 33px;
}

.detail-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-faint);
  font-family: var(--font-display);
  font-size: 8px;
  letter-spacing: 0.12em;
}

.detail-eyebrow .category-glyph {
  display: grid;
  place-items: center;
  width: 27px;
  height: 27px;
  border-radius: 7px;
  color: var(--accent);
  background: rgba(207, 77, 43, 0.075);
  font-family: var(--font-serif);
  font-size: 14px;
}

.detail-eyebrow i {
  width: 18px;
  height: 1px;
  background: rgba(37, 52, 42, 0.16);
}

.detail-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 17px;
}

.detail-title-row h1 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(32px, 3.4vw, 43px);
  font-weight: 600;
  line-height: 1.18;
  letter-spacing: 0.04em;
}

.spicy-meter {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 7px;
  border-radius: 999px;
  background: rgba(198, 75, 43, 0.065);
}

.spicy-meter i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(193, 86, 55, 0.2);
}

.spicy-meter i.on {
  background: #c95432;
}

.spicy-meter em {
  margin-left: 3px;
  color: #b95838;
  font-size: 8px;
  font-style: normal;
}

.rating-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 10px;
}

.rating-score {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #a4732d;
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 600;
}

.rating-score .el-icon {
  color: #d8a545;
  font-size: 11px;
}

.rating-divider {
  width: 1px;
  height: 10px;
  background: rgba(37, 52, 42, 0.15);
}

.spec-line {
  margin: 21px 0 0;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.8;
}

.spec-line span {
  display: inline-block;
  margin-right: 9px;
  padding: 2px 5px;
  border-radius: 4px;
  color: var(--accent);
  background: rgba(207, 77, 43, 0.06);
  font-size: 8px;
}

.dish-description {
  margin: 15px 0 0;
  color: #737972;
  font-size: 12px;
  line-height: 2;
  letter-spacing: 0.015em;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
}

.dish-tag {
  padding: 4px 8px;
  border: 1px solid rgba(37, 52, 42, 0.09);
  border-radius: 5px;
  color: var(--text-muted);
  font-size: 8px;
}

.detail-divider {
  height: 1px;
  margin: 23px 0 19px;
  background: linear-gradient(90deg, rgba(37, 52, 42, 0.1), transparent);
}

.price-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.price-label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-faint);
  font-size: 8px;
  letter-spacing: 0.08em;
}

.price-main > div {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

.price-main strong {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
}

.price-main strong small {
  margin-right: 2px;
  font-size: 16px;
  letter-spacing: 0;
}

.price-main del {
  color: #aeaaa1;
  font-family: var(--font-display);
  font-size: 10px;
}

.discount-chip {
  padding: 3px 6px;
  border-radius: 5px;
  color: #ae4d2f;
  background: rgba(207, 77, 43, 0.075);
  font-family: var(--font-display);
  font-size: 8px;
}

.fresh-note {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 3px;
  color: var(--text-muted);
  font-size: 9px;
}

.fresh-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5c9762;
  box-shadow: 0 0 0 4px rgba(92, 151, 98, 0.1);
}

.order-panel {
  margin-top: auto;
  padding: 18px 19px 14px;
  border: 1px solid rgba(37, 52, 42, 0.075);
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(255, 253, 248, 0.82), rgba(241, 234, 221, 0.55));
}

.quantity-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 13px;
}

.quantity-heading > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.quantity-heading strong {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 13px;
  letter-spacing: 0.04em;
}

.quantity-heading small {
  color: var(--text-faint);
  font-size: 8px;
  line-height: 1.5;
}

.quantity-subtotal {
  color: var(--text-muted);
  font-family: var(--font-display);
  font-size: 9px;
  white-space: nowrap;
}

.order-actions {
  display: flex;
  gap: 10px;
}

.quantity-input {
  flex: 0 0 121px;
  width: 121px;
}

.quantity-input :deep(.el-input__wrapper) {
  height: 45px;
  padding: 0 9px;
  border-radius: 11px;
  background: #fffdf8;
  box-shadow: 0 0 0 1px rgba(37, 52, 42, 0.1) inset;
}

.quantity-input :deep(.el-input-number__decrease),
.quantity-input :deep(.el-input-number__increase) {
  width: 31px;
  color: var(--ink);
  background: transparent;
}

.quantity-input :deep(.el-input-number__decrease:hover),
.quantity-input :deep(.el-input-number__increase:hover) {
  color: var(--accent);
}

.quantity-input :deep(.el-input__inner) {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 600;
}

.add-to-cart {
  flex: 1;
  height: 45px;
  border: 0;
  border-radius: 11px;
  background: var(--jade);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  box-shadow: 0 10px 22px rgba(23, 61, 47, 0.16);
}

.add-to-cart:hover:not(.is-disabled) {
  background: var(--accent);
  box-shadow: 0 12px 24px rgba(180, 68, 36, 0.2);
}

.add-to-cart .el-icon {
  margin-right: 6px;
  font-size: 14px;
}

.add-to-cart .arrow-icon {
  margin-right: 0;
  margin-left: 8px;
  font-size: 12px;
}

.add-to-cart.is-disabled {
  color: #9f9b92;
  background: #e5dfd4;
  box-shadow: none;
}

.order-tip {
  margin: 10px 0 0;
  color: var(--text-faint);
  font-size: 8px;
  line-height: 1.6;
  text-align: center;
}

.chef-section {
  margin-top: 35px;
}

.chef-note {
  position: relative;
  display: flex;
  gap: 25px;
  padding: 29px 31px;
  overflow: hidden;
  border: 1px solid rgba(37, 52, 42, 0.07);
  border-radius: 22px;
  background: rgba(255, 253, 248, 0.48);
}

.chef-mark {
  position: absolute;
  right: 28px;
  top: -12px;
  color: rgba(23, 61, 47, 0.075);
  font-family: var(--font-serif);
  font-size: 130px;
  line-height: 1;
}

.section-eyebrow {
  margin: 0 0 9px;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 8px;
  letter-spacing: 0.18em;
}

.chef-note h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.chef-copy {
  max-width: 680px;
  margin: 10px 0 0;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 2;
}

.chef-sign {
  flex-shrink: 0;
  margin-left: auto;
  align-self: flex-end;
  padding: 0 5px 3px;
  border-bottom: 1px solid rgba(37, 52, 42, 0.2);
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 11px;
  line-height: 1.5;
  text-align: right;
  white-space: nowrap;
  transform: rotate(-3deg);
}

.chef-sign i {
  color: var(--accent);
  font-size: 9px;
  font-style: normal;
}

.benefit-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  margin-top: 17px;
  overflow: hidden;
  border: 1px solid rgba(37, 52, 42, 0.07);
  border-radius: 18px;
  background: rgba(37, 52, 42, 0.07);
}

.benefit-item {
  padding: 21px 23px;
  background: rgba(250, 247, 240, 0.94);
}

.benefit-index {
  display: block;
  margin-bottom: 13px;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 8px;
  letter-spacing: 0.16em;
}

.benefit-item strong {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 15px;
  letter-spacing: 0.05em;
}

.benefit-item p {
  margin: 6px 0 0;
  color: var(--text-faint);
  font-size: 9px;
  line-height: 1.8;
}

.related-section {
  margin-top: 44px;
}

.related-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(37, 52, 42, 0.09);
}

.related-heading h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 27px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.related-more {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
  font-size: 9px;
}

.related-more:hover {
  color: var(--accent);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 19px;
}

.detail-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 440px;
  padding: 40px 24px;
  border: 1px dashed rgba(37, 52, 42, 0.14);
  border-radius: 28px;
  background: rgba(255, 253, 248, 0.5);
  text-align: center;
}

.state-icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin-bottom: 17px;
  border-radius: 50%;
  color: var(--accent);
  background: rgba(207, 77, 43, 0.075);
  font-size: 22px;
}

.detail-state h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 600;
}

.detail-state p {
  max-width: 380px;
  margin: 9px 0 20px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.9;
}

.detail-state :deep(.el-button) {
  border-color: var(--jade);
  background: var(--jade);
}

.detail-skeleton {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  min-height: 580px;
  overflow: hidden;
  border: 1px solid rgba(37, 52, 42, 0.06);
  border-radius: 30px;
  background: rgba(255, 253, 248, 0.6);
}

.detail-skeleton-media {
  min-height: 580px;
  background: #e9ddcb;
}

.detail-skeleton-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 45px 39px;
}

.skeleton-line {
  display: block;
  height: 12px;
  border-radius: 5px;
  background: #ece3d5;
}

.eyebrow-line {
  width: 37%;
  height: 9px;
}

.heading-line {
  width: 56%;
  height: 42px;
  margin: 3px 0 9px;
}

.text-line {
  width: 88%;
  height: 10px;
}

.text-line.short {
  width: 70%;
}

.price-line {
  width: 32%;
  height: 34px;
  margin-top: 14px;
}

.skeleton-block {
  width: 100%;
  height: 132px;
  margin-top: auto;
  border-radius: 16px;
  background: #efe6d8;
}

.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  animation: shimmer-move 1.5s infinite;
  transform: translateX(-100%);
}

@keyframes shimmer-move {
  to {
    transform: translateX(100%);
  }
}

@media (max-width: 1050px) {
  .detail-card,
  .detail-skeleton {
    grid-template-columns: minmax(0, 0.84fr) minmax(0, 1.16fr);
  }

  .detail-info {
    padding: 30px;
  }

  .detail-media,
  .detail-skeleton-media {
    min-height: 540px;
  }

  .detail-skeleton-info {
    padding: 36px 30px;
  }
}

@media (max-width: 880px) {
  .page-container {
    padding: 20px 20px 0;
  }

  .detail-card,
  .detail-skeleton {
    grid-template-columns: 1fr;
  }

  .detail-media,
  .detail-skeleton-media {
    min-height: auto;
    aspect-ratio: 4 / 3;
  }

  .detail-skeleton-info {
    min-height: 500px;
  }

  .detail-info {
    padding: 29px;
  }

  .order-panel {
    margin-top: 27px;
  }

  .benefit-grid {
    grid-template-columns: 1fr;
  }

  .related-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  /* 给底部悬浮购物球留出空间，避免遮住“加入购物车”按钮 */
  .detail-page {
    padding-bottom: 96px;
  }

  .page-container {
    padding: 14px 15px 0;
  }

  .detail-topbar {
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .detail-topbar .back-link {
    display: none;
  }

  .detail-badge {
    top: 18px;
    left: 18px;
  }

  .media-back {
    display: grid;
  }

  .breadcrumb {
    display: none;
  }

  .detail-card {
    border-radius: 22px;
  }

  .detail-media {
    aspect-ratio: 1 / 0.92;
  }

  .media-caption {
    left: 20px;
    bottom: 19px;
  }

  .media-caption strong {
    font-size: 22px;
  }

  .media-seal {
    right: 19px;
    bottom: 19px;
    width: 49px;
    height: 49px;
    font-size: 9px;
  }

  .detail-info {
    padding: 23px 19px;
  }

  .detail-title-row h1 {
    font-size: 31px;
  }

  .order-actions {
    flex-direction: column;
  }

  .quantity-input {
    width: 140px;
    flex-basis: auto;
  }

  .add-to-cart {
    width: 100%;
  }

  .chef-note {
    flex-wrap: wrap;
    gap: 16px;
    padding: 23px 20px;
  }

  .chef-sign {
    margin-left: 0;
  }

  .benefit-item {
    padding: 18px;
  }

  .related-heading h2 {
    font-size: 23px;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shimmer::after {
    animation: none;
  }
}
</style>
