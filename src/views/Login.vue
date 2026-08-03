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

        <el-form :model="form" @keyup.enter="handleLogin" style="display: flex; flex-direction: column; align-items: center;">
          <el-form-item>
            <el-input
                v-model="form.username"
                placeholder="请输入用户名"
                size="large"
                :prefix-icon="User"
                style="width: 350px;"
            />
          </el-form-item>

          <el-form-item>
            <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                style="width: 350px;"
                :prefix-icon="Lock"
                show-password
            />
          </el-form-item>

          <el-form-item>
            <el-radio-group v-model="form.role" style="width: 500px; display: flex; justify-content: space-around;">
              <el-radio value="admin" style="font-size: 14px;">管理员</el-radio>
              <el-radio value="inspector" style="font-size: 14px;">巡检人员</el-radio>
              <el-radio value="user" style="font-size: 14px;">普通用户</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item>
            <el-button
                type="primary"
                size="large"
                style="width: 350px;"
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

const router = useRouter()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  role: 'user'
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    const res = await axios.post('/api/auth/login', {
      username: form.username,
      password: form.password
    })

    if (res.data.code === 200) {
      // 后端返回的真实角色
      const serverRole = res.data.data.role || res.data.data.user?.role
      // 验证：用户选择的身份必须与后端角色一致
      if (serverRole && serverRole !== form.role) {
        ElMessage.error('请输入正确的用户和密码以及身份')
        return
      }
      localStorage.setItem('token', res.data.data.token)
      localStorage.setItem('username', form.username)
      localStorage.setItem('role', form.role)
      ElMessage.success('登录成功')
      router.push('/admin')
    } else {
      ElMessage.error(res.data.message || '登录失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请检查后端是否启动')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100px;

}

.login-container {
  width: 900px;
  height: 500px;
  display: flex;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
}

/* 左侧区域 */
.left-section {
  flex: 1;
  background: url('/login-bg.jpg') no-repeat center center;
  background-size: cover;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.left-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 35, 126, 0.6);
}

.left-content {
  position: relative;
  z-index: 1;
  color: white;
  text-align: center;
  padding: 40px;
}

.left-content h1 {
  font-size: 42px;
  margin-bottom: 10px;
  font-weight: bold;
}

.left-content p {
  font-size: 16px;
  margin: 5px 0;
}

.left-content .subtitle {
  opacity: 0.8;
  margin-top: 15px;
}

/* 右侧区域 */
.right-section {
  flex: 1;
  background: white;
  padding: 50px 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.right-section h2 {
  font-size: 28px;
  color: #1a237e;
  margin-bottom: 10px;
}

.form-desc {
  color: #666;
  margin-bottom: 30px;
}
</style>
