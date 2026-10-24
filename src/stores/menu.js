import { defineStore } from 'pinia'
import { fetchMenu } from '@/api/menu'
import { toNumber } from '@/utils/format'

/**
 * 兼容课程数据里常见的同义字段，并把价格、销量、库存、评分统一转成数字。
 * 图片只保留字符串路径，真正的 public 前缀在渲染时由 resolveAsset 统一拼接。
 * @param {Record<string, unknown>} raw
 * @returns {Record<string, unknown>}
 */
function normalizeDish(raw) {
  const price = toNumber(
    raw.price ?? raw.discountPrice ?? raw.salePrice ?? raw.currentPrice ?? raw.unitPrice,
  )
  const originalPrice = toNumber(
    raw.originalPrice ?? raw.originPrice ?? raw.oriPrice ?? raw.listPrice ?? raw.marketPrice,
  )
  const sales = toNumber(raw.monthlySales ?? raw.sales ?? raw.monthSales ?? raw.soldCount)
  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((tag) => String(tag)).filter(Boolean)
    : typeof raw.tags === 'string'
      ? raw.tags.split(/[,，、/]/).map((tag) => tag.trim()).filter(Boolean)
      : []

  return {
    ...raw,
    id: String(raw.id ?? raw.dishId ?? raw.code ?? raw.name ?? ''),
    categoryId: String(raw.categoryId ?? raw.category ?? raw.categoryName ?? 'default'),
    name: String(raw.name ?? raw.dishName ?? raw.title ?? '未命名菜品'),
    image: String(raw.image ?? raw.img ?? raw.picture ?? raw.imageUrl ?? raw.cover ?? ''),
    spec: String(raw.spec ?? raw.specification ?? raw.flavor ?? raw.unitSpec ?? ''),
    unit: String(raw.unit ?? '份'),
    description: String(raw.description ?? raw.desc ?? raw.intro ?? raw.detail ?? ''),
    badge: raw.badge ? String(raw.badge) : '',
    price,
    originalPrice: originalPrice > 0 ? originalPrice : price,
    monthlySales: Math.max(0, sales),
    stock: raw.stock === undefined ? 99 : Math.max(0, Math.floor(toNumber(raw.stock))),
    rating: toNumber(raw.rating ?? raw.score ?? raw.star),
    spicyLevel: Math.max(0, Math.min(3, Math.floor(toNumber(raw.spicyLevel ?? raw.spicy)))),
    tags,
  }
}

export const useMenuStore = defineStore('menu', {
  state: () => ({
    restaurant: {},
    categories: [],
    dishes: [],
    loaded: false,
    loading: false,
    error: '',
  }),

  getters: {
    categoryName: (state) => (categoryId) =>
      state.categories.find((category) => category.id === categoryId)?.name || '今日菜单',

    categoriesWithCount: (state) =>
      state.categories.map((category) => ({
        ...category,
        count: state.dishes.filter((dish) => dish.categoryId === category.id).length,
      })),

    dishById: (state) => (dishId) =>
      state.dishes.find((dish) => String(dish.id) === String(dishId)) || null,

    featuredDish: (state) =>
      state.dishes.find((dish) => dish.badge) || state.dishes[0] || null,
  },

  actions: {
    async loadMenu(force = false) {
      if (this.loading || (this.loaded && !force)) return

      this.loading = true
      this.error = ''

      try {
        const { restaurant, categories, dishes } = await fetchMenu()
        this.restaurant = restaurant
        this.categories = categories.map((category, index) => ({
          ...category,
          id: String(category.id ?? category.name ?? index),
          name: String(category.name ?? category.categoryName ?? `分类 ${index + 1}`),
          glyph: String(category.glyph ?? category.icon ?? '食').slice(0, 1),
          subtitle: String(category.subtitle ?? category.desc ?? '今日现做'),
          order: index,
        }))
        this.dishes = dishes
          .filter((dish) => dish && typeof dish === 'object')
          .map(normalizeDish)
          .filter((dish) => dish.id && dish.name)
        this.loaded = true
      } catch (error) {
        this.error = error.friendlyMessage || error.message || '菜单加载失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
  },
})
