# 灶边小馆 · 扫码点餐

面向到店顾客的 Vue 3 扫码点餐单页应用：顾客登录后浏览分类菜品、按名称搜索、查看菜品详情、调整点餐数量、加入购物车、修改数量并完成模拟下单。

技术栈：**Vue 3 + Vite + Vue Router（history 模式）+ Pinia（持久化）+ Axios + Element Plus**。用户与菜品数据来自本地 JSON，无需后端即可完整运行。

> **在线预览**：https://zamp1e.github.io/scan-order-app/ （GitHub Pages，推送到 `main` 后由 Actions 自动构建部署）

> 提交包的使用说明见根目录 `提交说明.md`；本文件是项目详细文档。

## 环境说明（Windows）

本机可用的是 **PowerShell**，`bash` 不在 PATH 中。项目所有命令都只依赖 `git` / `node` / `npm`，
在 PowerShell 里直接粘贴即可，无需 Git Bash。

`C:\Program Files\Git\bin\bash.exe` 与 `git-bash.exe` 实际存在，如果你更喜欢 Unix 命令，
可以开始菜单搜索「Git Bash」单独打开（那是独立窗口，不依赖 PATH 里的 `bash`）。

## 快速开始

环境要求：Node.js **18.18+**。

```powershell
npm install
npm run dev
```

打开终端里显示的地址（默认 `http://localhost:5173`），首次进入为登录页。

生产构建与预览：

```powershell
npm run build
npm run preview
```

> 项目使用 history 模式，`vite` / `vite preview` 已自动处理回退。部署到 Nginx 等静态服务器时需把不存在的路径回退到 `index.html`，否则刷新 `/home`、`/cart` 会 404。

## 演示账号

账号校验读取 `public/data/users.json`，登录页的“演示账号”可一键填入。

| 用户名 | 密码 | 桌号 | 身份 |
| --- | --- | --- | --- |
| `demo` | `123456` | A08 | 银卡食客 |
| `foodie` | `zaobian2026` | B12 | 金卡食客 |
| `guest` | `guest123` | C03 | 普通食客 |

用户名或密码不匹配时提示“用户名或密码有误，请重新输入”。

## 功能实现对照

### 一、功能要求

| 考点 | 实现 |
| --- | --- |
| 登录校验 | Element Plus 表单：必填、长度校验；Axios 读取用户 JSON 后逐项匹配；成功写入 Pinia 并跳转首页，失败显示错误提示并清空密码 |
| 登录跳转 | 支持 `?redirect=` 回跳（例如未登录直接打开 `/cart`，登录后回到购物车）；非法地址回落到首页 |
| 点餐首页 | 菜品图片、名称、规格、原价、折扣价、月销量、评分、库存提示，卡片右下角“加入”按钮；按五个分类分组展示 |
| 搜索筛选 | 按菜品名称实时筛选，可与分类组合；无结果时显示空状态与一键重置；支持 Esc 清空 |
| 分类筛选 | 桌面端左侧分类栏、移动端横向分类条，均展示分类菜品数量 |
| 菜品详情 | 大图、名称、规格说明、描述、原价、折扣价、库存、月销量；数量使用 Element Plus 数字框，最小值 0，最大值为“库存 − 购物车已有数量” |
| 加入购物车 | 菜品卡上的「加入」点一次即变成「− 数量 +」步进器：+ 继续加、− 减到 0 后恢复「加入」按钮；卡片数量与购物车、悬浮球红点实时同步 |
| 购物车入口 | 页面右下角常驻圆形悬浮球（图标、桌号、合计，右上角红点显示份数），点击在球上方展开购物悬浮窗；窗口内可加减数量、移除、清空、去结算，不离开当前页面 |
| 购物车 | 展示图片、名称、规格、单价、数量、单项小计；改数量后单项小计与总计实时更新；支持单项移除、清空购物车 |
| 我的主页 | 独立页面 `/profile`：头像、姓名、等级、桌号、累计下单/份数/消费，全部历史订单（订单号、时间、菜品缩略图、金额），并可退出登录；入口为顶部导航「我的」、菜品分类栏「我的」卡片与手机端点单栏 |
| 空状态 | 购物车无菜品时显示“购物车空空如也”，并提供去点餐按钮 |
| 下单 | 提交后生成演示订单号，弹窗展示桌号、份数、金额；该单同时写入订单历史（本地存储键 `zaobian-orders`），随后清空购物车 |

### 二、项目设计

| 考点 | 实现 |
| --- | --- |
| Vue 3 工程 | Vite 构建，`<script setup>` 组合式 API，整体可用 VSCode 打开（含推荐插件配置） |
| history 路由 | `createWebHistory(import.meta.env.BASE_URL)`，所有页面通过路由声明访问，含登录守卫、404 页与滚动行为 |
| 用户持久化 | Pinia + `pinia-plugin-persistedstate`，登录态写入 `localStorage`（键 `zaobian-user`），刷新、直接访问 history 路径均不丢失；退出登录同时清理购物车 |
| Axios 取数 | `src/api/request.js` 创建实例（`baseURL` 取 `import.meta.env.BASE_URL`），统一错误信息；`src/api/menu.js` 负责用户与菜单接口 |
| Element Plus | 表单、输入框、按钮、数字框、消息提示、气泡确认、下拉菜单、对话框等均使用 Element Plus，并做主题配色覆盖 |

> 题目文字同时提到 Pinia 与 Vuex：本项目按“项目设计”要求使用 Vue 3 官方推荐、也是 Vuex 继任方案的 **Pinia**，并通过持久化插件满足刷新不丢数据。

## 路由表

| 路径 | 页面 | 权限 |
| --- | --- | --- |
| `/login` | 登录 | 仅未登录可见，已登录访问自动回首页 |
| `/home` | 点餐首页 | 需登录 |
| `/dish/:id` | 菜品详情 | 需登录 |
| `/cart` | 我的购物车 | 需登录 |
| `/profile` | 个人中心 | 需登录 |
| `/:pathMatch(.*)*` | 404 | 公开，提供回首页/登录入口 |

## 数据说明

数据位于 `public/data/`，以静态资源方式由 Axios 加载：

- `public/data/users.json`：用户数组，字段含 `username`、`password`、`name`、`tableNo`、`level`、`greeting`；同时兼容 `{ "users": [] }` 结构。
- `public/data/dishes.json`：含 `restaurant`、`categories`、`dishes`；菜品字段含 `id`、`name`、`categoryId`、`image`、`spec`、`originalPrice`、`price`、`monthlySales`、`stock`、`description`、`tags`、`rating`、`spicyLevel`、`badge`。

替换为题目下发的 JSON 时，保持表头字段结构即可，业务代码无需改动。代码内置了字段兼容层，能识别 `username/userName/account`、`price/discountPrice/salePrice`、`image/img/picture`、`monthlySales/sales` 等常见同义字段，以及 `{ users: [] }`、`{ data: { list: [] } }`、分类内嵌菜品等结构。

菜品图片位于 `public/images/dishes/`（19 张本地 4:3 实拍照片，1200×900，可离线展示，来源见 [图片来源.md](图片来源.md)）；替换为其它照片时把 `image` 改为 `images/...` 相对路径或完整 URL。若某条数据缺少图片，会自动回落到占位图，不会出现破图。

> `users.json` 中的明文密码仅用于课程演示。真实项目中凭证校验应由后端完成，前端只接收脱敏用户信息；本项目登录后也不会把密码写入 Pinia 或本地存储。

## 项目结构

```text
scan-order-app/
├─ public/
│  ├─ data/
│  │  ├─ users.json             # 用户校验数据
│  │  └─ dishes.json            # 分类与菜品数据
│  ├─ images/dishes/            # 本地菜品照片（jpg）
│  └─ favicon.svg
├─ scripts/
│  ├─ capture-screenshots.mjs   # 浏览器验收 + 截图脚本
│  └─ self-check.mjs            # 数据与金额自检├─ screenshots/                 # 运行截图（生成后在此）
├─ src/
│  ├─ api/                      # Axios 实例与数据接口
│  ├─ components/               # 顶部导航、菜品卡片、购物车数量输入
│  ├─ layouts/MainLayout.vue    # 登录后布局 + 移动端底部栏
│  ├─ router/index.js           # history 路由与守卫
│  ├─ stores/                   # Pinia：user / cart / menu
│  ├─ styles/main.css           # 设计变量、全局与 Element Plus 主题
│  ├─ utils/                    # 金额格式化、资源路径
│  ├─ views/                    # 登录 / 首页 / 详情 / 购物车 / 我的 / 404
│  ├─ App.vue
│  └─ main.js
├─ .editorconfig
├─ .eslintrc.cjs
├─ .prettierrc.json
├─ 提交说明.md                  # 提交包使用说明（先读这份）
├─ VERIFY.md                    # 验收与截图执行清单
├─ jsconfig.json
├─ index.html
├─ package.json
└─ vite.config.js
```

## 关键设计

- **金额计算统一收口**：购物车 store 的 `subtotal`、`originalTotal`、`savings` getter 统一四舍五入到分，组件只负责展示，避免各处自行计算导致精度漂移；数量变化即触发单项小计与总计同步更新。
- **库存约束**：详情页数字框 `max = 库存 − 购物车已有数量`；加入购物车和购物车改数量时再次 clamp，负数与超库存无法写入。
- **数据归一化**：菜单 store 把 JSON 中的字符串数字转为数字、统一 `id` 为字符串，购物车比对使用字符串比较，避免类型不一致导致重复行。
- **路由与资源**：路由、Axios `baseURL`、图片路径都基于 `BASE_URL`，可部署在根路径或子目录。
- **响应式**：桌面端双栏分类 + 卡片网格，平板与手机端切换为横向分类条与单列卡片；购物车在所有尺寸下都是右下角悬浮球，点开是悬浮窗；手机端另有「菜单 / 我的」底部点单栏。
- **代码规范**：ESLint + eslint-plugin-vue + Prettier，2 空格缩进、单引号、无分号，关键逻辑均有注释。

## 运行截图

截图由 `scripts/capture-screenshots.mjs` 调用本机 Edge/Chrome 真实渲染并断言业务链路后自动生成，**已随包提供**：

| 页面 | 文件 |
| --- | --- |
| 登录页 | `screenshots/01-login.png` |
| 点餐首页 | `screenshots/02-home.png` |
| 菜品详情 | `screenshots/03-dish-detail.png` |
| 购物车 | `screenshots/04-cart.png` |
| 空购物车 | `screenshots/05-cart-empty.png` |
| 购物悬浮窗 | `screenshots/06-cart-panel.png` |
| 我的页面 | `screenshots/07-profile.png` |
| 菜品卡数量步进器 | `screenshots/08-menu-stepper.png` |

```powershell
# 终端 1
npm run build
npm run preview

# 终端 2（另开一个 PowerShell 窗口）
npm run screenshots
```

脚本依次断言：错误账号提示、正确登录跳转、首页搜索、分类筛选、详情数量控制、加购跳转、购物车金额联动、刷新后登录态与购物车持久化、单项移除与空状态、悬浮球桌号/合计/红点、购物悬浮窗、下单落库、我的页面订单记录与退出登录；全部通过后才写出截图。浏览器不在默认路径时可用 `BROWSER_PATH` 指定。

## 可用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建到 `dist/` |
| `npm run preview` | 预览构建产物（端口 4173） |
| `npm run verify` | 依次执行数据自检、lint 与 build，全部通过才算通过 |
| `npm run check:data` | 校验 JSON 数据完整性、分类关联与金额计算 |
| `npm run lint` | ESLint 检查项目内 `.js` / `.vue`（排除 `node_modules`、`dist`、`public`） |
| `npm run lint:fix` | 自动修复可修复的 ESLint 问题 |
| `npm run format` | Prettier 格式化源码 |
| `npm run screenshots` | 真实浏览器验收并输出截图 |

完整的「安装 → 校验 → 预览 → 截图 → 手动验收清单」见 [VERIFY.md](VERIFY.md)。

## 提交说明

- `.gitignore` 已排除 `node_modules`、`dist`、`.env`；导出提交包时删除 `node_modules` 后压缩即可。
- 用 VSCode 打开项目根目录，推荐安装 `.vscode/extensions.json` 中的 Vue - Official、ESLint、Prettier、EditorConfig 插件。
- `screenshots/` 保存运行截图，无需再单独维护。

## 打包提交

项目已初始化 Git，`.gitignore` 排除了 `node_modules`、`dist`、`.env`。
只导出被 Git 跟踪的文件即可，提交包里不会出现依赖与构建产物：

```powershell
cd "C:\Users\19094\Desktop\Vue大作业\scan-order-app"
git archive --format=zip -o "..\scan-order-app-提交包.zip" HEAD
```

也可以直接压缩文件夹，但请先确认 `node_modules`、`dist` 不存在或被排除。
