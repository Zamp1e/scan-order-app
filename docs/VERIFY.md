# 验收与截图执行清单（PowerShell 版）

> 全部命令在 **Windows PowerShell** 中执行，不需要 bash。
> 打不开终端的情况见最后一节。

## 0. 环境

- Node.js 18.18+：本机 `C:\Program Files\nodejs\node.exe`
- Microsoft Edge 或 Google Chrome（截图脚本驱动系统浏览器，不下载内核）

## 1. 安装依赖

```powershell
cd "C:\Users\PC-1\Documents\deepseek-harness\default-workspace\scan-order-app"
npm install
```

## 2. 静态检查与构建

```powershell
npm run verify
```

等价于 `npm run check:data && npm run lint && npm run build`，三步都必须成功。

> 若 `npm` 提示“无法识别”，说明 Node 不在 PATH：
> 临时用完整路径 `& "C:\Program Files\nodejs\npm.cmd" install`，
> 或重开终端后再试。

## 3. 启动预览

```powershell
npm run preview
```

终端会输出 `http://localhost:4173/`，保持这个窗口不要关。

## 4. 生成运行截图（另开一个 PowerShell）

```powershell
cd "C:\Users\PC-1\Documents\deepseek-harness\default-workspace\scan-order-app"
npm run screenshots
```

脚本真实驱动浏览器，依次断言：

1. 错误账号提示「用户名或密码有误」
2. 正确账号登录跳转 `/home`
3. 菜品卡点「加入」后变成「− 1 +」步进器，+ 变 2、− 回 1、再 − 回到「加入」按钮（悬浮球红点同步 1→2）
4. 搜索「宫保」只剩 1 道菜
5. 分类筛选「主食汤羹」只剩 1 组
6. 详情页数量初始 0、加购按钮禁用
7. 数量改为 2 后小计 ¥79.60
8. 加购跳转 `/cart`，数量 2、总计 79.60
9. 数量 +1 后小计与总计同步为 119.40
10. 录入 999 被纠正为库存上限 36
11. 刷新 `/cart` 后登录态与数量仍为 3
12. 移除菜品后出现「购物车空空如也」
13. 悬浮球显示 `A08` 桌号、合计 ¥79.60，右上角红点为 2
14. 点击悬浮球展开购物悬浮窗，窗内是宫保鸡丁、合计 79.60，关闭后窗口消失
15. 提交订单后写入订单历史，订单号以 `ZB` 开头
16. 点击导航「我的」进入独立页面 `/profile`，显示林小满、1 条订单记录且包含该订单号
17. 退出登录后回到登录页

全部通过后才写出 `screenshots/01-login.png` ~ `08-menu-stepper.png`。

浏览器不在默认路径时：

```powershell
$env:BROWSER_PATH = "D:\Apps\Chrome\chrome.exe"; npm run screenshots
```

## 5. 手动验收建议

| 场景 | 操作 | 期望 |
| --- | --- | --- |
| 未登录直访 | 清 localStorage 后打开 `/cart` | 跳 `/login?redirect=/cart`，登录后回到购物车 |
| 登录失败 | `demo` / `000000` | 红色提示，密码被清空，不跳转 |
| 库存边界 | 购物车已有 2 份宫保鸡丁，再进详情 | 数量上限 34，超出无法输入 |
| 数量为 0 | 详情页保持 0 | 加购按钮禁用 |
| 移除 | 购物车垃圾桶并确认 | 行消失、总计重算；清空后显示空状态 |
| 卡片步进器 | 首页点「加入」后在卡片上点 − | 减到 0 时按钮恢复成「加入」，悬浮球红点同步消失 |
| 手机端点单栏 | 窄屏（<760px）打开首页 | 底部出现「菜单 / 购物车 / 我的」，购物车按钮显示份数与合计 |
| 刷新 | 在 `/dish/gongbao-chicken` 刷新 | 正常渲染，不 404 |
| 退出 | 头像下拉 → 退出登录 | 回登录页，购物车同时清空 |

## 6. 常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `npm : 无法将“npm”项识别` | Node 不在 PATH | 用 `& "C:\Program Files\nodejs\npm.cmd" <命令>`，或重开终端 |
| `bash : 无法将“bash”项识别` | 本机 `bash` 不在 PATH | 本清单不需要 bash；忽略 |
| 刷新子路由 404 | 部署服务器未配 history fallback | Nginx `try_files $uri $uri/ /index.html;` |
| 截图脚本报找不到浏览器 | 未装 Edge/Chrome 或路径特殊 | 设 `$env:BROWSER_PATH` 指向绝对路径 |
| 端口 4173 被占用 | 上次预览未关 | 关掉旧进程，或 `npm run preview -- --port 4174` |
