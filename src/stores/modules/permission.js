/**
 * 权限管理 Store 模块
 *
 * 职责：
 * 1. 管理动态路由的生成和存储
 * 2. 将后端返回的路由字符串转换为 Vue Router 可用的路由对象
 * 3. 处理路由权限验证
 * 4. 管理侧边栏、顶部导航等路由数据
 */

import auth from '@/plugins/auth'
import router, { constantRoutes, dynamicRoutes } from '@/router'
import { getRouters } from '@/api/menu'
import Layout from '@/layout/index'
import ParentView from '@/components/ParentView'
import InnerLink from '@/layout/components/InnerLink'

// import.meta.glob 是一个强大的动态导入功能，用于批量导入文件目录中的模块
/**
 * 使用 Vite 的 glob 功能，动态匹配 views 目录下所有的 .vue 文件
 * 返回格式：{ './views/system/user/index.vue': () => import('./views/system/user/index.vue'), ... }
 * 用于将后端返回的字符串路径（如 'system/user/index'）转换为真正的组件导入函数
 */
const modules = import.meta.glob('./../../views/**/*.vue')

const usePermissionStore = defineStore('permission', {
  state: () => ({
    routes: [],
    addRoutes: [],
    defaultRoutes: [],
    topbarRouters: [],
    sidebarRouters: [],
  }),
  actions: {
    setRoutes(routes) {
      this.addRoutes = routes
      this.routes = constantRoutes.concat(routes)
    },
    setDefaultRoutes(routes) {
      this.defaultRoutes = constantRoutes.concat(routes)
    },
    setTopbarRoutes(routes) {
      this.topbarRouters = routes
    },
    setSidebarRouters(routes) {
      this.sidebarRouters = routes
    },
    /**
     * 生成动态路由
     *
     * 流程：
     * 1. 从后端获取路由数据（JSON 格式，component 字段为字符串）
     * 2. 将字符串 component 转换为真正的 Vue 组件
     * 3. 过滤并注册动态路由（基于权限）
     * 4. 生成不同场景下的路由数据（侧边栏、顶部导航等）
     *
     * @param {Array} roles - 用户角色（当前未使用，保留用于扩展）
     * @returns {Promise} 返回处理后的路由数组
     */
    generateRoutes(roles) {
      return new Promise((resolve) => {
        // 向后端请求路由数据
        getRouters().then((res) => {
          // 深拷贝路由数据，用于不同场景的处理
          const sdata = JSON.parse(JSON.stringify(res.data)) // 侧边栏路由
          const rdata = JSON.parse(JSON.stringify(res.data)) // 重写路由（用于路由表）
          const defaultData = JSON.parse(JSON.stringify(res.data)) // 默认路由（用于顶部导航）

          // 将后端返回的路由字符串转换为 Vue Router 路由对象
          const sidebarRoutes = filterAsyncRouter(sdata) // 侧边栏路由
          const rewriteRoutes = filterAsyncRouter(rdata, false, true) // 路由表路由（扁平化处理）
          const defaultRoutes = filterAsyncRouter(defaultData) // 顶部导航路由

          // 过滤并注册静态定义的动态路由（基于权限）
          const asyncRoutes = filterDynamicRoutes(dynamicRoutes)
          asyncRoutes.forEach((route) => {
            router.addRoute(route) // 动态添加到路由表
          })

          // 存储不同场景的路由数据
          this.setRoutes(rewriteRoutes) // 存储完整路由表
          this.setSidebarRouters(constantRoutes.concat(sidebarRoutes)) // 侧边栏路由（包含公共路由）
          this.setDefaultRoutes(sidebarRoutes) // 默认路由
          this.setTopbarRoutes(defaultRoutes) // 顶部导航路由

          resolve(rewriteRoutes)
        })
      })
    },
  },
})

/**
 * 将后端返回的路由数据转换为 Vue Router 可用的路由对象
 *
 * 后端返回格式示例：
 * {
 *   path: '/system',
 *   component: 'Layout',  // 或 'system/user/index' 这样的字符串
 *   children: [...]
 * }
 *
 * 转换后：
 * {
 *   path: '/system',
 *   component: Layout,  // 真正的组件对象或函数
 *   children: [...]
 * }
 *
 * @param {Array} asyncRouterMap - 后端返回的路由数组
 * @param {Object} lastRouter - 父路由对象（用于路径拼接）
 * @param {Boolean} type - 是否扁平化处理子路由
 * @returns {Array} 转换后的路由数组
 */
function filterAsyncRouter(asyncRouterMap, lastRouter = false, type = false) {
  return asyncRouterMap.filter((route) => {
    // 如果需要扁平化处理，先处理子路由
    if (type && route.children) {
      route.children = filterChildren(route.children)
    }

    // 转换 component 字段：从字符串转为真正的组件
    if (route.component) {
      // 特殊组件直接映射
      if (route.component === 'Layout') {
        route.component = Layout // 布局组件
      } else if (route.component === 'ParentView') {
        route.component = ParentView // 父视图组件（用于多级菜单）
      } else if (route.component === 'InnerLink') {
        route.component = InnerLink // 内部链接组件
      } else {
        // 普通页面组件：通过 loadView 动态加载
        // route.component 可能是 'system/user/index' 这样的字符串
        route.component = loadView(route.component)
      }
    }

    // 递归处理子路由
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type)
    } else {
      // 没有子路由时，删除空字段
      delete route['children']
      delete route['redirect']
    }
    return true
  })
}

function filterChildren(childrenMap, lastRouter = false) {
  var children = []
  childrenMap.forEach((el) => {
    el.path = lastRouter ? lastRouter.path + '/' + el.path : el.path
    if (el.children && el.children.length && el.component === 'ParentView') {
      children = children.concat(filterChildren(el.children, el))
    } else {
      children.push(el)
    }
  })
  return children
}

// 动态路由遍历，验证是否具备权限
export function filterDynamicRoutes(routes) {
  const res = []
  routes.forEach((route) => {
    if (route.permissions) {
      if (auth.hasPermiOr(route.permissions)) {
        res.push(route)
      }
    } else if (route.roles) {
      if (auth.hasRoleOr(route.roles)) {
        res.push(route)
      }
    }
  })
  return res
}

/**
 * 动态加载视图组件
 *
 * 将后端返回的字符串路径（如 'system/user/index'）转换为真正的组件导入函数
 *
 * 原理：
 * 1. 使用 import.meta.glob 预加载所有 views 下的 .vue 文件
 * 2. 匹配字符串路径与文件路径
 * 3. 返回一个懒加载函数，Vue Router 会在需要时调用
 *
 * 示例：
 * loadView('system/user/index')
 * => () => import('@/views/system/user/index.vue')
 *
 * @param {String} view - 视图路径字符串，如 'system/user/index'
 * @returns {Function} 返回组件导入函数，如果找不到则返回 undefined
 */
export const loadView = (view) => {
  let res
  // 遍历所有已匹配的 .vue 文件
  for (const path in modules) {
    // 从完整路径中提取相对路径
    // 例如：'./../../views/system/user/index.vue' => 'system/user/index'
    const dir = path.split('views/')[1].split('.vue')[0]

    // 如果匹配，返回一个懒加载函数
    if (dir === view) {
      res = () => modules[path]() // 返回 () => import('@/views/xxx.vue')
    }
  }
  return res
}

export default usePermissionStore
