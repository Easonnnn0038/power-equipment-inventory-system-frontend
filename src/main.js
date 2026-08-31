import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// Element Plus 组件 & icons 由 unplugin-vue-components 按需自动导入
// 样式（CSS）通过 ElementPlusResolver({ importStyle: 'css' }) 按需注入
const app = createApp(App)
app.use(router)
app.mount('#app')
