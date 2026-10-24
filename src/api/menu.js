import request from './request'

const LIST_KEYS = ['users', 'list', 'records', 'data', 'items', 'result']

/**
 * 从常见包装结构中取出数组，例如：
 * [ ... ] / { users: [...] } / { data: { list: [...] } }
 * @param {unknown} payload
 * @param {string[]} preferredKeys
 * @returns {unknown[]}
 */
function pickArray(payload, preferredKeys) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []

  for (const key of [...preferredKeys, ...LIST_KEYS]) {
    const value = payload[key]
    if (Array.isArray(value)) return value
    if (value && typeof value === 'object') {
      const nested = pickArray(value, preferredKeys)
      if (nested.length) return nested
    }
  }

  return []
}

/**
 * 兼容课程数据中常见的用户字段命名。
 * @param {Record<string, unknown>} raw
 * @returns {Record<string, unknown>}
 */
function normalizeUser(raw) {
  const username = raw.username ?? raw.userName ?? raw.account ?? raw.loginName ?? raw.name ?? ''
  const password = raw.password ?? raw.pwd ?? raw.pass ?? raw.userPwd ?? ''
  const displayName = raw.nickname ?? raw.nickName ?? raw.realName ?? raw.name ?? username

  return {
    ...raw,
    username: String(username).trim(),
    password: String(password),
    name: String(displayName || username || '食客'),
    tableNo: String(raw.tableNo ?? raw.table ?? raw.tableCode ?? 'A01'),
    level: String(raw.level ?? raw.memberLevel ?? raw.role ?? '普通食客'),
    greeting: String(raw.greeting ?? raw.welcome ?? '今天也要好好吃饭'),
  }
}

/**
 * 读取用户信息。兼容数组、`{ users: [] }`、`{ data: { list: [] } }` 等结构。
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function fetchUsers() {
  const { data } = await request.get('data/users.json')
  const users = pickArray(data, ['users'])
    .filter((item) => item && typeof item === 'object')
    .map(normalizeUser)
    .filter((item) => item.username)

  if (!users.length) {
    throw new Error('用户数据格式不正确，未读取到任何用户')
  }

  return users
}

/**
 * 读取菜单数据，同时兼容“分类 + 菜品平铺”和“分类内嵌菜品”两种写法。
 * @returns {Promise<{ restaurant: object, categories: Array, dishes: Array }>}
 */
export async function fetchMenu() {
  const { data } = await request.get('data/dishes.json')

  if (!data || typeof data !== 'object') {
    throw new Error('菜品数据格式不正确')
  }

  const restaurant = data.restaurant ?? data.shop ?? data.shopInfo ?? {}
  let categories = Array.isArray(data.categories) ? data.categories : []
  let dishes = Array.isArray(data.dishes) ? data.dishes : []

  categories = categories.filter((category) => category && typeof category === 'object')

  // 写法二：categories: [{ id, name, dishes: [...] }]
  if (!dishes.length && categories.some((category) => Array.isArray(category?.dishes))) {
    dishes = categories.flatMap((category) => {
      const categoryId = category.id ?? category.name
      return (category.dishes || []).map((dish) => ({
        ...dish,
        categoryId: dish.categoryId ?? dish.category ?? categoryId,
      }))
    })
  }

  // 分类内嵌菜品只是数据组织方式，不需要把整份菜品再挂回分类对象上。
  categories = categories.map((category) => {
    const copy = { ...category }
    delete copy.dishes
    return copy
  })

  // 写法三：直接给菜品数组，分类从菜品字段推导。
  if (!dishes.length && Array.isArray(data.list)) {
    dishes = data.list
  }

  dishes = dishes.filter((dish) => dish && typeof dish === 'object')

  if (!dishes.length) {
    throw new Error('菜品数据格式不正确，未读取到任何菜品')
  }

  if (!categories.length) {
    const seen = new Map()
    dishes.forEach((dish) => {
      const id = String(dish.categoryId ?? dish.category ?? 'default')
      if (!seen.has(id)) {
        seen.set(id, {
          id,
          name: String(dish.categoryName ?? dish.category ?? '今日菜单'),
          glyph: '食',
        })
      }
    })
    categories = [...seen.values()]
  }

  return { restaurant, categories, dishes }
}
