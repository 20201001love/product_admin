/**
 * v-hasRole 角色权限控制指令
 *
 * 功能说明：
 * 根据用户的角色（roles）控制元素的显示/隐藏
 * 如果用户没有指定的角色，则从 DOM 中移除该元素
 *
 * 使用方式：
 * <el-button v-hasRole="['admin']">管理员功能</el-button>
 * <el-button v-hasRole="['editor', 'reviewer']">编辑/审核功能</el-button>
 *
 * 角色判断逻辑：
 * 1. 如果用户拥有超级管理员角色 "admin"，则直接通过
 * 2. 如果用户角色列表中包含指令值中的任意一个角色，则通过
 * 3. 否则移除元素
 *
 * 注意事项：
 * - 指令值必须是数组格式
 * - 如果角色验证失败，元素会被从 DOM 中移除（而非隐藏）
 * - 需要确保 useUserStore 中已正确设置 roles
 * - 超级管理员角色固定为 "admin"
 */

import useUserStore from '@/stores/modules/user'

export default {
  /**
   * 指令挂载时执行角色检查
   * @param {HTMLElement} el - 绑定指令的 DOM 元素
   * @param {Object} binding - 指令绑定对象
   * @param {Array} binding.value - 需要的角色数组，如 ['admin', 'editor']
   * @param {VNode} _vnode - Vue 虚拟节点（未使用）
   */
  mounted(el, binding, _vnode) {
    const { value } = binding
    // 超级管理员角色标识，拥有此角色的用户可以访问所有功能
    const super_admin = 'admin'
    // 从用户 Store 中获取当前用户的所有角色
    const roles = useUserStore().roles

    // 验证指令值格式：必须是数组且不为空
    if (value && value instanceof Array && value.length > 0) {
      const roleFlag = value

      // 检查用户是否拥有所需角色
      // some() 方法：只要有一个角色匹配就返回 true
      const hasRole = roles.some((role) => {
        // 判断条件：
        // 1. 用户拥有超级管理员角色
        // 2. 用户角色列表中包含指令要求的任意一个角色
        return super_admin === role || roleFlag.includes(role)
      })

      // 如果没有角色权限，从 DOM 中移除元素
      if (!hasRole && el.parentNode) {
        el.parentNode.removeChild(el)
      }
    } else {
      // 指令值格式错误，抛出异常提示开发者
      throw new Error(`请设置角色权限标签值`)
    }
  },
}
