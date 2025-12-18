/**
 * 会话级缓存对象（SessionStorage 封装）
 * 使用浏览器 sessionStorage API，数据在关闭标签页/窗口后自动清除
 * 适合存储临时数据、表单草稿等不需要持久化的信息
 */
const sessionCache = {
  /**
   * 设置会话级缓存（字符串值）
   *
   * @param {string} key - 存储的键名
   * @param {string} value - 存储的值（必须是字符串）
   * @returns {void}
   *
   * @example
   * // 存储字符串
   * cache.session.set('username', 'admin')
   *
   * @example
   * // 存储临时状态
   * cache.session.set('formDraft', 'draft data')
   */
  set (key, value) {
    // 检查浏览器是否支持 sessionStorage
    if (!sessionStorage) {
      return
    }
    // 只有当 key 和 value 都不为空时才存储
    if (key != null && value != null) {
      sessionStorage.setItem(key, value)
    }
  },

  /**
   * 获取会话级缓存（字符串值）
   *
   * @param {string} key - 要获取的键名
   * @returns {string|null} 存储的值，不存在或 key 为空时返回 null
   *
   * @example
   * // 获取存储的值
   * const username = cache.session.get('username')  // "admin"
   *
   * @example
   * // 获取不存在的值
   * const value = cache.session.get('notExist')  // null
   */
  get (key) {
    // 检查浏览器是否支持 sessionStorage
    if (!sessionStorage) {
      return null
    }
    // 如果 key 为空，直接返回 null
    if (key == null) {
      return null
    }
    return sessionStorage.getItem(key)
  },

  /**
   * 设置会话级缓存（JSON 对象）
   * 自动将对象序列化为 JSON 字符串存储
   *
   * @param {string} key - 存储的键名
   * @param {Object|Array} jsonValue - 要存储的 JSON 对象或数组
   * @returns {void}
   *
   * @example
   * // 存储对象
   * const userInfo = { name: '张三', age: 25 }
   * cache.session.setJSON('userInfo', userInfo)
   *
   * @example
   * // 存储数组
   * const items = [{ id: 1, name: 'item1' }, { id: 2, name: 'item2' }]
   * cache.session.setJSON('items', items)
   *
   * @example
   * // 存储表单数据
   * const formData = { username: 'admin', password: '123456' }
   * cache.session.setJSON('loginForm', formData)
   */
  setJSON (key, jsonValue) {
    // 只有当值不为空时才存储
    if (jsonValue != null) {
      // 将对象序列化为 JSON 字符串后存储
      this.set(key, JSON.stringify(jsonValue))
    }
  },

  /**
   * 获取会话级缓存（JSON 对象）
   * 自动将存储的 JSON 字符串反序列化为对象
   *
   * @param {string} key - 要获取的键名
   * @returns {Object|Array|null} 解析后的对象或数组，不存在时返回 null
   *
   * @example
   * // 获取对象
   * const userInfo = cache.session.getJSON('userInfo')
   * // 结果: { name: '张三', age: 25 }
   *
   * @example
   * // 获取数组
   * const items = cache.session.getJSON('items')
   * // 结果: [{ id: 1, name: 'item1' }, { id: 2, name: 'item2' }]
   *
   * @example
   * // 获取不存在的值
   * const data = cache.session.getJSON('notExist')  // null
   */
  getJSON (key) {
    // 先获取字符串值
    const value = this.get(key)
    // 如果值存在，解析为 JSON 对象
    if (value != null) {
      return JSON.parse(value)
    }
    return null
  },

  /**
   * 删除会话级缓存
   *
   * @param {string} key - 要删除的键名
   * @returns {void}
   *
   * @example
   * // 删除单个缓存
   * cache.session.remove('username')
   *
   * @example
   * // 清除临时数据
   * cache.session.remove('formDraft')
   */
  remove (key) {
    // 检查浏览器是否支持 sessionStorage
    if (!sessionStorage) {
      return
    }
    sessionStorage.removeItem(key)
  }
}
/**
 * 本地持久化缓存对象（LocalStorage 封装）
 * 使用浏览器 localStorage API，数据会持久化保存，关闭浏览器后仍然存在
 * 适合存储用户偏好设置、主题配置等需要持久化的信息
 */
const localCache = {
  /**
   * 设置本地缓存（字符串值）
   *
   * @param {string} key - 存储的键名
   * @param {string} value - 存储的值（必须是字符串）
   * @returns {void}
   *
   * @example
   * // 存储用户偏好
   * cache.local.set('theme', 'dark')
   *
   * @example
   * // 存储语言设置
   * cache.local.set('language', 'zh-CN')
   */
  set (key, value) {
    // 检查浏览器是否支持 localStorage
    if (!localStorage) {
      return
    }
    // 只有当 key 和 value 都不为空时才存储
    if (key != null && value != null) {
      localStorage.setItem(key, value)
    }
  },

  /**
   * 获取本地缓存（字符串值）
   *
   * @param {string} key - 要获取的键名
   * @returns {string|null} 存储的值，不存在或 key 为空时返回 null
   *
   * @example
   * // 获取存储的值
   * const theme = cache.local.get('theme')  // "dark"
   *
   * @example
   * // 获取不存在的值
   * const value = cache.local.get('notExist')  // null
   */
  get (key) {
    // 检查浏览器是否支持 localStorage
    if (!localStorage) {
      return null
    }
    // 如果 key 为空，直接返回 null
    if (key == null) {
      return null
    }
    return localStorage.getItem(key)
  },

  /**
   * 设置本地缓存（JSON 对象）
   * 自动将对象序列化为 JSON 字符串存储
   *
   * @param {string} key - 存储的键名
   * @param {Object|Array} jsonValue - 要存储的 JSON 对象或数组
   * @returns {void}
   *
   * @example
   * // 存储用户设置
   * const settings = { theme: 'dark', language: 'zh-CN', fontSize: 14 }
   * cache.local.setJSON('userSettings', settings)
   *
   * @example
   * // 存储布局配置
   * const layout = { sidebar: true, tagsView: true, fixedHeader: true }
   * cache.local.setJSON('layout-setting', layout)
   *
   * @example
   * // 存储购物车数据
   * const cart = [{ id: 1, name: '商品1', count: 2 }]
   * cache.local.setJSON('shoppingCart', cart)
   */
  setJSON (key, jsonValue) {
    // 只有当值不为空时才存储
    if (jsonValue != null) {
      // 将对象序列化为 JSON 字符串后存储
      this.set(key, JSON.stringify(jsonValue))
    }
  },

  /**
   * 获取本地缓存（JSON 对象）
   * 自动将存储的 JSON 字符串反序列化为对象
   *
   * @param {string} key - 要获取的键名
   * @returns {Object|Array|null} 解析后的对象或数组，不存在时返回 null
   *
   * @example
   * // 获取用户设置
   * const settings = cache.local.getJSON('userSettings')
   * // 结果: { theme: 'dark', language: 'zh-CN', fontSize: 14 }
   *
   * @example
   * // 获取布局配置
   * const layout = cache.local.getJSON('layout-setting')
   * // 结果: { sidebar: true, tagsView: true, fixedHeader: true }
   *
   * @example
   * // 获取不存在的值
   * const data = cache.local.getJSON('notExist')  // null
   */
  getJSON (key) {
    // 先获取字符串值
    const value = this.get(key)
    // 如果值存在，解析为 JSON 对象
    if (value != null) {
      return JSON.parse(value)
    }
    return null
  },

  /**
   * 删除本地缓存
   *
   * @param {string} key - 要删除的键名
   * @returns {void}
   *
   * @example
   * // 删除单个缓存
   * cache.local.remove('theme')
   *
   * @example
   * // 清除用户设置
   * cache.local.remove('userSettings')
   */
  remove (key) {
    // 检查浏览器是否支持 localStorage
    if (!localStorage) {
      return
    }
    localStorage.removeItem(key)
  }
}

/**
 * 缓存工具模块
 * 提供 sessionStorage 和 localStorage 的统一封装接口
 *
 * @module cache
 *
 * @example
 * // 导入缓存工具
 * import cache from '@/plugins/cache'
 *
 * @example
 * // 使用会话级缓存（关闭标签页后清除）
 * cache.session.set('tempData', 'value')
 * cache.session.get('tempData')
 * cache.session.setJSON('formData', { name: 'test' })
 * cache.session.getJSON('formData')
 * cache.session.remove('tempData')
 *
 * @example
 * // 使用本地缓存（持久化保存）
 * cache.local.set('theme', 'dark')
 * cache.local.get('theme')
 * cache.local.setJSON('settings', { theme: 'dark' })
 * cache.local.getJSON('settings')
 * cache.local.remove('theme')
 *
 * @example
 * // 实际使用场景 - 保存用户偏好设置
 * const userSettings = {
 *   theme: 'dark',
 *   language: 'zh-CN',
 *   sidebarCollapse: false
 * }
 * cache.local.setJSON('userSettings', userSettings)
 *
 * // 页面加载时恢复设置
 * const savedSettings = cache.local.getJSON('userSettings')
 * if (savedSettings) {
 *   // 应用设置
 *   applySettings(savedSettings)
 * }
 *
 * @example
 * // 实际使用场景 - 保存表单草稿（会话级）
 * const formData = {
 *   username: 'admin',
 *   email: 'admin@example.com'
 * }
 * cache.session.setJSON('formDraft', formData)
 *
 * // 页面加载时恢复草稿
 * const draft = cache.session.getJSON('formDraft')
 * if (draft) {
 *   form.value = draft
 * }
 */
export default {
  /**
   * 会话级缓存（SessionStorage）
   * 数据在关闭标签页/窗口后自动清除
   * 适合存储临时数据、表单草稿等
   */
  session: sessionCache,

  /**
   * 本地缓存（LocalStorage）
   * 数据会持久化保存，关闭浏览器后仍然存在
   * 适合存储用户偏好设置、主题配置等
   */
  local: localCache
}
