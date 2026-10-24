<script setup>
import { ref, watch } from 'vue'

/**
 * 购物车数量输入。
 * Element Plus 的 InputNumber 在“外部值未变化”时不会重置内部输入框：
 * 例如已到库存上限 36，用户再键入 999，store 仍是 36，输入框却残留 999。
 * 这里维护一份内部值，在越界时立即回写合法值，保证界面与购物车数据始终一致。
 */
const props = defineProps({
  modelValue: {
    type: Number,
    default: 1,
  },
  max: {
    type: Number,
    default: 99,
  },
  min: {
    type: Number,
    default: 1,
  },
  label: {
    type: String,
    default: '菜品数量',
  },
})

const emit = defineEmits(['change'])

const inner = ref(Math.min(Math.max(props.modelValue, props.min), props.max))

watch(
  () => props.modelValue,
  (value) => {
    inner.value = Math.min(Math.max(Number(value) || props.min, props.min), props.max)
  },
)

watch(
  () => props.max,
  (max) => {
    if (inner.value > max) inner.value = Math.max(props.min, max)
  },
)

function handleChange(value) {
  const next = Math.floor(Number(value))
  const safe = Number.isFinite(next) ? Math.min(Math.max(next, props.min), props.max) : props.min

  // 无论是否越界都回写一次：越界时纠正输入框，合法时保持同步。
  inner.value = safe
  emit('change', safe)
}
</script>

<template>
  <el-input-number
    v-model="inner"
    :min="min"
    :max="max"
    :precision="0"
    size="small"
    class="cart-quantity"
    :aria-label="label"
    @change="handleChange"
  />
</template>

<style scoped>
.cart-quantity {
  width: 100px;
}

.cart-quantity :deep(.el-input__wrapper) {
  height: 30px;
  border-radius: 8px;
  background: #fffdf8;
  box-shadow: 0 0 0 1px rgba(37, 52, 42, 0.09) inset;
}

.cart-quantity :deep(.el-input-number__decrease),
.cart-quantity :deep(.el-input-number__increase) {
  width: 25px;
  color: var(--ink);
  background: transparent;
}

.cart-quantity :deep(.el-input-number__decrease:hover),
.cart-quantity :deep(.el-input-number__increase:hover) {
  color: var(--accent);
}

.cart-quantity :deep(.el-input__inner) {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 600;
}

@media (max-width: 1060px) {
  .cart-quantity {
    width: 88px;
  }
}
</style>
