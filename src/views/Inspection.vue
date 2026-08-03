<!--
  巡检记录列表页面
  
  功能：
  1. 巡检记录列表展示（表格 + 分页）
  2. 新建巡检（跳转到新建页面）
  3. 编辑/删除巡检记录
  
  数据来源：GET /api/inspection?pageNum=1&pageSize=10
  对应后端：InspectionController
-->

<template>
  <div class="inspection-page">
    <!-- 页面标题栏 + 新建巡检按钮 -->
    <div class="page-header">
      <h2>巡检记录</h2>
      <el-button type="primary" @click="$router.push('/admin/inspection/create')">新建巡检</el-button>
    </div>
    <!-- 巡检记录表格 -->
    <el-table :data="inspectionList" border stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="equipmentName" label="设备名称" width="180" />
      <el-table-column prop="inspectionResult" label="巡检结果" width="120">
        <template #default="{ row }">
          <el-tag :type="row.inspectionResult === '正常' ? 'success' : 'danger'">{{ row.inspectionResult }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="problemDesc" label="问题描述" />
      <el-table-column prop="inspectorName" label="巡检员" width="120" />
      <el-table-column prop="inspectionTime" label="巡检时间" width="180" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="sizes, prev, pager, next" @size-change="loadData" @current-change="loadData" />
    </div>
  </div>
</template>

<script setup>
/**
 * 巡检记录列表脚本逻辑
 * 
 * 功能：
 * 1. 加载巡检记录列表（分页）
 * 2. 编辑功能（待完善）
 * 3. 删除巡检记录
 */

import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getInspectionList, updateInspection, deleteInspection } from '@/api/inspection'

// 表格加载状态
const loading = ref(false)
// 巡检记录列表数据
const inspectionList = ref([])
// 总记录数
const total = ref(0)
// 分页参数
const pageNum = ref(1)
const pageSize = ref(10)

/**
 * 加载巡检记录列表
 */
async function loadData() {
  loading.value = true
  try {
    const res = await getInspectionList({ pageNum: pageNum.value, pageSize: pageSize.value })
    inspectionList.value = res.data.list || []
    total.value = res.data.total || 0
  } catch { inspectionList.value = [] } finally { loading.value = false }
}

/**
 * 编辑巡检记录（待完善）
 */
function handleEdit(row) { ElMessage.info('编辑功能待完善') }

/**
 * 删除巡检记录
 */
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定删除该巡检记录？', '提示', { type: 'warning' })
    await deleteInspection(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {}
}

// 页面挂载时加载数据
onMounted(loadData)
</script>

<style scoped>
.inspection-page { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 20px; color: #303133; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }

/* 分页大小选择器文字居中 */
:deep(.el-pagination__sizes .el-input__inner) {
  text-align: center;
}
</style>
