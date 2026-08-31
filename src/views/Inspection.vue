<!--
  巡检记录列表页面
  
  功能：
  1. 巡检记录列表展示（表格 + 分页）
  2. 新建巡检（跳转到新建页面）
  3. 编辑/删除巡检记录
  4. 查看巡检详情（含检查项清单和图片附件预览）

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
      <el-table-column label="操作" width="320" fixed="right">
        <template #default="{ row }">
          <div class="action-btns">
            <el-button class="action-btn" @click="handleViewDetail(row)">详情</el-button>
            <el-button class="action-btn" @click="handleEdit(row)">编辑</el-button>
            <el-button class="action-btn" type="danger" @click="handleDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <!-- 巡检详情对话框 -->
    <el-dialog v-model="detailVisible" title="巡检记录详情" width="900px" append-to-body center class="detail-dialog">
      <div v-if="detailData" class="detail-content">
        <!-- 基本信息卡片 -->
        <div class="detail-section">
          <div class="detail-section-title">
            <span class="icon">📋</span>
            <span>基本信息</span>
          </div>
          <div class="detail-info-grid">
            <div class="detail-info-item">
              <span class="detail-label">设备名称</span>
              <span class="detail-value">{{ detailData.equipmentName || '-' }}</span>
            </div>
            <div class="detail-info-item">
              <span class="detail-label">巡检结果</span>
              <span class="detail-value">
                <el-tag :type="detailData.inspectionResult === '正常' ? 'success' : 'danger'">
                  {{ detailData.inspectionResult || '-' }}
                </el-tag>
              </span>
            </div>
            <div class="detail-info-item">
              <span class="detail-label">巡检计划</span>
              <span class="detail-value">{{ detailData.inspectionPlanName || '-' }}</span>
            </div>
            <div class="detail-info-item">
              <span class="detail-label">巡检方式</span>
              <span class="detail-value">{{ detailData.inspectionMethod || '-' }}</span>
            </div>
            <div class="detail-info-item">
              <span class="detail-label">巡检员</span>
              <span class="detail-value">{{ detailData.inspectorName || '-' }}</span>
            </div>
            <div class="detail-info-item">
              <span class="detail-label">巡检时间</span>
              <span class="detail-value">{{ detailData.inspectionDate || detailData.inspectionTime || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 检查项清单 -->
        <div class="detail-section" v-if="parsedCheckItems.length > 0">
          <div class="detail-section-title">
            <span class="icon">✅</span>
            <span>检查项清单</span>
            <span class="detail-count">共 {{ parsedCheckItems.length }} 项</span>
          </div>
          <div class="detail-check-items">
            <div
                v-for="(item, index) in parsedCheckItems"
                :key="index"
                class="detail-check-item"
                :class="{ checked: item.checked }"
            >
              <div class="detail-checkbox" :class="{ checked: item.checked }">
                <span v-if="item.checked">✓</span>
              </div>
              <div class="detail-check-text">{{ item.name }}</div>
              <div class="detail-check-status" :class="item.status">
                {{ item.checked ? item.status : '待检' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 问题描述 -->
        <div class="detail-section">
          <div class="detail-section-title">
            <span class="icon">📝</span>
            <span>问题描述</span>
          </div>
          <div class="detail-text-content">
            {{ detailData.problemDesc || '无问题描述' }}
          </div>
        </div>

        <!-- 处理措施 / 备注 -->
        <div class="detail-section">
          <div class="detail-section-title">
            <span class="icon">💬</span>
            <span>处理措施 / 备注</span>
          </div>
          <div class="detail-text-content">
            {{ detailData.remark || '无备注信息' }}
          </div>
        </div>

        <!-- 附件图片 -->
        <div class="detail-section" v-if="parsedAttachments.length > 0">
          <div class="detail-section-title">
            <span class="icon">📎</span>
            <span>附件图片</span>
            <span class="detail-count">共 {{ parsedAttachments.length }} 个文件</span>
          </div>
          <div class="detail-images">
            <div
                v-for="(file, index) in parsedAttachments"
                :key="index"
                class="detail-image-item"
            >
              <el-image
                  v-if="isImage(file.name)"
                  :src="file.url"
                  :preview-src-list="imageUrls"
                  :initial-index="index"
                  fit="cover"
                  class="detail-image"
                  preview-teleported
              >
                <template #error>
                  <div class="detail-image-error">
                    <span>📷</span>
                    <span>图片加载失败</span>
                  </div>
                </template>
              </el-image>
              <div v-else class="detail-file-item">
                <span class="detail-file-icon">📄</span>
                <span class="detail-file-name">{{ file.name }}</span>
              </div>
              <div class="detail-image-name">{{ file.name }}</div>
            </div>
          </div>
        </div>

        <!-- 无附件提示 -->
        <div class="detail-section" v-else>
          <div class="detail-section-title">
            <span class="icon">📎</span>
            <span>附件图片</span>
          </div>
          <div class="detail-empty">暂无附件</div>
        </div>
      </div>
    </el-dialog>
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
 * 4. 查看巡检详情（含检查项清单和图片附件预览）
 */

import { ref, computed, onMounted } from 'vue'
import { getRole } from '@/stores/auth'
import { useRoute } from 'vue-router'

const route = useRoute()
const userRole = getRole()
import { ElMessage, ElMessageBox } from 'element-plus'
import { getInspectionList, getInspectionById, updateInspection, deleteInspection } from '@/api/inspection'
import { toastPermission, confirmDestructive } from '@/utils/messages';

// 表格加载状态
const loading = ref(false)
// 巡检记录列表数据
const inspectionList = ref([])
// 总记录数
const total = ref(0)
// 分页参数
const pageNum = ref(1)
const pageSize = ref(10)

// 详情对话框
const detailVisible = ref(false)
const detailData = ref(null)

/**
 * 解析检查项清单（JSON 字符串 → 数组）
 */
const parsedCheckItems = computed(() => {
  if (!detailData.value) return []
  const raw = detailData.value.checkItems
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw) {
    try {
      const arr = JSON.parse(raw)
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }
  return []
})

/**
 * 解析附件列表（JSON 字符串 → 数组）
 */
const parsedAttachments = computed(() => {
  if (!detailData.value) return []
  const raw = detailData.value.attachments
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw) {
    try {
      const arr = JSON.parse(raw)
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }
  return []
})

/**
 * 获取所有图片 URL（用于 el-image 预览）
 */
const imageUrls = computed(() => {
  return parsedAttachments.value
      .filter(f => isImage(f.name))
      .map(f => f.url)
      .filter(Boolean)
})

/**
 * 判断文件是否为图片
 */
function isImage(name) {
  if (!name) return false
  const ext = name.toLowerCase().split('.').pop()
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)
}

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
 * 查看巡检记录详情
 */
async function handleViewDetail(row) {
  try {
    const res = await getInspectionById(row.id)
    detailData.value = res.data || res.data?.data || row
    detailVisible.value = true
  } catch {
    detailData.value = row
    detailVisible.value = true
  }
}

/**
 * 编辑巡检记录（待完善）
 */
function handleEdit(row) {
  if (userRole !== 'admin') {
    toastPermission(userRole, '编辑已提交的巡检记录')
    return
  }
  ElMessage.info({ message: '当前版本暂不支持巡检记录编辑\n💡 如需修改，可删除后重新提交', duration: 2800, showClose: true })
}

/**
 * 删除巡检记录
 */
async function handleDelete(row) {
  if (userRole !== 'admin') {
    toastPermission(userRole, '删除巡检记录')
    return
  }
  try {
    await confirmDestructive({
      title: '删除巡检记录',
      body: '此操作将永久删除该巡检记录（含现场照片、检查项数据、巡检人信息），删除后无法恢复。确定要删除吗？',
      confirmText: '永久删除该记录',
      cancelText: '保留记录',
    })
    await deleteInspection(row.id)
    ElMessage.success({ message: '✓ 已删除该巡检记录', duration: 1600, grouping: true })
    loadData()
  } catch (e) { /* 取消 */ }
}

// 页面挂载时加载数据
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.inspection-page { padding: 0 !important; }
.page-header { display: flex !important; justify-content: space-between !important; align-items: center !important; margin-bottom: 16px !important; }
.page-header h2 { margin: 0 !important; font-size: 20px !important; color: #303133 !important; }
.pagination { margin-top: 16px !important; display: flex !important; justify-content: flex-end !important; }

:deep(.el-pagination__sizes .el-input__inner) {
  text-align: center !important;
}
</style>

<style>
.action-btns {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  width: 100% !important;
  gap: 8px !important;
}

.el-table .cell .action-btn {
  padding: 9px 18px !important;
  font-size: 15px !important;
  min-height: 38px !important;
  font-weight: 500 !important;
  line-height: 1 !important;
}

.el-table .cell .action-btn:hover {
  padding: 9px 18px !important;
  font-size: 15px !important;
  min-height: 38px !important;
}

.el-table .cell .action-btn + .action-btn {
  margin-left: 0 !important;
}

/* 详情对话框居中 */
.detail-dialog {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
}

.detail-dialog .el-dialog__title {
  font-size: 20px !important;
  font-weight: 600 !important;
}

.detail-dialog .el-dialog__body {
  padding: 20px 30px 30px !important;
  max-height: 70vh !important;
  overflow-y: auto !important;
}

/* 详情内容容器 */
.detail-content {
  display: flex !important;
  flex-direction: column !important;
  gap: 24px !important;
}

/* 详情分区 */
.detail-section {
  background: #fafbfc !important;
  border-radius: 10px !important;
  padding: 20px !important;
}

.detail-section-title {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #303133 !important;
  margin-bottom: 16px !important;
}

.detail-section-title .icon {
  font-size: 18px !important;
}

.detail-count {
  font-size: 13px !important;
  color: #909399 !important;
  font-weight: normal !important;
  margin-left: auto !important;
}

/* 基本信息网格 */
.detail-info-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 16px 24px !important;
}

.detail-info-item {
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
  padding: 12px 16px !important;
  background: #fff !important;
  border-radius: 8px !important;
  box-shadow: inset 1px 0 0 var(--accent, #409eff); padding-left: 15px !important;
}

.detail-label {
  font-size: 13px !important;
  color: #909399 !important;
}

.detail-value {
  font-size: 15px !important;
  color: #303133 !important;
  font-weight: 500 !important;
}

/* 检查项清单 */
.detail-check-items {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 12px 16px !important;
}

.detail-check-item {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  padding: 12px 16px !important;
  background: #fff !important;
  border-radius: 8px !important;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease !important;
}

.detail-check-item.checked {
  background: #f0f9eb !important;
}

.detail-checkbox {
  width: 20px !important;
  height: 20px !important;
  border: 2px solid #dcdfe6 !important;
  border-radius: 4px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 12px !important;
  color: #fff !important;
  flex-shrink: 0 !important;
}

.detail-checkbox.checked {
  background: #67c23a !important;
  border-color: #67c23a !important;
}

.detail-check-text {
  flex: 1 !important;
  font-size: 14px !important;
  color: #606266 !important;
}

.detail-check-status {
  font-size: 12px !important;
  padding: 2px 8px !important;
  border-radius: 4px !important;
  background: #f0f2f5 !important;
  color: #909399 !important;
}

.detail-check-status.正常 {
  background: #f0f9eb !important;
  color: #67c23a !important;
}

.detail-check-status.异常 {
  background: #fef0f0 !important;
  color: #f56c6c !important;
}

.detail-check-status.待检 {
  background: #fdf6ec !important;
  color: #e6a23c !important;
}

/* 文本内容 */
.detail-text-content {
  font-size: 14px !important;
  color: #606266 !important;
  line-height: 1.8 !important;
  padding: 16px !important;
  background: #fff !important;
  border-radius: 8px !important;
  white-space: pre-wrap !important;
  word-break: break-all !important;
}

/* 附件图片区 */
.detail-images {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 16px !important;
}

.detail-image-item {
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
}

.detail-image {
  width: 100% !important;
  height: 160px !important;
  border-radius: 8px !important;
  border: 1px solid #ebeef5 !important;
  cursor: pointer !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease !important;
}

.detail-image:hover {
  border-color: #409eff !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2) !important;
}

.detail-image-error {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  color: #909399 !important;
  font-size: 13px !important;
}

.detail-image-error span:first-child {
  font-size: 32px !important;
}

.detail-image-name {
  font-size: 12px !important;
  color: #909399 !important;
  text-align: center !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

/* 非图片文件 */
.detail-file-item {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  padding: 24px !important;
  background: #fff !important;
  border-radius: 8px !important;
  border: 1px solid #ebeef5 !important;
}

.detail-file-icon {
  font-size: 36px !important;
}

.detail-file-name {
  font-size: 13px !important;
  color: #606266 !important;
  text-align: center !important;
  word-break: break-all !important;
}

/* 空状态 */
.detail-empty {
  text-align: center !important;
  padding: 24px !important;
  color: #909399 !important;
  font-size: 14px !important;
  background: #fff !important;
  border-radius: 8px !important;
}
</style>
