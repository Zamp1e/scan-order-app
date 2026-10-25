<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Minus, Plus } from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'
import { resolveAsset } from '@/utils/asset'
import { formatPrice } from '@/utils/format'

const props = defineProps({
  dish: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['add', 'preview'])

const router = useRouter()
const cartStore = useCartStore()

const inCartCount = computed(() => cartStore.quantityOf(props.dish.id))
const image = computed(() => resolveAsset(props.dish.image))
const stockLeft = computed(() => Math.max(0, Math.floor(Number(props.dish.stock) || 0)))
const lowStock = computed(() => stockLeft.value > 0 && stockLeft.value <= 12)
const rating = computed(() => Number(props.dish.rating || 0).toFixed(1))
const tagline = computed(() =>
  Array.isArray(props.dish.tags) ? props.dish.tags.slice(0, 2).join(' · ') : '',
)

function openDetail() {
  router.push({ name: 'dish-detail', params: { id: props.dish.id } })
}

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
    class="menu-row"
    role="link"
    tabindex="0"
    :aria-label="`查看${dish.name}详情`"
    @click="openDetail"
    @mouseenter="$emit('preview', dish)"
    @keydown.enter.prevent="openDetail"
    @keydown.space.prevent="openDetail"
  >
    <img class="row-thumb" :src="image" :alt="dish.name" loading="lazy" />

    <div class="row-main">
      <h3 class="row-name">{{ dish.name }}</h3>
      <p class="row-spec">{{ dish.spec }}</p>
      <p class="row-meta">
        <span v-if="Number(dish.rating) > 0" class="row-rating">★ {{ rating }}</span>
        <span v-if="tagline" class="row-tags">{{ tagline }}</span>
        <span v-if="lowStock" class="row-low">仅剩 {{ stockLeft }} 份</span>
      </p>
    </div>

    <div class="row-side">
      <span class="row-price"><small>¥</small>{{ formatPrice(dish.price) }}</span>

      <div v-if="inCartCount > 0" class="row-stepper" role="group" :aria-label="`${dish.name} 数量`">
        <button type="button" aria-label="减少一份" @click="decrease">
          <el-icon><Minus /></el-icon>
        </button>
        <strong>{{ inCartCount }}</strong>
        <button type="button" aria-label="增加一份" @click="increase">
          <el-icon><Plus /></el-icon>
        </button>
      </div>

      <button
        v-else
        class="row-add"
        type="button"
        :disabled="stockLeft <= 0"
        :aria-label="`将${dish.name}加入购物车`"
        @click.stop="increase"
      >
        {{ stockLeft <= 0 ? '售罄' : '加入' }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.menu-row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 12px 2px;
  border-bottom: 1px solid var(--line-soft);
  cursor: pointer;
  outline: none;
  transition: background 0.18s ease;
}

.menu-row:hover,
.menu-row:focus-visible {
  background: rgba(26, 25, 23, 0.028);
}

.row-thumb {
  width: 64px;
  height: 64px;
  object-fit: cover;
  display: block;
  background: var(--cream-deep);
  transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.menu-row:hover .row-thumb {
  transform: scale(1.04);
}

.row-main {
  min-width: 0;
}

.row-name {
  margin: 0 0 4px;
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--ink);
}

.row-spec {
  margin: 0;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 5px 0 0;
  color: var(--text-faint);
  font-size: 10px;
  letter-spacing: 0.04em;
}

.row-rating {
  color: var(--text-muted);
}

.row-low {
  color: var(--jade);
}

.row-side {
  display: flex;
  align-items: center;
  gap: 16px;
}

.row-price {
  min-width: 62px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 17px;
  letter-spacing: 0.02em;
  text-align: right;
}

.row-price small {
  margin-right: 2px;
  color: var(--text-muted);
  font-size: 10px;
}

.row-add {
  min-width: 64px;
  padding: 7px 14px;
  border: 1px solid var(--jade);
  border-radius: 999px;
  background: transparent;
  color: var(--jade);
  font: inherit;
  font-size: 11px;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.row-add:hover:not(:disabled) {
  background: var(--jade);
  color: var(--paper);
}

.row-add:disabled {
  border-color: var(--line-soft);
  color: var(--text-faint);
  cursor: not-allowed;
}

.row-stepper {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--jade);
  border-radius: 999px;
}

.row-stepper button {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--jade);
  cursor: pointer;
}

.row-stepper button:hover {
  background: var(--jade-soft);
}

.row-stepper strong {
  min-width: 20px;
  font-family: var(--font-display);
  font-size: 13px;
  text-align: center;
}

@container (max-width: 900px) {
  .menu-row {
    grid-template-columns: 54px minmax(0, 1fr) auto;
    gap: 12px;
    padding: 12px 0;
  }

  .row-thumb {
    width: 54px;
    height: 54px;
  }

  .row-name {
    font-size: 16px;
  }

  .row-side {
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  .row-price {
    min-width: 0;
    font-size: 15px;
  }

  .row-add {
    min-width: 0;
    padding: 5px 12px;
  }
}
</style>
