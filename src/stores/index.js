import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 单例 Pinia：路由守卫与组件共享同一份持久化状态。
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export default pinia
