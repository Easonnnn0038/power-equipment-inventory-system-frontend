import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../views/MainLayout.vue'
import { ElMessage } from 'element-plus'

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

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    if (to.path !== '/login' && !token) {
        next('/login')
        return
    }
    if (to.meta && to.meta.roles) {
        const userRole = localStorage.getItem('role') || 'user'
        if (!to.meta.roles.includes(userRole)) {
            ElMessage.warning('该身份暂不支持此操作')
            next(from.path !== '/login' ? false : '/admin/home')
            return
        }
    }
    next()
})

export default router
