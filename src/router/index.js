/**
 * 路由配置文件
 * 
 * 路由结构：
 * / - 重定向到 /login
 * /login - 登录页
 * /admin - 管理后台（MainLayout 布局）
 *   /admin/home - 首页仪表盘
 *   /admin/equipment - 设备台账
 *   /admin/inspection - 巡检记录列表
 *   /admin/inspection/create - 新建巡检记录
 *   /admin/statistics - 数据统计概览
 *   /admin/settings/user - 用户管理
 *   /admin/settings/role - 角色管理
 * 
 * 路由守卫：
 * - 未登录用户访问非 /login 页面时自动跳转到登录页
 */

import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../views/MainLayout.vue'

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        component: () => import('../views/Login.vue')
    },
    {
        path: '/admin',
        component: MainLayout,  // 使用主布局组件
        redirect: '/admin/home',
        children: [
            {
                path: 'home',
                name: 'Home',
                component: () => import('../views/Home.vue')  // 首页仪表盘
            },
            {
                path: 'equipment',
                name: 'Equipment',
                component: () => import('../views/Equipment.vue')  // 设备台账
            },
            {
                path: 'inspection',
                name: 'Inspection',
                component: () => import('../views/Inspection.vue')  // 巡检记录列表
            },
            {
                path: 'inspection/create',
                name: 'InspectionCreate',
                component: () => import('../views/InspectionCreate.vue')  // 新建巡检记录
            },
            {
                path: 'statistics',
                name: 'Statistics',
                component: () => import('../views/Statistics.vue')  // 数据统计
            },
            {
                path: 'settings/user',
                name: 'UserSettings',
                component: () => import('../views/UserSettings.vue')  // 用户管理
            },
            {
                path: 'settings/role',
                name: 'RoleSettings',
                component: () => import('../views/RoleSettings.vue')  // 角色管理
            },
            {
                path: 'ai-chat',
                name: 'AiChat',
                component: () => import('../views/AiChatPage.vue')  // AI 助手聊天页
            }
        ]
    }
]

// 创建路由实例
const router = createRouter({
    history: createWebHistory(),
    routes
})

/**
 * 全局路由守卫
 * 检查用户是否已登录（localStorage 中是否有 token）
 * 未登录时自动跳转到登录页
 */
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    if (to.path !== '/login' && !token) {
        next('/login')
    } else {
        next()
    }
})

export default router
