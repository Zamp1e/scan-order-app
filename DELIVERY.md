# 交付说明（务必先读）

## 一、本次交付内容

`scan-order-app/` 是一个可直接运行的 Vue 3 扫码点餐项目，覆盖题目全部功能点与技术点：

- 登录页：用户名 + 密码表单校验，读取 `public/data/users.json` 做账号匹配，失败提示“用户名或密码有误”，成功后写入 Pinia 并跳转首页。
- 点餐首页：按分类分组展示菜品（图片、名称、规格、原价、折扣价、月销量、评分、库存提示、加入按钮），支持按菜品名称实时搜索。
- 菜品详情：大图、规格、原价、折扣价、库存、月销量、描述，数量 0 起步、上限受库存约束，加入后跳转购物车。
- 购物车：展示全部已选菜品，数量增减时单项小计与订单总计实时联动，支持单项移除、清空，空车显示“购物车空空如也”。
- 技术栈：Vue 3 + Vite、vue-router history 模式、Pinia + 持久化插件（刷新不丢）、Axios 取数、Element Plus 组件与主题定制。
- 附带：响应式布局、404 页面、登录回跳、演示订单弹窗、ESLint/Prettier 配置、VSCode 推荐插件、数据自检脚本、真实浏览器验收与截图脚本、README 与 VERIFY 手册。

## 二、已完成的检查（基于源码与数据，未运行 Node）

| 检查项 | 方式 | 结果 |
| --- | --- | --- |
| JSON 语法 | 逐份解析确认结构，尾逗号检查 | 通过 |
| 菜品分类关联 | 18 道菜的 `categoryId` 全部命中 5 个分类 | 通过 |
| 图片资源 | 18 个 `image` 路径与 `public/images/dishes/` 下 18 张 JPG 一一对应 | 通过 |
| 金额口径 | 宫保鸡丁 39.8 × 2 = 79.60，× 3 = 119.40，与购物车 getter 的四舍五入逻辑一致 | 通过 |
| 模板结构 | 逐文件核对 `<script setup>` / `<template>` / `<style scoped>` 闭合，div、section、article 成对 | 通过 |
| 依赖引用 | 图标、组件、工具函数的导入均被使用，无悬空引用 | 通过 |
| 路由 | `/login`、`/home`、`/dish/:id`、`/cart`、404 均以 history 模式声明，守卫与回跳逻辑已核对 | 通过 |

## 三、未执行的检查（必须由你在本机完成）

本次会话的终端被宿主机环境阻断：DSH 每次执行命令前会调用
`C:\Users\PC-1\.dsh\profiles\desktop\node_modules\dsh-ops\bin\prepare-workspace.ps1`，
而本机 PowerShell 执行策略拒绝运行该脚本（`UnauthorizedAccess`，错误码指向 ExecutionPolicy）。
因此以下命令**没有**在本会话执行，不能声称“已验证”：

- `npm install`
- `npm run verify`（数据自检 + ESLint + Vite 构建）
- `npm run preview`
- `npm run screenshots`（真实浏览器截图）

`screenshots/` 目录目前只有说明文件，没有 PNG。项目根目录的 `VERIFY.md` 给出了逐条执行步骤与预期结果。

## 四、你只需要跑这三步

在 **PowerShell** 中执行（本机 `bash` 不在 PATH，不要用 bash）：

```powershell
cd "C:\Users\PC-1\Documents\deepseek-harness\default-workspace\scan-order-app"
npm install
npm run verify
```

`verify` 通过后，另开两个 PowerShell 窗口：

```powershell
npm run preview      # 窗口 1
npm run screenshots  # 窗口 2
```

截图会写入 `screenshots/01-login.png` ~ `08-menu-stepper.png`，同时脚本会断言登录、搜索、分类、详情数量、加购跳转、金额联动、刷新持久化、越界纠正、移除与空状态、菜品卡步进器同步、悬浮球桌号/合计/红点、购物悬浮窗、下单落库与「我的」页面订单记录、退出登录。

## 五、可替换的数据

题目提到的用户/菜品 JSON 未随任务提供，项目内置了一份结构完整的示例数据：

- `public/data/users.json`：5 个字段以上的用户数组，含 3 个演示账号。
- `public/data/dishes.json`：`restaurant` + `categories` + `dishes`，18 道菜、5 个分类。

代码内置字段兼容层，可直接替换为课程下发的 JSON：支持 `username/userName/account`、`price/discountPrice/salePrice`、
`image/img/picture`、`monthlySales/sales`、`{ users: [] }`、`{ data: { list: [] } }`、分类内嵌菜品等常见写法，
无需改业务代码。

## 六、风险提示

- 若课程强制要求 Vuex 而不是 Pinia，只需把 `src/stores/*` 改写为 Vuex 模块；当前按“项目设计”要求采用 Vue 3 官方推荐的 Pinia，并已用持久化插件满足刷新不丢。
- 若需在静态服务器（Nginx/Apache）部署，必须配置 history fallback，否则刷新 `/home`、`/cart` 会 404，`VERIFY.md` 已给出配置片段。
- `users.json` 中的明文密码仅用于课程演示，真实项目应由后端校验。

## 七、GitHub 接入（已取消）

用户完成 `git config --global`（`user.name=Zamp1e`、`user.email=190942906@qq.com`、`init.defaultBranch=main`）后，
决定**不再上传 GitHub**。因此建远程仓库、`git push`、开启 Pages 均不执行。

相关准备文件仍保留在工作区（`.github/workflows/deploy.yml`、`scripts/postbuild-pages.mjs`、
`scripts/init-git.ps1`、`scripts/init-git.sh`、`GITHUB.md`、`.gitattributes`），
但打包脚本 `pack.ps1` 默认将它们排除，提交包里不会出现。

若以后要恢复接入，在工作区根目录执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\init-git.ps1 -User Zamp1e -Repo scan-order-app
git push -u origin main
```

## 八、打包提交

工作区根目录（与 `scan-order-app` 同级）：

```powershell
cd "C:\Users\PC-1\Documents\deepseek-harness\default-workspace"
powershell -NoProfile -ExecutionPolicy Bypass -File pack.ps1
```

生成 `scan-order-app-提交包.zip`，排除 `node_modules`、`dist`、`.git` 与 GitHub 相关文件；
需要连 GitHub 配置一起打包时加 `-IncludeGitHub`。
