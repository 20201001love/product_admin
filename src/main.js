// Element Plus UI 组件库
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import locale from 'element-plus/es/locale/lang/zh-cn'
// 全局样式
import '@/assets/styles/index.scss'
import { createApp } from 'vue'
import pinia from './stores'
import Cookies from 'js-cookie'
import App from './App.vue'
import router from './router'
import './permission' // 导入路由权限守卫
import 'virtual:svg-icons-register'
import SvgIcon from '@/components/SvgIcon'
import elementIcons from '@/components/SvgIcon/svgicon'
import VxeUITable from 'vxe-table'
import VxeUIAll from 'vxe-pc-ui'

// 插件系统（权限、缓存、下载等）
import plugins from './plugins'

const app = createApp(App)
// 注册 VXE Table 相关插件
app.use(VxeUITable) // VXE Table 核心
app.use(VxeUIAll) // VXE UI 组件

app.use(pinia)
app.use(router)
// 使用插件系统
app.use(plugins)
app.use(ElementPlus, {
  locale,
  size: Cookies.get('size') || 'default',
})
app.use(elementIcons)
app.component('svg-icon', SvgIcon)

app.mount('#app')
