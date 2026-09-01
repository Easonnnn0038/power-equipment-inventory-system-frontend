# 电力设备台账管理系统 · 前端


---



## 🏗️ 技术栈亮点

### 前端
- **框架**: Vue 3 `<script setup>` Composition API + Pinia 状态管理
- **UI**: Element Plus —— 按需自动导入（unplugin-auto-import + unplugin-vue-components），主色 token 单处统一切换
- **构建**: Vite 5 + Rollup manualChunks 拆包（vue / element-plus / echarts / axios 四大 vendor 独立缓存）
- **图表**: ECharts Core 按需（PieChart / BarChart / LineChart / GaugeChart + Title / Tooltip / Legend），非 Tree Shaking 的 full import 全删
- **路由**: Vue Router 4 + 角色路由守卫 + `normalizeRole()` 死循环防护 + localStorage 登录态迁移
- **请求**: Axios 拦截器分层（401 本地模式豁免 / 6 类网络错误结构化提示 / 3 段式表单校验）
- **动效**: 统一 6 个 motion token（时长 + 缓动），`prefers-reduced-motion` 全局降级，Exit faster 规则，`transition: all` 硬编码全清
- **可访问性**: Skip-link / 侧栏 `<div>` → `<button>` 语义化 / label-for 关联 / focus-visible 轮廓 / 18×18 复选框扩大至 WCAG 44×44 靶心
- **设计系统**: `style.css` 定义 37 个 CSS 变量（Brand / Surface / Text / Border / Shadow / Motion / Font），零硬编码 hex

### 后端（对应仓库：power-equipment-inventory-system-backend）
- Spring Boot + MyBatis + MySQL 8 + Redis 三重缓存防护（穿透/击穿/雪崩）+ JWT 认证
- 三层权限模型：User → Role → Permission，拦截器级 `@RequireRole` 注解
- 全局异常处理器：ResourceNotFound / Validation / RateLimit 统一返回 `Result<T>`

---

## 🚀 快速启动

### 环境要求
- Node.js ≥ 18
- 后端服务运行中（可选，未启动时自动进入「本地演示模式」）

### 3 步启动
`bash` 或 PowerShell：

```powershell
# 1. 安装依赖
cd power-equipment-inventory-system-frontend
npm install

# 2. 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 3. 生产打包（chunk 拆分已配置）
npm run build
```

> 若后端服务未运行，登录会自动 fallback 到本地验证模式，仍可完整体验所有页面（数据会以 localStorage 兜底持久化）

---

## 🔐 演示账号（3 角色 · 权限矩阵）

| 角色 | 账号 / 密码 | 权限范围 | 典型操作路径 |
|---|---|---|---|
| 👑 **管理员** | `admin` / `admin123` | 全部页面 + 全部操作（含系统设置、账户管理、巡检记录编辑/删除） | 设备 CRUD → 新建巡检 → 数据统计 → 用户管理 |
| 👷 **巡检人员** | `inspector` / `inspector123` | 首页 / 设备 / 巡检 / 统计；**不可编辑/删除巡检记录**，不可进入系统设置 | 设备查询 → 新建巡检（仅新增） → 查看自己的巡检记录 |
| 👤 **普通用户** | `user` / `user123` | 仅首页 / 数据统计 / AI 助手 | 首页搜索栏 → AI Chat 提问 → 查看统计大屏 |



## 📁 目录结构

```
power-equipment-inventory-system-frontend/
├── public/
│   ├── login-bg.jpg          # 登录页背景图
│   └── icons.svg             # SVG 图标集
├── src/
│   ├── api/
│   │   ├── request.js        # Axios 实例 + 本地模式守卫 + 6 类网络错误结构化
│   │   ├── auth.js           # 登录 / 登出 / 获取用户信息
│   │   ├── equipment.js      # 设备台账 CRUD
│   │   ├── inspection.js     # 巡检记录 CRUD + 详情
│   │   ├── message.js        # 消息 + 待办（用户级持久化）
│   │   └── stats.js          # 统计数据聚合
│   ├── router/index.js       # 路由表 + 角色守卫 + normalizeRole 死循环防护
│   ├── stores/auth.js        # Pinia 登录态：token / role / userInfo，含旧 key 迁移
│   ├── utils/messages.js     # clarify 设计系统库：4 档错误 × Toast + 破坏性确认框
│   ├── views/
│   │   ├── Login.vue         # 左右分栏响应式登录页（3 角色选择 + 本地 fallback）
│   │   ├── MainLayout.vue    # 主框架：侧栏/顶栏/消息面板/路由出口/polling 生命周期
│   │   ├── Home.vue          # 首页：横幅 + 居中搜索栏 + 最近动态 + 设备统计 + 待办
│   │   ├── Equipment.vue     # 设备台账：表格 + 新增/编辑 1200px 居中对话框
│   │   ├── Inspection.vue    # 巡检记录：表格 + 260px 操作列（编辑左/删除右）+ 详情
│   │   ├── InspectionCreate.vue  # 新建巡检：5 分区 + 5 项 validateForm 3 段式校验
│   │   ├── Statistics.vue    # 数据统计：ECharts 4 图表（Core + 按需注册）
│   │   ├── AiChat.vue        # 悬浮 AI 助手面板（悬浮球展开）
│   │   ├── AiChatPage.vue    # 全屏 AI Chat 页（首页搜索栏跳转）
│   │   ├── MessagePanel.vue  # 消息抽屉：未读/已读 + 加入待办 + 未读一键删除
│   │   ├── UserSettings.vue  # 账户管理（仅管理员可见）
│   │   └── RoleSettings.vue  # 角色权限管理（仅管理员可见）
│   ├── App.vue
│   ├── main.js               # Element Plus 按需导入入口（Auto Import 插件生成）
│   └── style.css             # 设计 token 定义 + 全局 reset + prefers-reduced-motion
├── vite.config.js            # Vite + Element Plus Auto Import + manualChunks 拆包
├── package.json
└── README.md                 # 就是本文件
```

---

## ✅ Quality Checklist（审计通过项）

| 阶段 | 命令 | 关键成果 |
|---|---|---|
| Distill 代码精简 | `/impeccable distill` | 删除 `* { margin:0 !important }` 核级重置；清除 Vite 模板残留 .hero / #next-steps |
| Adapt 响应式 | `/impeccable adapt Login.vue` | 登录容器 3 断点适配（<1024px / <768px / 竖屏），`clamp()` + `pointer: coarse` |
| Optimize 性能 | `/impeccable optimize` | Element Plus / ECharts 按需导入 + 4 chunk 拆分；MainLayout polling 可见性节流；18 处 `transition: all` 全清 |
| Harden 可访问性 | `/impeccable harden` | Skip-link；侧栏 div → button 语义化；checkbox-label 关联；focus-visible 轮廓 |
| Animate 动效系统 | `/impeccable animate` | 6 个 motion token；Exit faster 规则；`prefers-reduced-motion` 全局降级；card-reveal 入场 |
| Clarify 文案清晰化 | `/impeccable clarify` | `src/utils/messages.js` 设计系统库；71+ 处短错误升级 3 段式；7 处「确认/取消」改名破坏性动作+对象+后果 |
| Polish 细节优化 | 当前文件 | validateForm 5 处 → 3 段式；AI 聊天 18 处 hex → CSS var；简历级 README |

---

