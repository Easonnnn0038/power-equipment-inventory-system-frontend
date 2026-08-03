<template>
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
            <div
              class="slider-item"
              :class="{ active: activeMenu === item.path || (item.children && isChildActive(item)) }"
              @click="handleSliderClick(item)"
            >
              <el-icon :size="22" :color="activeMenu === item.path || (item.children && isChildActive(item)) ? '#ffffff' : '#4a90d9'">
                <component :is="item.icon" />
              </el-icon>
            </div>
          </el-tooltip>

          <div class="slider-divider"></div>

          <el-tooltip
            v-for="(btn, index) in bottomButtons"
            :key="btn.action"
            :content="btn.label"
            placement="right"
            popper-class="slider-tooltip"
          >
            <div
              class="slider-item"
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
              />
            </div>
          </el-tooltip>
        </div>

        <transition name="flyout">
          <div v-if="showSubmenu" class="submenu-flyout" :style="{ top: submenuTop + 'px' }">
            <div class="submenu-title">{{ currentSubmenuLabel }}</div>
            <div
              v-for="child in currentSubmenuChildren"
              :key="child.path"
              class="submenu-item"
              :class="{ active: activeMenu === child.path }"
              @click="handleSubmenuClick(child)"
            >
              {{ child.label }}
            </div>
          </div>
        </transition>
      </el-aside>

      <!-- 主内容区域：渲染各个路由页面 -->
      <el-main class="main-content">
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

import { ref, onMounted, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { HomeFilled, Monitor, Document, DataAnalysis, Setting, ChatDotRound, EditPen, User, Bell, Lightning } from '@element-plus/icons-vue'
import { sendAiChat, submitFeedback, getUserProfile, getAnnouncements } from '@/api/common'
// 引入 AI 聊天组件
import AiChat from './AiChat.vue'
// 引入消息面板组件
import MessagePanel from './MessagePanel.vue'
// 引入消息 API
import { getUnreadCount } from '@/api/message'

const router = useRouter()
const route = useRoute()
const username = ref(localStorage.getItem('username') || 'admin')
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

const navItems = [
  { path: '/admin/home', label: '首页', icon: HomeFilled },
  { path: '/admin/equipment', label: '设备台账', icon: Monitor },
  { path: 'inspection', label: '巡检记录', icon: Document, children: [
    { path: '/admin/inspection', label: '巡检列表' },
    { path: '/admin/inspection/create', label: '新建巡检' }
  ]},
  { path: 'statistics', label: '数据统计', icon: DataAnalysis, children: [
    { path: '/admin/statistics', label: '统计概览' }
  ]},
  { path: 'settings', label: '系统设置', icon: Setting, children: [
    { path: '/admin/settings/user', label: '用户管理' },
    { path: '/admin/settings/role', label: '角色管理' }
  ]}
]

const bottomButtons = [
  { action: 'ai', label: 'AI助手', icon: ChatDotRound, handler: handleAiChat },
  { action: 'feedback', label: '意见反馈', icon: EditPen, handler: handleFeedback },
  { action: 'account', label: '账户设置', icon: User, handler: handleAccountSettings },
  { action: 'announcement', label: '消息', icon: Bell, handler: handleAnnouncements }
]

function isChildActive(item) {
  if (!item.children) return false
  return item.children.some(child => activeMenu.value === child.path)
}

function handleSliderClick(item) {
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
async function handleFeedback() { ElMessage.info('意见反馈功能开发中') }
async function handleAccountSettings() { ElMessage.info('账户设置功能开发中') }

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

// 页面加载时获取未读数量
onMounted(() => {
  loadUnreadMessages()
  // 每60秒刷新一次未读数量
  setInterval(loadUnreadMessages, 60000)
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
  transition: all 0.25s ease;
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
  transition: all 0.2s;
}
.submenu-item:hover { background-color: #f5f7fa; color: #4a90d9; }
.submenu-item.active { color: #4a90d9; font-weight: 500; }

.flyout-enter-active, .flyout-leave-active { transition: opacity 0.2s, transform 0.2s; }
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
