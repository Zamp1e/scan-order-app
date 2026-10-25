<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, Lock, User } from '@element-plus/icons-vue'
import { fetchUsers } from '@/api/menu'
import { useUserStore } from '@/stores/user'
import { resolveAsset } from '@/utils/asset'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应为 2 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度应为 6 到 32 个字符', trigger: 'blur' },
  ],
}

const demoAccounts = [
  { username: 'demo', password: '123456', label: '银卡食客' },
  { username: 'foodie', password: 'zaobian2026', label: '金卡食客' },
  { username: 'guest', password: 'guest123', label: '普通食客' },
]

const heroImages = {
  main: resolveAsset('images/dishes/dongpo-pork.jpg'),
  steam: resolveAsset('images/dishes/xiaolongbao.jpg'),
  tea: resolveAsset('images/dishes/lemon-tea.jpg'),
}

function fillDemo(account) {
  form.username = account.username
  form.password = account.password
  errorMessage.value = ''
  formRef.value?.clearValidate()
}

function resolveRedirect() {
  const redirect = route.query.redirect
  if (typeof redirect !== 'string') return '/home'
  if (!redirect.startsWith('/') || redirect.startsWith('//')) return '/home'
  // 登录页本身不是有效落点，避免登录成功后又被“已登录”守卫弹回首页。
  if (/^\/login(?:[/?#]|$)/.test(redirect)) return '/home'
  return redirect
}

async function handleLogin() {
  if (loading.value) return

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const username = form.username.trim()
  if (!username || !form.password) return

  loading.value = true
  errorMessage.value = ''

  try {
    const users = await fetchUsers()
    const account = users.find(
      (item) =>
        String(item.username ?? '').trim() === username &&
        String(item.password ?? '') === form.password,
    )

    if (!account) {
      errorMessage.value = '用户名或密码有误，请重新输入'
      form.password = ''
      formRef.value?.clearValidate('password')
      return
    }

    userStore.signIn(account)
    ElMessage.success(`欢迎回来，${account.name || '食客'}`)
    await router.replace(resolveRedirect())
  } catch (error) {
    errorMessage.value =
      error.friendlyMessage || error.message || '用户信息加载失败，请检查网络或数据文件'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <section class="login-showcase">
      <div class="showcase-pattern" aria-hidden="true"></div>

      <header class="showcase-top">
        <div class="brand brand-light">
          <span class="brand-stamp">灶</span>
          <span class="brand-copy">
            <strong>灶边小馆</strong>
            <small>ZAOBIAN KITCHEN</small>
          </span>
        </div>
        <span class="table-pill">
          <span class="table-dot"></span>
          桌码 · A08
        </span>
      </header>

      <div class="showcase-content">
        <p class="eyebrow eyebrow-light">SCAN · ORDER · ENJOY</p>
        <h1>人间烟火气<br /><em>最抚凡人心</em></h1>
        <p class="showcase-desc">
          扫码入座，慢慢挑一道合胃口的菜。厨房现炒，热气上桌，把这一餐吃得认真一点。
        </p>

        <div class="showcase-steps" aria-label="点餐流程">
          <span><i>01</i> 扫码入座</span>
          <span><i>02</i> 挑选菜品</span>
          <span><i>03</i> 静候上菜</span>
        </div>
      </div>

      <div class="food-collage" aria-hidden="true">
        <figure class="plate-card plate-main">
          <img :src="heroImages.main" alt="" />
          <figcaption>
            <span>今日招牌</span>
            <strong>东坡肉</strong>
          </figcaption>
        </figure>
        <figure class="plate-card plate-steam">
          <img :src="heroImages.steam" alt="" />
        </figure>
        <figure class="plate-card plate-tea">
          <img :src="heroImages.tea" alt="" />
        </figure>
        <span class="collage-seal">现炒<br />上桌</span>
      </div>

      <blockquote class="showcase-quote">
        <span>“</span>
        一餐一饭，心有所栖。
        <footer>灶边食签 · 今日</footer>
      </blockquote>
    </section>

    <section class="login-panel">
      <div class="panel-inner">
        <div class="mobile-brand">
          <span class="brand-stamp">灶</span>
          <span class="brand-copy">
            <strong>灶边小馆</strong>
            <small>ZAOBIAN KITCHEN</small>
          </span>
        </div>

        <div class="login-card">
          <p class="card-index">NO. 08 / WELCOME BACK</p>
          <h2>欢迎回来</h2>
          <p class="card-desc">登录后开始点餐，今天也要好好吃饭。</p>

          <el-form
            ref="formRef"
            class="login-form"
            :model="form"
            :rules="rules"
            label-position="top"
          >
            <el-form-item prop="username">
              <el-input
                v-model="form.username"
                :prefix-icon="User"
                placeholder="请输入用户名"
                size="large"
                clearable
                autocomplete="username"
                aria-label="用户名"
                @keydown.enter.prevent="handleLogin"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                :prefix-icon="Lock"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                autocomplete="current-password"
                aria-label="密码"
                @keydown.enter.prevent="handleLogin"
              />
            </el-form-item>

            <Transition name="alert-slide">
              <el-alert
                v-if="errorMessage"
                class="login-error"
                :title="errorMessage"
                type="error"
                :closable="false"
                show-icon
              />
            </Transition>

            <el-form-item class="submit-item">
              <el-button
                class="login-button"
                type="primary"
                size="large"
                :loading="loading"
                @click="handleLogin"
              >
                <span>{{ loading ? '正在入座...' : '进入小馆' }}</span>
                <el-icon v-if="!loading"><ArrowRight /></el-icon>
              </el-button>
            </el-form-item>
          </el-form>

          <div class="demo-panel">
            <div class="demo-head">
              <span>演示账号</span>
              <em>点击自动填入</em>
            </div>
            <div class="demo-list">
              <button
                v-for="account in demoAccounts"
                :key="account.username"
                class="demo-account"
                type="button"
                @click="fillDemo(account)"
              >
                <span class="demo-avatar">{{ account.username.slice(0, 1).toUpperCase() }}</span>
                <span class="demo-copy">
                  <strong>{{ account.username }}</strong>
                  <small>{{ account.password }} · {{ account.label }}</small>
                </span>
                <el-icon><ArrowRight /></el-icon>
              </button>
            </div>
          </div>

          <p class="privacy-note">账户信息仅用于本地课程演示，不会上传至服务器。</p>
        </div>

        <footer class="panel-footer">
          <span>营业时间 10:30 — 21:30</span>
          <span>© 2026 ZAOBIAN KITCHEN</span>
        </footer>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(460px, 0.88fr);
  background: var(--cream);
}

.login-showcase {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 38px 48px 42px;
  color: var(--ink);
  background:
    radial-gradient(circle at 80% 12%, rgba(30, 58, 48, 0.05), transparent 42%),
    linear-gradient(158deg, #f5edde 0%, #efe5d3 56%, #ece1cd 100%);
  border-right: 1px solid rgba(26, 25, 23, 0.16);
}

.login-showcase::before {
  content: '';
  position: absolute;
  right: -160px;
  bottom: -220px;
  width: 620px;
  height: 620px;
  border: 1px solid rgba(240, 206, 155, 0.16);
  border-radius: 50%;
  box-shadow:
    0 0 0 60px rgba(240, 206, 155, 0.035),
    0 0 0 130px rgba(240, 206, 155, 0.025);
}

.login-showcase::after {
  content: '食';
  position: absolute;
  top: 12%;
  right: 4%;
  color: rgba(30, 58, 48, 0.07);
  font-family: var(--font-serif);
  font-size: clamp(240px, 32vw, 440px);
  line-height: 1;
  pointer-events: none;
}

.showcase-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.24;
  background-image:
    linear-gradient(rgba(246, 233, 211, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(246, 233, 211, 0.08) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent 72%);
  pointer-events: none;
}

.showcase-top {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.brand-stamp {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  color: var(--jade);
  background: #efe5d3;
  font-family: var(--font-serif);
  font-size: 23px;
  line-height: 1;
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
}

.brand-copy small {
  color: var(--text-muted);
  font-size: 8px;
  letter-spacing: 0.22em;
}

.table-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 13px;
  border: 1px solid rgba(246, 234, 214, 0.18);
  border-radius: 999px;
  background: rgba(26, 25, 23, 0.04);
  color: var(--ink);
  font-size: 11px;
  letter-spacing: 0.08em;
  backdrop-filter: blur(8px);
}

.table-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--jade);
  box-shadow: 0 0 0 4px rgba(30, 58, 48, 0.12);
}

.showcase-content {
  position: relative;
  z-index: 2;
  width: min(590px, 64%);
  margin-top: clamp(70px, 12vh, 142px);
}

.eyebrow {
  margin: 0 0 18px;
  color: var(--accent);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: 0.25em;
}

.eyebrow-light {
  color: var(--jade);
}

.showcase-content h1 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(48px, 5.2vw, 76px);
  font-weight: 600;
  line-height: 1.18;
  letter-spacing: 0.02em;
}

.showcase-content h1 em {
  position: relative;
  color: var(--jade);
  font-style: normal;
}

.showcase-content h1 em::after {
  content: '';
  position: absolute;
  left: 4px;
  right: 4px;
  bottom: 2px;
  height: 7px;
  border-radius: 999px;
  background: rgba(30, 58, 48, 0.2);
  transform: rotate(-1.5deg);
}

.showcase-desc {
  width: min(410px, 88%);
  margin: 26px 0 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 2;
  letter-spacing: 0.04em;
}

.showcase-steps {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-top: 36px;
  color: var(--text-faint);
  font-size: 11px;
  letter-spacing: 0.08em;
}

.showcase-steps span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
}

.showcase-steps i {
  color: var(--jade);
  font-family: var(--font-display);
  font-size: 10px;
  font-style: normal;
  letter-spacing: 0.12em;
}

.food-collage {
  position: absolute;
  z-index: 2;
  right: 3.5%;
  bottom: 10.5%;
  width: min(42%, 430px);
  height: min(47%, 400px);
  pointer-events: none;
}

.plate-card {
  position: absolute;
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 248, 232, 0.19);
  border-radius: 20px;
  background: #fdfaf2;
  box-shadow: 0 22px 50px rgba(40, 32, 20, 0.16);
}

.plate-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plate-main {
  right: 1%;
  top: 1%;
  width: 76%;
  aspect-ratio: 1 / 1.06;
  transform: rotate(5deg);
}

.plate-main figcaption {
  position: absolute;
  left: 14px;
  bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: var(--ink);
  background: rgba(255, 252, 245, 0.92);
  backdrop-filter: blur(10px);
}

.plate-main figcaption span {
  color: var(--text-faint);
  font-size: 8px;
  letter-spacing: 0.16em;
}

.plate-main figcaption strong {
  font-family: var(--font-serif);
  font-size: 15px;
  letter-spacing: 0.08em;
}

.plate-steam {
  left: -7%;
  bottom: 5%;
  width: 39%;
  aspect-ratio: 1 / 1.05;
  transform: rotate(-8deg);
}

.plate-tea {
  left: 4%;
  top: -11%;
  width: 27%;
  aspect-ratio: 0.83;
  transform: rotate(-5deg);
}

.collage-seal {
  position: absolute;
  right: -2%;
  bottom: 1%;
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border: 1px solid rgba(30, 58, 48, 0.45);
  border-radius: 50%;
  color: var(--jade);
  font-family: var(--font-serif);
  font-size: 12px;
  line-height: 1.4;
  letter-spacing: 0.1em;
  text-align: center;
  transform: rotate(9deg);
}

.showcase-quote {
  position: relative;
  z-index: 3;
  width: min(370px, 52%);
  margin: auto 0 0;
  padding: 17px 22px;
  border-left: 1px solid rgba(232, 191, 133, 0.4);
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 13px;
  letter-spacing: 0.06em;
}

.showcase-quote > span {
  position: absolute;
  left: 8px;
  top: 0;
  color: var(--text-faint);
  font-size: 27px;
  line-height: 1;
}

.showcase-quote footer {
  margin-top: 7px;
  color: var(--text-faint);
  font-family: var(--font-sans);
  font-size: 9px;
  letter-spacing: 0.16em;
}

.login-panel {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 48px 40px;
  background:
    radial-gradient(circle at 88% 12%, rgba(212, 189, 151, 0.2), transparent 30%),
    radial-gradient(circle at 4% 96%, rgba(210, 92, 49, 0.08), transparent 32%), #faf6ee;
}

.login-panel::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 1px;
  height: 120px;
  background: linear-gradient(transparent, rgba(23, 61, 47, 0.16), transparent);
}

.panel-inner {
  width: min(410px, 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 32px;
}

.mobile-brand {
  display: none;
}

.card-index {
  margin: 0 0 24px;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.login-card h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 42px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.05em;
}

.card-desc {
  margin: 12px 0 32px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.8;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.login-form :deep(.el-input__wrapper) {
  height: 52px;
  padding: 1px 16px;
  border-radius: 14px;
  background: rgba(255, 253, 248, 0.9);
  box-shadow: 0 0 0 1px rgba(35, 55, 43, 0.11) inset;
  transition:
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(35, 55, 43, 0.24) inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  background: #fffefa;
  box-shadow:
    0 0 0 1.5px var(--jade) inset,
    0 10px 24px rgba(23, 61, 47, 0.08);
}

.login-form :deep(.el-input__prefix) {
  margin-right: 7px;
  color: #94a096;
}

.login-form :deep(.el-input__inner) {
  color: var(--ink);
  font-size: 13px;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #aaa89f;
}

.login-form :deep(.el-form-item__error) {
  padding-top: 4px;
  padding-left: 4px;
  font-size: 11px;
}

.login-form :deep(.el-form-item.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px #cc5f41 inset;
}

.login-error {
  margin: -2px 0 18px;
  border: 1px solid rgba(191, 77, 51, 0.16);
  border-radius: 12px;
  background: rgba(191, 77, 51, 0.055);
}

.login-error :deep(.el-alert__icon) {
  color: #c75b3d;
}

.login-error :deep(.el-alert__title) {
  color: #9e3e28;
  font-size: 12px;
  line-height: 1.5;
}

.submit-item {
  margin-top: 2px;
  margin-bottom: 26px !important;
}

.login-button {
  width: 100%;
  height: 52px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(115deg, rgba(255, 255, 255, 0.14), transparent 40%), var(--jade);
  box-shadow: 0 14px 26px rgba(23, 61, 47, 0.18);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.14em;
}

.login-button:hover,
.login-button:focus {
  background: linear-gradient(115deg, rgba(255, 255, 255, 0.18), transparent 40%), #1c4c3a;
  box-shadow: 0 16px 30px rgba(23, 61, 47, 0.24);
  transform: translateY(-1px);
}

.login-button .el-icon {
  margin-left: 10px;
  font-size: 15px;
}

.demo-panel {
  padding-top: 21px;
  border-top: 1px solid rgba(35, 55, 43, 0.09);
}

.demo-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.demo-head span {
  color: var(--ink);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.demo-head em {
  color: var(--text-faint);
  font-size: 9px;
  font-style: normal;
}

.demo-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.demo-account {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid rgba(35, 55, 43, 0.09);
  border-radius: 12px;
  background: rgba(255, 253, 248, 0.62);
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.demo-account:hover {
  border-color: rgba(30, 58, 48, 0.3);
  background: #fffdf8;
  transform: translateY(-1px);
}

.demo-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  color: var(--jade);
  background: var(--jade-soft);
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
}

.demo-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.demo-copy strong {
  overflow: hidden;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.demo-copy small {
  overflow: hidden;
  color: var(--text-faint);
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.demo-account > .el-icon {
  flex-shrink: 0;
  margin-left: auto;
  color: #b5b3ab;
  font-size: 11px;
}

.privacy-note {
  margin: 19px 0 0;
  color: var(--text-faint);
  font-size: 9px;
  line-height: 1.7;
  text-align: center;
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: var(--text-faint);
  font-family: var(--font-display);
  font-size: 8px;
  letter-spacing: 0.1em;
}

.alert-slide-enter-active,
.alert-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.alert-slide-enter-from,
.alert-slide-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

@media (max-width: 1180px) {
  .login-showcase {
    padding: 32px 36px 36px;
  }

  .login-page {
    grid-template-columns: minmax(0, 1fr) minmax(420px, 0.9fr);
  }

  .showcase-content {
    width: min(520px, 76%);
  }

  .food-collage {
    right: 1%;
    bottom: 14%;
    width: 40%;
  }

  .showcase-quote {
    width: 48%;
  }
}

@media (max-width: 920px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-showcase {
    display: none;
  }

  .login-panel {
    min-height: 100vh;
    padding: 28px 22px;
    align-items: flex-start;
  }

  .panel-inner {
    width: min(430px, 100%);
    margin: auto;
    gap: 26px;
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
  }

  .mobile-brand .brand-stamp {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    color: #f9e8d2;
    background: var(--jade);
    font-size: 21px;
  }

  .mobile-brand .brand-copy strong {
    color: var(--ink);
    font-family: var(--font-serif);
    font-size: 19px;
    letter-spacing: 0.12em;
  }

  .mobile-brand .brand-copy small {
    color: var(--text-faint);
  }

  .login-card {
    padding: 30px 24px;
    border: 1px solid rgba(35, 55, 43, 0.08);
    border-radius: 24px;
    background: rgba(255, 253, 248, 0.66);
    box-shadow: 0 24px 60px rgba(66, 49, 31, 0.07);
  }

  .login-card h2 {
    font-size: 36px;
  }

  .panel-footer {
    justify-content: center;
    text-align: center;
  }

  .panel-footer span:last-child {
    display: none;
  }
}

@media (max-width: 520px) {
  .login-panel {
    padding: 20px 14px;
  }

  .login-card {
    padding: 25px 18px;
  }

  .login-card h2 {
    font-size: 32px;
  }

  .card-index {
    margin-bottom: 18px;
  }

  .card-desc {
    margin-bottom: 24px;
  }

  .demo-list {
    grid-template-columns: 1fr;
  }
}
</style>
