import { createRouter, createWebHistory } from 'vue-router'
import pinia from '@/stores'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: {
      title: '登录',
      guestOnly: true,
    },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/home',
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '今日菜单' },
      },
      {
        path: 'dish/:id',
        name: 'dish-detail',
        component: () => import('@/views/DishDetailView.vue'),
        meta: { title: '菜品详情' },
      },
      {
        path: 'cart',
        name: 'cart',
        component: () => import('@/views/CartView.vue'),
        meta: { title: '我的购物车' },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/ProfileView.vue'),
        meta: { title: '个人中心' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面走丢了' },
  },
]

// history 模式：地址栏无 #，生产环境需配置 index.html fallback。
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 96 }
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const userStore = useUserStore(pinia)
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !userStore.isLoggedIn) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  // 已登录仍访问登录页时，丢弃其 redirect，直接回首页，避免循环跳转。
  if (to.meta.guestOnly && userStore.isLoggedIn) {
    return { name: 'home' }
  }

  return true
})

router.afterEach((to) => {
  document.title = `${to.meta.title || '点餐'} · 灶边小馆`
})

export default router
