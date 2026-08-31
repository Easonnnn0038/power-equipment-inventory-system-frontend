<template>
  <!-- Skip Link：WCAG 2.4.1 Bypass Blocks，键盘 Tab 首项会命中，跳至主内容区 -->
  <a class="skip-link" href="#main-content">跳至主内容</a>
  <el-container style="height: 100vh; width: 100%;">
    <el-header class="header" height="60px">
      <div class="header-left">
        <h2 class="title"><el-icon :size="30" color="#ffffff"><Lightning /></el-icon> 电力设备台账管理系统Power Equipment Inventory Management System</h2>
      </div>
      <div class="header-right">
        <span class="welcome">欢迎：{{ username }}</span>
        <el-avatar :size="36">
          {{ username.charAt(0).toUpperCase() }}
        </el-avatar>
      </div>
    </el-header>

    <el-container style="height: calc(100vh - 60px);">
      <el-aside width="80px" class="slider-aside">
        <div class="slider-container">
          <el-tooltip
            v-for="item in navItems"
            :key="item.path"
            :content="item.label"
            placement="right"
            popper-class="slider-tooltip"
            :disabled="showSubmenu && currentSubmenuLabel === item.label"
          >
            <button
              type="button"
              class="slider-item"
              :aria-label="'导航：' + item.label"
              :class="{ active: activeMenu === item.path || (item.children && isChildActive(item)) }"
              @click="handleSliderClick(item)"
            >
              <el-icon :size="22" :color="activeMenu === item.path || (item.children && isChildActive(item)) ? '#ffffff' : '#4a90d9'">
                <component :is="item.icon" />
              </el-icon>
            </button>
          </el-tooltip>

          <div class="slider-divider"></div>

          <el-tooltip
            v-for="(btn, index) in bottomButtons"
            :key="btn.action"
            :content="btn.label"
            placement="right"
            popper-class="slider-tooltip"
          >
            <button
              type="button"
              class="slider-item"
              :aria-label="'操作：' + btn.label + (btn.action === 'announcement' && unreadCount > 0 ? '（有 '+unreadCount+' 条未读消息）' : '')"
              :class="{ 'bottom-first': index === 0 }"
              @click="btn.handler"
            >
              <el-icon :size="22" color="#4a90d9">
                <component :is="btn.icon" />
              </el-icon>
              <!-- 消息未读角标 -->
              <el-badge 
                v-if="btn.action === 'announcement' && unreadCount > 0" 
                :value="unreadCount" 
                :max="99"
                class="msg-badge"
                aria-hidden="true"
              />
            </button>
          </el-tooltip>
        </div>

        <transition name="flyout">
          <div v-if="showSubmenu" class="submenu-flyout" :style="{ top: submenuTop + 'px' }">
            <div class="submenu-title">{{ currentSubmenuLabel }}</div>
            <button
              type="button"
              v-for="child in currentSubmenuChildren"
              :key="child.path"
              class="submenu-item"
              :aria-label="'子菜单：' + currentSubmenuLabel + ' / ' + child.label"
              :class="{ active: activeMenu === child.path }"
              @click="handleSubmenuClick(child)"
            >
              {{ child.label }}
            </button>
          </div>
        </transition>
      </el-aside>

      <!-- 主内容区域：渲染各个路由页面 -->
      <el-main id="main-content" class="main-content" role="main">
        <router-view></router-view>
      </el-main>
    </el-container>

    <!-- AI 助手聊天面板：点击左侧底部 AI 助手图标时打开 -->
    <AiChat v-model:visible="showAiChat" />

    <!-- 消息侧滑面板 -->
    <MessagePanel v-model:visible="showMessagePanel" @unread-update="handleUnreadUpdate" @todo-update="handleTodoUpdate" />
  </el-container>
</template>

<script setup>
/**
 * 主布局组件脚本
 *
 * 新增内容：
 * - showAiChat：控制 AI 聊天面板显示/隐藏
 * - 引入 AiChat 组件并挂载在模板中
 * - handleAiChat：原来只弹提示，现在切换聊天面板的显隐
 */

import { ref, onMounted, onBeforeUnmount, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { HomeFilled, Monitor, Document, DataAnalysis, Setting, ChatDotRound, EditPen, User, Bell, Lightning } from '@element-plus/icons-vue'
import { getUsername, getRole } from '@/stores/auth'
import { sendAiChat, submitFeedback, getUserProfile, getAnnouncements } from '@/api/common'
// 引入 AI 聊天组件
import AiChat from './AiChat.vue'
// 引入消息面板组件
import MessagePanel from './MessagePanel.vue'
// 引入消息 API
import { getUnreadCount } from '@/api/message'
import { toastPermission } from '@/utils/messages';

const router = useRouter()
const route = useRoute()
const username = ref(getUsername() || 'admin')
const userRole = ref(getRole() || 'user')
const activeMenu = ref(route.path)
const showSubmenu = ref(false)
const currentSubmenuChildren = ref([])
const currentSubmenuLabel = ref('')
const submenuTop = ref(0)
// 控制 AI 助手聊天面板的显示与隐藏
const showAiChat = ref(false)
// 控制消息面板的显示与隐藏
const showMessagePanel = ref(false)
// 未读消息数量
const unreadCount = ref(0)
// 待办事项刷新触发器
const todoRefreshTrigger = ref(0)

/**
 * 提供给子组件的刷新待办方法
 */
provide('refreshTodoList', () => {
  todoRefreshTrigger.value++
})

provide('todoRefreshTrigger', todoRefreshTrigger)
// 子组件（如 Home.vue）可注入此函数，一键打开消息/待办面板
provide('openMessagePanel', () => { showMessagePanel.value = true })

// 根据角色过滤导航菜单
const allNavItems = [
  { path: '/admin/home', label: '首页', icon: HomeFilled, roles: ['admin', 'inspector', 'user'] },
  { path: '/admin/equipment', label: '设备台账', icon: Monitor, roles: ['admin', 'inspector'] },
  { path: 'inspection', label: '巡检记录', icon: Document, roles: ['admin', 'inspector'], children: [
    { path: '/admin/inspection', label: '巡检列表' },
    { path: '/admin/inspection/create', label: '新建巡检' }
  ]},
  { path: 'statistics', label: '数据统计', icon: DataAnalysis, roles: ['admin', 'inspector', 'user'], children: [
    { path: '/admin/statistics', label: '统计概览' }
  ]},
  { path: 'settings', label: '系统设置', icon: Setting, roles: ['admin'], children: [
    { path: '/admin/settings/user', label: '用户管理' },
    { path: '/admin/settings/role', label: '角色管理' }
  ]}
]

const navItems = allNavItems.filter(item => item.roles.includes(userRole.value))

// 根据角色过滤底部按钮（账户设置仅管理员可见）
const allBottomButtons = [
  { action: 'ai', label: 'AI助手', icon: ChatDotRound, handler: handleAiChat, roles: ['admin', 'inspector', 'user'] },
  { action: 'feedback', label: '意见反馈', icon: EditPen, handler: handleFeedback, roles: ['admin', 'inspector', 'user'] },
  { action: 'account', label: '账户设置', icon: User, handler: handleAccountSettings, roles: ['admin'] },
  { action: 'announcement', label: '消息', icon: Bell, handler: handleAnnouncements, roles: ['admin', 'inspector', 'user'] }
]

const bottomButtons = allBottomButtons.filter(btn => btn.roles.includes(userRole.value))

function isChildActive(item) {
  if (!item.children) return false
  return item.children.some(child => activeMenu.value === child.path)
}

function handleSliderClick(item) {
  // 检查角色权限
  if (item.roles && !item.roles.includes(userRole.value)) {
    toastPermission(userRole.value, item.label)
    return
  }
  if (item.children) {
    const sliderItems = document.querySelectorAll('.slider-item')
    const targetIndex = navItems.findIndex(n => n.path === item.path)
    if (targetIndex >= 0 && sliderItems[targetIndex]) {
      submenuTop.value = sliderItems[targetIndex].offsetTop
    }
    currentSubmenuChildren.value = item.children
    currentSubmenuLabel.value = item.label
    showSubmenu.value = !showSubmenu.value
  } else {
    showSubmenu.value = false
    activeMenu.value = item.path
    router.push(item.path)
  }
}

function handleSubmenuClick(child) {
  // 检查父级角色权限
  const parent = allNavItems.find(n => n.children && n.children.some(c => c.path === child.path))
  if (parent && parent.roles && !parent.roles.includes(userRole.value)) {
    toastPermission(userRole.value, `${parent.label} / ${child.label}`)
    return
  }
  activeMenu.value = child.path
  showSubmenu.value = false
  router.push(child.path)
}

/**
 * 处理 AI 助手按钮点击
 * 原来：只弹"开发中"提示
 * 现在：切换 AI 聊天面板的显示与隐藏（再次点击可以关闭）
 */
async function handleAiChat() {
  showAiChat.value = !showAiChat.value
}
async function handleFeedback() { ElMessage.info({ message: '当前版本暂不支持意见反馈\n💡 如需反馈问题或建议，请联系系统管理员', duration: 2600, showClose: true }); }
async function handleAccountSettings() {
  if (userRole.value !== 'admin') {
    toastPermission(userRole.value, '系统设置 / 账户管理')
    return
  }
  router.push('/admin/settings/user')
}

/**
 * 打开消息面板
 */
function handleAnnouncements() {
  showMessagePanel.value = true
}

/**
 * 未读消息数量更新
 */
function handleUnreadUpdate(count) {
  unreadCount.value = count
}

/**
 * 处理待办事项更新事件
 * 消息面板加入待办后调用，通知首页刷新待办列表
 */
function handleTodoUpdate() {
  todoRefreshTrigger.value++
}

/**
 * 加载未读消息数量（定时刷新）
 */
async function loadUnreadMessages() {
  try {
    const res = await getUnreadCount()
    unreadCount.value = res.data?.total || res.data || 0
  } catch (e) {
    // 后端未就绪时使用模拟数据
    unreadCount.value = 3
  }
}

// 未读消息轮询句柄（页面切后台会暂停，组件卸载会清理，避免内存泄漏）
let messagePollTimer = null
const POLL_INTERVAL_MS = 60_000

function startPolling() {
  if (messagePollTimer) return
  messagePollTimer = setInterval(loadUnreadMessages, POLL_INTERVAL_MS)
}
function stopPolling() {
  if (!messagePollTimer) return
  clearInterval(messagePollTimer)
  messagePollTimer = null
}
function handleVisibilityChange() {
  if (document.hidden) {
    stopPolling()
  } else {
    // 切回前台立即拉一次（保证消息即时），再恢复轮询
    loadUnreadMessages()
    startPolling()
  }
}

// 页面加载时获取未读数量
onMounted(() => {
  loadUnreadMessages()
  startPolling()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.header {
  background: linear-gradient(rgba(30, 60, 120, 0.75), rgba(30, 60, 120, 0.75)), url('@/assets/header-bg.png') center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 0 20px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}
.header-left { display: flex; align-items: center; padding-left: 20px; }
.title { color: white; font-family: "华文行楷", "STXingkai", "KaiTi", cursive;font-size: 25px;  letter-spacing: 6px;font-weight: bold; margin: 0; margin-left: 16px; }
.header-right { display: flex; align-items: center; gap: 12px; }
.welcome { color: white; font-size: 14px; }

.slider-aside {
  background-color: #ffffff !important;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 60px);
  padding: 20px 0;
  z-index: 10;
  width: 80px !important;
  flex-shrink: 0;
  overflow: visible;
}

.slider-container {
  width: 56px;
  background: linear-gradient(180deg, #e8f4fd 0%, #d0e8f7 100%);
  border-radius: 28px;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(74, 144, 217, 0.15);
}

.slider-item {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: background-color var(--motion-dur-mid) var(--motion-ease), box-shadow var(--motion-dur-mid) var(--motion-ease), color var(--motion-dur-mid) var(--motion-ease);
  flex-shrink: 0;
}
.slider-item:hover { background-color: rgba(74, 144, 217, 0.15); }
.slider-item.active {
  background-color: #4a90d9;
  box-shadow: 0 2px 6px rgba(74, 144, 217, 0.4);
}
.bottom-first { margin-top: auto; }

/* 消息未读角标定位 */
.msg-badge {
  position: absolute;
  top: 4px;
  right: 4px;
}



.slider-divider {
  width: 32px;
  height: 1px;
  background-color: rgba(74, 144, 217, 0.2);
  margin: 8px 0;
}

.submenu-flyout {
  position: absolute;
  left: 68px;
  width: 140px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  padding: 8px 0;
  z-index: 200;
}
.submenu-title {
  font-size: 12px;
  color: #909399;
  padding: 4px 16px 8px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 4px;
}
.submenu-item {
  padding: 8px 16px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: background-color var(--motion-dur-fast) var(--motion-ease), color var(--motion-dur-fast) var(--motion-ease), opacity var(--motion-dur-fast) var(--motion-ease);
}
.submenu-item:hover { background-color: #f5f7fa; color: #4a90d9; }
.submenu-item.active { color: #4a90d9; font-weight: 500; }

/* ===== 可访问性：skip-link（仅键盘 Tab 聚焦显示） ===== */
.skip-link {
  position: absolute;
  top: -100px;
  left: 16px;
  z-index: 99999;
  background: #2563eb;
  color: #fff !important;
  padding: 10px 18px;
  border-radius: 0 0 8px 8px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.18s ease, top 0.18s ease;
}
.skip-link:focus {
  top: 0;
  outline: 2px solid #ffffff;
  outline-offset: 2px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}

/* ===== <button> 语义化替换：.slider-item / .submenu-item 恢复原视觉 ===== */
.slider-item {
  background-color: transparent !important;
  border: none !important;
  padding: 0 !important;
  font-family: inherit;
  outline: none;
}
.slider-item:focus-visible {
  outline: 2px solid #4a90d9;
  outline-offset: 2px;
}
.submenu-item {
  width: 100%;
  background: transparent;
  border: none;
  text-align: left;
  font-family: inherit;
  line-height: 1.5;
  outline: none;
}
.submenu-item:focus-visible {
  background-color: #eaf3fd;
  color: #4a90d9;
}

.flyout-enter-active { transition: opacity var(--motion-dur-mid) var(--motion-ease), transform var(--motion-dur-mid) var(--motion-ease); }
.flyout-leave-active { transition: opacity var(--motion-dur-fast) var(--motion-ease-in), transform var(--motion-dur-fast) var(--motion-ease-in); }
.flyout-enter-from, .flyout-leave-to { opacity: 0; transform: translateX(-8px); }

.main-content {
  background-color: #f5f7fa;
  padding: 20px !important;
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto !important;
  overflow-x: hidden;
  min-height: 0;
  height: 100%;
}
</style>

<style>
html, body {
  overflow-x: hidden !important;
  overflow-y: auto !important;
  height: 100%;
}

.slider-tooltip {
  background: rgba(160, 160, 160, 0.85) !important;
  font-size: 16px !important;
  letter-spacing: 2px !important;
  padding: 8px 16px !important;
  border-radius: 8px !important;
  border: none !important;
}

.slider-tooltip .el-popper__arrow::before {
  background: rgba(160, 160, 160, 0.85) !important;
  border: none !important;
}
</style>
