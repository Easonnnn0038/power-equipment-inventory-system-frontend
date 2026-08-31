<!--
  新建巡检记录页面（完整版）
  
  功能：
  1. 步骤指示器（4步）：选择设备 → 填写结果 → 上传附件 → 提交确认
  2. 巡检基本信息：设备、计划、日期、巡检人、巡检方式
  3. 设备信息卡片：显示设备编号、运行状态
  4. 巡检结果：正常/异常卡片式选择
  5. 检查项清单：固定6项，支持勾选和状态标记
  6. 问题描述和处理措施
  7. 附件上传：支持照片和文档
  8. 右侧边栏：巡检提示、最近巡检记录、月度统计
  
  数据来源：
  - 设备列表：GET /api/equipment/all
  - 巡检计划：GET /api/inspection/plans
  - 巡检人员：GET /api/inspection/inspectors
  - 检查项：GET /api/inspection/check-items
  - 最近记录：GET /api/inspection/recent
  - 统计数据：GET /api/inspection/stats
  - 提交巡检：POST /api/inspection
  - 上传附件：POST /api/inspection/attachments
-->

<template>
  <div class="inspection-create-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="breadcrumb">
        <span>首页</span>
        <span class="separator">›</span>
        <span>巡检管理</span>
        <span class="separator">›</span>
        <span class="current">新建巡检记录</span>
      </div>
      <div class="page-title-row">
        <div>
          <h1>新建巡检记录</h1>
          <p class="subtitle">按步骤填写设备巡检信息，支持附件上传与异常标注。</p>
        </div>
        <div class="header-actions">
          <el-tag type="info" effect="plain" size="large">在线录入</el-tag>
          <span class="hint-text">编号将自动生成</span>
        </div>
      </div>
    </div>

    <!-- 步骤指示器 -->
    <div class="steps-container">
      <div class="step-item" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
        <div class="step-icon">
          <span v-if="currentStep > 1 || form.equipmentId">✓</span>
          <span v-else>1</span>
        </div>
        <div class="step-info">
          <div class="step-title">选择设备</div>
          <div class="step-desc">绑定巡检对象</div>
        </div>
      </div>
      <div class="step-line" :class="{ completed: currentStep > 1 }"></div>
      <div class="step-item" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
        <div class="step-icon">
          <span v-if="currentStep > 2 || form.inspectionResult">✓</span>
          <span v-else>2</span>
        </div>
        <div class="step-info">
          <div class="step-title">填写结果</div>
          <div class="step-desc">检查项与状态</div>
        </div>
      </div>
      <div class="step-line" :class="{ completed: currentStep > 2 }"></div>
      <div class="step-item" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
        <div class="step-icon">
          <span v-if="currentStep > 3 || uploadedFiles.length > 0">✓</span>
          <span v-else>3</span>
        </div>
        <div class="step-info">
          <div class="step-title">上传附件</div>
          <div class="step-desc">照片与文档</div>
        </div>
      </div>
      <div class="step-line" :class="{ completed: currentStep > 3 }"></div>
      <div class="step-item" :class="{ active: currentStep >= 4 }">
        <div class="step-icon">
          <span v-if="currentStep > 4">✓</span>
          <span v-else>4</span>
        </div>
        <div class="step-info">
          <div class="step-title">提交确认</div>
          <div class="step-desc">完成归档</div>
        </div>
      </div>
    </div>

    <!-- 主内容区：左侧表单 + 右侧边栏 -->
    <div class="main-content">
      <!-- 左侧表单区 -->
      <div class="form-area">
        <!-- 选择设备 + 巡检基本信息 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="icon">📋</span>
              <span>选择设备</span>
              <span class="required">*</span>
            </div>
            <div class="card-title">
              <span class="icon">🔧</span>
              <span>巡检基本信息</span>
              <span class="required">* 必填</span>
            </div>
          </div>
          <div class="card-body">
            <div class="form-grid">
              <div class="form-item">
                <label>巡检设备 <span class="required">*</span></label>
                <el-select v-model="form.equipmentId" placeholder="请选择巡检设备" style="width: 100%" @change="onEquipmentChange">
                  <el-option v-for="eq in equipmentList" :key="eq.id" :label="eq.equipmentName + ' - ' + eq.equipmentCode" :value="eq.id" />
                </el-select>
              </div>
              <div class="form-item">
                <label>巡检计划 <span class="required">*</span></label>
                <el-select v-model="form.inspectionPlanId" placeholder="请选择巡检计划" style="width: 100%">
                  <el-option v-for="plan in planList" :key="plan.id" :label="plan.name" :value="plan.id" />
                </el-select>
              </div>
              <div class="form-item">
                <label>巡检日期 <span class="required">*</span></label>
                <el-date-picker
                  v-model="form.inspectionDate"
                  type="datetime"
                  placeholder="选择巡检日期"
                  style="width: 100%"
                  value-format="YYYY-MM-DD HH:mm:ss"
                />
              </div>
            </div>

            <!-- 设备信息卡片 -->
            <div class="equipment-info-card" v-if="selectedEquipment">
              <div class="eq-icon">⚙️</div>
              <div class="eq-details">
                <div class="eq-row">
                  <span class="eq-label">设备编号</span>
                  <span class="eq-value">{{ selectedEquipment.equipmentCode }}</span>
                </div>
                <div class="eq-row">
                  <span class="eq-label">运行状态</span>
                  <span class="eq-value status-normal">
                    <span class="status-dot"></span>
                    {{ selectedEquipment.status || '正常运行' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="form-grid second-row">
              <div class="form-item">
                <label>巡检人 <span class="required">*</span></label>
                <el-select v-model="form.inspectorId" placeholder="请选择巡检人" style="width: 100%">
                  <el-option v-for="ins in inspectorList" :key="ins.id" :label="ins.name" :value="ins.id" />
                </el-select>
              </div>
              <div class="form-item radio-group">
                <label>巡检方式</label>
                <el-radio-group v-model="form.inspectionMethod">
                  <el-radio value="现场巡检">
                    <span class="radio-label">🏃 现场巡检</span>
                  </el-radio>
                  <el-radio value="远程巡检">
                    <span class="radio-label">💻 远程巡检</span>
                  </el-radio>
                </el-radio-group>
              </div>
            </div>
          </div>
        </div>

        <!-- 巡检结果 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="icon">📊</span>
              <span>巡检结果</span>
            </div>
          </div>
          <div class="card-body">
            <div class="result-label">
              <span>总体结论</span>
              <span class="required">*</span>
            </div>
            <div class="result-cards">
              <div class="result-card" :class="{ selected: form.inspectionResult === '正常', normal: true }" @click="selectResult('正常')">
                <div class="result-radio">
                  <span v-if="form.inspectionResult === '正常'" class="checked">●</span>
                  <span v-else class="unchecked">○</span>
                </div>
                <div class="result-icon">✅</div>
                <div class="result-content">
                  <div class="result-title">正常</div>
                  <div class="result-desc">设备运行无异常</div>
                </div>
              </div>
              <div class="result-card" :class="{ selected: form.inspectionResult === '异常', abnormal: true }" @click="selectResult('异常')">
                <div class="result-radio">
                  <span v-if="form.inspectionResult === '异常'" class="checked abnormal">●</span>
                  <span v-else class="unchecked">○</span>
                </div>
                <div class="result-icon">⚠️</div>
                <div class="result-content">
                  <div class="result-title">异常</div>
                  <div class="result-desc">发现异常需处理</div>
                </div>
              </div>
            </div>

            <!-- 检查项清单 -->
            <div class="check-items-section">
              <div class="check-items-header">
                <span class="check-items-title">检查项清单</span>
                <span class="check-items-count">
                  共 {{ checkItems.length }} 项，已完成 {{ completedCount }} 项
                </span>
              </div>
              <div class="check-items-grid">
                <div
                  v-for="(item, index) in checkItems"
                  :key="index"
                  class="check-item"
                  :class="{ checked: item.checked, pending: item.checked && item.status === '待检' }"
                  @click="toggleCheckItem(index)"
                >
                  <div class="checkbox" :class="{ checked: item.checked }">
                    <span v-if="item.checked">✓</span>
                  </div>
                  <div class="check-item-text">{{ item.name }}</div>
                  <div class="check-item-status" :class="item.status">
                    {{ item.checked ? item.status : '待检' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 问题描述 + 处理措施 -->
            <div class="desc-grid">
              <div class="form-item">
                <label>问题描述</label>
                <el-input
                  v-model="form.problemDesc"
                  type="textarea"
                  :rows="4"
                  placeholder="请描述巡检过程中发现的问题或异常情况..."
                />
              </div>
              <div class="form-item">
                <label>处理措施 / 备注</label>
                <el-input
                  v-model="form.remark"
                  type="textarea"
                  :rows="4"
                  placeholder="记录已采取的处理措施或其他备注信息..."
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 上传附件 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="icon">📎</span>
              <span>上传附件</span>
              <span class="optional">可选</span>
            </div>
          </div>
          <div class="card-body">
            <el-upload
              class="upload-area"
              drag
              :auto-upload="false"
              :limit="10"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :file-list="uploadedFiles"
              multiple
            >
              <div class="upload-icon">📸</div>
              <div class="upload-text">点击或拖拽文件到此区域</div>
              <div class="upload-hint">支持上传照片（JPG/PNG）和文档（PDF/DOC），单个文件不超过 10MB</div>
            </el-upload>
          </div>
        </div>

        <!-- 底部操作按钮 -->
        <div class="action-bar">
          <el-button @click="$router.back()" size="large" style="padding: 14px 40px; font-size: 16px; min-height: 48px;">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting" size="large" style="padding: 14px 40px; font-size: 16px; min-height: 48px;">
            提交巡检
          </el-button>
          <el-button @click="saveDraft" size="large" style="padding: 14px 40px; font-size: 16px; min-height: 48px;">保存草稿</el-button>
        </div>
      </div>

      <!-- 右侧边栏 -->
      <div class="sidebar">
        <!-- 巡检提示 -->
        <div class="sidebar-card tips-card">
          <div class="sidebar-title">
            <span class="icon">💡</span>
            <span>巡检提示</span>
          </div>
          <ul class="tips-list">
            <li>✓ 请确认设备已断电或保持安全距离后再进行拍照。</li>
            <li>✓ 发现异常时，请务必上传现场照片并详细描述。</li>
            <li>✓ 提交后可在巡检记录列表中查看或编辑。</li>
          </ul>
        </div>

        <!-- 最近巡检记录 -->
        <div class="sidebar-card recent-card">
          <div class="sidebar-title">
            <span class="icon">🕐</span>
            <span>最近巡检记录</span>
            <el-link type="primary" :underline="false" style="margin-left: auto;" @click="$router.push('/admin/inspection')">
              查看全部
            </el-link>
          </div>
          <div class="recent-list" v-loading="recentLoading">
            <div v-for="item in recentList" :key="item.id" class="recent-item">
              <div class="recent-main">
                <div class="recent-name">{{ item.equipmentName }}</div>
                <div class="recent-info">
                  {{ item.inspectionDateStr }} · {{ item.inspectorName || 'admin' }} · {{ item.inspectionPlanName || '日常巡检' }}
                </div>
              </div>
              <el-tag
                :type="item.inspectionResult === '正常' ? 'success' : (item.inspectionResult === '异常' ? 'danger' : 'warning')"
                size="small"
                effect="light"
              >
                {{ item.inspectionResult === '正常' ? '正常' : (item.inspectionResult === '异常' ? '异常' : '注意') }}
              </el-tag>
            </div>
            <div v-if="!recentLoading && recentList.length === 0" class="empty-state">
              暂无巡检记录
            </div>
          </div>
        </div>

        <!-- 本月统计 -->
        <div class="sidebar-card stats-card">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value" :class="{ up: stats.thisMonth > stats.lastMonth }">
                {{ stats.thisMonth }}
              </div>
              <div class="stat-label">本月巡检</div>
              <div class="stat-sub" v-if="stats.lastMonth">
                ↑ 较上月 +{{ stats.thisMonth - stats.lastMonth }}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-value warning">{{ stats.pending }}</div>
              <div class="stat-label">待处理异常</div>
              <div class="stat-sub">需跟进</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 新建巡检记录脚本逻辑
 * 
 * 状态变量：
 * - currentStep: 当前步骤（1-4）
 * - equipmentList: 设备列表
 * - planList: 巡检计划列表
 * - inspectorList: 巡检人员列表
 * - checkItems: 检查项清单
 * - recentList: 最近巡检记录
 * - stats: 统计数据
 * - form: 巡检表单数据
 * - uploadedFiles: 上传的文件列表
 */

import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAllEquipment } from '@/api/equipment'
import {
  createInspection,
  getInspectionPlans,
  getInspectors,
  getCheckItems,
  getRecentInspections,
  getInspectionStats
} from '@/api/inspection'

const router = useRouter()

// 当前步骤
const currentStep = ref(1)

// 加载状态
const recentLoading = ref(false)
const submitting = ref(false)

// 设备列表
const equipmentList = ref([])
// 巡检计划列表
const planList = ref([])
// 巡检人员列表
const inspectorList = ref([])
// 最近巡检记录
const recentList = ref([])
// 统计数据
const stats = reactive({ thisMonth: 0, lastMonth: 0, pending: 0 })

const checkItems = ref([])

// 已完成数量
const completedCount = computed(() => checkItems.value.filter(item => item.checked).length)

// 选中的设备
const selectedEquipment = computed(() => {
  if (!form.value.equipmentId) return null
  return equipmentList.value.find(e => e.id === form.value.equipmentId)
})

// 上传的文件列表
const uploadedFiles = ref([])

// 表单数据
const form = ref({
  equipmentId: '',
  equipmentName: '',
  inspectionPlanId: '',
  inspectionDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
  inspectorId: '',
  inspectionMethod: '现场巡检',
  inspectionResult: '',
  problemDesc: '',
  remark: '',
  checkItems: [],
  attachments: []
})

/**
 * 加载所有数据
 */
async function loadAllData() {
  try {
    const [equipRes, planRes, inspectorRes] = await Promise.all([
      getAllEquipment(),
      getInspectionPlans(),
      getInspectors()
    ])
    equipmentList.value = equipRes.data || []
    planList.value = planRes.data || []
    inspectorList.value = inspectorRes.data || []
    
    if (inspectorList.value.length > 0) {
      form.value.inspectorId = inspectorList.value[0].id
    }
  } catch (e) {
    console.warn('数据加载失败', e)
  }
}

/**
 * 加载最近巡检记录
 */
async function loadRecentData() {
  recentLoading.value = true
  try {
    const res = await getRecentInspections(5)
    recentList.value = res.data || []
  } catch (e) {
    console.warn('最近记录加载失败', e)
    recentList.value = []
  } finally {
    recentLoading.value = false
  }
}

/**
 * 加载统计数据
 */
async function loadStats() {
  try {
    const res = await getInspectionStats()
    if (res.data) {
      stats.thisMonth = res.data.thisMonth || 0
      stats.lastMonth = res.data.lastMonth || 0
      stats.pending = res.data.pending || 0
    }
  } catch (e) {
    console.warn('统计数据加载失败', e)
  }
}

/**
 * 设备选择变化
 */
function onEquipmentChange(id) {
  const eq = equipmentList.value.find(e => e.id === id)
  if (eq) {
    form.value.equipmentName = eq.equipmentName
    currentStep.value = Math.max(currentStep.value, 2)
    loadCheckItems(eq.equipmentType)
  }
}

async function loadCheckItems(equipmentType) {
  try {
    const res = await getCheckItems(equipmentType)
    const items = res.data || []
    checkItems.value = items.map(item => ({
      name: item.name,
      checked: item.defaultStatus === '正常',
      status: item.defaultStatus || '待检'
    }))
  } catch (e) {
    console.warn('检查项加载失败', e)
    checkItems.value = []
  }
}

/**
 * 选择巡检结果
 */
function selectResult(result) {
  form.value.inspectionResult = result
  currentStep.value = Math.max(currentStep.value, 3)
}

/**
 * 切换检查项
 */
function toggleCheckItem(index) {
  const item = checkItems.value[index]
  item.checked = !item.checked
  if (item.checked && item.status === '待检') {
    item.status = form.value.inspectionResult === '异常' ? '异常' : '正常'
  }
}

/**
 * 文件变化
 */
function handleFileChange(file, fileList) {
  uploadedFiles.value = fileList
  currentStep.value = Math.max(currentStep.value, 4)
}

/**
 * 文件移除
 */
function handleFileRemove(file, fileList) {
  uploadedFiles.value = fileList
}

/**
 * 表单验证
 */
function validateForm() {
  if (!form.value.equipmentId) {
    ElMessage.warning({ message: '请选择巡检设备\n💡 在上方「巡检设备」下拉中选择一项后再提交', duration: 2800, showClose: true, grouping: true })
    return false
  }
  if (!form.value.inspectionPlanId) {
    ElMessage.warning({ message: '请选择巡检计划\n💡 在「巡检计划」下拉中选择；若为空列表，请联系管理员创建对应巡检计划后再操作', duration: 2800, showClose: true, grouping: true })
    return false
  }
  if (!form.value.inspectionDate) {
    ElMessage.warning({ message: '请选择巡检日期\n💡 在上方「巡检日期」日期选择器中选择；注意巡检日期不能晚于今日（系统已做限制）', duration: 2800, showClose: true, grouping: true })
    return false
  }
  if (!form.value.inspectorId) {
    ElMessage.warning({ message: '请选择巡检人\n💡 在「巡检人员」下拉中选择；巡检人员来源于系统设置 → 账户管理中已启用的巡检人员身份账号', duration: 2800, showClose: true, grouping: true })
    return false
  }
  if (!form.value.inspectionResult) {
    ElMessage.warning({ message: '请选择巡检结果\n💡 在「巡检结果」中选择（正常或异常）；若选择「异常」请在下栏填写异常描述并上传现场照片以便后续复核', duration: 2800, showClose: true, grouping: true })
    return false
  }
  return true
}

/**
 * 提交巡检记录
 */
async function handleSubmit() {
  if (!validateForm()) return
  
  submitting.value = true
  try {
    const submitData = {
      equipmentId: form.value.equipmentId,
      inspectionPlanId: form.value.inspectionPlanId,
      inspectionMethod: form.value.inspectionMethod,
      inspectionResult: form.value.inspectionResult,
      problemDesc: form.value.problemDesc,
      checkItems: JSON.stringify(checkItems.value.map(item => ({
        name: item.name,
        checked: item.checked,
        status: item.status
      }))),
      attachments: JSON.stringify(uploadedFiles.value.map(f => ({
        name: f.name,
        url: f.url || f.uid,
        size: f.size
      }))),
      inspectionDate: form.value.inspectionDate,
      remark: form.value.remark
    }
    
    await createInspection(submitData)
    ElMessage.success('巡检记录已提交')
    currentStep.value = 5
    setTimeout(() => {
      router.push('/admin/inspection')
    }, 1000)
  } catch (e) {
    console.error('提交失败', e)
    ElMessage.error({ message: `提交失败：${(e?.response?.data?.message) || (e?.message) || '服务器暂未响应'}\n💡 建议 30 秒后重试，或切换到草稿稍后再提交`, duration: 4200, showClose: true, grouping: true })
  } finally {
    submitting.value = false
  }
}

/**
 * 保存草稿
 */
function saveDraft() {
  ElMessage.info({ message: '当前版本暂不支持草稿保存\n💡 建议先把已填内容写入巡检备注，提交后再从该记录复制补充', duration: 3000, showClose: true })
}

// 页面挂载时加载数据
onMounted(async () => {
  await Promise.all([loadAllData(), loadRecentData(), loadStats()])
})
</script>

<style scoped>
.inspection-create-page {
  padding: 0 !important;
  background: #f5f7fa !important;
  min-height: calc(100vh - 60px) !important;
}

/* 页面头部 */
.page-header {
  background: #fff !important;
  padding: 0px 50px !important;
  border-bottom: 1px solid #e4e7ed !important;
  text-align: left !important;
}

.breadcrumb {
  font-size: 13px !important;
  color: #909399 !important;
  margin-bottom: 18px !important;
  text-align: left !important;
}

.breadcrumb .separator {
  margin: 0 8px !important;
  color: #c0c4cc !important;
}

.breadcrumb .current {
  color: #303133 !important;
  font-weight: 500 !important;
}

.page-title-row {
  display: flex !important;
  justify-content: space-between !important;
  align-items: flex-start !important;
  text-align: left !important;
}

.page-title-row h1 {
  margin: 0 !important;
  font-size: 24px !important;
  color: #303133 !important;
  text-align: left !important;
}

.page-title-row .subtitle {
  margin: 8px 0 0 !important;
  font-size: 14px !important;
  color: #909399 !important;
  text-align: left !important;
}

.header-actions {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  text-align: left !important;
  margin-right: -50px !important;
}

.header-actions .hint-text {
  font-size: 13px !important;
  color: #909399 !important;
}

/* 步骤指示器 */
.steps-container {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: #fff !important;
  margin: 48px 50px 0 !important;
  padding: 48px 38px !important;
  border-radius: 12px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06) !important;
}

.step-item {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  transition: background-color 0.3s ease, color 0.3s ease !important;
}

.step-item.active .step-icon {
  background: #409eff !important;
  color: #fff !important;
  border-color: #409eff !important;
}

.step-item.completed .step-icon {
  background: #67c23a !important;
  color: #fff !important;
  border-color: #67c23a !important;
}

.step-icon {
  width: 36px !important;
  height: 36px !important;
  border-radius: 50% !important;
  background: #fff !important;
  border: 2px solid #dcdfe6 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  color: #909399 !important;
  transition: color 0.3s ease !important;
}

.step-info .step-title {
  font-size: 15px !important;
  font-weight: 600 !important;
  color: #303133 !important;
}

.step-item:not(.active):not(.completed) .step-info .step-title {
  color: #909399 !important;
}

.step-info .step-desc {
  font-size: 12px !important;
  color: #909399 !important;
  margin-top: 2px !important;
}

.step-line {
  width: 64px !important;
  height: 2px !important;
  background: #dcdfe6 !important;
  margin: 0 13px !important;
  transition: background-color 0.3s ease !important;
}

.step-line.completed {
  background: #67c23a !important;
}

/* 主内容区 */
.main-content {
  display: flex !important;
  gap: 51px !important;
  padding: 48px 50px !important;
}

/* 左侧表单区 */
.form-area {
  flex: 1 !important;
  min-width: 0 !important;
}

/* 卡片样式 */
.card {
  background: #fff !important;
  border-radius: 12px !important;
  margin-bottom: 42px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06) !important;
  overflow: hidden !important;
}

.card-header {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  padding: 36px 22px !important;
  border-bottom: 1px solid #f0f2f5 !important;
}

.card-title {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #303133 !important;
}

.card-title .icon {
  font-size: 18px !important;
}

.card-title .required {
  color: #f56c6c !important;
  font-size: 14px !important;
}

.card-title .optional {
  font-size: 12px !important;
  color: #909399 !important;
  font-weight: normal !important;
  padding: 2px 8px !important;
  background: #f0f2f5 !important;
  border-radius: 4px !important;
}

.card-body {
  padding: 48px 22px !important;
}

/* 表单网格 */
.form-grid {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 36px 26px !important;
  margin-bottom: 30px !important;
}

.form-grid.second-row {
  margin-top: 36px !important;
  grid-template-columns: repeat(2, 1fr) !important;
}

.form-item {
  display: flex !important;
  flex-direction: column !important;
  gap: 15px !important;
}

.form-item label {
  font-size: 14px !important;
  color: #606266 !important;
  font-weight: 500 !important;
}

.form-item .required {
  color: #f56c6c !important;
}

.form-item.radio-group .radio-label {
  font-size: 14px !important;
}

.form-item.radio-group .el-radio {
  font-size: 21px !important;
}

.form-item.radio-group .el-radio .el-radio__input {
  width: 21px !important;
  height: 21px !important;
}

.form-item.radio-group .el-radio .el-radio__input .el-radio__inner {
  width: 9px !important;
  height: 9px !important;
}

.form-item.radio-group .el-radio-group {
  display: flex !important;
  gap: 20px !important;
}

.form-item.radio-group .el-radio:last-child {
  margin-left: auto !important;
}

/* 设备信息卡片 */
.equipment-info-card {
  display: flex !important;
  align-items: center !important;
  gap: 16px !important;
  background: #f8f9fb !important;
  border-radius: 10px !important;
  padding: 30px 19px !important;
  margin-top: 18px !important;
}

.eq-icon {
  font-size: 32px !important;
}

.eq-details {
  flex: 1 !important;
  display: flex !important;
  gap: 26px !important;
}

.eq-row {
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
}

.eq-label {
  font-size: 12px !important;
  color: #909399 !important;
}

.eq-value {
  font-size: 15px !important;
  font-weight: 600 !important;
  color: #303133 !important;
}

.eq-value.status-normal {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  color: #67c23a !important;
}

.status-dot {
  width: 8px !important;
  height: 8px !important;
  background: #67c23a !important;
  border-radius: 50% !important;
  animation: pulse 2s infinite !important;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 巡检结果 */
.result-label {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  font-size: 15px !important;
  font-weight: 500 !important;
  color: #303133 !important;
  margin-bottom: 30px !important;
}

.result-label .required {
  color: #f56c6c !important;
}

.result-cards {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 30px 32px !important;
  margin-bottom: 42px !important;
}

.result-card {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 18px 11px !important;
  border: 2px solid #e4e7ed !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease !important;
}

.result-card:hover {
  border-color: #c0c4cc !important;
}

.result-card.normal.selected {
  border-color: #67c23a !important;
  background: #f0f9eb !important;
}

.result-card.abnormal.selected {
  border-color: #e6a23c !important;
  background: #fdf6ec !important;
}

.result-radio {
  font-size: 20px !important;
}

.result-radio .checked {
  color: #67c23a !important;
}

.result-card.abnormal.selected .result-radio .checked {
  color: #e6a23c !important;
}

.result-radio .unchecked {
  color: #c0c4cc !important;
}

.result-icon {
  font-size: 28px !important;
}

.result-content {
  flex: 1 !important;
}

.result-title {
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #303133 !important;
  margin-bottom: 6px !important;
}

.result-desc {
  font-size: 13px !important;
  color: #909399 !important;
}

/* 检查项清单 */
.check-items-section {
  margin-bottom: 42px !important;
}

.check-items-header {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  margin-bottom: 30px !important;
}

.check-items-title {
  font-size: 15px !important;
  font-weight: 500 !important;
  color: #303133 !important;
}

.check-items-count {
  font-size: 13px !important;
  color: #909399 !important;
}

.check-items-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 24px 26px !important;
}

.check-item {
  display: flex !important;
  align-items: center !important;
  gap: 11px !important;
  padding: 24px 16px !important;
  background: #f8f9fb !important;
  border-radius: 8px !important;
  cursor: pointer !important;
  transition: background-color 0.2s ease, border-color 0.2s ease !important;
}

.check-item:hover {
  background: #eef0f3 !important;
}

.check-item.checked {
  background: #f0f9eb !important;
}

.checkbox {
  width: 20px !important;
  height: 20px !important;
  border: 2px solid #dcdfe6 !important;
  border-radius: 4px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 12px !important;
  color: #fff !important;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease !important;
}

.checkbox.checked {
  background: #409eff !important;
  border-color: #409eff !important;
}

.check-item.checked .checkbox {
  background: #67c23a !important;
  border-color: #67c23a !important;
}

.check-item-text {
  flex: 1 !important;
  font-size: 14px !important;
  color: #606266 !important;
}

.check-item-status {
  font-size: 12px !important;
  padding: 2px 8px !important;
  border-radius: 4px !important;
  background: #f0f2f5 !important;
  color: #909399 !important;
}

.check-item-status.正常 {
  background: #f0f9eb !important;
  color: #67c23a !important;
}

.check-item-status.异常 {
  background: #fef0f0 !important;
  color: #f56c6c !important;
}

.check-item-status.待检 {
  background: #fdf6ec !important;
  color: #e6a23c !important;
}

/* 描述网格 */
.desc-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 36px 38px !important;
}

/* 上传区域 */
.upload-area {
  width: 100% !important;
}

.upload-area :deep(.el-upload-dragger) {
  padding: 72px 77px !important;
  background: #fafbfc !important;
  border: 2px dashed #dcdfe6 !important;
  border-radius: 12px !important;
}

.upload-icon {
  font-size: 48px !important;
  margin-bottom: 24px !important;
}

.upload-text {
  font-size: 15px !important;
  color: #303133 !important;
  margin-bottom: 12px !important;
}

.upload-hint {
  font-size: 13px !important;
  color: #909399 !important;
}

/* 底部操作按钮 */
.action-bar {
  display: flex !important;
  justify-content: center !important;
  gap: 90px !important;
  padding: 36px 38px !important;
  background: #fff !important;
  border-radius: 12px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06) !important;
}

.action-bar .el-button {
  padding: 14px 30px !important;
  font-size: 15px !important;
  min-height: 44px !important;
  line-height: 1 !important;
  width: 120px !important;
}

/* 右侧边栏 */
.sidebar {
  width: 288px !important;
  flex-shrink: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 36px !important;
}

.sidebar-card {
  background: #fff !important;
  border-radius: 12px !important;
  padding: 36px 19px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06) !important;
}

.sidebar-title {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #303133 !important;
  margin-bottom: 30px !important;
}

.sidebar-title .icon {
  font-size: 18px !important;
}

/* 巡检提示 */
.tips-list {
  list-style: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

.tips-list li {
  font-size: 13px !important;
  color: #606266 !important;
  line-height: 2.7 !important;
  padding-left: 4px !important;
}

/* 最近巡检记录 */
.recent-list {
  display: flex !important;
  flex-direction: column !important;
  gap: 21px !important;
}

.recent-item {
  display: flex !important;
  justify-content: space-between !important;
  align-items: flex-start !important;
  padding: 21px 22px !important;
  background: #f8f9fb !important;
  border-radius: 8px !important;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease !important;
}

.recent-item:hover {
  background: #eef0f3 !important;
}

.recent-main {
  flex: 1 !important;
  min-width: 0 !important;
}

.recent-name {
  font-size: 14px !important;
  font-weight: 500 !important;
  color: #303133 !important;
  margin-bottom: 6px !important;
}

.recent-info {
  font-size: 12px !important;
  color: #909399 !important;
}

.empty-state {
  text-align: center !important;
  padding: 20px !important;
  color: #909399 !important;
  font-size: 14px !important;
}

/* 统计卡片 */
.stats-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 30px 32px !important;
}

.stat-item {
  text-align: center !important;
  padding: 30px 13px !important;
  background: #f8f9fb !important;
  border-radius: 10px !important;
}

.stat-value {
  font-size: 28px !important;
  font-weight: 700 !important;
  color: #303133 !important;
  margin-bottom: 6px !important;
}

.stat-value.up {
  color: #67c23a !important;
}

.stat-value.warning {
  color: #e6a23c !important;
}

.stat-label {
  font-size: 13px !important;
  color: #606266 !important;
  margin-bottom: 6px !important;
}

.stat-sub {
  font-size: 12px !important;
  color: #909399 !important;
}

/* 响应式 */
@media (max-width: 1200px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .sidebar {
    width: 256px !important;
  }
}

@media (max-width: 992px) {
  .main-content {
    flex-direction: column !important;
  }
  .sidebar {
    width: 100% !important;
  }
  .steps-container {
    flex-wrap: wrap !important;
    gap: 16px !important;
    margin: 20px !important;
    padding: 24px !important;
  }
  .step-line {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .form-grid,
  .form-grid.second-row,
  .desc-grid {
    grid-template-columns: 1fr !important;
  }
  .check-items-grid {
    grid-template-columns: 1fr !important;
  }
  .result-cards {
    grid-template-columns: 1fr !important;
  }
  .action-bar {
    gap: 20px !important;
    flex-wrap: wrap !important;
    padding: 24px !important;
  }
  .steps-container {
    padding: 16px !important;
  }
  .main-content {
    padding: 20px !important;
  }
  .page-header {
    padding: 20px !important;
  }
}
</style>
