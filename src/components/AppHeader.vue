<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, LocationFilled, SwitchButton, User } from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

function handleCommand(command) {
  if (command === 'profile') {
    router.push({ name: 'profile' })
    return
  }
  if (command !== 'logout') return

  userStore.signOut()
  cartStore.clearCart()
  ElMessage.success('已退出登录，期待下次见')
  router.replace({ name: 'login' })
}

// 桌面端滚动时给吸顶导航加阴影，避免与内容糊在一起。
const scrolled = ref(false)

function handleScroll() {
  scrolled.value = window.scrollY > 6
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <header class="site-header" :class="{ 'is-scrolled': scrolled }">
    <div class="header-inner">
      <RouterLink class="brand" to="/home" aria-label="灶边小馆点餐首页">
        <span class="brand-stamp">灶</span>
        <span class="brand-copy">
          <strong>灶边小馆</strong>
          <small>ZAOBIAN KITCHEN</small>
        </span>
      </RouterLink>

      <nav class="main-nav" aria-label="主导航">
        <RouterLink class="nav-link" to="/home">今日菜单</RouterLink>
        <RouterLink class="nav-link" to="/profile">我的</RouterLink>
      </nav>

      <div class="header-actions">
        <span class="table-tag">
          <el-icon><LocationFilled /></el-icon>
          <span class="table-copy">
            <small>TABLE</small>
            {{ userStore.tableNo }} 桌
          </span>
        </span>

        <el-dropdown trigger="click" @command="handleCommand">
          <button class="user-chip" type="button" aria-label="打开用户菜单">
            <span class="user-avatar">{{ userStore.avatarText }}</span>
            <span class="user-copy">
              <strong>{{ userStore.displayName }}</strong>
              <small>{{ userStore.level }}</small>
            </span>
            <el-icon class="chevron"><ArrowDown /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>
                {{ userStore.tableNo }} 号桌 · {{ userStore.level }}
              </el-dropdown-item>
              <el-dropdown-item divided command="profile">
                <el-icon><User /></el-icon>
                我的主页
              </el-dropdown-item>
              <el-dropdown-item command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 28px;
  border-bottom: 1px solid rgba(37, 53, 44, 0.08);
  background: rgba(247, 242, 232, 0.86);
  backdrop-filter: blur(18px);
  transition:
    box-shadow 0.25s ease,
    background 0.25s ease;
}

.site-header.is-scrolled {
  background: rgba(247, 242, 232, 0.94);
  box-shadow: 0 10px 26px rgba(53, 41, 26, 0.07);
}

.header-inner {
  width: min(1240px, 100%);
  min-height: 54px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 42px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--ink);
  flex-shrink: 0;
}

.brand-stamp {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  color: #f9e8d2;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.13), transparent 55%),
    var(--jade);
  font-family: var(--font-serif);
  font-size: 23px;
  line-height: 1;
  box-shadow: 0 8px 18px rgba(23, 61, 47, 0.2);
  transform: rotate(-3deg);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.brand-copy strong {
  font-family: var(--font-serif);
  font-size: 20px;
  letter-spacing: 0.13em;
  font-weight: 700;
}

.brand-copy small {
  color: var(--text-faint);
  font-size: 8px;
  letter-spacing: 0.22em;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-link {
  position: relative;
  padding: 9px 16px;
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.nav-link:hover {
  color: var(--ink);
  background: rgba(23, 61, 47, 0.055);
}

.nav-link.router-link-active {
  color: var(--jade);
  background: rgba(23, 61, 47, 0.08);
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
  transform: translateX(-50%);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.table-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 13px;
  border: 1px solid rgba(23, 61, 47, 0.12);
  border-radius: 12px;
  color: var(--jade);
  background: rgba(255, 253, 248, 0.6);
}

.table-tag .el-icon {
  font-size: 15px;
  color: var(--accent);
}

.table-copy {
  display: flex;
  align-items: baseline;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
}

.table-copy small {
  color: var(--text-faint);
  font-size: 8px;
  letter-spacing: 0.12em;
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 4px 8px 4px 4px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.user-chip:hover {
  background: rgba(255, 253, 248, 0.7);
  border-color: rgba(23, 61, 47, 0.09);
}

.user-avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: #7b4a25;
  background:
    radial-gradient(circle at 30% 25%, #fff3dd, transparent 45%),
    #ecd4ae;
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 700;
}

.user-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
}

.user-copy strong {
  color: var(--ink);
  font-size: 12px;
  font-weight: 600;
}

.user-copy small {
  color: var(--text-faint);
  font-size: 9px;
}

.chevron {
  color: var(--text-faint);
  font-size: 11px;
}

@media (max-width: 1000px) {
  .header-inner {
    gap: 22px;
  }

  .table-tag {
    display: none;
  }
}

@media (max-width: 760px) {
  .site-header {
    padding: 8px 18px;
  }

  .header-inner {
    min-height: 50px;
    gap: 14px;
  }

  .brand-stamp {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    font-size: 20px;
  }

  .brand-copy strong {
    font-size: 17px;
  }

  .brand-copy small,
  .main-nav,
  .user-copy,
  .chevron {
    display: none;
  }

  .header-actions {
    gap: 9px;
  }

  .user-chip {
    padding: 0;
  }

  .user-avatar {
    width: 34px;
    height: 34px;
  }
}
</style>
