<!--
  角色管理页面
  
  功能：
  1. 角色列表展示（表格）
  2. 编辑角色（待完善）
  3. 删除角色（待完善）
  
  数据来源：GET /api/role?pageNum=1&pageSize=50
  路由：/admin/settings/role
-->

<template>
  <div class="settings-page">
    <h2>角色管理</h2>
    <!-- 角色列表表格 -->
    <el-table :data="roleList" border stripe style="width: 100%; margin-top: 16px" v-loading="loading">
      <el-table-column prop="roleName" label="角色名称" width="160" />
      <el-table-column prop="roleCode" label="角色编码" width="160" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
/**
 * 角色管理脚本逻辑
 * 
 * 功能：
 * 1. 加载角色列表
 * 2. 编辑/删除功能（待完善）
 */

import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

// 表格加载状态
const loading = ref(false)
// 角色列表数据
const roleList = ref([])

/**
 * 加载角色列表
 */
async function loadRoles() {
  loading.value = true
  try {
    const res = await request.get('/role', { params: { pageNum: 1, pageSize: 50 } })
    roleList.value = res.data.list || []
  } catch { roleList.value = [] } finally { loading.value = false }
}

/**
 * 编辑角色（待完善）
 */
function handleEdit(row) { ElMessage.info({ message: `当前版本暂不支持编辑角色「${row.name}」\n💡 如需调整权限，可先删除后重新创建角色，或联系管理员处理`, duration: 3200, showClose: true }); }

/**
 * 删除角色（待完善）
 */
function handleDelete(row) { ElMessage.info({ message: `当前版本暂不支持删除角色「${row.name}」\n💡 如该角色已绑定用户，请先转移或删除对应用户后再操作`, duration: 3200, showClose: true }); }

// 页面挂载时加载角色列表
onMounted(loadRoles)
</script>

<style scoped>
.settings-page { padding: 20px; }
.settings-page h2 { margin: 0; font-size: 20px; color: #303133; }
</style>
