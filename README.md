# 电力设备台账管理系统 - 前端

> 电力设备台账管理系统的前端部分，基于 Vue 3 + Element Plus 构建，提供设备台账管理、巡检工作流、数据可视化、AI 助手等功能。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue 3 | ^3.5.39 | 渐进式 JavaScript 框架（Composition API） |
| Element Plus | ^2.14.3 | 基于 Vue 3 的组件库 |
| Vue Router | ^5.2.0 | 官方路由管理器 |
| Axios | ^1.18.1 | HTTP 请求库 |
| ECharts | ^6.1.0 | 数据可视化图表库 |
| Vite | ^8.1.1 | 下一代前端构建工具 |

## 功能模块

- **登录认证**：支持管理员 / 巡检人员 / 普通用户三种角色，登录时校验账号密码与角色匹配
- **首页**：欢迎横幅、搜索栏（接入 AI 助手）、设备统计卡片、待办事项面板、活动时间线
- **设备台账**：设备列表展示、新增 / 编辑 / 删除设备、按条件筛选
- **巡检管理**：
  - 巡检记录列表（分页、查看详情、编辑、删除）
  - 新建巡检（4 步流程：选择设备 → 填写结果 → 上传附件 → 提交确认）
  - 巡检详情对话框（基本信息、检查项清单、问题描述、附件图片预览）
- **数据统计**：基于 ECharts 的设备运行状态、巡检趋势等可视化图表
- **AI 助手**：全屏聊天页面，支持自然语言对话
- **消息中心**：消息列表、已读 / 未读管理、加入待办事项、删除消息
- **账户管理**（仅管理员）：用户管理、角色权限设置

## 权限说明

| 角色 | 可访问功能 |
|------|-----------|
| 管理员 (admin) | 所有功能 |
| 巡检人员 (inspector) | 首页、设备台账、巡检管理、数据统计、AI 助手（不可编辑/删除巡检记录） |
| 普通用户 (user) | 首页、AI 助手、数据统计 |

> 路由守卫会根据用户角色自动控制页面访问权限，无权限操作会提示"该身份暂不支持此操作"。

## 项目结构

```
src/
├── api/                    # API 接口模块
│   ├── auth.js             # 认证相关（登录、登出）
│   ├── common.js           # 通用接口
│   ├── equipment.js        # 设备台账接口
│   ├── inspection.js       # 巡检记录接口
│   ├── message.js          # 消息接口
│   ├── request.js          # Axios 实例封装（统一处理 token、错误）
│   └── stats.js            # 统计数据接口
├── assets/                 # 静态资源
├── components/             # 公共组件
├── router/
│   └── index.js            # 路由配置 + 路由守卫（角色权限控制）
├── views/                  # 页面组件
│   ├── Login.vue           # 登录页
│   ├── MainLayout.vue      # 主布局（侧边栏 + 顶部栏 + 内容区）
│   ├── Home.vue            # 首页
│   ├── Equipment.vue       # 设备台账
│   ├── Inspection.vue      # 巡检记录列表
│   ├── InspectionCreate.vue# 新建巡检记录
│   ├── Statistics.vue      # 数据统计
│   ├── AiChatPage.vue      # AI 助手全屏页
│   ├── MessagePanel.vue    # 消息面板
│   ├── UserSettings.vue    # 用户管理
│   └── RoleSettings.vue    # 角色设置
├── App.vue                 # 根组件
├── main.js                 # 应用入口
└── style.css               # 全局样式
```

## 快速开始

### 环境要求

- Node.js >= 16
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

启动后访问 http://localhost:5173

> **注意**：前端需要配合后端服务一起运行。请先启动后端项目（默认运行在 http://localhost:8080），前端通过 Vite 代理将 `/api` 请求转发到后端。

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 普通用户 | user | user123 |
| 巡检人员 | inspector | inspector123 |

## 构建部署

```bash
# 构建生产环境包
npm run build

# 本地预览构建产物
npm run preview
```

构建产物位于 `dist/` 目录，可部署到任意静态文件服务器（Nginx、Apache 等）。

### Nginx 部署示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/dist;
    index index.html;

    # 前端路由（Vue Router history 模式）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理到后端
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Vite 配置说明

项目通过 Vite 的 `server.proxy` 配置将前端 `/api` 请求代理到后端服务，开发时无需处理跨域问题。

```js
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

## 相关仓库

- **后端项目**：[power-equipment-inventory-system-backend](https://github.com/Easonnnn0038/power-equipment-inventory-system-backend)
  - Spring Boot + MyBatis + MySQL
  - 提供 RESTful API 接口



## License

MIT
