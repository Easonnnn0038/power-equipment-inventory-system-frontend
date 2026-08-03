<template>
  <div class="home">
    <!-- 顶部蓝色欢迎横幅 -->
    <div class="welcome-banner">
      <h1 class="banner-title">欢迎使用电力设备台账管理系统</h1>
      <p class="banner-subtitle">实时监控设备状态，高效管理巡检计划，保障电力系统稳定运行。</p>
    </div>

    <!-- 四个统计卡片 -->
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue">
          <el-icon :size="28"><Monitor /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">设备总数</div>
          <div class="stat-value">{{ stats.totalEquipment }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-green">
          <el-icon :size="28"><Connection /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">在线设备</div>
          <div class="stat-value">{{ stats.onlineEquipment }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-orange">
          <el-icon :size="28"><Document /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">今日巡检</div>
          <div class="stat-value">{{ stats.todayInspections }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-gray">
          <el-icon :size="28"><Warning /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">异常告警</div>
          <div class="stat-value">{{ stats.alertCount }}</div>
        </div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-section">
      <p class="search-hint">我们今天从哪里开始...</p>
      <div class="search-bar">
        <el-icon :size="20" color="#9ca3af"><Search /></el-icon>
        <input
          type="text"
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索设备、巡检记录、告警信息..."
          @keyup.enter="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">搜索</button>
      </div>
    </div>

    <!-- 下方左右两栏：通知公告 + 待办事项 -->
    <div class="bottom-grid">
      <!-- 通知公告 -->
      <div class="panel panel-notice">
        <div class="panel-header">
          <div class="panel-title">
            <el-icon :size="18" color="#4a90d9"><Bell /></el-icon>
            <span>通知公告</span>
          </div>
          <a class="view-more">查看更多</a>
        </div>
        <div class="notice-list" v-if="noticeList.length > 0">
          <div class="notice-item" v-for="(item, index) in noticeList" :key="index">
            <div class="notice-dot" :class="item.dotClass"></div>
            <div class="notice-content">
              <div class="notice-text">{{ item.text }}</div>
              <div class="notice-date">{{ item.date }}</div>
            </div>
          </div>
        </div>
        <div class="notice-empty" v-else>
          <el-icon :size="48" color="#d1d5db"><Bell /></el-icon>
          <p>当前没有通知</p>
        </div>
      </div>

      <!-- 待办事项 -->
      <div class="panel panel-todo">
        <div class="panel-header">
          <div class="panel-title">
            <el-icon :size="18" color="#E6A23C"><Tickets /></el-icon>
            <span>待办事项</span>
          </div>
          <span class="todo-count">{{ todoList.length }}</span>
        </div>
        <div class="todo-list" v-if="displayTodoList.length > 0">
          <div class="todo-item" v-for="(item, index) in displayTodoList" :key="index">
            <div class="todo-check" @click="removeTodo(index, item)">
              <input type="checkbox" class="todo-checkbox" />
            </div>
            <div class="todo-body">
              <div class="todo-name">{{ item.name }}</div>
              <div class="todo-date" v-if="item.deadline">截止日期：{{ item.deadline }}</div>
            </div>
          </div>
        </div>
        <div class="todo-empty" v-else>
          <el-icon :size="48" color="#d1d5db"><Tickets /></el-icon>
          <p>还没有任务待办</p>
        </div>
        <button class="todo-btn">查看全部待办</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, inject, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Monitor, Connection, Document, Warning, Tickets, Bell,
  Setting, DataAnalysis, Search
} from '@element-plus/icons-vue'
import { getDashboardStats, getTodoList } from '@/api/stats'
import { getTodoMessages, removeTodoMessage } from '@/api/message'
import { ElMessage } from 'element-plus'

const router = useRouter()
const todoRefreshTrigger = inject('todoRefreshTrigger', ref(0))

const searchKeyword = ref('')

function handleSearch() {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索内容')
    return
  }
  router.push({
    path: '/admin/ai-chat',
    query: { question: searchKeyword.value.trim() }
  })
}

const stats = ref({
  totalEquipment: 0,
  onlineEquipment: 0,
  todayInspections: 0,
  alertCount: 0
})

const noticeList = ref([])
const todoList = ref([])

// 显示在首页的待办列表（最多5条）
const displayTodoList = computed(() => {
  if (todoList.value.length === 0) return []
  return todoList.value.slice(0, 5).map(t => ({
    name: t.name,
    deadline: t.deadline || t.description || ''
  }))
})

/**
 * 删除待办事项
 * 点击复选框时触发，从列表中移除该项
 */
async function removeTodo(index, item) {
  // 从 todoList 中移除对应项
  const realIndex = todoList.value.findIndex(t =>
    t.name === item.name && (t.description || '') === (item.deadline || '')
  )
  if (realIndex !== -1) {
    todoList.value.splice(realIndex, 1)
  }

  // 如果是消息待办，调用后端删除接口
  if (item.messageId) {
    try {
      await removeTodoMessage(item.messageId)
    } catch (e) {
      // 后端失败时静默处理，前端已移除
    }
    // 同步从 localStorage 移除
    const key = 'local_todo_messages'
    const todos = JSON.parse(localStorage.getItem(key) || '[]')
    const filtered = todos.filter(t => t.id !== item.messageId)
    localStorage.setItem(key, JSON.stringify(filtered))
  }

  ElMessage.success('已完成该待办事项')
}

async function loadData() {
  // 优先从后端获取已加入待办的消息
  let msgTodos = []
  let backendSuccess = false

  try {
    const msgRes = await getTodoMessages()
    if (msgRes && msgRes.data && msgRes.data.length > 0) {
      backendSuccess = true
      msgTodos = msgRes.data.map(msg => ({
        name: msg.title,
        description: msg.content ? msg.content.substring(0, 40) : '',
        isMessage: true,
        messageId: msg.id
      }))
    } else if (msgRes && msgRes.data) {
      // 后端正常返回但数组为空
      backendSuccess = true
    }
  } catch {
    // 后端接口不可用，走本地存储兜底
    backendSuccess = false
  }

  // 从本地存储获取待办消息（后端失败时的兜底，或补充后端未返回的数据）
  const localTodos = getLocalTodoMessages().map(msg => ({
    name: msg.title,
    description: msg.content ? msg.content.substring(0, 40) : '',
    isMessage: true,
    messageId: msg.id
  }))

  // 合并去重
  const existingIds = new Set(msgTodos.map(t => t.messageId))
  const mergedLocalTodos = localTodos.filter(t => !existingIds.has(t.messageId))

  // 获取统计数据和待办列表
  try {
    const [statsRes, todoRes] = await Promise.all([
      getDashboardStats().catch(() => ({ data: null })),
      getTodoList().catch(() => ({ data: [] }))
    ])

    if (statsRes && statsRes.data) {
      stats.value = statsRes.data
    } else {
      stats.value = { totalEquipment: 3, onlineEquipment: 2, todayInspections: 0, alertCount: 0 }
    }

    const systemTodos = todoRes.data || []
    // 合并：系统待办 + 后端待办消息 + 本地待办消息
    todoList.value = [...systemTodos, ...msgTodos, ...mergedLocalTodos]
  } catch {
    stats.value = { totalEquipment: 0, onlineEquipment: 0, todayInspections: 0, alertCount: 0 }
    // 后端不可用时，仅合并后端待办消息 + 本地待办消息
    todoList.value = [...msgTodos, ...mergedLocalTodos]
  }
}

function getLocalTodoMessages() {
  try {
    const data = localStorage.getItem('local_todo_messages')
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

onMounted(() => { loadData() })
watch(todoRefreshTrigger, () => { loadData() })
</script>

<style scoped>
.home {
  padding: 24px 96px !important;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

/* ===== 顶部横幅 ===== */
.welcome-banner {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border-radius: 32px;
  padding: 64px 30px !important;
  color: #fff;
  text-align: left;
}
.banner-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 20px 0 !important;
  letter-spacing: 1px;
}
.banner-subtitle {
  font-size: 17px;
  margin: 0;
  opacity: 0.9;
}

/* ===== 四个统计卡片 ===== */
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.stat-card {
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 20px;
  padding: 70px 24px !important;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
  cursor: pointer;
}
.stat-card:hover {
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.1);
  transform: translateY(-2px);
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon-blue { background: #eff6ff; color: #2563eb; }
.stat-icon-green { background: #f0fdf4; color: #16a34a; }
.stat-icon-orange { background: #fff7ed; color: #ea580c; }
.stat-icon-gray { background: #f3f4f6; color: #4b5563; }
.stat-info { flex: 1; }
.stat-label {
  font-size: 15px;
  color: #6b7280;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

/* ===== 搜索栏 ===== */
.search-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.search-hint {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}
.search-bar {
  width: 100%;
  max-width: 2000px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px 20px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}
.search-bar:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15);
}
.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 30px;
  color: #111827;
  background: transparent;
}
.search-input::placeholder {
  color: #9ca3af;
}
.search-btn {
  padding: 20px 40px !important;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

/* ===== 下方左右两栏 ===== */
.bottom-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  flex: 1;
  min-height: 0;
}
.panel {
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}
.view-more {
  font-size: 14px;
  color: #2563eb;
  cursor: pointer;
}
.view-more:hover { text-decoration: underline; }

/* 通知公告 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
}
.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
}
.notice-item:last-child { border-bottom: none; }
.notice-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}
.notice-dot-blue { background: #2563eb; }
.notice-dot-green { background: #16a34a; }
.notice-dot-orange { background: #ea580c; }
.notice-content { flex: 1; }
.notice-text {
  font-size: 15px;
  color: #111827;
  margin-bottom: 6px;
}
.notice-date {
  font-size: 13px;
  color: #9ca3af;
}
.notice-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
  color: #9ca3af;
}
.notice-empty p {
  margin: 0;
  font-size: 14px;
}

/* 待办事项 */
.todo-count {
  background: #f3f4f6;
  color: #6b7280;
  font-size: 13px;
  padding: 2px 10px;
  border-radius: 10px;
}
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: 12px;
}
.todo-check { flex-shrink: 0; padding-top: 2px; }
.todo-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.todo-body { flex: 1; }
.todo-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}
.todo-date {
  font-size: 13px;
  color: #6b7280;
}
.todo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
  color: #9ca3af;
}
.todo-empty p {
  margin: 0;
  font-size: 14px;
}
.todo-btn {
  margin-top: 16px;
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.todo-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

@media (max-width: 1400px) {
  .shortcut-row { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 1100px) {
  .stat-row { grid-template-columns: repeat(2, 1fr); }
  .bottom-grid { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .home { padding: 16px; }
  .shortcut-row { grid-template-columns: repeat(2, 1fr); }
  .stat-row { grid-template-columns: 1fr; }
  .banner-title { font-size: 24px; }
}
</style>
