import { ElMessage } from 'element-plus'
import { formatMoney } from '@/utils/format'

/**
 * 把菜品加入购物车并给出统一提示。
 * 首页卡片、详情页“相关菜品”和详情页主按钮都走这里，避免三处各写一套判断文案。
 * @param {ReturnType<typeof import('@/stores/cart').useCartStore>} cartStore
 * @param {Record<string, unknown>} dish
 * @param {number} quantity
 * @returns {{ ok: boolean, reason?: string, added?: number }}
 */
export function addDishWithFeedback(cartStore, dish, quantity = 1) {
  const result = cartStore.addItem(dish, quantity)

  if (!result.ok) {
    ElMessage.warning(
      result.reason === 'sold-out' ? `${dish.name} 今日已售罄` : `${dish.name} 已达库存上限`,
    )
    return result
  }

  ElMessage.success(`${dish.name} × ${result.added} 已加入购物车`)
  return result
}

/**
 * 单项小计金额：购物车页面与悬浮窗共用，避免两处各写一遍乘法。
 * @param {{ price: unknown, quantity: unknown }} item
 * @returns {string}
 */
export function lineTotalOf(item) {
  return formatMoney(Number(item.price) * Number(item.quantity))
}
