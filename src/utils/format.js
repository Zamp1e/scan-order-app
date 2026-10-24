/**
 * 转为有限数字，非法值统一兜底为 0。
 * @param {unknown} value
 * @returns {number}
 */
export function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * 菜品单价展示：整数不带小数，非整数最多保留两位并去掉尾零。
 * @param {unknown} value
 * @returns {string}
 */
export function formatPrice(value) {
  const amount = toNumber(value)
  return Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

/**
 * 金额展示：统一保留两位小数，避免浮点误差直接暴露给用户。
 * @param {unknown} value
 * @returns {string}
 */
export function formatMoney(value) {
  return toNumber(value).toFixed(2)
}

/**
 * 月销量展示，过万时压缩为“x.x万”。
 * @param {unknown} value
 * @returns {string}
 */
export function formatSales(value) {
  const sales = Math.max(0, toNumber(value))
  if (sales >= 10000) {
    return `${(sales / 10000).toFixed(1)}万`
  }
  return sales.toLocaleString('zh-CN')
}

/**
 * 生成演示订单号：ZB + 日期 + 时间 + 三位随机数。
 * @returns {string}
 */
export function createOrderNo() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const random = String(Math.floor(Math.random() * 900) + 100)
  return `ZB${date}${time}${random}`
}
