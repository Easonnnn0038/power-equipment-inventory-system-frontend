<template>
  <div class="ai-chat-page">
    <div class="ai-chat-page-header">
      <div class="header-left">
        <el-icon :size="22" :style="{ color: 'var(--brand-secondary)' }"><ChatDotRound /></el-icon>
        <span class="header-title">AI 助手</span>
        <span class="header-sub">电力设备台账管理系统智能问答</span>
      </div>
      <div class="header-right">
        <el-button @click="clearChat" :icon="Delete" circle text>清空对话</el-button>
      </div>
    </div>

    <div class="ai-chat-page-body" ref="messagesRef">
      <div v-if="messages.length === 0" class="welcome-section">
        <div class="welcome-icon">🤖</div>
        <h2>你好，我是 AI 助手</h2>
        <p class="welcome-desc">可以帮你查询设备信息、分析巡检数据、解答系统操作问题</p>
        <div class="quick-questions">
          <button class="quick-btn" @click="askQuick('设备总数是多少？')">设备总数是多少？</button>
          <button class="quick-btn" @click="askQuick('最近的巡检记录')">最近的巡检记录</button>
          <button class="quick-btn" @click="askQuick('如何新增设备？')">如何新增设备？</button>
          <button class="quick-btn" @click="askQuick('异常告警有哪些？')">异常告警有哪些？</button>
        </div>
      </div>

      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message-item"
        :class="msg.role === 'user' ? 'msg-user' : 'msg-ai'"
      >
        <template v-if="msg.role === 'ai'">
          <div class="avatar ai-avatar">
            <el-icon :size="18"><Cpu /></el-icon>
          </div>
          <div class="bubble ai-bubble">{{ msg.content }}</div>
        </template>
        <template v-else>
          <div class="bubble user-bubble">{{ msg.content }}</div>
          <div class="avatar user-avatar">
            <el-icon :size="18"><User /></el-icon>
          </div>
        </template>
      </div>

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

    <div class="ai-chat-page-footer">
      <div class="input-wrapper">
        <el-input
          v-model="input"
          type="textarea"
          :rows="3"
          placeholder="输入问题，按 Enter 发送，Shift+Enter 换行"
          resize="none"
          @keydown="handleKeyDown"
          :disabled="loading"
        />
        <button
          class="send-btn"
          :disabled="loading || !input.trim()"
          @click="sendMessage"
        >
          <el-icon :size="20"><Promotion /></el-icon>
          <span>发送</span>
        </button>
      </div>
      <p class="input-hint">AI 助手可能会出错，请核实重要信息</p>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ChatDotRound, Cpu, User, Promotion, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { sendAiChat } from '@/api/common'

const route = useRoute()

const input = ref('')
const messages = ref([])
const loading = ref(false)
const messagesRef = ref(null)

async function scrollToBottom() {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

function askQuick(question) {
  input.value = question
  sendMessage()
}

function clearChat() {
  messages.value = []
  input.value = ''
  ElMessage.success('已清空对话')
}

async function sendMessage() {
  const content = input.value.trim()
  if (!content || loading.value) return

  messages.value.push({ role: 'user', content })
  input.value = ''
  loading.value = true
  scrollToBottom()

  try {
    const res = await sendAiChat(content)
    const reply = res?.data?.reply || '抱歉，我没有理解您的问题。'
    messages.value.push({ role: 'ai', content: reply })
  } catch (err) {
    const errorMsg = 'AI 助手暂时无法响应，请稍后再试。'
    messages.value.push({ role: 'ai', content: errorMsg })
    ElMessage.error({ message: `AI 助手暂时无法响应：${errorMsg}\n💡 建议检查网络，5 秒后重试；或换用更具体的关键词（如"2026年8月巡检异常统计"）`, duration: 4200, showClose: true, grouping: true })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

onMounted(() => {
  const query = route.query.question || route.query.q
  if (query && typeof query === 'string') {
    input.value = query
    sendMessage()
  }
})
</script>

<style scoped>
.ai-chat-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: var(--surface-subtle);
}

.ai-chat-page-header {
  height: 60px;
  padding: 0 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border-soft);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-1);
}

.header-sub {
  font-size: 13px;
  color: var(--text-4);
  margin-left: 8px;
  padding-left: 12px;
  border-left: 1px solid var(--border);
}

.ai-chat-page-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.welcome-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.welcome-section h2 {
  margin: 0 0 8px;
  font-size: 24px;
  color: var(--text-1);
}

.welcome-desc {
  color: var(--text-4);
  margin: 0 0 32px;
  font-size: 14px;
}

.quick-questions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 520px;
}

.quick-btn {
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-1);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  text-align: left;
}

.quick-btn:hover {
  border-color: var(--brand-secondary);
  background: var(--el-color-primary-light-9);
  color: var(--brand-secondary);
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 100%;
}

.msg-user {
  justify-content: flex-end;
}

.msg-user .bubble {
  text-align: right;
}

.msg-ai {
  justify-content: flex-start;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  flex-shrink: 0;
}

.ai-avatar {
  background: var(--text-3);
}

.user-avatar {
  background: var(--brand-secondary);
}

.bubble {
  max-width: 60%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
  white-space: pre-wrap;
}

.ai-bubble {
  background: var(--surface);
  color: var(--text-1);
  border: 1px solid var(--border-soft);
  border-top-left-radius: 4px;
}

.user-bubble {
  background: var(--brand-secondary);
  color: var(--text-inverse);
  border-top-right-radius: 4px;
}

.thinking {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 16px 20px;
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

.ai-chat-page-footer {
  padding: 16px 24px 20px;
  background: var(--surface);
  border-top: 1px solid var(--border-soft);
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  max-width: 900px;
  margin: 0 auto;
}

.input-wrapper :deep(.el-textarea__inner) {
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
}

.send-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 20px;
  background: var(--brand-secondary);
  color: var(--text-inverse);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: var(--brand-primary);
}

.send-btn:disabled {
  background: var(--text-4);
  cursor: not-allowed;
}

.input-hint {
  text-align: center;
  color: var(--text-4);
  font-size: 12px;
  margin: 8px 0 0;
}

.ai-chat-page-body::-webkit-scrollbar {
  width: 6px;
}

.ai-chat-page-body::-webkit-scrollbar-thumb {
  background: var(--text-4);
  border-radius: 3px;
}

.ai-chat-page-body::-webkit-scrollbar-track {
  background: transparent;
}
</style>
