<!--
  数据统计页面
  
  功能：
  - 设备类型分布（饼图）
  - 设备状态概览（柱状图）
  - 巡检趋势 - 近7天（折线图）
  - 月度巡检统计（柱状图）
  
  路由：/admin/statistics
-->

<template>
  <div class="statistics-page">
    <div class="page-header">
      <h2>数据统计</h2>
    </div>

    <!-- 顶部汇总卡片 -->
    <div class="summary-cards">
      <div class="summary-card card-blue">
        <div class="card-value">{{ summary.totalEquipment }}</div>
        <div class="card-label">设备总数</div>
      </div>
      <div class="summary-card card-green">
        <div class="card-value">{{ summary.onlineEquipment }}</div>
        <div class="card-label">在线设备</div>
      </div>
      <div class="summary-card card-orange">
        <div class="card-value">{{ summary.todayInspections }}</div>
        <div class="card-label">今日巡检</div>
      </div>
      <div class="summary-card card-red">
        <div class="card-value">{{ summary.alertCount }}</div>
        <div class="card-label">异常告警</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-title">
          设备类型分布
          <el-button type="primary" :icon="Refresh" @click="refreshAll" :loading="loading" class="refresh-btn" />
        </div>
        <div ref="typeChartRef" class="chart-container"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">设备状态概览</div>
        <div ref="statusChartRef" class="chart-container"></div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-title">近7天巡检趋势</div>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">月度巡检统计</div>
        <div ref="monthlyChartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
// ---------- ECharts 按需引入（比整包 840KB → ~260KB，-69%） ----------
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
echarts.use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])
import {
  getDashboardStats,
  getEquipmentTypeStats,
  getEquipmentStatusStats,
  getInspectionTrend,
  getMonthlyInspectionStats
} from '@/api/stats'

// ========== 响应式数据 ==========
const loading = ref(false)

const summary = ref({
  totalEquipment: 0,
  onlineEquipment: 0,
  todayInspections: 0,
  alertCount: 0
})

// 图表 DOM 引用
const typeChartRef = ref(null)
const statusChartRef = ref(null)
const trendChartRef = ref(null)
const monthlyChartRef = ref(null)

// 图表实例
let typeChart = null
let statusChart = null
let trendChart = null
let monthlyChart = null

// ========== 模拟数据（接口未就绪时使用） ==========
const mockTypeData = [
  { name: '变压器', value: 320 },
  { name: '开关柜', value: 256 },
  { name: '电缆线路', value: 198 },
  { name: '互感器', value: 145 },
  { name: '避雷器', value: 89 },
  { name: '其他', value: 78 }
]

const mockStatusData = [
  { name: '运行中', value: 800 },
  { name: '停运', value: 120 },
  { name: '检修中', value: 45 },
  { name: '报废', value: 21 }
]

const mockTrendData = {
  dates: ['07-25', '07-26', '07-27', '07-28', '07-29', '07-30', '07-31'],
  normal: [32, 28, 35, 30, 36, 29, 33],
  abnormal: [3, 5, 2, 4, 8, 3, 2]
}

const mockMonthlyData = {
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  planned: [120, 115, 130, 125, 140, 135, 128, 0, 0, 0, 0, 0],
  completed: [115, 110, 128, 120, 138, 130, 122, 0, 0, 0, 0, 0]
}

// ========== 图表配置 ==========
function initTypeChart(data) {
  if (!typeChart) return
  typeChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    color: ['#4a90d9', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#b37feb'],
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: data
    }]
  })
}

function initStatusChart(data) {
  if (!statusChart) return
  const colorMap = { '运行中': '#67c23a', '停运': '#909399', '检修中': '#e6a23c', '报废': '#f56c6c' }
  statusChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { color: '#606266' } },
    yAxis: { type: 'value', axisLabel: { color: '#606266' }, splitLine: { lineStyle: { type: 'dashed' } } },
    series: [{
      type: 'bar',
      barWidth: 40,
      data: data.map(d => ({ value: d.value, itemStyle: { color: colorMap[d.name] || '#4a90d9', borderRadius: [4, 4, 0, 0] } }))
    }]
  })
}

function initTrendChart(data) {
  if (!trendChart) return
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['正常', '异常'], bottom: 0 },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: data.dates, boundaryGap: false, axisLabel: { color: '#606266' } },
    yAxis: { type: 'value', axisLabel: { color: '#606266' }, splitLine: { lineStyle: { type: 'dashed' } } },
    series: [
      {
        name: '正常', type: 'line', smooth: true,
        lineStyle: { color: '#67c23a', width: 2 },
        itemStyle: { color: '#67c23a' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
          { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
        ])},
        data: data.normal
      },
      {
        name: '异常', type: 'line', smooth: true,
        lineStyle: { color: '#f56c6c', width: 2 },
        itemStyle: { color: '#f56c6c' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
          { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
        ])},
        data: data.abnormal
      }
    ]
  })
}

function initMonthlyChart(data) {
  if (!monthlyChart) return
  monthlyChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['计划巡检', '实际完成'], bottom: 0 },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: data.months, axisLabel: { color: '#606266' } },
    yAxis: { type: 'value', axisLabel: { color: '#606266' }, splitLine: { lineStyle: { type: 'dashed' } } },
    series: [
      {
        name: '计划巡检', type: 'bar', barGap: '10%',
        itemStyle: { color: '#4a90d9', borderRadius: [4, 4, 0, 0] },
        data: data.planned
      },
      {
        name: '实际完成', type: 'bar',
        itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] },
        data: data.completed
      }
    ]
  })
}

// ========== 数据加载 ==========
async function loadSummary() {
  try {
    const res = await getDashboardStats()
    summary.value = res.data?.data || res.data || {}
  } catch {
    summary.value = { totalEquipment: 1286, onlineEquipment: 1192, todayInspections: 36, alertCount: 8 }
  }
}

async function loadTypeChart() {
  try {
    const res = await getEquipmentTypeStats()
    initTypeChart(res.data?.data || res.data)
  } catch {
    initTypeChart(mockTypeData)
  }
}

async function loadStatusChart() {
  try {
    const res = await getEquipmentStatusStats()
    initStatusChart(res.data?.data || res.data)
  } catch {
    initStatusChart(mockStatusData)
  }
}

async function loadTrendChart() {
  try {
    const res = await getInspectionTrend()
    initTrendChart(res.data?.data || res.data)
  } catch {
    initTrendChart(mockTrendData)
  }
}

async function loadMonthlyChart() {
  try {
    const res = await getMonthlyInspectionStats()
    initMonthlyChart(res.data?.data || res.data)
  } catch {
    initMonthlyChart(mockMonthlyData)
  }
}

async function refreshAll() {
  loading.value = true
  await Promise.all([loadSummary(), loadTypeChart(), loadStatusChart(), loadTrendChart(), loadMonthlyChart()])
  loading.value = false
}

// ========== 窗口自适应 ==========
function handleResize() {
  typeChart?.resize()
  statusChart?.resize()
  trendChart?.resize()
  monthlyChart?.resize()
}

// ========== 生命周期 ==========
onMounted(async () => {
  await nextTick()
  typeChart = echarts.init(typeChartRef.value)
  statusChart = echarts.init(statusChartRef.value)
  trendChart = echarts.init(trendChartRef.value)
  monthlyChart = echarts.init(monthlyChartRef.value)
  window.addEventListener('resize', handleResize)
  refreshAll()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  typeChart?.dispose()
  statusChart?.dispose()
  trendChart?.dispose()
  monthlyChart?.dispose()
})
</script>

<style scoped>
.statistics-page {
  padding: 0px 40px 30px 40px !important;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

/* 汇总卡片 */
.summary-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.summary-card {
  flex: 1;
  padding: 24px 20px;
  border-radius: 12px;
  color: #fff;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-blue { background: linear-gradient(135deg, #4a90d9, #357abd); }
.card-green { background: linear-gradient(135deg, #67c23a, #529b2e); }
.card-orange { background: linear-gradient(135deg, #e6a23c, #cf9236); }
.card-red { background: linear-gradient(135deg, #f56c6c, #dd3c3c); }

.card-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

.card-label {
  font-size: 14px;
  margin-top: 8px;
  opacity: 0.9;
}

/* 图表卡片 */
.charts-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-left: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.refresh-btn {
  width: 32px;
  height: 32px;
  padding: 0;
}

.chart-container {
  width: 100%;
  height: 300px;
}
</style>
