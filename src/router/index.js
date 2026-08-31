import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../views/MainLayout.vue'
import { ElMessage } from 'element-plus'
import { getToken, getRole, setRole, clearAuth } from '@/stores/auth'
import { toastPermission } from '@/utils/messages'

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: () => import('../views/Login.vue') },
    {
        path: '/admin',
        component: MainLayout,
        redirect: '/admin/home',
        children: [
            { path: 'home', name: 'Home', component: () => import('../views/Home.vue'), meta: { roles: ['admin', 'inspector', 'user'] } },
            { path: 'equipment', name: 'Equipment', component: () => import('../views/Equipment.vue'), meta: { roles: ['admin', 'inspector'] } },
            { path: 'inspection', name: 'Inspection', component: () => import('../views/Inspection.vue'), meta: { roles: ['admin', 'inspector'] } },
            { path: 'inspection/create', name: 'InspectionCreate', component: () => import('../views/InspectionCreate.vue'), meta: { roles: ['admin', 'inspector'] } },
            { path: 'statistics', name: 'Statistics', component: () => import('../views/Statistics.vue'), meta: { roles: ['admin', 'inspector', 'user'] } },
            { path: 'settings/user', name: 'UserSettings', component: () => import('../views/UserSettings.vue'), meta: { roles: ['admin'] } },
            { path: 'settings/role', name: 'RoleSettings', component: () => import('../views/RoleSettings.vue'), meta: { roles: ['admin'] } },
            { path: 'ai-chat', name: 'AiChat', component: () => import('../views/AiChatPage.vue'), meta: { roles: ['admin', 'inspector', 'user'] } }
        ]
    }
]

const router = createRouter({ history: createWebHistory(), routes })

// 合法角色白名单
const VALID_ROLES = ['admin', 'inspector', 'user']
// 死循环检测：同一路径 2 秒内跳转超过 3 次判定为死循环
const navTrace = new Map() // path -> { count, time }

/**
 * 校验并修正 localStorage 中的 role（防止脏数据导致死循环）
 */
function normalizeRole() {
    let role = getRole()
    if (!VALID_ROLES.includes(role)) {
        // 默认降级为 user，保证 /admin/home 可进入
        role = 'user'
        setRole(role)
        console.warn('[Router] 检测到非法 role，已自动修正为 user')
    }
    return role
}

/**
 * 限流：权限提示 2 秒内最多弹一次
 */
let lastTipTime = 0
function tipOnce(msg) {
    const now = Date.now()
    if (now - lastTipTime > 2000) {
        ElMessage.warning(msg)
        lastTipTime = now
    }
}

/**
 * 检测死循环：如果 2 秒内同一路径重复跳转 ≥ 3 次，强制放行
 */
function detectLoop(path) {
    const now = Date.now()
    const entry = navTrace.get(path)
    if (!entry || now - entry.time > 2000) {
        navTrace.set(path, { count: 1, time: now })
        return false
    }
    entry.count++
    if (entry.count >= 3) {
        console.error('[Router] 检测到路由死循环，强制放行以恢复页面')
        navTrace.clear()
        return true
    }
    return false
}

/**
 * 路由守卫
 */
router.beforeEach((to, from, next) => {
    // 死循环检测（优先于所有判断）
    if (detectLoop(to.fullPath)) {
        next()
        return
    }

    const token = getToken()

    // 情况 1：未登录访问受保护页 → 强制跳登录
    if (to.path !== '/login' && !token) {
        // 清除脏数据，避免登录后立即被踢
        clearAuth()
        next('/login')
        return
    }

    // 情况 2：已登录但访问登录页 → 直接进首页，不做二次判断
    if (to.path === '/login' && token) {
        normalizeRole()
        next('/admin/home')
        return
    }

    // 情况 3：有 token → 先修正 role，再鉴权
    const userRole = normalizeRole()

    // 情况 4：权限校验
    if (to.meta && to.meta.roles) {
        if (!to.meta.roles.includes(userRole)) {
            toastPermission(userRole)
            // 无权限且来源页无效时，跳到首页（首页允许所有角色，不会再次触发此处）
            if (!from.path || from.path === '/' || from.path === '/login' || from.path === to.fullPath) {
                next('/admin/home')
            } else {
                next(false)
            }
            return
        }
    }

    // 情况 5：放行
    next()
})

export default router
