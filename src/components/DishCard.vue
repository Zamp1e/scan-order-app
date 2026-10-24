<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Minus, Plus, StarFilled } from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'
import { resolveAsset } from '@/utils/asset'
import { formatPrice, formatSales } from '@/utils/format'

const props = defineProps({
  dish: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['add'])

const router = useRouter()
const cartStore = useCartStore()

const imageUrl = computed(() => resolveAsset(props.dish.image))
const inCartCount = computed(() => cartStore.quantityOf(props.dish.id))
const soldOut = computed(() => Number(props.dish.stock) <= 0)
const stockLeft = computed(() => Math.max(0, Math.floor(Number(props.dish.stock) || 0)))
const ratingText = computed(() => Number(props.dish.rating || 0).toFixed(1))
const tagText = computed(() =>
  Array.isArray(props.dish.tags) ? props.dish.tags.slice(0, 2).join(' · ') : '',
)
const originalPrice = computed(() => Number(props.dish.originalPrice) || 0)
const salePrice = computed(() => Number(props.dish.price) || 0)
const hasDiscount = computed(() => originalPrice.value > salePrice.value)
const discountLabel = computed(() => {
  if (!hasDiscount.value) return ''
  const discount = (salePrice.value / originalPrice.value) * 10
  return `${discount.toFixed(1).replace(/\.0$/, '')}折`
})
const lowStock = computed(() => stockLeft.value > 0 && stockLeft.value <= 12)

function goDetail() {
  router.push({ name: 'dish-detail', params: { id: props.dish.id } })
}

/**
 * 卡片上的数量增减与购物车（含购物详情抽屉）共用同一份 store，
 * 任何一处改动都会立刻反映到另一处。
 */
function increase(event) {
  event.stopPropagation()
  emit('add', props.dish)
}

function decrease(event) {
  event.stopPropagation()
  const next = inCartCount.value - 1
  if (next <= 0) {
    cartStore.removeItem(props.dish.id)
    ElMessage.info(`${props.dish.name} 已从购物车移除`)
    return
  }
  cartStore.setQuantity(props.dish.id, next)
}
</script>

<template>
  <article
    class="dish-card"
    role="link"
    tabindex="0"
    :aria-label="`查看${dish.name}详情`"
    @click="goDetail"
    @keydown.enter.prevent="goDetail"
    @keydown.space.prevent="goDetail"
  >
    <div class="dish-media">
      <img :src="imageUrl" :alt="dish.name" loading="lazy" />
      <span v-if="dish.badge" class="dish-badge">{{ dish.badge }}</span>
      <span v-if="inCartCount" class="in-cart-mark">已选 {{ inCartCount }}</span>
      <span class="image-shade"></span>
    </div>

    <div class="dish-body">
      <div class="dish-title-row">
        <h3>{{ dish.name }}</h3>
        <span class="dish-sales">月售 {{ formatSales(dish.monthlySales) }}</span>
      </div>

      <p class="dish-spec">{{ dish.spec }}</p>

      <div class="dish-meta">
        <span v-if="Number(dish.rating) > 0" class="rating">
          <el-icon><StarFilled /></el-icon>
          {{ ratingText }}
        </span>
        <span v-if="tagText" class="tag-line">{{ tagText }}</span>
        <span v-if="lowStock" class="stock-warning">仅剩 {{ stockLeft }} 份</span>
      </div>

      <div class="dish-footer">
        <div class="price-block">
          <span class="current-price"><small>¥</small>{{ formatPrice(salePrice) }}</span>
          <del v-if="hasDiscount">¥{{ formatPrice(originalPrice) }}</del>
          <span v-if="discountLabel" class="discount-pill">{{ discountLabel }}</span>
        </div>

        <div v-if="inCartCount > 0" class="card-stepper" role="group" :aria-label="`${dish.name} 已选 ${inCartCount} 份`">
          <button type="button" aria-label="减少一份" @click="decrease">
            <el-icon><Minus /></el-icon>
          </button>
          <strong>{{ inCartCount }}</strong>
          <button
            type="button"
            aria-label="增加一份"
            :disabled="inCartCount >= stockLeft"
            @click="increase"
          >
            <el-icon><Plus /></el-icon>
          </button>
        </div>

        <button
          v-else
          class="add-button"
          type="button"
          :disabled="soldOut"
          :aria-label="soldOut ? `${dish.name}已售罄` : `将${dish.name}加入购物车`"
          @click.stop="$emit('add', dish)"
        >
          <el-icon v-if="!soldOut"><Plus /></el-icon>
          <span>{{ soldOut ? '售罄' : '加入' }}</span>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.dish-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(43, 58, 47, 0.075);
  border-radius: 22px;
  background: rgba(255, 253, 248, 0.92);
  box-shadow: 0 14px 34px rgba(66, 49, 31, 0.055);
  cursor: pointer;
  outline: none;
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
    border-color 0.28s ease;
}

.dish-card:hover {
  transform: translateY(-5px);
  border-color: rgba(43, 58, 47, 0.13);
  box-shadow: 0 24px 46px rgba(66, 49, 31, 0.11);
}

.dish-card:focus-visible {
  box-shadow:
    0 0 0 3px rgba(207, 77, 43, 0.24),
    0 24px 46px rgba(66, 49, 31, 0.11);
}

.dish-media {
  position: relative;
  aspect-ratio: 4 / 2.8;
  overflow: hidden;
  background: #ead8bf;
}

.dish-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.55s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.dish-card:hover .dish-media img {
  transform: scale(1.045);
}

.image-shade {
  position: absolute;
  inset: auto 0 0;
  height: 34%;
  background: linear-gradient(transparent, rgba(30, 25, 17, 0.22));
  pointer-events: none;
}

.dish-badge {
  position: absolute;
  top: 13px;
  left: 13px;
  z-index: 1;
  padding: 5px 9px;
  border: 1px solid rgba(255, 250, 240, 0.24);
  border-radius: 7px;
  color: #fff7e8;
  background: rgba(28, 52, 40, 0.75);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  backdrop-filter: blur(9px);
}

.in-cart-mark {
  position: absolute;
  right: 13px;
  top: 13px;
  z-index: 1;
  padding: 5px 8px;
  border-radius: 7px;
  color: #8f3c21;
  background: rgba(255, 244, 224, 0.9);
  font-size: 9px;
  font-weight: 600;
  backdrop-filter: blur(9px);
}

.dish-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 17px 17px 16px;
}

.dish-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.dish-title-row h3 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.02em;
}

.dish-sales {
  flex-shrink: 0;
  padding-top: 3px;
  color: var(--text-faint);
  font-family: var(--font-display);
  font-size: 9px;
  letter-spacing: 0.01em;
}

.dish-spec {
  display: -webkit-box;
  min-height: 34px;
  margin: 7px 0 10px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.dish-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 17px;
  margin-bottom: 14px;
  overflow: hidden;
  color: var(--text-faint);
  font-size: 9px;
  white-space: nowrap;
}

.rating {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #a97734;
  font-family: var(--font-display);
  font-size: 9px;
  font-weight: 600;
}

.rating .el-icon {
  color: #d8a646;
  font-size: 10px;
}

.tag-line {
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-warning {
  margin-left: auto;
  color: #bd5d3c;
  font-size: 9px;
}

.dish-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px dashed rgba(43, 58, 47, 0.09);
}

.price-block {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 5px;
}

.current-price {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.035em;
}

.current-price small {
  margin-right: 2px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
}

.price-block del {
  color: #b2ada3;
  font-family: var(--font-display);
  font-size: 10px;
}

.discount-pill {
  padding: 2px 4px;
  border-radius: 4px;
  color: #ad4b2e;
  background: rgba(205, 82, 45, 0.08);
  font-size: 8px;
}

.add-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 31px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  color: #fff8ec;
  background: var(--jade);
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.add-button:hover:not(:disabled) {
  background: var(--accent);
  box-shadow: 0 8px 16px rgba(180, 68, 36, 0.22);
  transform: translateY(-1px);
}

.add-button:active:not(:disabled) {
  transform: translateY(0);
}

.add-button:disabled {
  color: #99958c;
  background: #e4ded3;
  cursor: not-allowed;
}

.add-button .el-icon {
  font-size: 12px;
}

/* 已在购物车中：加入按钮换成数量步进器 */
.card-stepper {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 31px;
  padding: 0 3px;
  border: 1px solid rgba(23, 61, 47, 0.16);
  border-radius: 10px;
  background: rgba(255, 253, 248, 0.95);
  box-shadow: 0 6px 14px rgba(23, 61, 47, 0.08);
}

.card-stepper button {
  display: grid;
  place-items: center;
  width: 25px;
  height: 25px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  color: var(--jade);
  background: transparent;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.card-stepper button:hover:not(:disabled) {
  color: var(--accent);
  background: rgba(201, 78, 43, 0.1);
}

.card-stepper button:disabled {
  color: #b9b6ad;
  cursor: not-allowed;
}

.card-stepper button .el-icon {
  font-size: 12px;
}

.card-stepper strong {
  min-width: 20px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

@media (max-width: 640px) {
  .dish-card {
    border-radius: 18px;
  }

  .dish-body {
    padding: 14px;
  }

  .dish-title-row h3 {
    font-size: 18px;
  }

  .current-price {
    font-size: 22px;
  }
}
</style>
