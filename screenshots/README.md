# 截图说明

本目录包含由 `npm run screenshots` 真实生成的运行截图：

| 文件 | 内容 |
| --- | --- |
| `01-login.png` | 登录页 |
| `02-home.png` | 点餐首页（分类、19 道菜、搜索）|
| `03-dish-detail.png` | 菜品详情与数量选择 |
| `04-cart.png` | 购物车、数量调整与小计/总计 |
| `05-cart-empty.png` | 移除后的“购物车空空如也”空状态 |
| `06-cart-panel.png` | 购物悬浮窗（数量增减、合计）|
| `07-profile.png` | 个人中心（订单记录、退出登录）|
| `08-menu-stepper.png` | 菜品卡数量步进器 |

生成方式（PowerShell）：

```powershell
cd "scan-order-app 目录"
npm install
npm run build
npm run preview      # 窗口 1，保持运行
npm run screenshots  # 窗口 2
```

脚本会依次断言登录校验、搜索、分类、详情数量、加购跳转、金额联动、
刷新后的登录态与购物车持久化、越界数量纠正、单项移除与空状态；
全部通过后才写出上述 PNG。整页截图前脚本会先滚动唤醒懒加载图片，
并等待过渡动画结束，避免拍到空白占位。
