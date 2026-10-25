# 交付说明（务必先读）

## 一、交付内容

`scan-order-app/` 是一个可直接运行的 Vue 3 + Vite 扫码点餐项目，覆盖课程要求的全部功能点与技术点：

- **登录页**：Element Plus 表单校验，读取 `public/data/users.json` 匹配账号，失败提示“用户名或密码有误”，成功后写入 Pinia 并跳转首页；支持 `?redirect=` 回跳。
- **点餐首页**：对开页排版——左栏分类目录与菜品大图预览，右栏五个分类的菜品行（缩略图、规格、评分、标签、价格）；按名称实时搜索、分类筛选；菜品行「加入」后原地变为 `− 数量 +` 步进器，减到 0 恢复「加入」。
- **菜品详情**：大图、规格、原价、折扣价、库存、描述，数量 0 起步、上限受库存约束，加入后跳转 `/cart`。
- **购物车**：右下角常驻悬浮球（桌号 + 合计 + 红点份数），点击弹出**购物悬浮窗**，可增减数量、移除、清空、去结算；`/cart` 页面提供完整明细与下单弹窗。
- **个人中心**：独立页面 `/profile`，展示头像、姓名、等级、桌号、累计下单/份数/消费，全部历史订单与退出登录。
- **技术栈**：Vue 3 `<script setup>`、Vite、vue-router（history 模式 + 守卫）、Pinia + 持久化插件、Axios、Element Plus 主题定制。
- **附带**：响应式布局（手机端底部「菜单 / 我的」点单栏）、404 页面、数据自检脚本、真实浏览器验收与 8 张运行截图、ESLint/Prettier 配置、README 与 VERIFY 手册、`图片来源.md`。

## 二、已完成的验证（本机实际执行）

| 检查项 | 命令 | 结果 |
| --- | --- | --- |
| 安装依赖 | `npm ci` | 通过，235 个包 |
| 数据自检 | `npm run check:data` | 通过（3 用户 / 5 分类 / 19 菜品） |
| 代码规范 | `npm run lint` | 通过，0 error / 0 warning |
| 生产构建 | `npm run build` | 通过，产物在 `dist/` |
| 预览服务 | `npm run preview` | 通过，`/home`、`/cart`、`/profile` 刷新回退正常 |
| 浏览器验收 | `npm run screenshots` | 通过，17 条断言，输出 `screenshots/01~08` |
| Git 基线 | `git log` | 有初始提交，可随时回退 |

## 三、你只需要跑这三步

在 **PowerShell** 中执行（项目根目录即 `scan-order-app`）：

```powershell
npm ci
npm run verify   # 数据自检 + ESLint + 构建
npm run preview
```

需要重新生成截图时另开一个窗口：

```powershell
npm run screenshots   # 需先启动 preview，默认 http://127.0.0.1:4173
```

截图会写入 `screenshots/01-login.png` ~ `08-menu-stepper.png`，脚本同时断言登录、搜索、分类、详情数量、加购跳转、金额联动、刷新持久化、越界纠正、移除与空状态、菜品卡步进器同步、悬浮球桌号/合计/红点、购物悬浮窗、下单落库、个人中心订单记录与退出登录。

## 四、可替换的数据

项目内置结构完整的示例数据：

- `public/data/users.json`：3 个演示账号（`demo/123456`、`foodie/zaobian2026`、`guest/guest123`）。
- `public/data/dishes.json`：`restaurant` + `categories` + `dishes`，19 道菜、5 个分类。

代码内置字段兼容层，可直接替换为课程下发的 JSON：支持 `username/userName/account`、`price/discountPrice/salePrice`、
`image/img/picture`、`monthlySales/sales`、`{ users: [] }`、`{ data: { list: [] } }`、分类内嵌菜品等常见写法，无需改业务代码。

## 五、风险提示

- 若课程强制要求 Vuex 而不是 Pinia，只需把 `src/stores/*` 改写为 Vuex 模块；当前按“项目设计”要求采用 Pinia，并用持久化插件满足刷新不丢。
- 部署到 Nginx/Apache 等静态服务器必须配置 history fallback，否则刷新 `/home`、`/cart`、`/profile` 会 404，`VERIFY.md` 已给出配置片段。
- `users.json` 中的明文密码仅用于课程演示，真实项目应由后端校验。

## 六、打包提交

仓库已初始化 Git，`.gitignore` 排除了 `node_modules`、`dist`、`.env`。只打包被 Git 跟踪的文件即可：

```powershell
cd "C:\Users\19094\Desktop\Vue大作业\scan-order-app"
git archive --format=zip -o "..\scan-order-app-提交包.zip" HEAD
```

`git archive` 只包含源码、数据、图片与文档，不会带入 `node_modules`、`dist`、`.git`。
