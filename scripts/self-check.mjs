// 轻量自检：不依赖浏览器，直接校验数据文件与核心金额逻辑。
// 用法：node scripts/self-check.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function readJson(relativePath) {
  const raw = await readFile(path.join(rootDir, relativePath), 'utf8')
  return JSON.parse(raw)
}

const users = await readJson('public/data/users.json')
const menu = await readJson('public/data/dishes.json')

assert.ok(Array.isArray(users) && users.length > 0, 'users.json 应是非空数组')
users.forEach((user, index) => {
  assert.ok(user.username, `users[${index}] 缺少 username`)
  assert.ok(user.password, `users[${index}] 缺少 password`)
})

assert.ok(Array.isArray(menu.categories) && menu.categories.length > 0, 'categories 不能为空')
assert.ok(Array.isArray(menu.dishes) && menu.dishes.length > 0, 'dishes 不能为空')

const categoryIds = new Set(menu.categories.map((category) => category.id))
const dishIds = new Set()
let missingImage = 0

for (const dish of menu.dishes) {
  assert.ok(dish.id, '存在缺少 id 的菜品')
  assert.ok(!dishIds.has(dish.id), `菜品 id 重复：${dish.id}`)
  dishIds.add(dish.id)
  assert.ok(categoryIds.has(dish.categoryId), `菜品 ${dish.id} 的 categoryId 不在分类表中`)
  assert.ok(Number(dish.price) >= 0, `菜品 ${dish.id} 价格非法`)
  assert.ok(Number(dish.originalPrice) >= Number(dish.price), `菜品 ${dish.id} 原价低于折扣价`)
  assert.ok(Number(dish.stock) >= 0, `菜品 ${dish.id} 库存非法`)
  assert.ok(Array.isArray(dish.tags), `菜品 ${dish.id} tags 应为数组`)
  if (!dish.image) missingImage += 1
}

// 金额逻辑：与 src/stores/cart.js 相同的四舍五入口径。
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100
const chicken = menu.dishes.find((dish) => dish.id === 'gongbao-chicken')
assert.ok(chicken, '缺少示例菜品 gongbao-chicken')
assert.equal(roundMoney(chicken.price * 2), 79.6, '2 份宫保鸡丁应为 79.60')
assert.equal(roundMoney(chicken.price * 3), 119.4, '3 份宫保鸡丁应为 119.40')

console.log('✅ 数据自检通过')
console.log(`   用户 ${users.length} 条，分类 ${menu.categories.length} 个，菜品 ${menu.dishes.length} 道`)
if (missingImage) {
  console.log(`   提示：${missingImage} 道菜未配置图片，运行时将回落为占位插画`)
}
