<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import {
  ArrowDown,
  ArrowRight,
  Clock,
  LocationFilled,
  Refresh,
  Search,
} from '@element-plus/icons-vue'
import DishCard from '@/components/DishCard.vue'
import { useCartStore } from '@/stores/cart'
import { useMenuStore } from '@/stores/menu'
import { useOrdersStore } from '@/stores/orders'
import { useUserStore } from '@/stores/user'
import { resolveAsset } from '@/utils/asset'
import { addDishWithFeedback } from '@/utils/cart'

const menuStore = useMenuStore()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()
const userStore = useUserStore()

const keyword = ref('')
const selectedCategory = ref('all')
const menuAnchor = ref()

const featuredDish = computed(() => menuStore.featuredDish)
const myOrderCount = computed(() => ordersStore.ordersOf(userStore.profile?.username).length)
const featuredImage = computed(() =>
  resolveAsset(featuredDish.value?.image || 'images/dishes/dongpo-pork.jpg'),
)
const todayLabel = new Intl.DateTimeFormat('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

const activeCategoryName = computed(() => {
  if (selectedCategory.value === 'all') return '全部菜品'
  return menuStore.categoryName(selectedCategory.value)
})

const filteredGroups = computed(() => {
  const query = keyword.value.trim().toLowerCase()

  return menuStore.categoriesWithCount
    .filter(
      (category) => selectedCategory.value === 'all' || category.id === selectedCategory.value,
    )
    .map((category) => ({
      ...category,
      dishes: menuStore.dishes.filter((dish) => {
        const inCategory = dish.categoryId === category.id
        const dishName = String(dish.name ?? '').toLowerCase()
        const matchesKeyword = !query || dishName.includes(query)
        return inCategory && matchesKeyword
      }),
    }))
    .filter((group) => group.dishes.length > 0)
})

const resultCount = computed(() =>
  filteredGroups.value.reduce((total, group) => total + group.dishes.length, 0),
)
const hasActiveFilter = computed(
  () => Boolean(keyword.value.trim()) || selectedCategory.value !== 'all',
)
const searchQuery = computed(() => keyword.value.trim())
const isInitialLoading = computed(() => !menuStore.loaded && !menuStore.error)
const hasError = computed(() => Boolean(menuStore.error) && !menuStore.loaded)

function selectCategory(categoryId) {
  selectedCategory.value = categoryId
  if (window.innerWidth < 1024) {
    nextTick(() => {
      menuAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
}

function scrollToMenu() {
  menuAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function resetFilters() {
  keyword.value = ''
  selectedCategory.value = 'all'
}

function handleAdd(dish) {
  addDishWithFeedback(cartStore, dish)
}

onMounted(() => {
  menuStore.loadMenu()
})
</script>

<template>
  <main class="home-page">
    <div class="page-container">
      <section class="hero" aria-labelledby="home-heading">
        <span class="hero-watermark" aria-hidden="true">食</span>

        <div class="hero-copy">
          <p class="eyebrow hero-eyebrow">ZAOBIAN · TODAY'S MENU</p>
          <h1 id="home-heading">好好吃饭，<br /><span>就是正经事。</span></h1>
          <p class="hero-desc">
            今日菜单已经备好。挑几道合胃口的菜，灶台马上开火。热菜、凉碟、主食和甜饮，都在这一桌。
          </p>

          <div class="hero-chips">
            <span>
              <el-icon><Clock /></el-icon>
              今日营业 10:30 — 21:30
            </span>
            <span>
              <el-icon><LocationFilled /></el-icon>
              {{ userStore.tableNo }} 号桌 · {{ userStore.displayName }}
            </span>
          </div>

          <div class="hero-actions">
            <button class="hero-cta" type="button" @click="scrollToMenu">
              开始点餐
              <el-icon><ArrowDown /></el-icon>
            </button>
            <span class="hero-date">{{ todayLabel }} · 今日供应 {{ menuStore.dishes.length }} 道</span>
          </div>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <div class="hero-plate-ring"></div>
          <div class="hero-plate">
            <img :src="featuredImage" alt="" />
          </div>
          <div class="hero-float hero-float--top">
            <span>今日招牌</span>
            <strong>{{ featuredDish?.name || '东坡肉' }}</strong>
          </div>
          <div class="hero-float hero-float--bottom">
            <span class="steam-dot"></span>
            <div>
              <strong>现点现炒</strong>
              <small>热气上桌，慢慢吃</small>
            </div>
          </div>
          <span class="hero-seal">灶边<br />出品</span>
        </div>
      </section>

      <div ref="menuAnchor" class="menu-shell">
        <aside class="menu-aside" aria-label="菜品分类">
          <div class="aside-heading">
            <p class="eyebrow">EXPLORE THE MENU</p>
            <h2>菜单分类</h2>
          </div>

          <div class="category-list">
            <button
              class="category-item"
              :class="{ active: selectedCategory === 'all' }"
              type="button"
              @click="selectCategory('all')"
            >
              <span class="category-glyph">全</span>
              <span class="category-copy">
                <strong>全部菜品</strong>
                <small>一次看全今日菜单</small>
              </span>
              <span class="category-count">{{ menuStore.dishes.length }}</span>
            </button>

            <button
              v-for="category in menuStore.categoriesWithCount"
              :key="category.id"
              class="category-item"
              :class="{ active: selectedCategory === category.id }"
              type="button"
              @click="selectCategory(category.id)"
            >
              <span class="category-glyph">{{ category.glyph }}</span>
              <span class="category-copy">
                <strong>{{ category.name }}</strong>
                <small>{{ category.subtitle }}</small>
              </span>
              <span class="category-count">{{ category.count }}</span>
            </button>
          </div>

          <div class="aside-note">
            <span class="aside-quote-mark">“</span>
            <p>不知道吃什么？<br />先从招牌点起。</p>
            <small>主厨推荐 · 不会出错</small>
            <span class="aside-note-stamp">荐</span>
          </div>

          <RouterLink class="aside-profile" :to="{ name: 'profile' }" aria-label="打开我的主页">
            <div class="aside-profile-head">
              <span class="aside-profile-avatar">{{ userStore.avatarText }}</span>
              <div class="aside-profile-copy">
                <strong>{{ userStore.displayName }}</strong>
                <small>{{ userStore.level }} · {{ userStore.tableNo }} 号桌</small>
              </div>
            </div>
            <p class="aside-profile-orders">
              <span>{{ myOrderCount }}</span> 单历史订单
            </p>
            <span class="aside-profile-btn">
              我的主页
              <el-icon><ArrowRight /></el-icon>
            </span>
          </RouterLink>
        </aside>

        <section class="menu-content" aria-labelledby="menu-heading">
          <div class="menu-toolbar">
            <div class="menu-title">
              <p class="eyebrow">FRESHLY COOKED</p>
              <div class="menu-title-row">
                <h2 id="menu-heading">{{ activeCategoryName }}</h2>
                <span class="dish-total">{{ resultCount }} 道</span>
              </div>
            </div>

            <div class="menu-search">
              <el-input
                v-model="keyword"
                :prefix-icon="Search"
                placeholder="搜索菜品名称，如宫保鸡丁"
                size="large"
                clearable
                aria-label="按菜品名称搜索"
                @keyup.esc="keyword = ''"
              />
            </div>
          </div>

          <div class="mobile-categories" aria-label="移动端菜品分类">
            <button
              class="mobile-category"
              :class="{ active: selectedCategory === 'all' }"
              type="button"
              @click="selectCategory('all')"
            >
              全部 <span>{{ menuStore.dishes.length }}</span>
            </button>
            <button
              v-for="category in menuStore.categoriesWithCount"
              :key="category.id"
              class="mobile-category"
              :class="{ active: selectedCategory === category.id }"
              type="button"
              @click="selectCategory(category.id)"
            >
              {{ category.name }} <span>{{ category.count }}</span>
            </button>
          </div>

          <div v-if="isInitialLoading" class="skeleton-area" aria-label="菜单加载中">
            <div v-for="index in 6" :key="index" class="skeleton-card">
              <div class="skeleton-media shimmer"></div>
              <div class="skeleton-body">
                <span class="skeleton-line shimmer"></span>
                <span class="skeleton-line short shimmer"></span>
                <span class="skeleton-line price shimmer"></span>
              </div>
            </div>
          </div>

          <div v-else-if="hasError" class="error-panel" role="alert">
            <div class="error-mark">
              <el-icon><Refresh /></el-icon>
            </div>
            <h3>菜单加载失败</h3>
            <p>{{ menuStore.error }}</p>
            <el-button type="primary" round @click="menuStore.loadMenu(true)">重新加载</el-button>
          </div>

          <template v-else>
            <div v-if="!filteredGroups.length" class="empty-search">
              <div class="empty-search-icon">
                <el-icon><Search /></el-icon>
              </div>
              <h3>{{ searchQuery ? `没有找到「${searchQuery}」` : '没有找到这道菜' }}</h3>
              <p>
                换个关键词试试，或者回到全部菜单。厨房今天还有 {{ menuStore.dishes.length }}
                道好菜。
              </p>
              <el-button round @click="resetFilters">
                查看全部菜品
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>

            <div v-else class="category-groups">
              <section
                v-for="group in filteredGroups"
                :id="`category-${group.id}`"
                :key="group.id"
                class="category-group"
              >
                <header class="group-heading">
                  <div class="group-title">
                    <span class="group-glyph">{{ group.glyph }}</span>
                    <div>
                      <h3>{{ group.name }}</h3>
                      <p>{{ group.subtitle }}</p>
                    </div>
                  </div>
                  <span class="group-count">{{ group.dishes.length }} 道供应中</span>
                </header>

                <div class="dish-grid">
                  <DishCard
                    v-for="dish in group.dishes"
                    :key="dish.id"
                    :dish="dish"
                    @add="handleAdd"
                  />
                </div>
              </section>
            </div>

            <button v-if="hasActiveFilter" class="reset-filter" type="button" @click="resetFilters">
              清除筛选，查看全部菜单
              <el-icon><ArrowRight /></el-icon>
            </button>
          </template>
        </section>
      </div>

    </div>
  </main>
</template>

<style scoped>
.home-page {
  padding-bottom: 8px;
}

.page-container {
  width: min(1240px, 100%);
  margin: 0 auto;
  padding: 28px 28px 0;
}

.hero {
  position: relative;
  display: flex;
  min-height: 364px;
  overflow: hidden;
  padding: 48px 52px;
  border-radius: 32px;
  color: #f8eedf;
  background:
    radial-gradient(circle at 83% 20%, rgba(209, 149, 80, 0.3), transparent 33%),
    radial-gradient(circle at 40% 115%, rgba(155, 74, 37, 0.23), transparent 44%),
    linear-gradient(135deg, #1d4b39 0%, #143b2d 54%, #0c2a21 100%);
  box-shadow: 0 28px 68px rgba(22, 46, 35, 0.16);
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(246, 235, 214, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(246, 235, 214, 0.055) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0.55), transparent 72%);
  pointer-events: none;
}

.hero::after {
  content: '';
  position: absolute;
  right: 34%;
  top: 50%;
  width: 1px;
  height: 66%;
  background: linear-gradient(transparent, rgba(247, 235, 213, 0.12), transparent);
  transform: translateY(-50%);
}

.hero-watermark {
  position: absolute;
  right: 4%;
  bottom: -18%;
  color: rgba(247, 235, 213, 0.035);
  font-family: var(--font-serif);
  font-size: 390px;
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
  user-select: none;
}

.hero-copy {
  position: relative;
  z-index: 3;
  width: 60%;
}

.eyebrow {
  margin: 0 0 13px;
  color: var(--accent);
  font-size: 9px;
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: 0.23em;
}

.hero-eyebrow {
  color: #deb575;
}

.hero-copy h1 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(42px, 4.5vw, 62px);
  font-weight: 600;
  line-height: 1.21;
  letter-spacing: 0.04em;
}

.hero-copy h1 span {
  position: relative;
  color: #efc485;
}

.hero-copy h1 span::after {
  content: '';
  position: absolute;
  left: 3px;
  right: 4px;
  bottom: 3px;
  height: 6px;
  border-radius: 999px;
  background: rgba(198, 89, 49, 0.4);
  transform: rotate(-1deg);
}

.hero-desc {
  width: min(480px, 92%);
  margin: 20px 0 0;
  color: rgba(248, 238, 222, 0.62);
  font-size: 13px;
  line-height: 1.95;
  letter-spacing: 0.025em;
}

.hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
}

.hero-chips span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  border: 1px solid rgba(246, 234, 214, 0.13);
  border-radius: 8px;
  color: rgba(248, 238, 222, 0.68);
  background: rgba(255, 255, 255, 0.035);
  font-size: 9px;
  letter-spacing: 0.03em;
  backdrop-filter: blur(6px);
}

.hero-chips .el-icon {
  color: #d8a75e;
  font-size: 11px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 26px;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  height: 45px;
  padding: 0 19px;
  border: 1px solid rgba(255, 247, 233, 0.12);
  border-radius: 12px;
  color: #1b3b2c;
  background: #f0d1a1;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.hero-cta:hover {
  background: #f7ddb4;
  box-shadow: 0 10px 24px rgba(9, 26, 18, 0.25);
  transform: translateY(-2px);
}

.hero-cta .el-icon {
  font-size: 13px;
}

.hero-date {
  color: rgba(248, 238, 222, 0.43);
  font-size: 9px;
  letter-spacing: 0.06em;
}

.hero-visual {
  position: absolute;
  top: 50%;
  right: 5.3%;
  z-index: 2;
  width: clamp(260px, 29vw, 342px);
  aspect-ratio: 1;
  transform: translateY(-50%);
}

.hero-visual::before {
  content: '';
  position: absolute;
  inset: 2%;
  border-radius: 50%;
  background: rgba(214, 151, 76, 0.3);
  filter: blur(38px);
}

.hero-plate-ring {
  position: absolute;
  inset: -18px;
  border: 1px dashed rgba(238, 206, 158, 0.27);
  border-radius: 50%;
  animation: ring-spin 48s linear infinite;
}

@keyframes ring-spin {
  to {
    transform: rotate(360deg);
  }
}

.hero-plate {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border: 8px solid rgba(249, 238, 218, 0.12);
  border-radius: 50%;
  background: #e4caa8;
  box-shadow: 0 30px 65px rgba(4, 18, 12, 0.42);
  transform: rotate(4deg);
}

.hero-plate img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-float {
  position: absolute;
  z-index: 3;
  border: 1px solid rgba(255, 250, 240, 0.21);
  background: rgba(17, 45, 33, 0.72);
  box-shadow: 0 14px 30px rgba(4, 19, 12, 0.2);
  backdrop-filter: blur(12px);
}

.hero-float--top {
  top: 9%;
  right: -8%;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 14px;
  border-radius: 11px;
  animation: gentle-float 5s ease-in-out infinite;
}

.hero-float--top span {
  color: rgba(248, 238, 222, 0.48);
  font-size: 8px;
  letter-spacing: 0.13em;
}

.hero-float--top strong {
  font-family: var(--font-serif);
  font-size: 14px;
  letter-spacing: 0.1em;
}

.hero-float--bottom {
  left: -10%;
  bottom: 7%;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 13px;
  border-radius: 11px;
  animation: gentle-float 6s ease-in-out 0.7s infinite reverse;
}

.hero-float--bottom > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-float--bottom strong {
  color: #f8edda;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.hero-float--bottom small {
  color: rgba(248, 238, 222, 0.42);
  font-size: 7px;
}

.steam-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e0ab62;
  box-shadow: 0 0 0 4px rgba(224, 171, 98, 0.12);
}

@keyframes gentle-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-7px);
  }
}

.hero-seal {
  position: absolute;
  right: 3%;
  bottom: -1%;
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border: 1px solid rgba(240, 210, 163, 0.4);
  border-radius: 50%;
  color: #ebcd9f;
  font-family: var(--font-serif);
  font-size: 11px;
  line-height: 1.45;
  text-align: center;
  letter-spacing: 0.1em;
  transform: rotate(9deg);
}

.menu-shell {
  display: grid;
  grid-template-columns: 206px minmax(0, 1fr);
  gap: 36px;
  align-items: start;
  margin-top: 42px;
  scroll-margin-top: 95px;
}

.menu-aside {
  position: sticky;
  top: 96px;
}

.aside-heading {
  padding: 0 5px;
  margin-bottom: 17px;
}

.aside-heading h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 27px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.category-item:hover {
  background: rgba(255, 253, 248, 0.7);
  border-color: rgba(43, 58, 47, 0.06);
}

.category-item.active {
  color: #f8f0e1;
  background: var(--jade);
  border-color: transparent;
  box-shadow: 0 12px 24px rgba(23, 61, 47, 0.15);
}

.category-glyph {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 35px;
  height: 35px;
  border-radius: 10px;
  color: var(--jade);
  background: var(--jade-soft);
  font-family: var(--font-serif);
  font-size: 16px;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.category-item.active .category-glyph {
  color: #2d3c2e;
  background: #efd4a7;
}

.category-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.category-copy strong {
  overflow: hidden;
  font-family: var(--font-serif);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-copy small {
  overflow: hidden;
  color: var(--text-faint);
  font-size: 8px;
  letter-spacing: 0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-item.active .category-copy small {
  color: rgba(248, 240, 225, 0.45);
}

.category-count {
  margin-left: auto;
  color: var(--text-faint);
  font-family: var(--font-display);
  font-size: 9px;
}

.category-item.active .category-count {
  color: #ddb67d;
}

.aside-note {
  position: relative;
  overflow: hidden;
  margin-top: 22px;
  padding: 19px 18px 17px;
  border: 1px solid rgba(30, 67, 48, 0.08);
  border-radius: 17px;
  background:
    linear-gradient(140deg, rgba(255, 253, 248, 0.8), rgba(237, 231, 218, 0.62));
}

.aside-quote-mark {
  position: absolute;
  top: 0;
  right: 14px;
  color: rgba(23, 61, 47, 0.1);
  font-family: var(--font-serif);
  font-size: 67px;
  line-height: 1;
}

.aside-note p {
  position: relative;
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 14px;
  line-height: 1.7;
  letter-spacing: 0.04em;
}

.aside-note small {
  display: block;
  margin-top: 9px;
  color: var(--text-faint);
  font-size: 8px;
  letter-spacing: 0.08em;
}

.aside-note-stamp {
  position: absolute;
  right: 13px;
  bottom: 12px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 1px solid rgba(194, 78, 43, 0.3);
  border-radius: 5px;
  color: var(--accent);
  font-family: var(--font-serif);
  font-size: 11px;
  opacity: 0.7;
  transform: rotate(5deg);
}

.aside-profile {
  display: block;
  margin-top: 14px;
  padding: 16px 16px 14px;
  border: 1px solid rgba(23, 61, 47, 0.1);
  border-radius: 17px;
  color: inherit;
  background:
    linear-gradient(150deg, rgba(255, 253, 248, 0.92), rgba(232, 238, 228, 0.72));
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.aside-profile:hover {
  border-color: rgba(23, 61, 47, 0.24);
  transform: translateY(-1px);
}

.aside-profile-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.aside-profile-avatar {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: #7b4a25;
  background:
    radial-gradient(circle at 30% 25%, #fff3dd, transparent 45%),
    #ecd4ae;
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 700;
}

.aside-profile-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.aside-profile-copy strong {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 14px;
}

.aside-profile-copy small {
  color: var(--text-faint);
  font-size: 10px;
}

.aside-profile-orders {
  margin: 12px 0 10px;
  color: var(--text-muted);
  font-size: 11px;
}

.aside-profile-orders span {
  margin-right: 3px;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
}

.aside-profile-btn {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(23, 61, 47, 0.14);
  border-radius: 999px;
  color: var(--jade);
  background: rgba(255, 253, 248, 0.86);
  font-size: 12px;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.aside-profile-btn:hover {
  border-color: rgba(23, 61, 47, 0.3);
  background: #fff;
}


.menu-content {
  min-width: 0;
}

.menu-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 25px;
}

.menu-title-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.menu-title h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 36px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: 0.03em;
}

.dish-total {
  color: var(--text-faint);
  font-size: 10px;
}

.menu-search {
  width: 288px;
  flex-shrink: 0;
}

.menu-search :deep(.el-input__wrapper) {
  height: 43px;
  padding: 1px 14px;
  border-radius: 12px;
  background: rgba(255, 253, 248, 0.8);
  box-shadow: 0 0 0 1px rgba(36, 54, 42, 0.09) inset;
}

.menu-search :deep(.el-input__wrapper.is-focus) {
  background: #fffdf8;
  box-shadow: 0 0 0 1.5px var(--jade) inset;
}

.menu-search :deep(.el-input__prefix) {
  margin-right: 4px;
  color: #9b9d94;
}

.menu-search :deep(.el-input__inner) {
  font-size: 11px;
}

.menu-search :deep(.el-input__inner::placeholder) {
  color: #aaa89f;
}

.mobile-categories {
  display: none;
}

.category-groups {
  display: flex;
  flex-direction: column;
  gap: 34px;
}

.group-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(37, 52, 42, 0.09);
}

.group-title {
  display: flex;
  align-items: center;
  gap: 11px;
}

.group-glyph {
  display: grid;
  place-items: center;
  width: 31px;
  height: 31px;
  border-radius: 9px;
  color: var(--accent);
  background: rgba(207, 77, 43, 0.075);
  font-family: var(--font-serif);
  font-size: 15px;
}

.group-title h3 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.group-title p {
  margin: 3px 0 0;
  color: var(--text-faint);
  font-size: 8px;
  letter-spacing: 0.035em;
}

.group-count {
  color: var(--text-faint);
  font-size: 9px;
  white-space: nowrap;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 19px;
}

.empty-search,
.error-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 340px;
  padding: 36px 24px;
  border: 1px dashed rgba(37, 52, 42, 0.14);
  border-radius: 24px;
  background: rgba(255, 253, 248, 0.48);
  text-align: center;
}

.empty-search-icon,
.error-mark {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin-bottom: 17px;
  border-radius: 50%;
  color: var(--accent);
  background: rgba(207, 77, 43, 0.08);
  font-size: 22px;
}

.error-mark {
  color: var(--jade);
  background: var(--jade-soft);
}

.empty-search h3,
.error-panel h3 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.empty-search p,
.error-panel p {
  max-width: 390px;
  margin: 9px 0 20px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.9;
}

.empty-search :deep(.el-button),
.error-panel :deep(.el-button) {
  border-color: rgba(37, 52, 42, 0.16);
  background: transparent;
  color: var(--ink);
}

.empty-search :deep(.el-button:hover),
.error-panel :deep(.el-button:hover) {
  border-color: var(--accent);
  color: var(--accent);
}

.reset-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 27px auto 0;
  padding: 0;
  border: 0;
  color: var(--text-muted);
  background: transparent;
  font-size: 10px;
  cursor: pointer;
}

.reset-filter:hover {
  color: var(--accent);
}

.skeleton-area {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 19px;
}

.skeleton-card {
  overflow: hidden;
  border: 1px solid rgba(43, 58, 47, 0.06);
  border-radius: 22px;
  background: rgba(255, 253, 248, 0.6);
}

.skeleton-media {
  aspect-ratio: 4 / 2.8;
  background: #eae0d0;
}

.skeleton-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 17px;
}

.skeleton-line {
  display: block;
  width: 58%;
  height: 14px;
  border-radius: 5px;
  background: #ebe2d4;
}

.skeleton-line.short {
  width: 82%;
  height: 9px;
}

.skeleton-line.price {
  width: 34%;
  height: 18px;
  margin-top: 9px;
}

.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  animation: shimmer-move 1.5s infinite;
  transform: translateX(-100%);
}

@keyframes shimmer-move {
  to {
    transform: translateX(100%);
  }
}

@media (max-width: 1180px) {
  .hero {
    padding: 42px;
  }

  .hero-copy {
    width: 63%;
  }

  .hero-visual {
    right: 3%;
    width: clamp(250px, 27vw, 305px);
  }

  .hero-float--top {
    right: -2%;
  }

  .hero-float--bottom {
    left: -4%;
  }

  .dish-grid,
  .skeleton-area {
    gap: 16px;
  }
}

@media (min-width: 1025px) and (max-width: 1160px) {
  .dish-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .skeleton-area {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .page-container {
    padding: 22px 22px 0;
  }

  .hero {
    min-height: 340px;
    padding: 38px;
  }

  .hero-copy {
    width: 64%;
  }

  .hero-desc {
    font-size: 12px;
  }

  .hero-visual {
    right: 2%;
    width: clamp(230px, 28vw, 290px);
    opacity: 0.92;
  }

  .hero-float--top {
    right: -3%;
  }

  .hero-float--bottom {
    left: -5%;
  }

  .menu-shell {
    grid-template-columns: 1fr;
    gap: 0;
    margin-top: 30px;
  }

  .menu-aside {
    display: none;
  }

  .menu-toolbar {
    margin-bottom: 14px;
  }

  .mobile-categories {
    display: flex;
    gap: 7px;
    overflow-x: auto;
    margin: 0 -4px 22px;
    padding: 4px 4px 8px;
    scrollbar-width: none;
  }

  .mobile-categories::-webkit-scrollbar {
    display: none;
  }

  .mobile-category {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    height: 32px;
    padding: 0 12px;
    border: 1px solid rgba(37, 52, 42, 0.1);
    border-radius: 999px;
    color: var(--text-muted);
    background: rgba(255, 253, 248, 0.55);
    font-size: 10px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      background 0.2s ease,
      border-color 0.2s ease;
  }

  .mobile-category span {
    color: var(--text-faint);
    font-family: var(--font-display);
    font-size: 8px;
  }

  .mobile-category.active {
    border-color: var(--jade);
    color: #f8f0e1;
    background: var(--jade);
  }

  .mobile-category.active span {
    color: rgba(248, 240, 225, 0.55);
  }

  .dish-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .hero {
    display: block;
    min-height: auto;
    padding: 34px 28px 32px;
  }

  .hero::after {
    display: none;
  }

  .hero-copy {
    width: 100%;
  }

  .hero-visual {
    display: none;
  }

  .hero-desc {
    width: 100%;
    max-width: 550px;
  }

  .hero-actions {
    justify-content: space-between;
  }

  .dish-grid,
  .skeleton-area {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .menu-toolbar {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }

  .menu-search {
    width: 100%;
  }

}

@media (max-width: 560px) {
  .page-container {
    padding: 14px 15px 0;
  }

  .hero {
    padding: 28px 21px 26px;
    border-radius: 24px;
  }

  .hero-copy h1 {
    font-size: 36px;
  }

  .hero-desc {
    margin-top: 16px;
    font-size: 11px;
    line-height: 1.85;
  }

  .hero-chips {
    margin-top: 18px;
  }

  .hero-chips span {
    font-size: 8px;
  }

  .hero-actions {
    align-items: flex-start;
    flex-direction: column;
    gap: 11px;
    margin-top: 21px;
  }

  .hero-date {
    line-height: 1.6;
  }

  .hero-watermark {
    font-size: 280px;
  }

  .menu-shell {
    margin-top: 26px;
  }

  .menu-title h2 {
    font-size: 30px;
  }

  .menu-toolbar {
    gap: 13px;
    margin-bottom: 10px;
  }

  .category-groups {
    gap: 27px;
  }

  .group-heading {
    align-items: flex-start;
  }

  .group-title h3 {
    font-size: 18px;
  }

  .group-count {
    padding-top: 5px;
    font-size: 8px;
  }

  .dish-grid,
  .skeleton-area {
    grid-template-columns: 1fr;
  }


}

@media (prefers-reduced-motion: reduce) {
  .hero-plate-ring,
  .hero-float--top,
  .hero-float--bottom,
  .shimmer::after {
    animation: none;
  }
}
</style>
