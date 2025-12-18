/**
 * 应用全局状态管理 Store
 * 管理侧边栏状态、设备类型、组件尺寸等全局应用配置
 *
 * @module stores/modules/app
 */

// 导入 Cookie 操作库，用于持久化存储用户偏好设置
import Cookies from 'js-cookie'

/**
 * 应用状态管理 Store
 * 使用 Pinia 进行状态管理，提供响应式的全局状态
 */
const useAppStore = defineStore(
  'app',
  {
    /**
     * 应用状态定义
     * 包含侧边栏状态、设备类型、组件尺寸等
     */
    state: () => ({
      /**
       * 侧边栏状态对象
       * @property {boolean} opened - 侧边栏是否打开
       *                               从 Cookie 中读取，如果不存在则默认为 true（打开状态）
       *                               使用 !!+ 将字符串转换为布尔值：'1' -> true, '0' -> false
       * @property {boolean} withoutAnimation - 是否禁用动画效果
       *                                         true: 切换时无动画，false: 有平滑过渡动画
       * @property {boolean} hide - 是否完全隐藏侧边栏
       *                            true: 隐藏侧边栏（移动端或特殊场景），false: 显示侧边栏
       */
      sidebar: {
        // 从 Cookie 读取侧边栏状态，如果 Cookie 值为 '1' 则打开，'0' 则关闭，默认打开
        // !!+ 的作用：将字符串 '1' 或 '0' 转换为布尔值 true 或 false
        opened: Cookies.get('sidebarStatus') ? !!+Cookies.get('sidebarStatus') : true,
        withoutAnimation: false,
        hide: false
      },

      /**
       * 设备类型
       * @type {string}
       * @description 标识当前设备类型，用于响应式布局
       *              - 'desktop': 桌面端（默认）
       *              - 'mobile': 移动端
       *              用于控制不同设备下的布局和交互方式
       */
      device: 'desktop',

      /**
       * 组件尺寸
       * @type {string}
       * @description Element Plus 组件的全局尺寸设置
       *              从 Cookie 中读取，如果不存在则默认为 'default'
       *              可选值：'large' | 'default' | 'small'
       *              影响所有 Element Plus 组件的默认尺寸
       */
      size: Cookies.get('size') || 'default'
    }),

    /**
     * 状态操作方法
     * 提供修改状态的 action 方法
     */
    actions: {
      /**
       * 切换侧边栏打开/关闭状态
       * 如果侧边栏被隐藏（hide=true），则不允许切换
       * 切换后会将状态保存到 Cookie 中，实现持久化
       *
       * @param {boolean} withoutAnimation - 是否禁用动画
       *                                     true: 切换时无动画效果
       *                                     false 或 undefined: 有平滑过渡动画
       * @returns {boolean|void} 如果侧边栏被隐藏返回 false，否则返回 undefined
       *
       * @example
       * // 在组件中使用
       * import { useAppStore } from '@/stores/modules/app'
       *
       * const appStore = useAppStore()
       *
       * // 切换侧边栏（带动画）
       * appStore.toggleSideBar()
       *
       * // 切换侧边栏（无动画）
       * appStore.toggleSideBar(true)
       *
       * @example
       * // 在按钮点击事件中使用
       * <el-button @click="appStore.toggleSideBar()">切换侧边栏</el-button>
       */
      toggleSideBar(withoutAnimation) {
        // 如果侧边栏被隐藏，不允许切换
        if (this.sidebar.hide) {
          return false
        }
        // 切换打开/关闭状态
        this.sidebar.opened = !this.sidebar.opened
        // 设置动画状态
        this.sidebar.withoutAnimation = withoutAnimation
        // 将状态保存到 Cookie，实现持久化
        // 1 表示打开，0 表示关闭
        if (this.sidebar.opened) {
          Cookies.set('sidebarStatus', 1)
        } else {
          Cookies.set('sidebarStatus', 0)
        }
      },

      /**
       * 关闭侧边栏
       * 强制关闭侧边栏，无论当前状态如何
       * 通常用于移动端或特定场景下的响应式处理
       *
       * @param {Object} options - 配置选项
       * @param {boolean} options.withoutAnimation - 是否禁用动画
       *                                              true: 关闭时无动画效果
       *                                              false 或 undefined: 有平滑过渡动画
       *
       * @example
       * // 关闭侧边栏（带动画）
       * appStore.closeSideBar({ withoutAnimation: false })
       *
       * @example
       * // 关闭侧边栏（无动画，常用于移动端）
       * appStore.closeSideBar({ withoutAnimation: true })
       *
       * @example
       * // 在移动端响应式处理中使用
       * if (window.innerWidth < 768) {
       *   appStore.closeSideBar({ withoutAnimation: true })
       * }
       */
      closeSideBar({ withoutAnimation }) {
        // 保存关闭状态到 Cookie
        Cookies.set('sidebarStatus', 0)
        // 设置为关闭状态
        this.sidebar.opened = false
        // 设置动画状态
        this.sidebar.withoutAnimation = withoutAnimation
      },

      /**
       * 切换设备类型
       * 用于响应式布局，根据设备类型调整界面显示
       *
       * @param {string} device - 设备类型
       *                          'desktop': 桌面端
       *                          'mobile': 移动端
       *
       * @example
       * // 设置为移动端
       * appStore.toggleDevice('mobile')
       *
       * @example
       * // 设置为桌面端
       * appStore.toggleDevice('desktop')
       *
       * @example
       * // 在窗口大小变化时使用
       * window.addEventListener('resize', () => {
       *   const isMobile = window.innerWidth < 768
       *   appStore.toggleDevice(isMobile ? 'mobile' : 'desktop')
       * })
       */
      toggleDevice(device) {
        this.device = device
      },

      /**
       * 设置组件尺寸
       * 设置 Element Plus 组件的全局尺寸，并持久化到 Cookie
       *
       * @param {string} size - 组件尺寸
       *                        'large': 大尺寸
       *                        'default': 默认尺寸（默认值）
       *                        'small': 小尺寸
       *
       * @example
       * // 设置为大尺寸
       * appStore.setSize('large')
       *
       * @example
       * // 设置为小尺寸
       * appStore.setSize('small')
       *
       * @example
       * // 在用户偏好设置中使用
       * <el-radio-group v-model="size" @change="appStore.setSize">
       *   <el-radio label="large">大</el-radio>
       *   <el-radio label="default">默认</el-radio>
       *   <el-radio label="small">小</el-radio>
       * </el-radio-group>
       */
      setSize(size) {
        this.size = size
        // 保存到 Cookie，实现持久化
        Cookies.set('size', size)
      },

      /**
       * 切换侧边栏隐藏状态
       * 控制侧边栏是否完全隐藏（不同于关闭，隐藏时侧边栏不占用空间）
       * 通常用于移动端或全屏场景
       *
       * @param {boolean} status - 是否隐藏
       *                          true: 隐藏侧边栏
       *                          false: 显示侧边栏
       *
       * @example
       * // 隐藏侧边栏（移动端场景）
       * appStore.toggleSideBarHide(true)
       *
       * @example
       * // 显示侧边栏
       * appStore.toggleSideBarHide(false)
       *
       * @example
       * // 在响应式布局中使用
       * const isMobile = window.innerWidth < 768
       * appStore.toggleSideBarHide(isMobile)
       */
      toggleSideBarHide(status) {
        this.sidebar.hide = status
      }
    }
  })

export default useAppStore
