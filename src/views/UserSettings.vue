<!--
  用户管理页面（卡片式布局）
  
  功能：
  1. 卡片式展示用户列表
  2. 编辑用户信息（弹窗）
  3. 修改用户密码（弹窗）
  4. 启用/禁用账户
  5. 删除用户
  6. 角色分配
  
  数据来源：
  - GET    /api/user         用户列表
  - PUT    /api/user/{id}    更新用户
  - DELETE /api/user/{id}    删除用户
  - PUT    /api/user/{id}/password  修改密码
  - PUT    /api/user/{id}/status    更新状态
  - POST   /api/user/{id}/roles     分配角色
  - GET    /api/role/all            获取所有角色
-->

<template>
  <div class="user-settings">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>账户管理</h2>
      <el-button type="primary" @click="handleAddUser">
        <el-icon><Plus /></el-icon>新增用户
      </el-button>
    </div>

    <!-- 用户卡片列表 -->
    <div class="user-cards" v-loading="loading">
      <el-card 
        v-for="user in userList" 
        :key="user.id" 
        class="user-card"
        :class="{ 'user-card-disabled': user.status === '禁用' }"
        shadow="hover"
      >
        <!-- 卡片头部：头像和基本信息 -->
        <div class="card-header">
          <el-avatar :size="64" :style="{ backgroundColor: getAvatarColor(user.username) }">
            {{ user.realName ? user.realName.charAt(0) : user.username.charAt(0) }}
          </el-avatar>
          <div class="user-info">
            <div class="user-name">
              {{ user.realName || user.username }}
              <el-tag 
                v-if="user.status === '禁用'" 
                type="danger" 
                size="small"
                class="status-tag"
              >已禁用</el-tag>
            </div>
            <div class="user-username">@{{ user.username }}</div>
            <!-- 角色标签 -->
            <div class="user-roles">
              <el-tag 
                v-for="role in getUserRoles(user.roleIds)" 
                :key="role.id" 
                :type="getRoleTagType(role.roleCode)"
                size="small"
                class="role-tag"
              >
                {{ role.roleName }}
              </el-tag>
              <span v-if="getUserRoles(user.roleIds).length === 0" class="no-role">暂无角色</span>
            </div>
          </div>
        </div>

        <!-- 联系方式 -->
        <div class="card-body">
          <div class="info-row">
            <el-icon><Phone /></el-icon>
            <span>{{ user.phone || '未设置' }}</span>
          </div>
          <div class="info-row">
            <el-icon><Message /></el-icon>
            <span>{{ user.email || '未设置' }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="card-footer">
          <el-button size="small" @click="handleEdit(user)">
            <el-icon><Edit /></el-icon>编辑信息
          </el-button>
          <el-button size="small" @click="handleChangePassword(user)">
            <el-icon><Lock /></el-icon>修改密码
          </el-button>
          <el-button 
            size="small" 
            :type="user.status === '正常' ? 'warning' : 'success'"
            @click="handleToggleStatus(user)"
          >
            <el-icon v-if="user.status === '正常'"><SwitchButton /></el-icon>
            <el-icon v-else><Check /></el-icon>
            {{ user.status === '正常' ? '禁用' : '启用' }}
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(user)">
            <el-icon><Delete /></el-icon>删除
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!loading && userList.length === 0" description="暂无用户数据" />

    <!-- 编辑用户弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑用户" width="500px">
      <el-form :model="editForm" label-width="80px" ref="editFormRef">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="editForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="editForm.phone" placeholder="请输入电话号码" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.roleIds" multiple placeholder="请选择角色" style="width: 100%">
            <el-option 
              v-for="role in roleList" 
              :key="role.id" 
              :label="role.roleName" 
              :value="role.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="450px">
      <el-form :model="passwordForm" label-width="80px" ref="passwordFormRef">
        <el-form-item label="原密码" required>
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePassword">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 新增用户弹窗 -->
    <el-dialog v-model="addDialogVisible" title="新增用户" width="500px">
      <el-form :model="addForm" label-width="80px" ref="addFormRef">
        <el-form-item label="用户名" required>
          <el-input v-model="addForm.username" placeholder="请输入用户名（登录账号）" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="addForm.password" type="password" show-password placeholder="请输入初始密码" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="addForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="addForm.phone" placeholder="请输入电话号码" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="addForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="addForm.roleIds" multiple placeholder="请选择角色" style="width: 100%">
            <el-option 
              v-for="role in roleList" 
              :key="role.id" 
              :label="role.roleName" 
              :value="role.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAdd">确认新增</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 用户管理脚本逻辑
 * 
 * 功能：
 * 1. 加载用户列表和角色列表
 * 2. 编辑用户信息
 * 3. 修改用户密码
 * 4. 启用/禁用账户
 * 5. 删除用户
 * 6. 新增用户
 */

import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Lock, Delete, Phone, Message, SwitchButton, Check } from '@element-plus/icons-vue'
import request from '@/api/request'
import { confirmDestructive, FORM } from '@/utils/messages';

// ==================== 数据定义 ====================

// 加载状态
const loading = ref(false)

// 用户列表
const userList = ref([])

// 角色列表（用于显示角色名称）
const roleList = ref([])

// ==================== 弹窗控制 ====================

// 编辑弹窗
const editDialogVisible = ref(false)
const editForm = reactive({
  id: null,
  username: '',
  realName: '',
  phone: '',
  email: '',
  roleIds: []
})
const editFormRef = ref()

// 修改密码弹窗
const passwordDialogVisible = ref(false)
const passwordForm = reactive({
  id: null,
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordFormRef = ref()

// 新增用户弹窗
const addDialogVisible = ref(false)
const addForm = reactive({
  username: '',
  password: '',
  realName: '',
  phone: '',
  email: '',
  roleIds: []
})
const addFormRef = ref()

// ==================== 工具方法 ====================

/**
 * 根据用户名生成头像背景色
 */
function getAvatarColor(username) {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9B59B6', '#3498DB']
  const index = username.charCodeAt(0) % colors.length
  return colors[index]
}

/**
 * 根据角色ID列表获取角色信息
 */
function getUserRoles(roleIds) {
  if (!roleIds || roleIds.length === 0) return []
  return roleList.value.filter(role => roleIds.includes(role.id))
}

/**
 * 获取角色标签类型（用于显示不同颜色）
 */
function getRoleTagType(roleCode) {
  const typeMap = {
    'admin': 'danger',
    'user': '',
    'inspector': 'warning'
  }
  return typeMap[roleCode] || ''
}

// ==================== 数据加载 ====================

/**
 * 加载用户列表
 */
async function loadUsers() {
  loading.value = true
  try {
    const res = await request.get('/user', { params: { pageNum: 1, pageSize: 100 } })
    userList.value = res.data?.list || res.data || []
  } catch (e) {
    console.error('加载用户列表失败:', e)
    userList.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 加载角色列表
 */
async function loadRoles() {
  try {
    const res = await request.get('/role/all')
    roleList.value = res.data || res.data?.list || []
  } catch (e) {
    console.error('加载角色列表失败:', e)
    roleList.value = [
      { id: 1, roleName: '系统管理员', roleCode: 'admin' },
      { id: 2, roleName: '普通用户', roleCode: 'user' },
      { id: 3, roleName: '巡检人员', roleCode: 'inspector' }
    ]
  }
}

// ==================== 操作方法 ====================

/**
 * 编辑用户
 */
function handleEdit(user) {
  editForm.id = user.id
  editForm.username = user.username
  editForm.realName = user.realName || ''
  editForm.phone = user.phone || ''
  editForm.email = user.email || ''
  editForm.roleIds = user.roleIds ? [...user.roleIds] : []
  editDialogVisible.value = true
}

/**
 * 保存编辑
 */
async function saveEdit() {
  try {
    // 1. 更新用户信息
    await request.put(`/user/${editForm.id}`, {
      realName: editForm.realName,
      phone: editForm.phone,
      email: editForm.email
    })

    // 2. 更新角色分配
    await request.post(`/user/${editForm.id}/roles`, editForm.roleIds)

    ElMessage.success('用户信息更新成功')
    editDialogVisible.value = false
    loadUsers()
  } catch (e) {
    console.error('更新用户失败:', e)
    ElMessage.error(e.response?.data?.message || '更新失败')
  }
}

/**
 * 修改密码
 */
function handleChangePassword(user) {
  passwordForm.id = user.id
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordDialogVisible.value = true
}

/**
 * 保存密码修改
 */
async function savePassword() {
  // 简单校验
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    ElMessage.warning({ message: FORM.required('个人信息').fact + '（真实姓名、手机号、邮箱为必填校验字段）\n💡 请补充后再次保存', duration: 2600, showClose: true })
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning({ message: FORM.match('新密码', '确认密码').fact + '\n💡 ' + FORM.match('新密码', '确认密码').action, duration: 2600, showClose: true })
    return
  }
  if (passwordForm.newPassword.length < 6) {
    ElMessage.warning({ message: FORM.minLen('新密码', 6).fact + '\n💡 ' + FORM.minLen('新密码', 6).action, duration: 2600, showClose: true })
    return
  }

  try {
    await request.put(`/user/${passwordForm.id}/password`, {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
  } catch (e) {
    console.error('修改密码失败:', e)
    ElMessage.error(e.response?.data?.message || '修改失败')
  }
}

/**
 * 切换用户状态（启用/禁用）
 */
function handleToggleStatus(user) {
  const newStatus = user.status === '正常' ? '禁用' : '正常'
  const action = newStatus === '禁用' ? '禁用' : '启用'

  ElMessageBox.confirm(`确定要${action}用户 "${user.username}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.put(`/user/${user.id}/status`, { status: newStatus })
      ElMessage.success(`用户已${action}`)
      loadUsers()
    } catch (e) {
      console.error('更新状态失败:', e)
      ElMessage.error(e.response?.data?.message || '操作失败')
    }
  }).catch(() => {})
}

/**
 * 删除用户
 */
function handleDelete(user) {
  ElMessageBox.confirm(
    `确定要删除用户 "${user.username}" 吗？此操作不可恢复！`,
    '危险操作',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'error',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    try {
      await request.delete(`/user/${user.id}`)
      ElMessage.success('用户删除成功')
      loadUsers()
    } catch (e) {
      console.error('删除用户失败:', e)
      ElMessage.error(e.response?.data?.message || '删除失败')
    }
  }).catch(() => {})
}

/**
 * 新增用户
 */
function handleAddUser() {
  addForm.username = ''
  addForm.password = ''
  addForm.realName = ''
  addForm.phone = ''
  addForm.email = ''
  addForm.roleIds = []
  addDialogVisible.value = true
}

/**
 * 保存新增
 */
async function saveAdd() {
  if (!addForm.username || !addForm.password) {
    ElMessage.warning({ message: '创建用户失败：请填写必填项\n💡 「用户名」为登录账号，「密码」至少 6 位', duration: 3000, showClose: true })
    return
  }

  try {
    // 1. 创建用户
    const res = await request.post('/user', {
      username: addForm.username,
      password: addForm.password,
      realName: addForm.realName,
      phone: addForm.phone,
      email: addForm.email,
      status: '正常'
    })

    // 2. 分配角色
    if (addForm.roleIds && addForm.roleIds.length > 0 && res.data?.id) {
      await request.post(`/user/${res.data.id}/roles`, addForm.roleIds)
    }

    ElMessage.success('用户创建成功')
    addDialogVisible.value = false
    loadUsers()
  } catch (e) {
    console.error('创建用户失败:', e)
    ElMessage.error(e.response?.data?.message || '创建失败')
  }
}

// ==================== 初始化 ====================

onMounted(() => {
  loadRoles()
  loadUsers()
})
</script>

<style scoped>
.user-settings {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  color: #303133;
  font-weight: 600;
}

/* 用户卡片容器 */
.user-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

/* 用户卡片 */
.user-card {
  border-radius: 12px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease, background-color 0.3s ease;
  border: 1px solid #ebeef5;
}

.user-card:hover {
  border-color: #409EFF;
  transform: translateY(-2px);
}

.user-card-disabled {
  opacity: 0.7;
  background-color: #f5f7fa;
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-tag {
  font-size: 12px;
}

.user-username {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.user-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.role-tag {
  font-size: 12px;
}

.no-role {
  font-size: 12px;
  color: #c0c4cc;
}

/* 卡片主体 */
.card-body {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 14px;
  color: #606266;
}

.info-row .el-icon {
  color: #909399;
}

.info-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 卡片底部操作按钮 */
.card-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.card-footer .el-button {
  flex: 1;
  min-width: 80px;
}

.card-footer .el-button .el-icon {
  margin-right: 4px;
}

/* 对话框样式 */
:deep(.el-dialog__header) {
  padding-bottom: 20px;
}

:deep(.el-dialog__footer) {
  padding-top: 20px;
}
</style>
