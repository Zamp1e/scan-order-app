import { defineStore } from 'pinia'
import { toNumber } from '@/utils/format'

const roundMoney = (value) => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100
const MAX_RECORDS = 50

/**
 * 订单历史：下单成功时把购物车快照留存下来，“我的”主页据此展示点过的菜。
 * 记录按登录账号归属，换账号登录时不会看到别人的订单。
 */
export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders: [],
  }),

  getters: {
    /**
     * 当前账号的订单，最新的在最前面。
     * @returns {(owner: string) => Array<Record<string, unknown>>}
     */
    ordersOf: (state) => (owner) =>
      owner ? state.orders.filter((order) => order.owner === owner) : [],

    /**
     * 当前账号累计下单次数与金额。
     * @returns {(owner: string) => { count: number, total: number, dishes: number }}
     */
    summaryOf: (state) => (owner) => {
      const list = owner ? state.orders.filter((order) => order.owner === owner) : []
      return {
        count: list.length,
        total: roundMoney(list.reduce((sum, order) => sum + toNumber(order.total), 0)),
        dishes: list.reduce((sum, order) => sum + toNumber(order.count), 0),
      }
    },
  },

  actions: {
    /**
     * 记录一笔订单，items 传购物车快照即可，内部只保留展示所需字段。
     * @param {{ orderNo: string, owner?: string, tableNo?: string, count: number, total: number, items: Array<Record<string, unknown>> }} order
     */
    addOrder({ orderNo, owner = '', tableNo = '', count = 0, total = 0, items = [] }) {
      this.orders.unshift({
        orderNo,
        owner,
        tableNo,
        count: Math.max(0, Math.floor(toNumber(count))),
        total: roundMoney(total),
        createdAt: new Date().toISOString(),
        items: items.map((item) => ({
          id: String(item.id ?? ''),
          name: String(item.name ?? '菜品'),
          spec: String(item.spec ?? ''),
          unit: String(item.unit || '份'),
          quantity: Math.max(0, Math.floor(toNumber(item.quantity))),
          price: roundMoney(item.price),
          image: String(item.image ?? ''),
        })),
      })

      if (this.orders.length > MAX_RECORDS) {
        this.orders.length = MAX_RECORDS
      }
    },
  },

  // 订单历史同样持久化，刷新或重开浏览器后仍然能看到点过的菜。
  persist: {
    key: 'zaobian-orders',
  },
})
