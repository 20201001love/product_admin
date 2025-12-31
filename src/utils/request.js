/**
 * HTTP 请求工具模块
 *
 * 功能：
 * 1. 封装 axios 实例，统一配置请求和响应拦截器
 * 2. 自动处理 Token 认证
 * 3. 防止重复提交请求
 * 4. 统一处理响应状态码和错误信息
 * 5. 提供文件下载功能
 *
 * @module utils/request
 */

// ==================== 导入依赖 ====================
import axios from 'axios' // HTTP 请求库
import { ElNotification, ElMessageBox, ElMessage, ElLoading } from 'element-plus' // Element Plus UI 组件（用于消息提示）
import { getToken } from '@/utils/auth' // 获取 Token 的工具函数
import errorCode from '@/utils/errorCode' // 错误码映射表
import { tansParams, blobValidate } from '@/utils/huacai.js' // 参数转换和 Blob 验证工具
import cache from '@/plugins/cache' // 缓存插件（用于防重复提交）
import { saveAs } from 'file-saver' // 文件保存库
import useUserStore from '@/stores/modules/user' // 用户状态管理 Store

// ==================== 全局变量 ====================
/**
 * 下载加载实例
 * 用于在文件下载时显示加载动画
 * @type {Object}
 */
let downloadLoadingInstance

/**
 * 是否显示重新登录弹窗的标志
 * 用于防止在 401 错误时重复弹出登录提示
 * @type {Object}
 * @property {boolean} show - 是否正在显示重新登录弹窗
 */
export let isRelogin = { show: false }

// ==================== 配置 Axios 默认设置 ====================
/**
 * 设置 axios 默认请求头
 * 所有请求默认使用 JSON 格式，字符编码为 UTF-8
 */
axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

/**
 * 创建 axios 实例
 * 配置统一的请求基础 URL 和超时时间
 */
const service = axios.create({
  /**
   * 请求基础 URL
   * 从环境变量中读取，所有请求都会自动拼接此基础路径
   * 例如：VITE_APP_BASE_API = 'http://api.example.com'
   * 请求 '/user/info' 会变成 'http://api.example.com/user/info'
   */
  baseURL: import.meta.env.VITE_APP_BASE_API,
  /**
   * 请求超时时间（毫秒）
   * 如果请求超过 10 秒未响应，会自动取消请求并触发超时错误
   */
  timeout: 10000,
})

// ==================== 请求拦截器 ====================
/**
 * 请求拦截器
 * 在发送请求之前对请求配置进行处理
 *
 * 处理内容：
 * 1. 自动添加 Token 到请求头
 * 2. GET 请求参数序列化
 * 3. POST/PUT 请求防重复提交
 */
service.interceptors.request.use(
  (config) => {
    // ========== 1. Token 处理 ==========
    /**
     * 判断是否需要设置 Token
     * 如果请求头中设置了 isToken: false，则不会自动添加 Token
     * 用于某些不需要认证的接口（如登录、注册等）
     */
    const isToken = (config.headers || {}).isToken === false

    /**
     * 如果存在 Token 且未禁用 Token，则自动添加到请求头
     * 使用 Bearer Token 认证方式（JWT 标准格式）
     */
    if (getToken() && !isToken) {
      config.headers['Authorization'] = 'Bearer ' + getToken()
    }

    // ========== 2. GET 请求参数处理 ==========
    /**
     * 将 GET 请求的 params 对象转换为 URL 查询字符串
     * 例如：{ id: 1, name: 'test' } => '?id=1&name=test'
     *
     * 原因：某些后端接口需要查询参数在 URL 中，而不是在 params 对象中
     */
    // get请求映射params参数
    if (config.method === 'get' && config.params) {
      let url = config.url + '?' + tansParams(config.params)
      url = url.slice(0, -1)
      config.params = {}
      config.url = url
    }

    // ========== 3. 防重复提交处理 ==========
    /**
     * 判断是否需要防止重复提交
     * 如果请求头中设置了 repeatSubmit: false，则跳过防重复提交检查
     * 用于某些需要快速连续调用的接口
     */
    const isRepeatSubmit = (config.headers || {}).repeatSubmit === false

    /**
     * 对 POST 和 PUT 请求进行防重复提交检查
     * 原理：比较当前请求与上一次请求的 URL、数据和时间间隔
     */
    if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
      // 构建当前请求对象，用于与上一次请求进行比较
      const requestObj = {
        url: config.url, // 请求地址
        data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data, // 请求数据（转为字符串便于比较）
        time: new Date().getTime(), // 请求时间戳
      }

      // 计算请求数据大小（用于判断是否超过限制）
      const requestSize = Object.keys(JSON.stringify(requestObj)).length
      const limitSize = 5 * 1024 * 1024 // 限制大小为 5MB

      /**
       * 如果请求数据过大，跳过防重复提交检查
       * 原因：大文件上传时，缓存大量数据会影响性能
       */
      if (requestSize >= limitSize) {
        console.warn(`[${config.url}]: ` + '请求数据大小超出允许的5M限制，无法进行防重复提交验证。')
        return config
      }

      // 从 sessionStorage 中获取上一次请求的信息
      const sessionObj = cache.session.getJSON('sessionObj')

      /**
       * 如果这是第一次请求（没有上一次请求记录）
       * 直接保存当前请求信息到 sessionStorage
       */
      if (sessionObj === undefined || sessionObj === null || sessionObj === '') {
        cache.session.setJSON('sessionObj', requestObj)
      } else {
        // 获取上一次请求的信息
        const s_url = sessionObj.url // 上一次请求的地址
        const s_data = sessionObj.data // 上一次请求的数据
        const s_time = sessionObj.time // 上一次请求的时间

        const interval = 1000 // 时间间隔阈值（毫秒），小于此时间视为重复提交

        /**
         * 判断是否为重复提交：
         * 1. 请求地址相同
         * 2. 请求数据相同
         * 3. 时间间隔小于 1 秒
         *
         * 如果满足以上条件，则拒绝本次请求
         */
        if (
          s_data === requestObj.data &&
          requestObj.time - s_time < interval &&
          s_url === requestObj.url
        ) {
          const message = '数据正在处理，请勿重复提交'
          console.warn(`[${s_url}]: ` + message)
          return Promise.reject(new Error(message))
        } else {
          // 不是重复提交，更新 sessionStorage 中的请求信息
          cache.session.setJSON('sessionObj', requestObj)
        }
      }
    }

    // 返回处理后的请求配置
    return config
  },
  /**
   * 请求错误处理
   * 当请求配置出错时（如网络错误、配置错误等）会触发此回调
   */
  (error) => {
    console.log(error)
    return Promise.reject(error)
  },
)

// ==================== 响应拦截器 ====================
/**
 * 响应拦截器
 * 在接收到响应后对响应数据进行统一处理
 *
 * 处理内容：
 * 1. 统一处理业务状态码
 * 2. 处理认证失败（401）
 * 3. 处理服务器错误（500）
 * 4. 处理其他错误状态码
 * 5. 处理网络错误和超时
 */
service.interceptors.response.use(
  /**
   * 响应成功处理
   * @param {Object} res - axios 响应对象
   * @returns {Promise} 返回处理后的数据或拒绝的 Promise
   */
  (res) => {
    // ========== 1. 提取状态码和错误信息 ==========
    /**
     * 获取业务状态码
     * 后端返回的数据格式通常为：{ code: 200, msg: '成功', data: {...} }
     * 如果未设置状态码，默认视为成功（200）
     */
    const code = res.data.code || 200

    /**
     * 获取错误信息
     * 优先级：错误码映射表 > 后端返回的 msg > 默认错误信息
     */
    const msg = errorCode[code] || res.data.msg || errorCode['default']

    // ========== 2. 二进制数据处理 ==========
    /**
     * 如果是二进制数据（blob 或 arraybuffer），直接返回
     * 用于文件下载等场景，不需要进行业务状态码判断
     */
    if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
      return res.data
    }

    // ========== 3. 业务状态码处理 ==========
    /**
     * 401 - 未授权/登录过期
     * 处理逻辑：
     * 1. 检查是否已经显示过重新登录弹窗（防止重复弹出）
     * 2. 显示确认对话框，询问用户是否重新登录
     * 3. 用户确认后，清除登录信息并跳转到首页
     */
    if (code === 401) {
      if (!isRelogin.show) {
        isRelogin.show = true // 标记正在显示登录弹窗
        ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            // 用户点击"重新登录"
            isRelogin.show = false
            // 清除用户登录信息（Token、用户信息等）
            useUserStore()
              .logOut()
              .then(() => {
                // 跳转到首页
                location.href = '/index'
              })
          })
          .catch(() => {
            // 用户点击"取消"，关闭弹窗
            isRelogin.show = false
          })
      }
      // 拒绝 Promise，阻止后续处理
      return Promise.reject('无效的会话，或者会话已过期，请重新登录。')
    } else if (code === 500) {
      /**
       * 500 - 服务器内部错误
       * 如果响应中包含 errors 数组（业务错误详情），则返回完整数据供业务代码处理
       * 否则显示错误提示消息，并拒绝 Promise
       */
      if (res.data.data && res.data.data.errors && Array.isArray(res.data.data.errors)) {
        // 包含详细错误信息，返回给业务代码处理（不显示通用错误提示）
        return Promise.reject(res.data)
      } else {
        // 普通错误，显示错误提示
        ElMessage({ message: msg, type: 'error' })
        return Promise.reject(new Error(msg))
      }
    } else if (code === 601) {
      /**
       * 601 - 业务警告
       * 显示警告提示消息，并拒绝 Promise
       * 通常用于业务逻辑校验失败等场景
       */
      ElMessage({ message: msg, type: 'warning' })
      return Promise.reject(new Error(msg))
    } else if (code !== 200) {
      /**
       * 其他非 200 状态码
       * 显示错误通知（右上角弹出），并拒绝 Promise
       */
      ElNotification.error({ title: msg })
      return Promise.reject('error')
    } else {
      /**
       * 200 - 请求成功
       * 返回响应数据，供业务代码使用
       */
      return Promise.resolve(res.data)
    }
  },
  /**
   * 响应错误处理
   * 当请求失败时（网络错误、超时、HTTP 状态码错误等）会触发此回调
   *
   * @param {Error} error - 错误对象
   * @returns {Promise} 返回拒绝的 Promise
   */
  (error) => {
    console.log('err' + error)
    let { message } = error

    /**
     * 根据错误类型，转换为用户友好的错误信息
     */
    if (message == 'Network Error') {
      // 网络连接错误（无法连接到服务器）
      message = '后端接口连接异常'
    } else if (message.includes('timeout')) {
      // 请求超时
      message = '系统接口请求超时'
    } else if (message.includes('Request failed with status code')) {
      // HTTP 状态码错误（如 404、403 等）
      // 提取状态码（如 "Request failed with status code 404" => "404异常"）
      message = '系统接口' + message.substr(message.length - 3) + '异常'
    }

    // 显示错误提示消息（5 秒后自动关闭）
    ElMessage({ message: message, type: 'error', duration: 5 * 1000 })
    return Promise.reject(error)
  },
)

// ==================== 文件下载方法 ====================
/**
 * 通用文件下载方法
 *
 * 功能：
 * 1. 发送 POST 请求下载文件
 * 2. 显示下载加载动画
 * 3. 验证响应是否为有效的文件数据
 * 4. 处理下载错误
 *
 * @param {string} url - 下载接口地址
 * @param {Object} params - 请求参数（通常包含文件 ID 等信息）
 * @param {string} filename - 下载后的文件名
 * @param {Object} config - 额外的 axios 配置项（可选）
 * @returns {Promise} 返回下载请求的 Promise
 *
 * @example
 * // 下载文件
 * download('/api/file/download', { fileId: 123 }, 'document.pdf')
 *
 * @example
 * // 带额外配置的下载
 * download('/api/file/download', { fileId: 123 }, 'document.pdf', {
 *   timeout: 30000 // 设置超时时间为 30 秒
 * })
 */
export function download(url, params, filename, config) {
  // 显示全屏加载动画，提示用户正在下载
  downloadLoadingInstance = ElLoading.service({
    text: '正在下载数据，请稍候',
    background: 'rgba(0, 0, 0, 0.7)',
  })

  // 发送 POST 请求下载文件
  return service
    .post(url, params, {
      /**
       * 请求数据转换
       * 将参数对象转换为 URL 编码格式（application/x-www-form-urlencoded）
       * 例如：{ id: 1, name: 'test' } => 'id=1&name=test'
       */
      transformRequest: [
        (params) => {
          return tansParams(params)
        },
      ],
      /**
       * 设置请求头
       * 使用表单格式，而不是 JSON 格式
       */
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      /**
       * 响应类型为 blob（二进制数据）
       * 用于接收文件数据
       */
      responseType: 'blob',
      /**
       * 合并额外的配置项
       * 允许调用者传入自定义配置（如超时时间、请求头等）
       */
      ...config,
    })
    .then(async (data) => {
      /**
       * 验证响应数据是否为有效的 Blob 数据
       * 如果后端返回的是错误信息（JSON 格式），会被识别为无效的 Blob
       */
      const isBlob = blobValidate(data)

      if (isBlob) {
        // 响应是有效的文件数据，创建 Blob 对象并保存文件
        const blob = new Blob([data])
        saveAs(blob, filename) // 触发浏览器下载
      } else {
        // 响应不是文件数据，可能是错误信息
        // 尝试解析为 JSON，提取错误信息并提示用户
        const resText = await data.text()
        const rspObj = JSON.parse(resText)
        const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode['default']
        ElMessage.error(errMsg)
      }

      // 关闭加载动画
      downloadLoadingInstance.close()
    })
    .catch((r) => {
      // 下载失败，记录错误并提示用户
      console.error(r)
      ElMessage.error('下载文件出现错误，请联系管理员！')
      // 关闭加载动画
      downloadLoadingInstance.close()
    })
}

// ==================== 导出 ====================
/**
 * 导出配置好的 axios 实例
 * 业务代码可以直接使用此实例发送 HTTP 请求
 *
 * @example
 * import request from '@/utils/request'
 *
 * // GET 请求
 * request.get('/api/user/info')
 *
 * // POST 请求
 * request.post('/api/user/login', { username: 'admin', password: '123456' })
 */
export default service
