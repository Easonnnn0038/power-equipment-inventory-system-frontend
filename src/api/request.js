/**
 * Axios 请求封装模块
 * 
 * 功能说明：
 * 1. 创建 axios 实例，统一配置 baseURL 和超时时间
 * 2. 请求拦截器：自动从 localStorage 获取 token 并添加到请求头
 * 3. 响应拦截器：统一处理业务错误（code !== 200）和 HTTP 错误
 * 4. 401 未授权时自动清除登录状态并跳转到登录页
 * 
 * 使用方式：
 * import request from './request'
 * request.get('/api/xxx') 或 request.post('/api/xxx', data)
 */

import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器：自动携带 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一处理错误
request.interceptors.response.use(
  (response) => {
    // blob 类型直接返回，不走业务码判断
    if (response.config.responseType === 'blob') {
      return response
    }
    const res = response.data
    if (res.code !== 200) {
      // 调试用：在控制台输出完整错误信息，方便定位后端问题
      console.error('[API ERROR]', response.config.url, res)
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    // 调试用：打印 HTTP 层面的错误（4xx/5xx、网络错误等）
    if (error.response) {
      console.error('[HTTP ERROR]', error.config?.url, error.response.status, error.response.data)
    } else {
      console.error('[NETWORK ERROR]', error.config?.url, error.message)
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('role')
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
