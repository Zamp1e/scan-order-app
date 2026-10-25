<script setup>
import { computed, onMounted, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import MenuRow from '@/components/MenuRow.vue'
import { useCartStore } from '@/stores/cart'
import { useMenuStore } from '@/stores/menu'
import { useOrdersStore } from '@/stores/orders'
import { useUserStore } from '@/stores/user'
import { addDishWithFeedback } from '@/utils/cart'

const menuStore = useMenuStore()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()
const userStore = useUserStore()

const keyword = ref('')
const selectedCategory = ref('all')
const hoveredId = ref('')

const myOrderCount = computed(() => ordersStore.ordersOf(userStore.profile?.username).length)

const todayLabel = new Intl.DateTimeFormat('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

const groups = computed(() => {
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

const resultCount = computed(() => groups.value.reduce((total, group) => total + group.dishes.length, 0))
const hasActiveFilter = computed(
  () => Boolean(keyword.value.trim()) || selectedCategory.value !== 'all',
)
const isInitialLoading = computed(() => !menuStore.loaded && !menuStore.error)
const hasError = computed(() => Boolean(menuStore.error) && !menuStore.loaded)

// 左栏大图预览：优先显示鼠标停留的菜品，否则显示当前列表第一道
const previewDish = computed(() => {
  const hovered = menuStore.dishes.find((dish) => dish.id === hoveredId.value)
  if (hovered) return hovered
  return groups.value[0]?.dishes[0] || menuStore.featuredDish || null
})

const previewImage = computed(() => previewDish.value?.image || 'images/dishes/dongpo-pork.jpg')

function selectCategory(categoryId) {
  selectedCategory.value = categoryId
  hoveredId.value = ''
}

function resetFilters() {
  keyword.value = ''
  selectedCategory.value = 'all'
}

function handleAdd(dish) {
  addDishWithFeedback(cartStore, dish)
}

function preview(dish) {
  hoveredId.value = dish.id
}

onMounted(() => {
  menuStore.loadMenu()
})
</script>

<template>
  <main class="home-page">
    <div class="page-container">
      <header class="menu-head" aria-labelledby="home-heading">
        <div class="menu-head-copy">
          <p class="eyebrow">ZAOBIAN · TODAY'S MENU</p>
          <h1 id="home-heading">今日菜单</h1>
          <p class="menu-head-sub">
            {{ todayLabel }} · {{ userStore.tableNo }} 号桌 · 今日供应
            {{ menuStore.dishes.length }} 道
          </p>
        </div>

        <div class="menu-search">
          <el-input
            v-model="keyword"
            :prefix-icon="Search"
            placeholder="搜索菜品，如宫保鸡丁"
            size="large"
            clearable
            aria-label="按菜品名称搜索"
            @keyup.esc="keyword = ''"
          />
        </div>
      </header>

      <div class="spread">
        <aside class="spread-rail" aria-label="菜品分类与预览">
          <figure class="preview">
            <img :src="previewImage" :alt="previewDish?.name || '今日菜单'" loading="lazy" />
            <figcaption>
              <strong>{{ previewDish?.name || '今日菜单' }}</strong>
              <p>{{ previewDish?.description || '挑几道合胃口的菜，灶台马上开火。' }}</p>
            </figcaption>
          </figure>

          <ul class="cat-list">
            <li>
              <button
                class="category-item"
                :class="{ active: selectedCategory === 'all' }"
                type="button"
                @click="selectCategory('all')"
              >
                <span class="cat-name">全部菜品</span>
                <span class="cat-count">{{ String(menuStore.dishes.length).padStart(2, '0') }}</span>
              </button>
            </li>
            <li v-for="category in menuStore.categoriesWithCount" :key="category.id">
              <button
                class="category-item"
                :class="{ active: selectedCategory === category.id }"
                type="button"
                @click="selectCategory(category.id)"
              >
                <span class="cat-name">{{ category.name }}</span>
                <span class="cat-count">{{ String(category.count).padStart(2, '0') }}</span>
              </button>
            </li>
          </ul>

          <RouterLink class="rail-profile" :to="{ name: 'profile' }" aria-label="打开个人中心">
            <span class="rail-avatar">{{ userStore.avatarText }}</span>
            <span class="rail-copy">
              <strong>{{ userStore.displayName }}</strong>
              <small>{{ myOrderCount }} 单历史订单</small>
            </span>
            <span class="rail-arrow" aria-hidden="true">→</span>
          </RouterLink>
        </aside>

        <section class="menu-content" aria-labelledby="menu-heading">
          <div class="content-head">
            <h2 id="menu-heading" class="content-title">
              {{ selectedCategory === 'all' ? '全部菜品' : menuStore.categoryName(selectedCategory) }}
            </h2>
            <span class="content-count">{{ resultCount }} 道</span>
          </div>

          <div v-if="isInitialLoading" class="skeleton-area" aria-label="菜单加载中">
            <div v-for="index in 6" :key="index" class="skeleton-row">
              <span class="skeleton-thumb shimmer"></span>
              <span class="skeleton-line shimmer"></span>
              <span class="skeleton-line short shimmer"></span>
            </div>
          </div>

          <div v-else-if="hasError" class="error-panel" role="alert">
            <el-icon><Refresh /></el-icon>
            <div>
              <h3>菜单加载失败</h3>
              <p>{{ menuStore.error }}</p>
            </div>
            <el-button round @click="menuStore.loadMenu(true)">重新加载</el-button>
          </div>

          <template v-else>
            <div v-if="!groups.length" class="empty-search">
              <h3>没有找到这道菜</h3>
              <p>换个关键词试试，厨房今天还有 {{ menuStore.dishes.length }} 道好菜。</p>
              <button class="reset-filter" type="button" @click="resetFilters">查看全部菜单</button>
            </div>

            <div v-else class="category-groups">
              <section
                v-for="group in groups"
                :id="`category-${group.id}`"
                :key="group.id"
                class="category-group"
              >
                <header class="group-heading">
                  <h3>{{ group.name }}</h3>
                  <span class="group-en">{{ group.id.toUpperCase() }}</span>
                  <span class="group-count">{{ group.dishes.length }} 道供应中</span>
                </header>

                <MenuRow
                  v-for="dish in group.dishes"
                  :key="dish.id"
                  :dish="dish"
                  @add="handleAdd"
                  @preview="preview(dish)"
                />
              </section>
            </div>

            <button v-if="hasActiveFilter" class="reset-filter" type="button" @click="resetFilters">
              清除筛选，查看全部菜单
            </button>
          </template>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.home-page {
  padding: 0 0 24px;
  container-type: inline-size;
}

.page-container {
  width: min(1140px, 100%);
  margin: 0 auto;
  padding: 34px 28px 0;
}

.menu-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line-strong);
}

.menu-head-copy .eyebrow {
  margin: 0 0 8px;
  color: var(--jade);
  font-family: var(--font-display);
  font-size: 10px;
  letter-spacing: 0.26em;
}

.menu-head h1 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 44px;
  font-weight: 600;
  letter-spacing: 0.14em;
  line-height: 1.1;
}

.menu-head-sub {
  margin: 12px 0 0;
  color: var(--text-muted);
  font-size: 12px;
  letter-spacing: 0.04em;
}

.menu-search {
  width: min(320px, 42vw);
}

.menu-search :deep(.el-input__wrapper) {
  border-radius: 0;
  border-bottom: 1px solid var(--line-strong);
  background: transparent;
  box-shadow: none;
  padding-left: 0;
}

.menu-search :deep(.el-input__wrapper.is-focus) {
  border-bottom-color: var(--jade);
}

.spread {
  display: grid;
  grid-template-columns: 246px minmax(0, 1fr);
  gap: 46px;
  margin-top: 26px;
}

.spread-rail {
  position: sticky;
  top: 82px;
  align-self: start;
}

.preview {
  margin: 0;
}

.preview img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: var(--cream-deep);
}

.preview figcaption {
  padding: 12px 0 0;
}

.preview strong {
  font-family: var(--font-serif);
  font-size: 15px;
  letter-spacing: 0.06em;
}

.preview p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.8;
}

.cat-list {
  margin: 22px 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--line-strong);
}

.cat-list li {
  border-bottom: 1px solid var(--line-soft);
}

.category-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 11px 2px;
  border: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: color 0.18s ease;
}

.category-item .cat-name {
  font-family: var(--font-serif);
  font-size: 14px;
  letter-spacing: 0.08em;
}

.category-item .cat-count {
  color: var(--text-faint);
  font-family: var(--font-display);
  font-size: 10px;
  letter-spacing: 0.12em;
}

.category-item:hover .cat-name {
  color: var(--jade);
}

.category-item.active .cat-name {
  color: var(--jade);
  font-weight: 600;
}

.category-item.active .cat-count {
  color: var(--jade);
}

.rail-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 22px;
  padding: 12px 2px 0;
  border-top: 1px solid var(--line-strong);
  color: var(--ink);
}

.rail-avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  font-family: var(--font-serif);
  font-size: 14px;
}

.rail-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rail-copy strong {
  font-family: var(--font-serif);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.rail-copy small {
  color: var(--text-faint);
  font-size: 10px;
}

.rail-arrow {
  margin-left: auto;
  color: var(--text-faint);
  font-size: 12px;
}

.content-head {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-strong);
}

.content-title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.content-count {
  color: var(--text-faint);
  font-size: 11px;
  letter-spacing: 0.06em;
}

.category-groups {
  margin-top: 6px;
}

.category-group {
  margin-bottom: 26px;
}

.group-heading {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 18px 0 8px;
}

.group-heading h3 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.group-en {
  color: var(--text-faint);
  font-family: var(--font-display);
  font-size: 9px;
  letter-spacing: 0.18em;
}

.group-count {
  margin-left: auto;
  color: var(--text-faint);
  font-size: 10px;
}

.skeleton-area {
  padding-top: 18px;
}

.skeleton-row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) 90px;
  gap: 16px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--line-soft);
}

.skeleton-thumb,
.skeleton-line {
  display: block;
  height: 12px;
  background: var(--cream-deep);
}

.skeleton-thumb {
  width: 64px;
  height: 64px;
}

.skeleton-line.short {
  width: 70%;
}

.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 253, 248, 0.7), transparent);
  animation: shimmer-move 1.4s infinite;
}

@keyframes shimmer-move {
  to {
    transform: translateX(100%);
  }
}

.error-panel {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 26px;
  border: 1px solid var(--line-strong);
}

.error-panel h3 {
  margin: 0 0 4px;
  font-family: var(--font-serif);
  font-size: 16px;
}

.error-panel p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
}

.error-panel :deep(.el-button) {
  margin-left: auto;
}

.empty-search {
  padding: 70px 20px;
  border: 1px solid var(--line-soft);
  text-align: center;
}

.empty-search h3 {
  margin: 0 0 8px;
  font-family: var(--font-serif);
  font-size: 18px;
}

.empty-search p {
  margin: 0 0 18px;
  color: var(--text-muted);
  font-size: 12px;
}

.reset-filter {
  display: inline-flex;
  margin-top: 10px;
  padding: 8px 0;
  border: 0;
  border-bottom: 1px solid var(--ink);
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 12px;
  letter-spacing: 0.06em;
  cursor: pointer;
}

.reset-filter:hover {
  color: var(--jade);
  border-bottom-color: var(--jade);
}

@container (max-width: 900px) {
  .page-container {
    padding: 22px 16px 0;
  }

  .menu-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .menu-head h1 {
    font-size: 32px;
  }

  .menu-search {
    width: 100%;
  }

  .spread {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    margin-top: 18px;
  }

  .spread-rail {
    position: static;
    display: block;
  }

  .preview {
    display: none;
  }

  .cat-list {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    margin: 0 0 16px;
    padding-bottom: 2px;
    overflow-x: auto;
    border-top: 0;
    scrollbar-width: none;
  }

  .cat-list::-webkit-scrollbar {
    display: none;
  }

  .cat-list li {
    flex: 0 0 auto;
    border-bottom: 0;
  }

  .category-item {
    width: auto;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid var(--line-soft);
    border-radius: 999px;
  }

  .category-item.active {
    border-color: var(--jade);
  }

  .rail-profile {
    display: none;
  }
}
</style>
