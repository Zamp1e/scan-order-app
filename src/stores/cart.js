import { defineStore } from 'pinia'
import { toNumber } from '@/utils/format'

const roundMoney = (value) => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100
const safeStock = (value) => Math.max(0, Math.floor(toNumber(value)))
const safeQuantity = (value) => Math.max(0, Math.floor(toNumber(value)))

/**
 * 购物车状态：价格、数量与库存都在 store 内统一收口，刷新后自动恢复。
 */
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
  }),

  getters: {
    isEmpty: (state) => state.items.length === 0,

    totalCount: (state) =>
      state.items.reduce((total, item) => total + safeQuantity(item.quantity), 0),

    subtotal: (state) =>
      roundMoney(
        state.items.reduce(
          (total, item) => total + toNumber(item.price) * safeQuantity(item.quantity),
          0,
        ),
      ),

    originalTotal: (state) => {
      const total = state.items.reduce(
        (sum, item) =>
          sum + toNumber(item.originalPrice || item.price) * safeQuantity(item.quantity),
        0,
      )
      return roundMoney(total)
    },

    savings: (state) => {
      const original = state.items.reduce(
        (sum, item) =>
          sum + toNumber(item.originalPrice || item.price) * safeQuantity(item.quantity),
        0,
      )
      const current = state.items.reduce(
        (sum, item) => sum + toNumber(item.price) * safeQuantity(item.quantity),
        0,
      )
      return Math.max(0, roundMoney(original - current))
    },

    quantityOf: (state) => (dishId) =>
      safeQuantity(state.items.find((item) => String(item.id) === String(dishId))?.quantity),
  },

  actions: {
    /**
     * 加入购物车。库存不足时不会静默截断，而是把结果交给调用方提示用户。
     * @param {Record<string, unknown>} dish
     * @param {number} quantity
     * @returns {{ ok: boolean, reason?: 'sold-out' | 'stock-limit', added?: number }}
     */
    addItem(dish, quantity = 1) {
      const stock = safeStock(dish.stock)
      const requestQuantity = Math.max(1, safeQuantity(quantity) || 1)
      const existing = this.items.find((item) => String(item.id) === String(dish.id))

      if (stock <= 0) {
        return { ok: false, reason: 'sold-out' }
      }

      if (existing) {
        const addable = Math.max(0, stock - safeQuantity(existing.quantity))
        if (addable <= 0) {
          return { ok: false, reason: 'stock-limit' }
        }
        const added = Math.min(addable, requestQuantity)
        existing.quantity = safeQuantity(existing.quantity) + added
        existing.stock = stock
        existing.price = roundMoney(dish.price)
        existing.originalPrice = roundMoney(dish.originalPrice || dish.price)
        return { ok: true, added }
      }

      const added = Math.min(stock, requestQuantity)
      this.items.push({
        id: String(dish.id),
        name: dish.name,
        image: dish.image,
        spec: dish.spec,
        unit: dish.unit || '份',
        price: roundMoney(dish.price),
        originalPrice: roundMoney(dish.originalPrice || dish.price),
        stock,
        quantity: added,
      })
      return { ok: true, added }
    },

    /**
     * 设置单项数量；数量为 0 时移除该项，防止负数与空行进入购物车。
     * @param {string} dishId
     * @param {number} quantity
     */
    setQuantity(dishId, quantity) {
      const item = this.items.find((entry) => String(entry.id) === String(dishId))
      if (!item) return

      const next = Math.min(safeQuantity(quantity), safeStock(item.stock))
      if (next <= 0) {
        this.removeItem(dishId)
        return
      }
      item.quantity = next
    },

    removeItem(dishId) {
      this.items = this.items.filter((item) => String(item.id) !== String(dishId))
    },

    clearCart() {
      this.items = []
    },
  },

  // 购物车同样持久化，验收刷新和回退时数据不丢。
  persist: {
    key: 'zaobian-cart',
  },
})
