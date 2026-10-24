import { defineStore } from 'pinia'

/**
 * 用户状态：只持久化脱敏后的用户资料，绝不在前端存储密码。
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null,
  }),

  getters: {
    isLoggedIn: (state) => Boolean(state.profile?.username),
    displayName: (state) => state.profile?.name || '食客',
    tableNo: (state) => state.profile?.tableNo || 'A01',
    level: (state) => state.profile?.level || '普通食客',
    avatarText: (state) => (state.profile?.name || '食').slice(0, 1),
  },

  actions: {
    /**
     * 登录成功后写入当前用户快照。
     * @param {Record<string, unknown>} account
     */
    signIn(account) {
      this.profile = {
        id: account.id ?? null,
        username: String(account.username ?? '').trim(),
        name: String(account.name || account.username || '食客'),
        tableNo: String(account.tableNo || 'A01'),
        level: String(account.level || '普通食客'),
        greeting: String(account.greeting || '今天也要好好吃饭'),
      }
    },

    signOut() {
      this.profile = null
    },
  },

  // 刷新页面后从 localStorage 自动恢复，满足登录态持久化要求。
  persist: {
    key: 'zaobian-user',
  },
})
