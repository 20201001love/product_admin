/**
 * 路由权限守卫
 *
 * 职责：
 * 1. 路由跳转前的权限验证
 * 2. 动态加载用户路由
 * 3. Token 验证和登录状态管理
 * 4. 页面标题设置
 */

import router from './router'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress' // 页面加载进度条
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { isHttp, isPathMatch } from '@/utils/validate'
import { isRelogin } from '@/utils/request'
import useUserStore from '@/stores/modules/user'
import useSettingsStore from '@/stores/modules/settings'
import usePermissionStore from '@/stores/modules/permission'
import useProductStore from '@/stores/modules/product'
import useCustomerStore from '@/stores/modules/customer'
import auth from '@/plugins/auth'

// 配置进度条（不显示旋转动画）
NProgress.configure({ showSpinner: false })

// 白名单路由（无需登录即可访问）
const whiteList = ['/login', '/register']

// 判断路径是否在白名单中
const isWhiteList = (path) => {
  return whiteList.some((pattern) => isPathMatch(pattern, path))
}

/**
 * 路由前置守卫
 * 在每次路由跳转前执行
 */
router.beforeEach((to, from, next) => {
  NProgress.start() // 开始显示加载进度条

  // 情况1：用户已登录（有 Token）
  if (getToken()) {
    // 设置页面标题
    if (to.meta.title) {
      useSettingsStore().setTitle(to.meta.title)
    }

    // 如果已登录却访问登录页，重定向到首页
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
      return
    }

    // 如果访问的是白名单路由，直接放行
    if (isWhiteList(to.path)) {
      next()
      return
    }

    // 如果用户信息未加载（roles 为空），需要先获取用户信息和路由
    if (useUserStore().roles.length === 0) {
      isRelogin.show = true // 防止重复请求

      // 获取用户信息
      useUserStore()
        .getInfo()
        .then(() => {
          isRelogin.show = false

          // 根据用户权限动态生成路由
          usePermissionStore()
            .generateRoutes()
            .then((accessRoutes) => {
              // 将动态路由添加到路由表中
              accessRoutes.forEach((route) => {
                if (!isHttp(route.path)) {
                  // 排除外部链接
                  router.addRoute(route) // 动态添加可访问路由表
                }
              })

              // 初始化产品仓库（如果用户有权限）
              if (auth.hasPermi('demand:product:list')) {
                const productStore = useProductStore()
                productStore.getProductList().catch((error) => {
                  console.error('初始化产品列表失败:', error)
                })
              }

              // 初始化客户仓库（如果用户有权限）
              if (auth.hasPermi('demand:customer:list')) {
                const customerStore = useCustomerStore()
                customerStore.getCustomerList().catch((error) => {
                  console.error('初始化客户列表失败:', error)
                })
              }

              // 使用 replace 确保路由已添加完成后再跳转
              next({ ...to, replace: true })
            })
        })
        .catch((err) => {
          // 获取用户信息失败，退出登录
          useUserStore()
            .logOut()
            .then(() => {
              ElMessage.error(err)
              next({ path: '/' })
            })
        })
    } else {
      // 用户信息已加载，直接放行
      next()
    }
  } else {
    // 情况2：用户未登录（无 Token）
    if (isWhiteList(to.path)) {
      // 访问白名单路由，直接放行
      next()
    } else {
      // 其他路由需要登录，重定向到登录页，并保存目标路径用于登录后跳转
      next(`/login?redirect=${to.fullPath}`)
      NProgress.done()
    }
  }
})

/**
 * 路由后置守卫
 * 路由跳转完成后执行
 */
router.afterEach(() => {
  NProgress.done() // 关闭加载进度条
})
