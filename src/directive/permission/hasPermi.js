/**
 * v-hasPermi 操作权限控制指令
 *
 * 功能说明：
 * 根据用户的操作权限（permissions）控制元素的显示/隐藏
 * 如果用户没有指定的权限，则从 DOM 中移除该元素
 *
 * 使用方式：
 * <el-button v-hasPermi="['system:user:add']">新增</el-button>
 * <el-button v-hasPermi="['system:user:edit', 'system:user:remove']">编辑/删除</el-button>
 *
 * 权限判断逻辑：
 * 1. 如果用户拥有超级权限 "*:*:*"，则直接通过
 * 2. 如果用户权限列表中包含指令值中的任意一个权限，则通过
 * 3. 否则移除元素
 *
 * 注意事项：
 * - 指令值必须是数组格式
 * - 如果权限验证失败，元素会被从 DOM 中移除（而非隐藏）
 * - 需要确保 useUserStore 中已正确设置 permissions
 */

import useUserStore from '@/stores/modules/user'

export default {
  /**
   * 指令挂载时执行权限检查
   * @param {HTMLElement} el - 绑定指令的 DOM 元素
   * @param {Object} binding - 指令绑定对象
   * @param {Array} binding.value - 需要的权限数组，如 ['system:user:add']
   * @param {VNode} _vnode - Vue 虚拟节点（未使用）
   */
  mounted(el, binding, _vnode) {
    const { value } = binding
    // 超级权限标识，拥有此权限的用户可以访问所有功能
    const all_permission = '*:*:*'
    // 从用户 Store 中获取当前用户的所有权限
    const permissions = useUserStore().permissions

    // 验证指令值格式：必须是数组且不为空
    if (value && value instanceof Array && value.length > 0) {
      const permissionFlag = value

      // 检查用户是否拥有所需权限
      // some() 方法：只要有一个权限匹配就返回 true
      const hasPermissions = permissions.some((permission) => {
        // 判断条件：
        // 1. 用户拥有超级权限
        // 2. 用户权限列表中包含指令要求的任意一个权限
        return all_permission === permission || permissionFlag.includes(permission)
      })

      // 如果没有权限，从 DOM 中移除元素
      if (!hasPermissions && el.parentNode) {
        el.parentNode.removeChild(el)
      }
    } else {
      // 指令值格式错误，抛出异常提示开发者
      throw new Error(`请设置操作权限标签值`)
    }
  },
}
