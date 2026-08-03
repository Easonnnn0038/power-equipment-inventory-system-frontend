/**
 * 巡检记录 API 模块
 * 
 * 对应后端 Controller：InspectionController
 * 基础路径：/api/inspection
 * 
 * 接口列表：
 * - getInspectionList: 分页查询巡检记录
 * - getAllInspections: 获取所有巡检记录
 * - getInspectionById: 根据 ID 获取详情
 * - getInspectionsByEquipmentId: 按设备 ID 查询巡检记录
 * - createInspection: 创建巡检记录
 * - updateInspection: 更新巡检记录
 * - deleteInspection: 删除巡检记录
 * - getInspectionPlans: 获取巡检计划列表
 * - getInspectors: 获取巡检人员列表
 * - getCheckItems: 获取检查项模板
 * - getRecentInspections: 获取最近巡检记录
 * - getInspectionStats: 获取巡检统计数据
 * - uploadAttachment: 上传巡检附件
 */

import request from './request'

// 获取巡检记录列表（分页）
export function getInspectionList(params) {
  return request.get('/inspection', { params })
}

// 获取所有巡检记录
export function getAllInspections() {
  return request.get('/inspection/all')
}

// 获取巡检记录详情
export function getInspectionById(id) {
  return request.get(`/inspection/${id}`)
}

// 按设备ID获取巡检记录
export function getInspectionsByEquipmentId(equipmentId) {
  return request.get(`/inspection/equipmentId/${equipmentId}`)
}

// 创建巡检记录
export function createInspection(data) {
  return request.post('/inspection', data)
}

// 更新巡检记录
export function updateInspection(id, data) {
  return request.put(`/inspection/${id}`, data)
}

// 删除巡检记录
export function deleteInspection(id) {
  return request.delete(`/inspection/${id}`)
}

/**
 * 获取巡检计划列表
 * 用于新建巡检时选择巡检计划
 * @returns {Promise} 巡检计划列表
 */
export function getInspectionPlans() {
  return request.get('/inspection/plans')
}

/**
 * 获取巡检人员列表
 * 用于新建巡检时选择巡检人
 * @returns {Promise} 巡检人员列表
 */
export function getInspectors() {
  return request.get('/inspection/inspectors')
}

/**
 * 获取检查项模板
 * 根据设备类型获取对应的检查项列表
 * @param {string} equipmentType - 设备类型（可选）
 * @returns {Promise} 检查项列表
 */
export function getCheckItems(equipmentType) {
  return request.get('/inspection/check-items', { params: { equipmentType } })
}

/**
 * 获取最近巡检记录
 * 用于右侧边栏展示
 * @param {number} limit - 限制数量，默认5
 * @returns {Promise} 最近巡检记录列表
 */
export function getRecentInspections(limit = 5) {
  return request.get('/inspection/recent', { params: { limit } })
}

/**
 * 获取巡检统计数据
 * 用于右侧边栏展示月度统计
 * @returns {Promise} 统计数据（本月巡检数、待处理异常数等）
 */
export function getInspectionStats() {
  return request.get('/inspection/stats')
}

/**
 * 上传巡检附件
 * 支持照片和文档上传
 * @param {FormData} formData - 文件数据
 * @param {number} inspectionId - 巡检记录ID（可选，创建后关联）
 * @returns {Promise} 上传结果
 */
export function uploadAttachment(formData, inspectionId) {
  return request.post('/inspection/attachments', formData, {
    params: { inspectionId },
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
