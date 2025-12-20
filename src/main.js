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

// 全局业务组件
import Pagination from '@/components/Pagination' // 分页组件
import RightToolbar from '@/components/RightToolbar' // 表格工具栏

// 插件系统（权限、缓存、下载等）
import plugins from './plugins'

// 全局工具函数
import {
  parseTime,
  resetForm,
  addDateRange,
  handleTree,
  selectDictLabel,
  selectDictLabels,
} from '@/utils/huacai.js'

const app = createApp(App)

/**
 * 挂载全局方法和工具函数
 * 这些方法可以在任何组件中通过 this.xxx 或 getCurrentInstance().appContext.config.globalProperties.xxx 访问
 */
// app.config.globalProperties.useDict = useDict // 字典工具
// app.config.globalProperties.download = download // 文件下载
app.config.globalProperties.parseTime = parseTime // 时间格式化
app.config.globalProperties.resetForm = resetForm // 表单重置
app.config.globalProperties.handleTree = handleTree // 树形数据处理
app.config.globalProperties.addDateRange = addDateRange // 日期范围处理
app.config.globalProperties.selectDictLabel = selectDictLabel // 字典标签选择
app.config.globalProperties.selectDictLabels = selectDictLabels // 字典标签多选

app.component('Pagination', Pagination)
app.component('RightToolbar', RightToolbar)

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
