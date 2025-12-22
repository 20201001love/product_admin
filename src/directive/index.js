/**
 * 自定义指令统一注册入口
 *
 * 职责：
 * 1. 导入所有自定义指令模块
 * 2. 将指令注册到 Vue 应用实例
 * 3. 使指令可以在全局使用
 *
 * 注册的指令：
 * - v-hasRole: 角色权限控制指令
 * - v-hasPermi: 操作权限控制指令
 * - v-copyText: 文本复制指令
 */

import hasRole from './permission/hasRole'
import hasPermi from './permission/hasPermi'
import copyText from './common/copyText'

/**
 * 注册所有自定义指令到 Vue 应用
 * @param {Object} app - Vue 应用实例
 */
export default function directive(app) {
  // 注册角色权限指令
  app.directive('hasRole', hasRole)
  // 注册操作权限指令
  app.directive('hasPermi', hasPermi)
  // 注册文本复制指令
  app.directive('copyText', copyText)
}
