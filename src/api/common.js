/**
 * 通用功能 API 模块
 * 
 * 【注意】以下接口需要在后端新增：
 * 
 * 1. POST /api/common/ai-chat - AI 助手对话
 *    请求格式：{ message: '用户输入的内容' }
 *    返回格式：{ code: 200, data: { reply: 'AI 回复内容' } }
 * 
 * 2. POST /api/common/feedback - 提交意见反馈
 *    请求格式：{ content: '反馈内容', contact: '联系方式（可选）' }
 *    返回格式：{ code: 200, message: '提交成功' }
 * 
 * 3. GET /api/common/user-profile - 获取当前用户账户信息
 *    返回格式：{ code: 200, data: { id, username, email, phone, role, createTime } }
 * 
 * 4. PUT /api/common/user-profile - 更新账户信息
 *    请求格式：{ email, phone, ... }
 *    返回格式：{ code: 200, message: '更新成功' }
 * 
 * 5. GET /api/common/announcements - 获取企业公告列表
 *    返回格式：{ code: 200, data: [{ id, title, content, publishTime, isRead }, ...] }
 * 
 * 6. GET /api/common/announcements/:id - 获取公告详情
 *    返回格式：{ code: 200, data: { id, title, content, publishTime, publisher } }
 */

import request from './request'

// AI 助手对话
export function sendAiChat(message) {
  return request.post('/common/ai-chat', { message })
}

// 提交意见反馈
export function submitFeedback(data) {
  return request.post('/common/feedback', data)
}

// 获取当前用户账户信息
export function getUserProfile() {
  return request.get('/common/user-profile')
}

// 更新账户信息
export function updateUserProfile(data) {
  return request.put('/common/user-profile', data)
}

// 获取企业公告列表
export function getAnnouncements() {
  return request.get('/common/announcements')
}

// 获取公告详情
export function getAnnouncementDetail(id) {
  return request.get(`/common/announcements/${id}`)
}
