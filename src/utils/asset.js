/**
 * 解析 public 目录资源，兼容部署在子路径下的场景。
 * 未提供图片或路径失效时回落到插画占位，避免出现破图。
 * @param {string} path
 * @param {string} fallback
 * @returns {string}
 */
export function resolveAsset(path, fallback = 'images/dishes/dongpo-pork.jpg') {
  const value = typeof path === 'string' ? path.trim() : ''
  const target = value || fallback
  if (!target) return ''
  if (/^(?:[a-z]+:)?\/\//i.test(target) || /^(?:data|blob):/i.test(target)) {
    return target
  }
  return `${import.meta.env.BASE_URL}${target.replace(/^\/+/, '')}`
}
