import useUserStore from '@/stores/modules/user'

/**
 * 权限验证函数（内部使用）
 * 检查用户是否拥有指定的权限
 *
 * 权限验证规则：
 * 1. 如果用户拥有超级权限 "*:*:*"，则拥有所有权限
 * 2. 如果用户拥有与传入权限完全匹配的权限，则通过验证
 * 3. 如果传入的权限为空或无效，则返回 false
 *
 * @param {string} permission - 要验证的权限字符串
 *                            格式通常为 "模块:功能:操作"，如 "system:user:add"
 * @returns {boolean} true 表示用户拥有该权限，false 表示没有
 *
 * @example
 * // 验证用户是否有添加用户的权限
 * authPermission('system:user:add')
 * // 返回 true 如果用户有该权限或拥有 "*:*:*" 超级权限
 *
 * @example
 * // 验证用户是否有删除权限的权限
 * authPermission('system:permission:delete')
 *
 * @example
 * // 无效权限返回 false
 * authPermission('')  // false
 * authPermission(null)  // false
 */
function authPermission(permission) {
  // 超级权限标识，拥有此权限的用户拥有所有权限
  const all_permission = "*:*:*"
  // 从用户 store 中获取当前用户的所有权限列表
  const permissions = useUserStore().permissions

  // 只有当传入的权限不为空时才进行验证
  if (permission && permission.length > 0) {
    // 检查用户权限列表中是否存在：
    // 1. 超级权限 "*:*:*"（拥有所有权限）
    // 2. 完全匹配的权限
    return permissions.some(v => {
      return all_permission === v || v === permission
    })
  } else {
    // 如果权限参数无效，返回 false
    return false
  }
}

/**
 * 角色验证函数（内部使用）
 * 检查用户是否拥有指定的角色
 *
 * 角色验证规则：
 * 1. 如果用户拥有超级管理员角色 "admin"，则拥有所有角色权限
 * 2. 如果用户拥有与传入角色完全匹配的角色，则通过验证
 * 3. 如果传入的角色为空或无效，则返回 false
 *
 * @param {string} role - 要验证的角色名称
 *                      如 "admin"、"editor"、"viewer" 等
 * @returns {boolean} true 表示用户拥有该角色，false 表示没有
 *
 * @example
 * // 验证用户是否是管理员
 * authRole('admin')
 * // 返回 true 如果用户是 admin 或拥有 admin 角色
 *
 * @example
 * // 验证用户是否是编辑者
 * authRole('editor')
 *
 * @example
 * // 验证用户是否是查看者
 * authRole('viewer')
 *
 * @example
 * // 无效角色返回 false
 * authRole('')  // false
 * authRole(null)  // false
 */
function authRole(role) {
  // 超级管理员角色标识，拥有此角色的用户拥有所有权限
  const super_admin = "admin"
  // 从用户 store 中获取当前用户的所有角色列表
  const roles = useUserStore().roles

  // 只有当传入的角色不为空时才进行验证
  if (role && role.length > 0) {
    // 检查用户角色列表中是否存在：
    // 1. 超级管理员角色 "admin"（拥有所有权限）
    // 2. 完全匹配的角色
    return roles.some(v => {
      return super_admin === v || v === role
    })
  } else {
    // 如果角色参数无效，返回 false
    return false
  }
}

export default {
  // 验证用户是否具备某权限
  hasPermi(permission) {
    return authPermission(permission)
  },
  // 验证用户是否含有指定权限，只需包含其中一个
  hasPermiOr(permissions) {
    return permissions.some(item => {
      return authPermission(item)
    })
  },
  // 验证用户是否含有指定权限，必须全部拥有
  hasPermiAnd(permissions) {
    return permissions.every(item => {
      return authPermission(item)
    })
  },
  // 验证用户是否具备某角色
  hasRole(role) {
    return authRole(role)
  },
  // 验证用户是否含有指定角色，只需包含其中一个
  hasRoleOr(roles) {
    return roles.some(item => {
      return authRole(item)
    })
  },
  // 验证用户是否含有指定角色，必须全部拥有
  hasRoleAnd(roles) {
    return roles.every(item => {
      return authRole(item)
    })
  }
}
