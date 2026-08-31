/**
 * Axios 请求封装模块
 *
 * 功能说明：
 * 1. 创建 axios 实例，统一配置 baseURL 和超时时间
 * 2. 请求拦截器：自动从 localStorage 获取 token 并添加到请求头
 * 3. 响应拦截器：统一处理业务错误（code !== 200）和 HTTP 错误
 * 4. 401 未授权时自动清除登录状态并跳转到登录页
 *    - 注意：本地模式（token 以 'local-token-' 开头）下不做踢回处理，避免后端接口不可用时被反复踢登录
 */

import axios from 'axios'
import { ElMessage } from 'element-plus'
import { networkErrorMessage } from '@/utils/messages'
import router from '@/router'
import { getToken, clearAuth, isLocalMode } from '@/stores/auth'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器：自动携带 token
request.interceptors.request.use(
  (config) => {
    const token = getToken()
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
      console.error('[API ERROR]', response.config.url, res)
      // 本地模式下：后端业务错误只在控制台打印，不弹窗骚扰用户
      if (isLocalMode()) {
        console.warn('[Local Mode] 后端业务错误已忽略：', res.message || res.code)
      } else {
        const bm = networkErrorMessage(res);
        ElMessage.error({ message: `业务处理失败：${res.message || bm.fact}\n💡 ${bm.action}`, duration: 3400, showClose: true, grouping: true })
      }
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
      // 本地模式下：后端 401（token 校验失败）属于预期行为，不清 token，不跳登录
      if (isLocalMode()) {
        console.warn('[Local Mode] 忽略 401，保留本地登录态')
      } else {
        clearAuth()
        router.push('/login')
        const e401 = networkErrorMessage({ status: 401 });
        ElMessage.warning({ message: `⚠ ${e401.fact}\n💡 ${e401.action}`, duration: 3200, showClose: true })
      }
    } else {
      // 本地模式下：500/网络错误只在控制台打印，不弹窗骚扰
      if (isLocalMode()) {
        console.warn('[Local Mode] 请求失败已忽略：', error.message)
      } else {
        const ne = networkErrorMessage(error);
        ElMessage.error({ message: `✗ ${ne.fact}${ne.reason ? ' — ' + ne.reason : ''}\n💡 ${ne.action}`, duration: 4000, showClose: true, grouping: true })
      }
    }
    return Promise.reject(error)
  }
)

export default request
