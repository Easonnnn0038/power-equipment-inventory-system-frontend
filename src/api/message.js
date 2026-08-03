/**
 * 消息相关 API 模块
 *
 * 接口列表：
 * - GET    /api/message/list          获取消息列表（支持按类型筛选）
 * - GET    /api/message/unread-count   获取未读消息数量
 * - PUT    /api/message/{id}/read      标记消息为已读
 * - PUT    /api/message/read-all       标记所有消息为已读
 * - DELETE /api/message/{id}           删除消息
 * - POST   /api/message/publish        发布公告/任务（仅管理员）
 */

import request from './request'

/**
 * 获取消息列表
 * @param {Object} params - 查询参数
 * @param {String} params.type - 消息类型：system（系统消息）/ task（任务消息），不传则查全部
 * @param {Number} params.pageNum - 页码
 * @param {Number} params.pageSize - 每页数量
 */
export function getMessageList(params) {
  return request.get('/message/list', { params })
}

/**
 * 获取未读消息数量
 * @returns {Promise} 返回未读数量
 */
export function getUnreadCount() {
  return request.get('/message/unread-count')
}

/**
 * 标记单条消息为已读
 * @param {Number} id - 消息ID
 */
export function markAsRead(id) {
  return request.put(`/message/${id}/read`)
}

/**
 * 标记所有消息为已读
 */
export function markAllAsRead() {
  return request.put('/message/read-all')
}

/**
 * 删除消息
 * @param {Number} id - 消息ID
 */
export function deleteMessage(id) {
  return request.delete(`/message/${id}`)
}

/**
 * 发布公告或任务
 * @param {Object} data - 发布内容
 * @param {String} data.type - 消息类型：announcement（公告）/ task（任务）
 * @param {String} data.title - 标题
 * @param {String} data.content - 内容
 * @param {String} data.priority - 优先级：normal（普通）/ urgent（紧急）
 */
export function publishMessage(data) {
  return request.post('/message/publish', data)
}

/**
 * 将任务消息加入待办事项
 * @param {Number} id - 消息ID
 */
export function addTaskToTodo(id) {
  return request.post(`/message/${id}/add-todo`)
}

/**
 * 获取已加入待办的任务消息列表
 * @returns {Promise} 返回待办消息列表
 */
export function getTodoMessages() {
  return request.get('/message/todo-list')
}

/**
 * 从待办中移除消息
 * @param {Number} id - 消息ID
 */
export function removeTodoMessage(id) {
  return request.delete(`/message/${id}/todo`)
}
