<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 左侧欢迎区域 -->
      <div class="left-section">
        <div class="left-content">
          <h1>Welcome Back</h1>
          <p>电力设备台账管理系统</p>
          <p class="subtitle">请登录您的账号继续操作</p>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="right-section">
        <h2>登录系统</h2>
        <p class="form-desc">请输入您的账号信息</p>

        <el-form class="login-form" :model="form" @keyup.enter="handleLogin">
          <el-form-item>
            <el-input
                aria-label="用户名"
                v-model="form.username"
                placeholder="请输入用户名"
                size="large"
                :prefix-icon="User"
            />
          </el-form-item>

          <el-form-item>
            <el-input
                aria-label="密码"
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
            />
          </el-form-item>

          <el-form-item>
            <el-radio-group class="role-group" v-model="form.role" aria-label="选择登录身份">
              <el-radio value="admin" style="font-size: 14px;">管理员</el-radio>
              <el-radio value="inspector" style="font-size: 14px;">巡检人员</el-radio>
              <el-radio value="user" style="font-size: 14px;">普通用户</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item>
            <el-button
                native-type="button"
                aria-label="登录"
                class="login-btn"
                type="primary"
                size="large"
                :loading="loading"
                @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { saveLogin } from '@/stores/auth'
import { loginWrong } from '@/utils/messages'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  role: 'user'
})

/**
 * 本地账号表（后端不可用/返回业务错误时的 fallback）
 * 角色说明：1=admin, 2=user, 3=inspector
 */
const localUsers = {
  admin:     { password: 'admin123',     role: 'admin',     name: '管理员' },
  user:      { password: 'user123',      role: 'user',      name: '普通用户' },
  inspector: { password: 'inspector123', role: 'inspector', name: '巡检员' }
}

/**
 * 本地验证逻辑（账号 + 密码 + 角色，三者都匹配才通过）
 */
function doLocalLogin() {
  const userInfo = localUsers[form.username]
  if (!userInfo) {
    ElMessage.error(loginWrong(form.role))
    return false
  }
  if (userInfo.password !== form.password) {
    ElMessage.error(loginWrong(form.role))
    return false
  }
  if (userInfo.role !== form.role) {
    ElMessage.error(loginWrong(form.role))
    return false
  }
  // 全部匹配：写本地登录态
  saveLogin({ token: 'local-token-' + Date.now(), username: form.username, role: form.role })
  ElMessage.success({ message: '登录成功，正在进入系统…\n已为您保存离线登录状态', duration: 1800, grouping: true })
  router.push('/admin/home')
  return true
}

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning({ message: '请先填写账号和密码再登录\n💡 演示账号：管理员 admin/admin123、巡检员 inspector/inspector123、普通用户 user/user123', duration: 3800, showClose: true })
    return
  }

  loading.value = true
  try {
    // 1. 先尝试后端登录
    const res = await axios.post('/api/auth/login', {
      username: form.username,
      password: form.password
    })

    if (res.data.code === 200) {
      // 后端返回的真实角色（兼容两种结构）
      const serverRole = res.data.data?.role || res.data.data?.user?.role
      // 验证：用户选择的身份必须与后端角色一致
      if (serverRole && serverRole !== form.role) {
        ElMessage.error(loginWrong(form.role))
        return
      }
      saveLogin({
        token: res.data.data.token || ('local-token-' + Date.now()),
        username: form.username,
        role: form.role,
      })
      ElMessage.success('登录成功')
      router.push('/admin/home')
    } else {
      // 2. 后端返回业务错误（账号密码错、用户不存在等）→ fallback 到本地验证
      console.warn('[Login] 后端业务错误（', res.data.message || res.data.code, '），尝试本地验证')
      doLocalLogin()
    }
  } catch (error) {
    // 3. 后端不可用（网络错误/500/跨域）→ fallback 到本地验证
    console.warn('[Login] 后端请求异常（', error.message, '），尝试本地验证')
    doLocalLogin()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ---------- 登录页外层：使用 svh(small viewport height)避免移动端浏览器地址栏干扰 ---------- */
.login-page {
  min-height: 100vh;
  min-height: 100svh;
  background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  padding: clamp(16px, 5vw, 100px) clamp(16px, 5vw, 100px) !important;
  box-sizing: border-box !important;
  animation: login-page-fade 420ms var(--motion-ease) both;
}

/* ---------- 卡片容器：取消固定 900×500，改为最大宽度约束 + 自适应高度 ---------- */
.login-container {
  width: min(92vw, 1100px) !important;
  max-width: 1100px !important;
  min-height: 480px;
  height: auto !important;
  display: flex !important;
  flex-direction: row !important;
  border-radius: 15px !important;
  overflow: hidden !important;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3) !important;
  background: #fff;
}

/* ================= 左侧欢迎区 ================= */
.left-section {
  flex: 1 1 50% !important;
  min-width: 0;              /* 防 flex 子项撑破 */
  background: url('/login-bg.jpg') no-repeat center center;
  background-size: cover !important;
  position: relative;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  /* 左右分栏最小高度 → 防止文字贴顶 */
  min-height: 480px;
  animation: login-rise 420ms var(--motion-ease) both;
  animation-delay: 0ms;
}
.left-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(26, 35, 126, 0.62);
}

.left-content {
  position: relative;
  z-index: 1;
  color: #fff;
  text-align: center !important;
  padding: clamp(24px, 4vw, 40px) !important;
  width: 100%;
  max-width: 460px;
}
.left-content h1 {
  font-size: clamp(28px, 4vw, 42px) !important;
  margin-bottom: 12px !important;
  font-weight: 700 !important;
  line-height: 1.2;
  letter-spacing: 0.02em;
}
.left-content p {
  font-size: clamp(14px, 1.8vw, 18px) !important;
  margin: 6px 0 !important;
  line-height: 1.6;
}
.left-content .subtitle {
  opacity: 0.85;
  margin-top: 16px !important;
}

/* ================= 右侧表单区 ================= */
.right-section {
  flex: 1 1 50% !important;
  min-width: 0;
  background: #fff;
  padding: clamp(24px, 4vw, 50px) clamp(20px, 5vw, 60px) !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  animation: login-rise 420ms var(--motion-ease) both;
  animation-delay: var(--motion-stagger);
}
.right-section h2 {
  font-size: clamp(22px, 2.8vw, 28px) !important;
  color: #1a237e !important;
  margin-bottom: 8px !important;
  font-weight: 600 !important;
}
.form-desc {
  color: #6b7280;
  margin-bottom: 28px !important;
  font-size: 14px !important;
}

/* ================= 表单内：所有交互元素统一宽度 + 横向居中 ================= */
.login-form {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  width: 100% !important;
}
/* 统一宽度容器（避免每个 el-form-item 写宽度） */
.login-form :deep(.el-form-item) {
  width: 100% !important;
  max-width: 420px !important;
  margin-bottom: 20px !important;
}
.login-form :deep(.el-form-item:last-child) {
  margin-bottom: 0 !important;
}
/* el-input 填满父宽：桌面端≈420px，移动端 100% */
.login-form :deep(.el-input) {
  width: 100% !important;
}
.login-form :deep(.el-input__wrapper) {
  /* 保证触控最小高度 44px（Element Plus large = 40px → 补 4px 内边距） */
  padding: 4px 15px !important;
  min-height: 44px !important;
}

/* ================= 角色选择组：三栏均匀分布 ================= */
.role-group {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap;
  justify-content: space-between !important;
  align-items: center;
  width: 100% !important;
  max-width: 420px !important;
  gap: 8px 12px;
}
.role-group :deep(.el-radio) {
  flex: 1 1 0;
  min-width: 104px;
  justify-content: center !important;
  font-size: 14px !important;
  /* 让每个单选的热区高度≥44，横向均分 */
  min-height: 44px !important;
  line-height: 44px !important;
  padding: 0 8px !important;
}
.role-group :deep(.el-radio__input) {
  width: 16px !important;
  height: 16px !important;
}

/* ================= 登录按钮 ================= */
.login-btn {
  width: 100% !important;
  max-width: 420px !important;
  min-height: 48px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  letter-spacing: 0.05em;
}

/* =========================================================
 * BREAKPOINT 1 — 899px 及以下：左右→上下堆叠
 *   触发条件：<900px 宽，左右分栏过于拥挤
 *   策略：左侧欢迎区压缩为 200px 高的顶部横幅；右侧区保留表单
 * =======================================================*/
@media (max-width: 899px) {
  .login-container {
    flex-direction: column !important;
    max-width: 520px !important;
    width: min(96vw, 520px) !important;
    min-height: auto !important;
  }
  .left-section {
    flex: none !important;
    min-height: 200px !important;
    height: 200px !important;
    background-position: center 35%;     /* 聚焦背景图中上部分 */
  }
  .left-content {
    padding: 16px 24px !important;
    max-width: 100%;
  }
  .left-content h1 {
    font-size: clamp(22px, 6vw, 30px) !important;
    margin-bottom: 6px !important;
  }
  .left-content p {
    font-size: clamp(13px, 2.6vw, 15px) !important;
    margin: 4px 0 !important;
  }
  .left-content .subtitle {
    margin-top: 10px !important;
  }
  .right-section {
    padding: 28px clamp(20px, 5vw, 36px) 32px !important;
  }
  .role-group {
    max-width: 100% !important;
  }
}

/* =========================================================
 * BREAKPOINT 2 — 639px 及以下：移动端
 *   策略：角色选择改为纵向 3 行（三栏在手机上字会被挤）；
 *         输入全宽；按钮与输入块热区再大一圈
 * =======================================================*/
@media (max-width: 639px) {
  .login-page {
    padding: 12px 12px !important;
  }
  .login-container {
    width: 100% !important;
    border-radius: 12px !important;
  }
  .left-section {
    min-height: 168px !important;
    height: 168px !important;
  }
  .right-section {
    padding: 20px 18px 26px !important;
  }
  .right-section h2 {
    font-size: 22px !important;
  }
  .form-desc {
    margin-bottom: 20px !important;
    font-size: 13px !important;
  }
  .role-group {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
  }
  .role-group :deep(.el-radio) {
    flex: 1 1 auto !important;
    min-width: 0 !important;
    justify-content: flex-start !important;
    padding-left: 12px !important;
    min-height: 48px !important;
    line-height: 48px !important;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #f8fafc;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }
  .role-group :deep(.el-radio.is-checked) {
    border-color: #1a237e !important;
    background: #eef2ff !important;
    color: #1a237e !important;
  }
  .login-form :deep(.el-input__wrapper) {
    min-height: 48px !important;
  }
  .login-btn {
    min-height: 50px !important;
  }
  .left-section, .right-section { animation-delay: 0ms !important; }
}

/* =========================================================
 * POINTER:COARSE（触屏设备，含二合一笔记本/平板）：
 *   所有交互元素的可点击热区统一拉到 ≥48×48；
 *   角色选项加边框，避免手指按不准
 * =======================================================*/
@media (pointer: coarse) {
  .login-form :deep(.el-input__wrapper) {
    min-height: 48px !important;
  }
  .role-group :deep(.el-radio) {
    min-height: 48px !important;
    line-height: 48px !important;
    padding: 0 12px !important;
  }
  .login-btn {
    min-height: 50px !important;
  }
}

/* =========================================================
 * POINTER:FINE + HOVER（鼠标精细指针设备）：保留用户偏好
 *   按钮 hover 白→蓝背景（登录按钮本来是蓝底白字，hover 时加深一点做反馈）
 * =======================================================*/
@media (pointer: fine) and (hover: hover) {
  .login-btn:hover {
    filter: brightness(1.05);
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(26, 35, 126, 0.22);
  }
  .role-group :deep(.el-radio:hover) {
    color: #1a237e;
  }
}

/* =========================================================
 * VERY SMALL VIEWPORTS（<375 iPhone SE 1st）— 极限兼容
 *   防止最小宽度撑破，不出现水平滚动条
 * =======================================================*/
@media (max-width: 374px) {
  .right-section { padding: 16px 14px 22px !important; }
  .left-content h1 { font-size: 20px !important; }
  .left-section, .right-section { animation-delay: 0ms !important; }
}

/* ---------- 非阻塞入场：用户可立即键入焦点，动画 parallel 不 block input ---------- */
@keyframes login-page-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes login-rise {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>