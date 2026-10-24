import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import pinia from './stores'
import './styles/main.css'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 兜底：避免单个组件异常导致整页白屏，至少把错误暴露到控制台并保留导航能力。
app.config.errorHandler = (error, _instance, info) => {
  console.error('[灶边小馆] 页面运行出错：', info, error)
}

app.mount('#app')
