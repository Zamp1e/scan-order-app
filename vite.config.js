import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * GitHub Pages 的项目站点部署在 https://<user>.github.io/<repo>/ 子路径下，
 * 因此构建时必须把 base 设为 "/<repo>/"；用户站点（<user>.github.io）则保持 "/"。
 *
 * 取值优先级：shell 环境变量 VITE_BASE > .env 文件 > 默认 "/"。
 * 用 loadEnv 读取 .env 文件，是因为 Vite 在解析配置前不会把 .env 注入 process.env。
 */
export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), 'VITE_')
  const base = process.env.VITE_BASE || fileEnv.VITE_BASE || '/'

  return {
    base,
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          // 把体积大且很少变动的依赖拆成独立 chunk，避免主包超过 1MB，
          // 也让浏览器在业务代码更新时能复用缓存的 vendor 文件。
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia', 'pinia-plugin-persistedstate'],
            'element-plus': ['element-plus', '@element-plus/icons-vue'],
            axios: ['axios'],
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      // 桌面工具（如 Edge/Chrome 预占端口）可能占用 5173，交给 Vite 自动顺延。
      strictPort: false,
      open: false,
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
    },
  }
})
