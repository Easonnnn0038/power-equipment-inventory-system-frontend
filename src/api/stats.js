/**
 * 仪表盘统计数据 API 模块
 * 
 * 【注意】以下接口需要在后端新增：
 * 1. GET /api/stats/dashboard - 返回仪表盘统计数据
 *    返回格式：{ code: 200, data: { totalEquipment, onlineEquipment, todayInspections, alertCount } }
 * 
 * 2. GET /api/stats/todo - 返回待办事项列表
 *    返回格式：{ code: 200, data: [{ name: '待巡检设备', count: 12, unit: '项' }, ...] }
 * 
 * 前端在接口未就绪时会使用模拟数据（见 Home.vue 中的 catch 块）
 */

import request from './request'

// 获取仪表盘统计数据
// 后端需新增此接口，返回格式参考：
// { code: 200, data: { totalEquipment, onlineEquipment, todayInspections, alertCount } }
export function getDashboardStats() {
  return request.get('/stats/dashboard')
}

// 获取待办事项
// 后端需新增此接口，返回格式参考：
// { code: 200, data: { pendingInspection: 12, pendingConfirm: 3, weeklyPlan: 18 } }
export function getTodoList() {
  return request.get('/stats/todo')
}

// ========== 数据统计页面接口 ==========

// 获取设备类型分布
// 返回格式：{ code: 200, data: [{ name: '变压器', value: 320 }, ...] }
export function getEquipmentTypeStats() {
  return request.get('/stats/equipment-type')
}

// 获取设备状态统计
// 返回格式：{ code: 200, data: [{ name: '运行中', value: 800 }, ...] }
export function getEquipmentStatusStats() {
  return request.get('/stats/equipment-status')
}

// 获取巡检趋势（近7天）
// 返回格式：{ code: 200, data: { dates: ['07-25', ...], normal: [30, ...], abnormal: [5, ...] } }
export function getInspectionTrend() {
  return request.get('/stats/inspection-trend')
}

// 获取月度巡检统计
// 返回格式：{ code: 200, data: { months: ['1月', ...], planned: [120, ...], completed: [115, ...] } }
export function getMonthlyInspectionStats() {
  return request.get('/stats/monthly-inspection')
}
