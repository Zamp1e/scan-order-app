/**
 * 真实浏览器验收 + 运行截图脚本。
 * 前置：先运行 `npm run build && npm run preview`，再执行 `npm run screenshots`。
 */
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const screenshotDir = path.join(rootDir, 'screenshots')
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173'

const browserCandidates = [
  process.env.BROWSER_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean)

const executablePath = browserCandidates.find((candidate) => existsSync(candidate))
if (!executablePath) {
  throw new Error('未找到 Edge/Chrome，可通过 BROWSER_PATH 指定浏览器可执行文件路径。')
}

await mkdir(screenshotDir, { recursive: true })

const browser = await chromium.launch({ executablePath, headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
  reducedMotion: 'reduce',
})
const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

/**
 * 整页截图前先滚动一遍，触发所有 loading="lazy" 的图片。
 * 否则 Playwright 的 fullPage 截图会在图片尚未进入视口时拍到空白占位。
 */
const warmupLazyImages = async () => {
  await page.evaluate(async () => {
    const step = window.innerHeight
    const max = document.body.scrollHeight
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 120))
    }
    window.scrollTo(0, 0)
    await new Promise((resolve) => setTimeout(resolve, 200))
  })

  // 等所有 <img> 解码完成，最多 5 秒
  await page
    .waitForFunction(() => Array.from(document.images).every((img) => img.complete), null, {
      timeout: 5000,
    })
    .catch(() => {})

  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src),
  )

  if (broken.length) {
    throw new Error(`存在未成功加载的图片：${broken.join(', ')}`)
  }
}

const shot = async (name, options = {}) => {
  // 整页截图需要先唤醒懒加载图片；局部截图不受影响
  if (options.fullPage) {
    await warmupLazyImages()
  }

  await page.screenshot({
    path: path.join(screenshotDir, name),
    animations: 'disabled',
    ...options,
  })
  console.log(`📸 ${name}`)
}

try {
  console.log('▶ 01 登录页')
  await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.login-card')
  await shot('01-login.png')

  console.log('▶ 错误账号校验')
  await page.locator('input[autocomplete="username"]').fill('demo')
  await page.locator('input[autocomplete="current-password"]').fill('wrongpass')
  await page.locator('.login-button').click()
  await page.waitForSelector('.login-error', { timeout: 5000 })
  assert.match(await page.locator('.login-error').innerText(), /用户名或密码有误/)

  console.log('▶ 正确账号登录')
  await page.locator('.demo-account').first().click()
  await page.locator('.login-button').click()
  await page.waitForURL('**/home', { timeout: 10000 })
  await page.waitForSelector('.dish-card')
  assert.match(await page.locator('.user-copy strong').innerText(), /林小满/)

  await page.waitForTimeout(300)
  await shot('02-home.png', { fullPage: true })

  console.log('▶ 菜品卡数量步进器与购物车同步')
  const gongbaoCard = page.locator('.dish-card').filter({ hasText: '宫保鸡丁' }).first()
  await gongbaoCard.locator('.add-button').click()
  await gongbaoCard.locator('.card-stepper').waitFor({ state: 'visible' })
  assert.equal((await gongbaoCard.locator('.card-stepper strong').innerText()).trim(), '1')
  assert.match(await page.locator('.cart-fab-badge').innerText(), /1/)

  await gongbaoCard.locator('.card-stepper button').last().click()
  await page.waitForTimeout(150)
  assert.equal((await gongbaoCard.locator('.card-stepper strong').innerText()).trim(), '2')
  assert.match(await page.locator('.cart-fab-badge').innerText(), /2/)
  await shot('08-menu-stepper.png')

  await gongbaoCard.locator('.card-stepper button').first().click()
  await page.waitForTimeout(120)
  assert.equal((await gongbaoCard.locator('.card-stepper strong').innerText()).trim(), '1')
  await gongbaoCard.locator('.card-stepper button').first().click()
  await gongbaoCard.locator('.add-button').waitFor({ state: 'visible' })
  assert.equal(await gongbaoCard.locator('.card-stepper').count(), 0)

  console.log('▶ 搜索与分类筛选')
  const searchInput = page.locator('.menu-search input')
  await searchInput.fill('宫保')
  await page.waitForTimeout(150)
  assert.equal(await page.locator('.dish-card').count(), 1)
  await searchInput.fill('')
  await page.locator('.category-item').filter({ hasText: '主食汤羹' }).click()
  await page.waitForTimeout(150)
  assert.equal(await page.locator('.category-group').count(), 1)
  assert.match(await page.locator('.group-heading h3').innerText(), /主食汤羹/)
  await page.locator('.category-item').filter({ hasText: '全部菜品' }).click()

  console.log('▶ 菜品详情与数量控制')
  await page.locator('.dish-card').filter({ hasText: '宫保鸡丁' }).click()
  await page.waitForURL('**/dish/gongbao-chicken')
  await page.waitForSelector('.detail-card')
  assert.match(await page.locator('.detail-title-row h1').innerText(), /宫保鸡丁/)
  assert.equal(await page.locator('.quantity-input input').inputValue(), '0')
  assert.equal(await page.locator('.add-to-cart').isDisabled(), true)

  const quantityInput = page.locator('.quantity-input input')
  await quantityInput.fill('2')
  await quantityInput.press('Enter')
  await page.locator('.detail-title-row h1').click()
  await page.waitForTimeout(200)
  assert.equal(await quantityInput.inputValue(), '2')
  assert.match(await page.locator('.quantity-subtotal').innerText(), /79\.60/)
  await shot('03-dish-detail.png')

  console.log('▶ 加购跳转购物车')
  await page.locator('.add-to-cart').click()
  await page.waitForURL('**/cart')
  await page.waitForSelector('.cart-item')
  assert.match(await page.locator('.cart-quantity input').inputValue(), /2/)
  assert.match(await page.locator('.summary-total strong').innerText(), /79\.60/)

  console.log('▶ 修改数量实时计算')
  await page.locator('.cart-quantity .el-input-number__increase').click()
  await page.waitForTimeout(150)
  assert.match(await page.locator('.cart-quantity input').inputValue(), /3/)
  assert.match(await page.locator('.line-total strong').innerText(), /119\.40/)
  assert.match(await page.locator('.summary-total strong').innerText(), /119\.40/)

  console.log('▶ 越界输入被纠正为库存上限')
  const cartQuantityInput = page.locator('.cart-quantity input')
  await cartQuantityInput.fill('999')
  await cartQuantityInput.press('Enter')
  await page.waitForTimeout(200)
  assert.equal(await cartQuantityInput.inputValue(), '36')
  assert.match(await page.locator('.line-total strong').innerText(), /1,432\.80|1432\.80/)
  await cartQuantityInput.fill('3')
  await cartQuantityInput.press('Enter')
  await page.waitForTimeout(200)
  assert.match(await page.locator('.summary-total strong').innerText(), /119\.40/)

  console.log('▶ 刷新保持登录态、购物车与 history 路由')
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.cart-item')
  assert.match(await page.locator('.user-copy strong').innerText(), /林小满/)
  assert.match(await page.locator('.cart-quantity input').inputValue(), /3/)
  await shot('04-cart.png', { fullPage: true })

  console.log('▶ 移除菜品与空状态')
  await page.locator('.remove-button').click()
  await page.locator('.el-popconfirm__action .el-button--primary').click()

  // Transition 使用 mode="out-in"：DOM 出现后还要等离场+入场动画结束，
  // 否则截图会拍到中间空白态（断言能过，画面是空的）。
  await page.waitForSelector('.empty-cart', { state: 'visible' })
  await page.waitForFunction(() => {
    const el = document.querySelector('.empty-cart')
    if (!el) return false
    const style = getComputedStyle(el)
    return Number(style.opacity) > 0.99 && !el.closest('.cart-fade-enter-active, .cart-fade-leave-active')
  })
  await page.waitForTimeout(350)

  // 截图前再确认关键文案真的可见，而不是仅存在于 DOM
  await page.locator('.empty-copy h2').scrollIntoViewIfNeeded()
  assert.equal(await page.locator('.empty-copy h2').isVisible(), true)
  assert.match(await page.locator('.empty-copy h2').innerText(), /购物车空空如也/)
  await shot('05-cart-empty.png')

  console.log('▶ 从详情页加购后，购物车页隐藏悬浮球')
  await page.goto(`${baseURL}/home`, { waitUntil: 'networkidle' })
  await page.locator('.dish-card').filter({ hasText: '宫保鸡丁' }).click()
  await page.waitForSelector('.detail-card')
  const dockQuantityInput = page.locator('.quantity-input input')
  await dockQuantityInput.fill('2')
  await dockQuantityInput.press('Enter')
  await page.locator('.detail-title-row h1').click()
  await page.locator('.add-to-cart').click()
  await page.waitForURL('**/cart')
  await page.waitForSelector('.cart-item')
  // 购物车页面自己有结算区，悬浮球在这页隐藏，避免与结算栏重叠
  assert.equal(await page.locator('.cart-fab').count(), 0)

  console.log('▶ 悬浮球：桌号、合计与数量红点')
  await page.goto(`${baseURL}/home`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.cart-fab')

  const cartFab = page.locator('.cart-fab')
  assert.equal(await cartFab.isVisible(), true)
  assert.match(await cartFab.locator('.cart-fab-table').innerText(), /A08/)
  assert.match(await cartFab.locator('.cart-fab-amount').innerText(), /79\.60/)
  assert.match(await cartFab.locator('.cart-fab-badge').innerText(), /2/)

  console.log('▶ 点击悬浮球展开购物悬浮窗')
  await cartFab.click()
  await page.waitForSelector('.cart-panel .panel-item', { state: 'visible' })
  assert.match(await page.locator('.panel-item h3').first().innerText(), /宫保鸡丁/)
  assert.match(await page.locator('.panel-foot strong').innerText(), /79\.60/)
  await shot('06-cart-panel.png')
  await page.locator('.panel-close').click()
  await page.waitForTimeout(320)
  assert.equal(await page.locator('.cart-panel').count(), 0)

  console.log('▶ 下单并写入订单历史')
  await page.goto(`${baseURL}/cart`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.checkout-button')
  await page.locator('.checkout-button').click()
  await page.waitForSelector('.order-success', { state: 'visible' })
  assert.match(await page.locator('.order-success h3').innerText(), /下单成功/)
  const orderNo = (await page.locator('.order-receipt strong').first().innerText()).trim()
  assert.match(orderNo, /^ZB\d+/)
  await page.locator('.success-button').click()
  await page.waitForURL('**/home')

  console.log('▶ 我的主页（独立页面）：资料、订单记录与退出登录')
  await page.locator('.main-nav .nav-link', { hasText: '我的' }).click()
  await page.waitForURL('**/profile')
  await page.waitForSelector('.profile-page .identity-card')
  assert.match(await page.locator('.identity-copy h2').innerText(), /林小满/)
  assert.equal(await page.locator('.history-item').count(), 1)
  assert.match(await page.locator('.history-item').first().innerText(), /宫保鸡丁/)
  assert.ok((await page.locator('.history-item').first().innerText()).includes(orderNo))
  await shot('07-profile.png', { fullPage: true })

  await page.locator('.sign-out').click()
  await page.waitForURL('**/login')
  assert.equal(await page.locator('.login-card').isVisible(), true)

  assert.deepEqual(pageErrors, [])
  console.log('\n✅ 真实浏览器验收全部通过，截图已写入 screenshots/。')
} finally {
  await browser.close()
}
