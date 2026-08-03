/**
 * 用户认证 API 模块
 * 
 * 对应后端 Controller：AuthController
 * 基础路径：/api/auth
 * 
 * 接口列表：
 * - login: 用户登录，返回 token
 * - logout: 用户登出
 */

import request from './request'

// 登录
export function login(data) {
  return request.post('/auth/login', data)
}

// 登出
export function logout() {
  return request.post('/auth/logout')
}
