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
import 'virtual:svg-icons-register'
import SvgIcon from '@/components/SvgIcon'
import elementIcons from '@/components/SvgIcon/svgicon'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(ElementPlus, {
  locale,
  size: Cookies.get('size') || 'default'
})
app.use(elementIcons)
app.component('svg-icon', SvgIcon)

app.mount('#app')
