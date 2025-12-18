import defaultSettings from '@/settings.js'
import { useDark, useToggle } from '@vueuse/core'
import { useDynamicTitle } from '@/utils/dynamicTitle'

/**
 * useDark() - VueUse 提供的暗黑模式管理函数
 *
 * 功能说明：
 * 1. 自动检测系统主题偏好（通过 prefers-color-scheme CSS 媒体查询）
 * 2. 返回一个响应式的 ref 对象，值为 true 表示暗黑模式，false 表示亮色模式
 * 3. 自动同步到 localStorage，持久化保存用户的主题选择
 * 4. 自动在 <html> 标签上添加/移除 'dark' class，方便 CSS 样式控制
 *
 * 返回值：Ref<boolean> - 一个响应式引用，可以通过 .value 访问当前状态
 *
 * 示例：
 * isDark.value === true  // 当前是暗黑模式
 * isDark.value === false // 当前是亮色模式
 */
const isDark = useDark()

/**
 * useToggle(isDark) - VueUse 提供的切换函数生成器
 *
 * 功能说明：
 * 1. 接收一个 ref 对象作为参数（这里是 isDark）
 * 2. 返回一个切换函数，调用该函数会自动切换 ref 的值（true ↔ false）
 * 3. 如果当前 isDark.value 是 true，调用 toggleDark() 后会变成 false
 * 4. 如果当前 isDark.value 是 false，调用 toggleDark() 后会变成 true
 *
 * 返回值：() => void - 一个无参数的函数，调用即可切换状态
 *
 * 使用示例：
 * toggleDark()  // 切换暗黑模式（亮色 ↔ 暗黑）
 */
const toggleDark = useToggle(isDark)

// 从默认设置中解构出各个配置项
const { sideTheme, showSettings, topNav, tagsView, fixedHeader, sidebarLogo, dynamicTitle } = defaultSettings

// 从 localStorage 中获取布局设置，如果没有则使用默认设置
const storageSetting = JSON.parse(localStorage.getItem('layout-setting')) || ''

const useSettingsStore = defineStore(
  'settings',
  {
    state: () => ({
      title: '',
      theme: storageSetting.theme || '#409EFF',
      sideTheme: storageSetting.sideTheme || sideTheme,
      showSettings: showSettings,
      topNav: storageSetting.topNav === undefined ? topNav : storageSetting.topNav,
      tagsView: storageSetting.tagsView === undefined ? tagsView : storageSetting.tagsView,
      fixedHeader: storageSetting.fixedHeader === undefined ? fixedHeader : storageSetting.fixedHeader,
      sidebarLogo: storageSetting.sidebarLogo === undefined ? sidebarLogo : storageSetting.sidebarLogo,
      dynamicTitle: storageSetting.dynamicTitle === undefined ? dynamicTitle : storageSetting.dynamicTitle,
      isDark: isDark.value
    }),
    actions: {
      // 修改布局设置
      changeSetting(data) {
        const { key, value } = data
        if (this.hasOwnProperty(key)) {
          this[key] = value
        }
      },
      // 设置网页标题
      setTitle(title) {
        this.title = title
        useDynamicTitle()
      },
      // 切换暗黑模式
      toggleTheme() {
        this.isDark = !this.isDark
        toggleDark()
      }
    }
  })

export default useSettingsStore
