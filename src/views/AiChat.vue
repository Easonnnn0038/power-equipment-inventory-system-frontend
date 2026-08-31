<!--
  AI 助手聊天组件

  功能说明：
  1. 一个从右下角弹出的悬浮聊天面板
  2. 支持用户发送消息，调用后端 AI 接口获取回复
  3. 消息分为用户消息（靠右蓝色）和 AI 回复（靠左灰色）
  4. 发送中显示加载状态，防止重复点击

  使用方式：
  - 通过 v-model:visible 控制显示/隐藏
  - 内部自动管理消息列表和请求状态
  - 组件被销毁时自动清空聊天记录

  数据流向：
  用户输入 → send() 函数 → sendAiChat API → 后端 /api/common/ai-chat → DeepSeek
  → 后端返回 reply → 加入 messages 列表 → 页面渲染
-->

<template>
  <transition name="ai-chat-pop">
    <!-- 聊天面板根容器，绝对定位在右下角 -->
    <div v-if="visible" class="ai-chat-wrapper">
    <div class="ai-chat-panel">
      <!-- 顶部标题栏：显示标题 + 关闭按钮 -->
      <div class="ai-chat-header">
        <div class="ai-chat-title">
          <el-icon :size="18" :style="{ color: 'var(--brand-secondary)' }"><ChatDotRound /></el-icon>
          <span>AI 助手</span>
        </div>
        <el-icon class="close-btn" :size="20" @click="closePanel"><Close /></el-icon>
      </div>

      <!-- 消息列表区域：滚动显示所有对话 -->
      <div class="ai-chat-messages" ref="messagesRef">
        <!-- 欢迎语：仅在没有任何消息时显示 -->
        <div v-if="messages.length === 0" class="welcome-tip">
          <p>👋 你好！我是电力设备台账管理系统的 AI 助手</p>
          <p>有任何关于设备管理、巡检、操作的问题都可以问我</p>
        </div>

        <!-- 遍历消息列表，根据角色渲染不同样式 -->
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="message-item"
          :class="msg.role === 'user' ? 'msg-user' : 'msg-ai'"
        >
          <!-- AI 消息：左侧显示机器人图标 + 气泡 -->
          <template v-if="msg.role === 'ai'">
            <div class="avatar ai-avatar">
              <el-icon :size="18"><Cpu /></el-icon>
            </div>
            <div class="bubble ai-bubble">{{ msg.content }}</div>
          </template>

          <!-- 用户消息：右侧显示气泡 + 用户头像 -->
          <template v-else>
            <div class="bubble user-bubble">{{ msg.content }}</div>
            <div class="avatar user-avatar">
              <el-icon :size="18"><User /></el-icon>
            </div>
          </template>
        </div>

        <!-- AI 思考中动画：请求等待时显示 -->
        <div v-if="loading" class="message-item msg-ai">
          <div class="avatar ai-avatar">
            <el-icon :size="18"><Cpu /></el-icon>
          </div>
          <div class="bubble ai-bubble thinking">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>

      <!-- 底部输入区域：输入框 + 发送按钮 -->
      <div class="ai-chat-input">
        <el-input
          v-model="input"
          type="textarea"
          :rows="5"
          placeholder="输入问题，按 Enter 发送，Shift+Enter 换行"
          resize="none"
          @keydown="handleKeyDown"
          :disabled="loading"
        />
        <el-button
          type="primary"
          class="send-btn"
          :icon="Promotion"
          :loading="loading"
          @click="sendMessage"
          circle
        />
      </div>
    </div>
    </div>
  </transition>
</template>

<script setup>
/**
 * AI 助手聊天组件 - 脚本逻辑
 *
 * 状态变量：
 * - visible: 控制整个面板显示/隐藏（父组件通过 v-model 传入）
 * - input: 输入框中的文本
 * - messages: 聊天消息列表，每条包含 role(user/ai) 和 content
 * - loading: 请求等待状态，防止重复发送
 * - messagesRef: 消息列表 DOM 引用，用于发送后自动滚动到底部
 */

import { ref, nextTick, watch } from 'vue'
import { Close, ChatDotRound, Cpu, User, Promotion } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { sendAiChat } from '@/api/common'

// ============== Props & Emits ==============
// 使用 Vue 3 的 defineModel 实现 v-model:visible 双向绑定
const visible = defineModel('visible', { type: Boolean, default: false })

// ============== 响应式状态 ==============
// 用户当前在输入框中输入的文本
const input = ref('')
// 聊天记录列表：每条消息是 { role: 'user' | 'ai', content: 'xxx' }
const messages = ref([])
// 是否正在等待 AI 回复（发送中状态）
const loading = ref(false)
// 消息容器 DOM 引用，用于发送后滚动到底部
const messagesRef = ref(null)

// ============== 辅助方法 ==============

/**
 * 关闭聊天面板
 * 由右上角的关闭按钮触发，直接把 visible 设为 false
 */
function closePanel() {
  visible.value = false
}

/**
 * 将消息容器滚动到底部
 * 在新消息追加后调用，确保用户能看到最新内容
 * 使用 nextTick 确保 DOM 更新后再执行滚动
 */
async function scrollToBottom() {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

// ============== 核心：发送消息 ==============

/**
 * 发送用户消息并获取 AI 回复
 *
 * 执行流程：
 * 1. 校验输入是否为空
 * 2. 将用户消息推入 messages 列表，立即渲染到界面
 * 3. 清空输入框，开启 loading 状态
 * 4. 调用后端 sendAiChat 接口发送请求
 * 5. 将 AI 回复推入 messages 列表
 * 6. 关闭 loading，滚动到底部
 * 7. 异常时提示用户，并添加一条错误提示消息
 */
async function sendMessage() {
  // 去除首尾空格后判断是否为空
  const content = input.value.trim()
  if (!content) {
    return
  }
  // 请求中不允许重复发送
  if (loading.value) {
    return
  }

  // 先把用户消息加到列表，让用户看到自己发出去了
  messages.value.push({ role: 'user', content })
  // 清空输入框
  input.value = ''
  // 开启加载状态
  loading.value = true
  // 用户消息显示后滚动到底部
  scrollToBottom()

  try {
    // 调用后端 AI 接口
    const res = await sendAiChat(content)
    // 接口返回格式：{ code: 200, data: { reply: '回复内容' } }
    const reply = res?.data?.reply || '抱歉，我没有理解您的问题。'
    // 把 AI 回复加入消息列表
    messages.value.push({ role: 'ai', content: reply })
  } catch (err) {
    // 请求失败时，在界面上显示错误提示
    const errorMsg = 'AI 助手暂时无法响应，请稍后再试。'
    messages.value.push({ role: 'ai', content: errorMsg })
    ElMessage.error({ message: `AI 助手暂时无法响应：${errorMsg}\n💡 建议检查网络，5 秒后重试；或换用更具体的关键词（如"2026年8月巡检异常统计"）`, duration: 4200, showClose: true, grouping: true })
  } finally {
    // 无论成功失败都要关闭 loading，并滚动到底部
    loading.value = false
    scrollToBottom()
  }
}

// ============== 键盘事件：Enter 发送 / Shift+Enter 换行 ==============

/**
 * 处理输入框的键盘事件
 * - 单独按 Enter：发送消息（阻止默认换行行为）
 * - Shift + Enter：允许换行，不做任何拦截
 */
function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// ============== 监听面板关闭：可选清空聊天记录 ==============
// 如果你希望每次打开都是新对话，可以取消下面这段的注释
// watch(visible, (val) => {
//   if (!val) {
//     // 关闭面板时清空聊天记录
//     messages.value = []
//   }
// })
</script>

<style scoped>
/* 聊天组件外层容器：固定定位在屏幕右下角 */
.ai-chat-wrapper {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 9999;
}

/* 聊天面板主体：固定尺寸 + 圆角阴影 */
.ai-chat-panel {
  width: 420px;
  height: 560px;
  background: var(--surface);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ---------- 顶部标题栏 ---------- */
.ai-chat-header {
  height: 52px;
  padding: 0 16px;
  background: linear-gradient(135deg, var(--brand-secondary), var(--brand-primary));
  color: var(--text-inverse);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.ai-chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

/* 关闭按钮：鼠标悬停变深 */
.close-btn {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color var(--motion-dur-fast) var(--motion-ease);
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ---------- 消息列表区域 ---------- */
.ai-chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: var(--surface-subtle);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 空状态欢迎语 */
.welcome-tip {
  background: var(--surface);
  padding: 16px;
  border-radius: 8px;
  color: var(--text-4);
  font-size: 14px;
  line-height: 1.8;
  text-align: center;
}
.welcome-tip p {
  margin: 0;
}

/* 单条消息容器：flex 布局，头像 + 气泡 */
.message-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 100%;
}

/* 用户消息：整体靠右排列，文字在气泡内右对齐，贴近头像 */
.msg-user {
  justify-content: flex-end;
}

.msg-user .bubble {
  text-align: right;
}

/* AI 消息：靠左排列 */
.msg-ai {
  justify-content: flex-start;
}

/* 圆形头像容器 */
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  flex-shrink: 0;
}

/* AI 头像：深灰蓝 */
.ai-avatar {
  background: var(--text-3);
}

/* 用户头像：主题蓝 */
.user-avatar {
  background: var(--brand-secondary);
}

/* 消息气泡基础样式 */
.bubble {
  max-width: 280px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

/* AI 气泡：白底 + 灰字 */
.ai-bubble {
  background: var(--surface);
  color: var(--text-1);
  border: 1px solid var(--border-soft);
  border-top-left-radius: 2px;
}

/* 用户气泡：蓝底 + 白字 */
.user-bubble {
  background: var(--brand-secondary);
  color: var(--text-inverse);
  border-top-right-radius: 2px;
}

/* AI 思考中动画：三个圆点依次呼吸 */
.thinking {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 14px 18px;
}
.thinking .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-4);
  animation: dot-pulse 1.4s var(--motion-ease) infinite both;
}
.thinking .dot:nth-child(1) { animation-delay: -0.32s; }
.thinking .dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes dot-pulse {
  0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* ---------- 底部输入区域 ---------- */
.ai-chat-input {
  padding: 12px;
  border-top: 1px solid var(--border-soft);
  background: var(--surface);
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

/* 输入框占满剩余空间 */
.ai-chat-input :deep(.el-textarea) {
  flex: 1;
}

/* 发送按钮：圆形、稍大、与输入框之间有留白 */
.send-btn {
  margin-left: 8px;
}

.send-btn :deep(.el-button) {
  width: 48px;
  height: 48px;
}

.send-btn :deep(.el-button .el-icon) {
  font-size: 22px;
}

/* ---------- 自定义滚动条样式（可选美化） ---------- */
.ai-chat-messages::-webkit-scrollbar {
  width: 6px;
}
.ai-chat-messages::-webkit-scrollbar-thumb {
  background: var(--text-4);
  border-radius: 3px;
}
.ai-chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

/* ---------- 聊天面板浮层入场（Exit faster） ---------- */
.ai-chat-pop-enter-active { transition: opacity var(--motion-dur-slow) var(--motion-ease), transform var(--motion-dur-slow) var(--motion-ease); }
.ai-chat-pop-leave-active { transition: opacity var(--motion-dur-mid) var(--motion-ease-in), transform var(--motion-dur-mid) var(--motion-ease-in); }
.ai-chat-pop-enter-from { opacity: 0; transform: translateY(28px) scale(0.96); }
.ai-chat-pop-leave-to { opacity: 0; transform: translateY(16px) scale(0.98); }
</style>
