<!--
  设备台账管理页面
  
  功能：
  1. 设备列表展示（表格 + 分页）
  2. 搜索筛选（按名称/类型/状态）
  3. 新增设备（弹窗表单）
  4. 编辑设备（复用新增弹窗）
  5. 删除设备（确认对话框）
  
  数据来源：GET /api/equipment?pageNum=1&pageSize=10
  对应后端：EquipmentController
-->

<template>
  <div class="equipment-page">
    <!-- 页面标题栏 + 新增按钮 -->
    <div class="page-header">
      <h2>设备台账</h2>
      <div class="actions">
        <el-button type="primary" size="large" style="width: 120px" @click="showAddDialog = true">新增设备</el-button>
        <el-button size="large" style="width: 120px" @click="handleExport">导出Excel</el-button>
        <el-button size="large" style="width: 120px" @click="showImportDialog = true">导入Excel</el-button>
      </div>
    </div>
    <!-- 搜索筛选栏 -->
    <div class="search-bar">
      <el-input v-model="searchName" placeholder="按设备名称搜索" clearable style="width: 240px" @clear="loadData" @keyup.enter="searchByName" />
      <el-select v-model="filterType" placeholder="按类型筛选" clearable style="width: 160px" @change="searchByType">
        <el-option label="变压器" value="变压器" />
        <el-option label="断路器" value="断路器" />
        <el-option label="隔离开关" value="隔离开关" />
        <el-option label="互感器" value="互感器" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="按状态筛选" clearable style="width: 160px" @change="searchByStatus">
        <el-option label="运行中" value="运行中" />
        <el-option label="停运" value="停运" />
        <el-option label="检修中" value="检修中" />
      </el-select>
      <el-button  size="large" style="width: 90px" @click="loadData">重置</el-button>
    </div>
    <el-table :data="equipmentList" border stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="equipmentCode" label="设备编号" width="140" />
      <el-table-column prop="equipmentName" label="设备名称" width="180" />
      <el-table-column prop="equipmentType" label="设备类型" width="120" />
      <el-table-column prop="equipmentModel" label="型号" width="140" />
      <el-table-column prop="manufacturer" label="生产厂家" width="160" />
      <el-table-column prop="location" label="安装位置" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button size="large" style="width: 90px" @click="handleEdit(row)">编辑</el-button>
          <el-button size="large" style="width: 90px" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="sizes, prev, pager, next" @size-change="loadData" @current-change="loadData" />
    </div>
    <el-dialog v-model="showAddDialog" :title="editingId ? '编辑设备' : '新增设备'" width="1200px" center append-to-body class="center-dialog">
      <el-form :model="form" label-width="100px">
        <el-form-item label="设备编号"><el-input v-model="form.equipmentCode" /></el-form-item>
        <el-form-item label="设备名称"><el-input v-model="form.equipmentName" /></el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="form.equipmentType">
            <el-option label="变压器" value="变压器" />
            <el-option label="断路器" value="断路器" />
            <el-option label="隔离开关" value="隔离开关" />
            <el-option label="互感器" value="互感器" />
          </el-select>
        </el-form-item>
        <el-form-item label="型号"><el-input v-model="form.equipmentModel" /></el-form-item>
        <el-form-item label="生产厂家"><el-input v-model="form.manufacturer" /></el-form-item>
        <el-form-item label="制造日期"><el-date-picker v-model="form.manufactureDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="安装日期"><el-date-picker v-model="form.installationDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="安装位置"><el-input v-model="form.location" /></el-form-item>
        <el-form-item label="电压等级"><el-input v-model="form.voltageLevel" /></el-form-item>
        <el-form-item label="容量"><el-input v-model="form.capacity" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="运行中" value="运行中" />
            <el-option label="停运" value="停运" />
            <el-option label="检修中" value="检修中" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="showImportDialog" title="导入设备" width="500px" center append-to-body>
      <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :limit="1"
          accept=".xlsx,.xls"
          :on-change="handleFileChange"
      >
        <el-button>选择文件</el-button>
        <template #tip>
          <div>请上传 .xlsx 格式文件</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :loading="importing">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
const userRole = localStorage.getItem('role') || 'user'
/**
 * 设备台账管理脚本逻辑
 * 
 * 状态变量：
 * - loading: 表格加载状态
 * - equipmentList: 设备列表数据
 * - total: 总记录数（分页用）
 * - pageNum/pageSize: 当前页码和每页条数
 * - searchName/filterType/filterStatus: 搜索筛选条件
 * - showAddDialog: 控制新增/编辑弹窗显示
 * - editingId: 当前编辑的设备 ID（null 表示新增模式）
 * - form: 表单数据
 */

import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEquipmentList, createEquipment, updateEquipment, deleteEquipment, searchEquipmentByName, searchEquipmentByType, searchEquipmentByStatus } from '@/api/equipment'
import { exportEquipmentExcel, importEquipment } from '@/api/equipment'

// 表格加载状态
const loading = ref(false)
// 设备列表数据
const equipmentList = ref([])
// 总记录数
const total = ref(0)
// 分页参数
const pageNum = ref(1)
const pageSize = ref(10)
// 搜索筛选条件
const searchName = ref('')
const filterType = ref('')
const filterStatus = ref('')
// 弹窗控制
const showAddDialog = ref(false)
// 编辑模式：记录当前编辑的设备 ID
const editingId = ref(null)
// 提交按钮加载状态
const submitting = ref(false)

// 表单数据对象
const form = ref({ equipmentCode: '', equipmentName: '', equipmentType: '', equipmentModel: '', manufacturer: '', manufactureDate: '', installationDate: '', location: '', status: '运行中', voltageLevel: '', capacity: '', remark: '' })
// 导入弹窗控制
const showImportDialog = ref(false)
const importing = ref(false)
const importFile = ref(null)


/**
 * 加载设备列表数据（分页）
 */
async function loadData() {
  loading.value = true
  try {
    const res = await getEquipmentList({ pageNum: pageNum.value, pageSize: pageSize.value })
    equipmentList.value = res.data.list || []
    total.value = res.data.total || 0
  } catch { equipmentList.value = [] } finally { loading.value = false }
}

/**
 * 按名称搜索设备
 */
async function searchByName() {
  if (!searchName.value) { loadData(); return }
  loading.value = true
  try {
    const res = await searchEquipmentByName(searchName.value)
    equipmentList.value = res.data || []
    total.value = equipmentList.value.length
  } catch { equipmentList.value = [] } finally { loading.value = false }
}

/**
 * 按类型筛选设备
 */
async function searchByType() {
  if (!filterType.value) { loadData(); return }
  loading.value = true
  try {
    const res = await searchEquipmentByType(filterType.value)
    equipmentList.value = res.data || []
    total.value = equipmentList.value.length
  } catch { equipmentList.value = [] } finally { loading.value = false }
}

/**
 * 按状态筛选设备
 */
async function searchByStatus() {
  if (!filterStatus.value) { loadData(); return }
  loading.value = true
  try {
    const res = await searchEquipmentByStatus(filterStatus.value)
    equipmentList.value = res.data || []
    total.value = equipmentList.value.length
  } catch { equipmentList.value = [] } finally { loading.value = false }
}

/**
 * 根据设备状态返回对应的 Tag 类型
 * @param {string} status - 设备状态
 * @returns {string} Element Plus Tag 类型
 */
function statusTagType(status) {
  const map = { '运行中': 'success', '停运': 'info', '检修中': 'warning' }
  return map[status] || 'info'
}

/**
 * 编辑设备：将设备数据填充到表单并打开弹窗
 * @param {Object} row - 设备数据行
 */
function handleEdit(row) { editingId.value = row.id; form.value = { ...row }; showAddDialog.value = true }

/**
 * 删除设备：弹出确认对话框后调用删除接口
 * @param {Object} row - 设备数据行
 */
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定删除设备「' + row.equipmentName + '」？', '提示', { type: 'warning' })
    await deleteEquipment(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {}
}

/**
 * 提交表单（新增或编辑）
 * 根据 editingId 判断是新增还是编辑模式
 */
async function handleSubmit() {
  submitting.value = true
  try {
    if (editingId.value) { await updateEquipment(editingId.value, form.value); ElMessage.success('更新成功') }
    else { await createEquipment(form.value); ElMessage.success('创建成功') }
    showAddDialog.value = false; editingId.value = null
    form.value = { equipmentCode: '', equipmentName: '', equipmentType: '', equipmentModel: '', manufacturer: '', manufactureDate: '', installationDate: '', location: '', status: '运行中', voltageLevel: '', capacity: '', remark: '' }
    loadData()
  } catch {} finally { submitting.value = false }
}

async function handleExport() {
  try {
    const res = await exportEquipmentExcel()
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '设备台账.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

function handleFileChange(file) {
  importFile.value = file.raw
}

async function handleImport() {
  if (!importFile.value) { ElMessage.warning('请先选择文件'); return }
  importing.value = true
  try {
    const res = await importEquipment(importFile.value)
    ElMessage.success(res.message || '导入成功')
    showImportDialog.value = false
    importFile.value = null
    loadData()
  } catch {
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

// 页面挂载时加载设备列表
onMounted(loadData)
</script>

<style scoped>
.equipment-page { padding: 20px 0 0 0 !important; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header .actions { display: flex; gap: 8px; }
.page-header h2 { margin: 0; font-size: 20px; color: #303133; }
.search-bar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }

/* 表格内容居中 */
:deep(.el-table__cell) {
  text-align: center;
}

/* 分页大小选择器文字居中 */
:deep(.el-pagination__sizes .el-input__inner) {
  text-align: center;
}
</style>

<style>
/* 强制对话框居中 */
.center-dialog {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
}

/* 对话框内表单控件放大 */
.center-dialog .el-form {
  font-size: 16px;
}
.center-dialog .el-input__wrapper {
  min-height: 48px;
  padding: 4px 15px;
}
.center-dialog .el-input__inner {
  font-size: 16px;
  height: 40px;
  line-height: 40px;
}
.center-dialog .el-select .el-input__wrapper {
  min-height: 48px;
}
.center-dialog .el-date-editor .el-input__wrapper {
  min-height: 48px;
}
.center-dialog .el-textarea__inner {
  font-size: 16px;
  padding: 10px 15px;
  min-height: 100px;
}
.center-dialog .el-form-item__label {
  font-size: 16px;
  font-weight: 500;
}
.center-dialog .el-dialog__header {
  padding: 24px 30px;
  font-size: 20px;
}
.center-dialog .el-dialog__body {
  padding: 30px;
}
.center-dialog .el-dialog__footer {
  padding: 20px 30px;
  display: flex;
  gap: 100px;
  justify-content: center;
}
.center-dialog .el-button {
  padding: 30px 40px !important;
  font-size: 18px;
  min-height: 50px;
}
.center-dialog .el-button--default {
  padding: 18px 40px;
  min-height: 50px;
}
</style>
