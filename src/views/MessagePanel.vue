<!--
  消息侧滑面板组件
  
  功能：
  1. 左右分栏布局：左侧消息列表 + 右侧消息详情
  2. 消息分类标签：系统消息 / 任务消息
  3. 标记已读（单条 / 全部）
  4. 删除消息
  5. 管理员发布公告/任务（弹窗）
  6. 任务消息单条加入待办事项
  7. 未读消息红色角标
  
  数据来源：
  - GET    /api/message/list          消息列表
  - GET    /api/message/unread-count   未读数量
  - PUT    /api/message/{id}/read      标记已读
  - PUT    /api/message/read-all       全部已读
  - DELETE /api/message/{id}           删除消息
  - POST   /api/message/publish        发布消息
  - POST   /api/message/{id}/add-todo  加入待办
-->

<template>
  <!-- 遮罩层 -->
  <transition name="fade">
    <div v-if="visible" class="message-mask" @click="handleClose"></div>
  </transition>

  <!-- 侧滑面板 -->
  <transition name="slide-right">
    <div v-if="visible" class="message-panel">
      <!-- 面板头部 -->
      <div class="panel-header">
        <div class="header-left">
          <el-icon :size="22" color="#303133"><Bell /></el-icon>
          <span class="header-title">消息</span>
          <el-badge v-if="unreadCount > 0" :value="unreadCount" :max="99" class="header-badge" />
        </div>
        <div class="header-actions">
          <!-- 管理员可见：发布按钮 -->
          <el-button v-if="isAdmin" size="small" type="primary" @click="handlePublish">
            <el-icon><EditPen /></el-icon>发布
          </el-button>
          <!-- 全部已读 -->
          <el-button size="small" @click="handleMarkAllRead" :disabled="unreadCount === 0">
            <el-icon><Check /></el-icon>全部已读
          </el-button>
          <!-- 关闭按钮 -->
          <el-icon class="close-btn" :size="20" @click="handleClose"><Close /></el-icon>
        </div>
      </div>

      <!-- 分类标签 -->
      <div class="message-tabs">
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'system' }"
          @click="switchTab('system')"
        >
          系统消息
          <el-badge v-if="systemUnread > 0" :value="systemUnread" :max="99" class="tab-badge" />
        </div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'task' }"
          @click="switchTab('task')"
        >
          任务消息
          <el-badge v-if="taskUnread > 0" :value="taskUnread" :max="99" class="tab-badge" />
        </div>
      </div>

      <!-- 面板主体：左右分栏 -->
      <div class="panel-body">
        <!-- 左侧：消息列表 -->
        <div class="message-list" v-loading="loading">
          <div
            v-for="msg in messageList"
            :key="msg.id"
            class="message-item"
            :class="{ 
              unread: msg.readStatus === 0,
              selected: selectedMessage?.id === msg.id
            }"
            @click="handleSelectMessage(msg)"
          >
            <!-- 未读小圆点 -->
            <div class="unread-dot" v-if="msg.readStatus === 0"></div>
            
            <!-- 消息图标 -->
            <div class="msg-icon" :style="{ backgroundColor: getIconBgColor(msg) }">
              <el-icon :size="16" color="#fff">
                <component :is="getMsgIcon(msg)" />
              </el-icon>
            </div>

            <!-- 消息摘要 -->
            <div class="msg-content">
              <div class="msg-title">{{ msg.title }}</div>
              <div class="msg-summary">{{ msg.content }}</div>
              <div class="msg-meta">
                <span class="msg-time">{{ formatTime(msg.createTime) }}</span>
                <el-tag v-if="msg.priority === 'urgent'" type="danger" size="small">紧急</el-tag>
              </div>
            </div>
            
            <!-- 列表快速删除按钮 -->
            <div class="msg-actions" @click.stop>
              <el-icon 
                class="delete-icon" 
                :class="{ 'delete-icon-disabled': msg.readStatus === 0 }"
                :title="msg.readStatus === 1 ? '删除这条消息' : '尚未阅读，点击将先自动标记为已读再删除'"
                @click="handleDelete(msg)"
              >
                <Delete />
              </el-icon>
            </div>
          </div>

          <!-- 空状态 -->
          <el-empty v-if="!loading && messageList.length === 0" description="暂无消息" :image-size="80" />
        </div>

        <!-- 右侧：消息详情 -->
        <div class="message-detail" v-if="selectedMessage">
          <div class="detail-header">
            <h3 class="detail-title">{{ selectedMessage.title }}</h3>
            <div class="detail-meta">
              <el-tag :type="selectedMessage.priority === 'urgent' ? 'danger' : 'info'" size="small">
                {{ selectedMessage.priority === 'urgent' ? '紧急' : '普通' }}
              </el-tag>
              <el-tag :type="selectedMessage.type === 'task' ? 'warning' : ''" size="small">
                {{ selectedMessage.type === 'task' ? '任务' : getTypeLabel(selectedMessage.subType) }}
              </el-tag>
              <span class="detail-time">{{ formatTime(selectedMessage.createTime) }}</span>
            </div>
          </div>

          <div class="detail-body">
            <div class="detail-content">{{ selectedMessage.content }}</div>
          </div>

          <!-- 操作按钮 -->
          <div class="detail-footer">
            <el-button 
              v-if="selectedMessage.readStatus === 0"
              size="small" @click="handleMarkRead(selectedMessage)"
            >
              标记已读
            </el-button>
            <!-- 任务消息：加入待办按钮 -->
            <el-button 
              v-if="selectedMessage.type === 'task' && !selectedMessage.addedToTodo"
              size="small" type="primary" @click="handleAddToTodo(selectedMessage)"
            >
              <el-icon><Plus /></el-icon>加入待办
            </el-button>
            <el-tag v-if="selectedMessage.addedToTodo" type="success" size="small">已加入待办</el-tag>
            <el-button size="small" type="danger" @click="handleDelete(selectedMessage)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </div>
        </div>

        <!-- 未选中消息时的占位 -->
        <div class="message-detail-empty" v-else>
          <el-empty description="选择一条消息查看详情" :image-size="100" />
        </div>
      </div>
    </div>
  </transition>

  <!-- 发布消息弹窗 -->
  <el-dialog v-model="publishDialogVisible" title="发布消息" width="500px">
    <el-form :model="publishForm" label-width="80px">
      <el-form-item label="消息类型" required>
        <el-radio-group v-model="publishForm.type">
          <el-radio value="announcement">公告通知</el-radio>
          <el-radio value="task">任务消息</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="优先级">
        <el-radio-group v-model="publishForm.priority">
          <el-radio value="normal">普通</el-radio>
          <el-radio value="urgent">紧急</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="标题" required>
        <el-input v-model="publishForm.title" placeholder="请输入消息标题" />
      </el-form-item>
      <el-form-item label="内容" required>
        <el-input 
          v-model="publishForm.content" 
          type="textarea" 
          :rows="4"
          placeholder="请输入消息内容" 
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="publishDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="savePublish">确认发布</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
/**
 * 消息面板脚本逻辑
 * 
 * 功能：
 * 1. 加载消息列表（按分类筛选）
 * 2. 查看消息详情
 * 3. 标记已读（单条/全部）
 * 4. 删除消息
 * 5. 管理员发布公告/任务
 * 6. 任务消息加入待办事项
 */

import { ref, reactive, computed, watch } from 'vue'
import { getRole } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Bell, Close, Check, Delete, Plus, EditPen,
  Warning, BellFilled, Document, Ticket
} from '@element-plus/icons-vue'
import { confirmDestructive } from '@/utils/messages';
import {
  getMessageList, getUnreadCount, markAsRead,
  markAllAsRead, deleteMessage, publishMessage, addTaskToTodo
} from '@/api/message'

// ==================== 组件属性 ====================

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible', 'unread-update', 'todo-update'])

// ==================== 数据定义 ====================

// 当前登录用户角色
const currentUserRole = ref(getRole() || 'user')
const isAdmin = computed(() => currentUserRole.value === 'admin' || currentUserRole.value === '1')

// 加载状态
const loading = ref(false)

// 当前激活的分类标签
const activeTab = ref('system')

// 消息列表
const messageList = ref([])

// 选中的消息（右侧详情展示）
const selectedMessage = ref(null)

// 未读数量
const unreadCount = ref(0)
const systemUnread = ref(0)
const taskUnread = ref(0)

// 发布弹窗
const publishDialogVisible = ref(false)
const publishForm = reactive({
  type: 'announcement',
  priority: 'normal',
  title: '',
  content: ''
})

// ==================== 工具方法 ====================

/**
 * 获取消息图标
 */
function getMsgIcon(msg) {
  if (msg.type === 'task') return Ticket
  switch (msg.subType) {
    case 'alert': return Warning
    case 'announcement': return BellFilled
    default: return Document
  }
}

/**
 * 获取消息图标背景色
 */
function getIconBgColor(msg) {
  if (msg.type === 'task') return '#E6A23C'
  switch (msg.subType) {
    case 'alert': return '#F56C6C'
    case 'announcement': return '#409EFF'
    default: return '#909399'
  }
}

/**
 * 获取消息子类型标签文字
 */
function getTypeLabel(subType) {
  const map = {
    alert: '告警',
    announcement: '公告',
    system: '通知'
  }
  return map[subType] || '通知'
}

/**
 * 格式化时间
 */
function formatTime(time) {
  if (!time) return ''
  // 如果是 ISO 格式字符串
  const date = new Date(time)
  if (isNaN(date.getTime())) return time
  
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${h}:${m}`
}

// ==================== 数据加载 ====================

/**
 * 加载消息列表
 */
async function loadMessages() {
  loading.value = true
  try {
    const res = await getMessageList({ type: activeTab.value, pageNum: 1, pageSize: 50 })
    messageList.value = res.data?.list || res.data || []
  } catch (e) {
    console.error('加载消息列表失败:', e)
    // 后端未就绪时使用模拟数据
    messageList.value = getMockMessages(activeTab.value)
  } finally {
    loading.value = false
  }
}

/**
 * 加载未读数量
 */
async function loadUnreadCount() {
  try {
    const res = await getUnreadCount()
    unreadCount.value = res.data?.total || res.data || 0
    systemUnread.value = res.data?.system || 0
    taskUnread.value = res.data?.task || 0
    emit('unread-update', unreadCount.value)
  } catch (e) {
    console.error('加载未读数量失败:', e)
    // 模拟数据
    unreadCount.value = 3
    systemUnread.value = 2
    taskUnread.value = 1
    emit('unread-update', unreadCount.value)
  }
}

/**
 * 模拟消息数据（后端未就绪时使用）
 */
function getMockMessages(type) {
  if (type === 'system') {
    return [
      { id: 1, type: 'system', subType: 'alert', title: '设备告警', content: '1号主变压器温度异常，当前温度85°C，请及时处理。', priority: 'urgent', readStatus: 0, createTime: '2026-07-31 14:30:00', addedToTodo: false },
      { id: 2, type: 'system', subType: 'announcement', title: '系统维护通知', content: '系统将于今晚22:00-23:00进行例行维护，届时将短暂无法访问。', priority: 'normal', readStatus: 0, createTime: '2026-07-31 10:00:00', addedToTodo: false },
      { id: 3, type: 'system', subType: 'system', title: '巡检提醒', content: '今日还有3台设备待巡检，请及时完成巡检记录。', priority: 'normal', readStatus: 1, createTime: '2026-07-31 08:00:00', addedToTodo: false }
    ]
  } else {
    return [
      { id: 4, type: 'task', subType: 'task', title: '设备检修任务', content: '请于本周五前完成2号主变压器的季度检修工作，并提交检修报告。', priority: 'urgent', readStatus: 0, createTime: '2026-07-31 09:00:00', addedToTodo: false },
      { id: 5, type: 'task', subType: 'task', title: '巡检计划编制', content: '请编制下月的设备巡检计划表，覆盖所有运行中设备。', priority: 'normal', readStatus: 0, createTime: '2026-07-30 15:00:00', addedToTodo: false },
      { id: 6, type: 'task', subType: 'task', title: '设备台账更新', content: '请更新新增设备的台账信息，确保数据完整性。', priority: 'normal', readStatus: 1, createTime: '2026-07-30 10:00:00', addedToTodo: true }
    ]
  }
}

// ==================== 交互方法 ====================

/**
 * 关闭面板
 */
function handleClose() {
  emit('update:visible', false)
}

/**
 * 切换分类标签
 */
function switchTab(tab) {
  activeTab.value = tab
  selectedMessage.value = null
  loadMessages()
}

/**
 * 选中消息查看详情
 */
async function handleSelectMessage(msg) {
  selectedMessage.value = msg
  // 如果消息未读，自动标记为已读
  if (msg.readStatus === 0) {
    await handleMarkRead(msg)
  }
}

/**
 * 标记单条消息已读
 */
async function handleMarkRead(msg) {
  try {
    await markAsRead(msg.id)
    msg.readStatus = 1
    loadUnreadCount()
  } catch (e) {
    // 后端未就绪时本地更新
    msg.readStatus = 1
    updateLocalUnread()
  }
}

/**
 * 全部标记已读
 */
async function handleMarkAllRead() {
  try {
    await markAllAsRead()
    messageList.value.forEach(msg => { msg.readStatus = 1 })
    loadUnreadCount()
    ElMessage.success('已全部标记为已读')
  } catch (e) {
    messageList.value.forEach(msg => { msg.readStatus = 1 })
    updateLocalUnread()
    ElMessage.success('已全部标记为已读')
  }
}

/**
 * 删除消息
 * 只有已读消息可以删除，未读消息需先标记已读
 */
function handleDelete(msg) {
  // 检查消息是否已读
  if (msg.readStatus === 0) {
    ElMessage.warning('请先标记为已读后再删除')
    // 自动标记为已读，方便用户直接删除
    handleMarkRead(msg)
    return
  }
  
  ElMessageBox.confirm('确定要删除这条消息吗？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteMessage(msg.id)
      ElMessage.success('删除成功')
      messageList.value = messageList.value.filter(m => m.id !== msg.id)
      selectedMessage.value = null
      loadUnreadCount()
      // 从本地存储移除待办
      removeTodoMessageFromLocal(msg.id)
      emit('todo-update')
    } catch (e) {
      // 后端未就绪时本地删除
      messageList.value = messageList.value.filter(m => m.id !== msg.id)
      selectedMessage.value = null
      updateLocalUnread()
      ElMessage.success('删除成功')
      // 从本地存储移除待办
      removeTodoMessageFromLocal(msg.id)
      emit('todo-update')
    }
  }).catch(() => {})
}

/**
 * 从本地存储移除待办消息
 */
function removeTodoMessageFromLocal(id) {
  const key = 'local_todo_messages'
  const todos = JSON.parse(localStorage.getItem(key) || '[]')
  const filtered = todos.filter(t => t.id !== id)
  localStorage.setItem(key, JSON.stringify(filtered))
}

/**
 * 任务消息加入待办
 */
async function handleAddToTodo(msg) {
  try {
    await addTaskToTodo(msg.id)
    msg.addedToTodo = true
    ElMessage.success('已加入待办事项')
    // 保存到本地存储，便于首页读取
    saveTodoMessageToLocal(msg)
    emit('todo-update')
  } catch (e) {
    // 后端未就绪时本地更新
    msg.addedToTodo = true
    ElMessage.success('已加入待办事项')
    // 保存到本地存储
    saveTodoMessageToLocal(msg)
    emit('todo-update')
  }
}

/**
 * 将待办消息保存到本地存储
 */
function saveTodoMessageToLocal(msg) {
  const key = 'local_todo_messages'
  const todos = JSON.parse(localStorage.getItem(key) || '[]')
  // 避免重复添加
  if (!todos.find(t => t.id === msg.id)) {
    todos.push({
      id: msg.id,
      title: msg.title,
      content: msg.content,
      type: msg.type,
      readStatus: msg.readStatus,
      addedToTodo: true,
      createTime: msg.createTime
    })
    localStorage.setItem(key, JSON.stringify(todos))
  }
}

/**
 * 打开发布弹窗
 */
function handlePublish() {
  publishForm.type = 'announcement'
  publishForm.priority = 'normal'
  publishForm.title = ''
  publishForm.content = ''
  publishDialogVisible.value = true
}

/**
 * 保存发布
 */
async function savePublish() {
  if (!publishForm.title || !publishForm.content) {
    ElMessage.warning({ message: '发布前请完整填写\n💡 「标题」3-30 字概括主题，「内容」填写具体说明', duration: 2800, showClose: true })
    return
  }

  try {
    await publishMessage({
      type: publishForm.type,
      priority: publishForm.priority,
      title: publishForm.title,
      content: publishForm.content
    })
    ElMessage.success('发布成功')
    publishDialogVisible.value = false
    loadMessages()
    loadUnreadCount()
  } catch (e) {
    ElMessage.error({ message: `发布失败：${e?.response?.data?.message || e?.message || '服务器暂未响应'}\n💡 建议 30 秒后重试，或减少内容长度`, duration: 4000, showClose: true, grouping: true })
  }
}

/**
 * 本地更新未读数量（后端未就绪时的回退方案）
 */
function updateLocalUnread() {
  const systemUnreadCount = messageList.value.filter(m => m.type === 'system' && m.readStatus === 0).length
  const taskUnreadCount = messageList.value.filter(m => m.type === 'task' && m.readStatus === 0).length
  systemUnread.value = systemUnreadCount
  taskUnread.value = taskUnreadCount
  unreadCount.value = systemUnreadCount + taskUnreadCount
  emit('unread-update', unreadCount.value)
}

// ==================== 监听器 ====================

// 面板打开时加载数据
watch(() => props.visible, (val) => {
  if (val) {
    loadMessages()
    loadUnreadCount()
  }
})
</script>

<style scoped>
/* 遮罩层 */
.message-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 999;
}

/* 侧滑面板 */
.message-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 720px;
  height: 100vh;
  background-color: #ffffff;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.08);
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-badge {
  margin-left: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-btn {
  cursor: pointer;
  color: #909399;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #f56c6c;
}

/* 分类标签 */
.message-tabs {
  display: flex;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab-item:hover {
  color: #409EFF;
}

.tab-item.active {
  color: #409EFF;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 30%;
  right: 30%;
  height: 2px;
  background-color: #409EFF;
  border-radius: 1px;
}

.tab-badge {
  margin-left: 2px;
}

/* 面板主体：左右分栏 */
.panel-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* 左侧消息列表 */
.message-list {
  width: 340px;
  border-right: 1px solid #ebeef5;
  overflow-y: auto;
  flex-shrink: 0;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f5f7fa;
}

.message-item:hover {
  background-color: #f5f7fa;
}

.message-item.selected {
  background-color: #ecf5ff;
}

.message-item.unread {
  background-color: #fef0f0;
}

.message-item.unread:hover {
  background-color: #fde2e2;
}

/* 未读小圆点 */
.unread-dot {
  position: absolute;
  top: 18px;
  right: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #f56c6c;
}

/* 消息列表快速删除按钮 */
.msg-actions {
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.message-item:hover .msg-actions {
  opacity: 1;
}

.delete-icon {
  font-size: 16px;
  color: #c0c4cc;
  cursor: pointer;
  transition: color 0.2s;
  padding: 4px;
  border-radius: 4px;
}

.delete-icon:hover {
  color: #f56c6c;
  background-color: #fef0f0;
}

.delete-icon-disabled {
  color: #dcdfe6 !important;
  cursor: not-allowed !important;
}

.delete-icon-disabled:hover {
  color: #dcdfe6 !important;
  background-color: transparent !important;
}

/* 消息图标 */
.msg-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 消息内容 */
.msg-content {
  flex: 1;
  min-width: 0;
}

.msg-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 16px;
}

.msg-summary {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.msg-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.msg-time {
  font-size: 12px;
  color: #c0c4cc;
}

/* 右侧消息详情 */
.message-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message-detail-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-header {
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-time {
  font-size: 12px;
  color: #c0c4cc;
}

.detail-body {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}

.detail-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
}

.detail-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
}

/* 动画（token 化 + Exit faster） */
.fade-enter-active { transition: opacity var(--motion-dur-mid) var(--motion-ease); }
.fade-leave-active { transition: opacity var(--motion-dur-fast) var(--motion-ease-in); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-right-enter-active { transition: transform var(--motion-dur-slow) var(--motion-ease), opacity var(--motion-dur-slow) var(--motion-ease); }
.slide-right-leave-active { transition: transform var(--motion-dur-mid) var(--motion-ease-in), opacity var(--motion-dur-mid) var(--motion-ease-in); }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); opacity: 0; }
</style>
