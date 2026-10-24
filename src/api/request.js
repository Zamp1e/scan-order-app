import axios from 'axios'

// BASE_URL 兼顾开发环境根路径和部署到子目录的场景。
const request = axios.create({
  baseURL: import.meta.env.BASE_URL,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
  },
})

request.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const isCanceled = error.code === 'ERR_CANCELED'

    if (!isCanceled) {
      if (status) {
        error.friendlyMessage = `数据请求失败（HTTP ${status}）`
      } else if (error.code === 'ECONNABORTED') {
        error.friendlyMessage = '数据请求超时，请稍后重试'
      } else {
        error.friendlyMessage = '数据请求失败，请检查网络或本地数据文件'
      }
    }

    return Promise.reject(error)
  },
)

export default request
