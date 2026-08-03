/**
 * 设备管理 API 模块
 * 
 * 对应后端 Controller：EquipmentController
 * 基础路径：/api/equipment
 * 
 * 接口列表：
 * - getEquipmentList: 分页查询设备列表
 * - getAllEquipment: 获取所有设备（不分页）
 * - getEquipmentById: 根据 ID 获取设备详情
 * - searchEquipmentByName: 按名称搜索
 * - searchEquipmentByType: 按类型筛选
 * - searchEquipmentByStatus: 按状态筛选
 * - createEquipment: 创建设备
 * - updateEquipment: 更新设备
 * - deleteEquipment: 删除设备
 */

import request from './request'

// 获取设备列表（分页）
export function getEquipmentList(params) {
  return request.get('/equipment', { params })
}

// 获取所有设备
export function getAllEquipment() {
  return request.get('/equipment/all')
}

// 获取设备详情
export function getEquipmentById(id) {
  return request.get(`/equipment/${id}`)
}

// 按名称搜索设备
export function searchEquipmentByName(name) {
  return request.get('/equipment/search/name', { params: { name } })
}

// 按类型筛选设备
export function searchEquipmentByType(type) {
  return request.get('/equipment/search/type', { params: { type } })
}

// 按状态筛选设备
export function searchEquipmentByStatus(status) {
  return request.get('/equipment/search/status', { params: { status } })
}

// 创建设备
export function createEquipment(data) {
  return request.post('/equipment', data)
}

// 更新设备
export function updateEquipment(id, data) {
  return request.put(`/equipment/${id}`, data)
}

// 删除设备
export function deleteEquipment(id) {
  return request.delete(`/equipment/${id}`)
}

//导出设备excel
export function exportEquipmentExcel() {
  return request.get('/equipment/export', { responseType: 'blob' })
}

//导入设备excel
export function importEquipment(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/equipment/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

