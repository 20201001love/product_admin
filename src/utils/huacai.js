/**
 * 通用js方法封装处理
 * 包含日期格式化、表单处理、数据字典、树形结构、参数处理等常用工具函数
 */

/**
 * 日期格式化函数
 * 支持多种时间格式输入，输出自定义格式的日期字符串
 *
 * @param {Date|string|number} time - 时间对象、时间字符串或时间戳
 * @param {string} pattern - 格式化模板，默认为 '{y}-{m}-{d} {h}:{i}:{s}'
 *                         支持占位符：{y}年 {m}月 {d}日 {h}时 {i}分 {s}秒 {a}星期
 * @returns {string|null} 格式化后的日期字符串，无效输入返回 null
 *
 * @example
 * // 基本用法
 * parseTime(new Date())  // "2024-01-15 14:30:25"
 *
 * @example
 * // 自定义格式
 * parseTime(new Date(), '{y}年{m}月{d}日')  // "2024年01月15日"
 *
 * @example
 * // 时间戳（秒）
 * parseTime(1705312225)  // "2024-01-15 14:30:25"
 *
 * @example
 * // 时间戳（毫秒）
 * parseTime(1705312225000)  // "2024-01-15 14:30:25"
 *
 * @example
 * // ISO 字符串
 * parseTime('2024-01-15T14:30:25.000Z')  // "2024-01-15 14:30:25"
 *
 * @example
 * // 包含星期
 * parseTime(new Date(), '{y}-{m}-{d} 星期{a}')  // "2024-01-15 星期一"
 */
export function parseTime(time, pattern) {
  if (arguments.length === 0 || !time) {
    return null
  }
  const format = pattern || '{y}-{m}-{d} {h}:{i}:{s}'
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if ((typeof time === 'string') && (/^[0-9]+$/.test(time))) {
      time = parseInt(time)
    } else if (typeof time === 'string') {
      time = time.replace(new RegExp(/-/gm), '/').replace('T', ' ').replace(new RegExp(/\.[\d]{3}/gm), '')
    }
    if ((typeof time === 'number') && (time.toString().length === 10)) {
      time = time * 1000
    }
    date = new Date(time)
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
    let value = formatObj[key]
    // Note: getDay() returns 0 on Sunday
    if (key === 'a') { return ['日', '一', '二', '三', '四', '五', '六'][value] }
    if (result.length > 0 && value < 10) {
      value = '0' + value
    }
    return value || 0
  })
  return time_str
}

/**
 * 表单重置函数
 * 重置 Element Plus 表单组件的所有字段到初始值
 *
 * @param {string} refName - 表单组件的 ref 名称
 *
 * @example
 * // 在 Vue 组件中使用
 * <template>
 *   <el-form ref="loginForm">
 *     <el-form-item label="用户名">
 *       <el-input v-model="form.username" />
 *     </el-form-item>
 *   </el-form>
 *   <el-button @click="handleReset">重置</el-button>
 * </template>
 *
 * <script setup>
 * import { resetForm } from '@/utils/huacai'
 *
 * function handleReset() {
 *   resetForm.call(this, 'loginForm')
 * }
 * </script>
 *
 * @example
 * // 在 Options API 中使用
 * methods: {
 *   handleReset() {
 *     resetForm.call(this, 'loginForm')
 *   }
 * }
 */
export function resetForm(refName) {
  if (this.$refs[refName]) {
    this.$refs[refName].resetFields()
  }
}

/**
 * 添加日期范围参数到查询对象
 * 用于将日期范围选择器的值添加到查询参数中，方便后端进行时间范围查询
 *
 * @param {Object} params - 查询参数对象
 * @param {Array<string>} dateRange - 日期范围数组，格式：[开始日期, 结束日期]
 * @param {string} propName - 自定义属性名称（可选），不传则使用默认的 beginTime/endTime
 * @returns {Object} 添加了日期范围参数后的查询对象
 *
 * @example
 * // 默认使用 beginTime 和 endTime
 * const query = { pageNum: 1, pageSize: 10 }
 * const dateRange = ['2024-01-01', '2024-01-31']
 * addDateRange(query, dateRange)
 * // 结果: { pageNum: 1, pageSize: 10, params: { beginTime: '2024-01-01', endTime: '2024-01-31' } }
 *
 * @example
 * // 自定义属性名称
 * const query = { pageNum: 1 }
 * const dateRange = ['2024-01-01', '2024-01-31']
 * addDateRange(query, dateRange, 'CreateTime')
 * // 结果: { pageNum: 1, params: { beginCreateTime: '2024-01-01', endCreateTime: '2024-01-31' } }
 *
 * @example
 * // 实际使用场景（在查询方法中）
 * function handleQuery() {
 *   const queryParams = {
 *     pageNum: 1,
 *     pageSize: 10,
 *     params: { status: 'active' }
 *   }
 *   const dateRange = this.dateRange  // 从日期选择器获取
 *   const finalParams = addDateRange(queryParams, dateRange)
 *   // 发送请求
 *   api.getList(finalParams)
 * }
 */
export function addDateRange(params, dateRange, propName) {
  let search = params
  search.params = typeof (search.params) === 'object' && search.params !== null && !Array.isArray(search.params) ? search.params : {}
  dateRange = Array.isArray(dateRange) ? dateRange : []
  if (typeof (propName) === 'undefined') {
    search.params['beginTime'] = dateRange[0]
    search.params['endTime'] = dateRange[1]
  } else {
    search.params['begin' + propName] = dateRange[0]
    search.params['end' + propName] = dateRange[1]
  }
  return search
}

/**
 * 根据值回显数据字典标签（单个值）
 * 从数据字典数组中根据 value 查找对应的 label 文本
 *
 * @param {Array<Object>} datas - 数据字典数组，每个对象包含 value 和 label 属性
 * @param {string|number} value - 要查找的值
 * @returns {string} 对应的标签文本，找不到则返回原值
 *
 * @example
 * // 基本用法
 * const statusDict = [
 *   { value: '0', label: '禁用' },
 *   { value: '1', label: '启用' }
 * ]
 * selectDictLabel(statusDict, '1')  // "启用"
 * selectDictLabel(statusDict, '0')  // "禁用"
 * selectDictLabel(statusDict, '2')  // "2" (找不到时返回原值)
 *
 * @example
 * // 在表格中使用
 * <el-table-column label="状态" prop="status">
 *   <template #default="{ row }">
 *     {{ selectDictLabel(statusOptions, row.status) }}
 *   </template>
 * </el-table-column>
 *
 * @example
 * // 在表单中使用
 * const form = { status: '1' }
 * const statusText = selectDictLabel(statusOptions, form.status)  // "启用"
 */
export function selectDictLabel(datas, value) {
  if (value === undefined) {
    return ""
  }
  var actions = []
  Object.keys(datas).some((key) => {
    if (datas[key].value == ('' + value)) {
      actions.push(datas[key].label)
      return true
    }
  })
  if (actions.length === 0) {
    actions.push(value)
  }
  return actions.join('')
}

/**
 * 根据值回显数据字典标签（多个值）
 * 支持字符串（逗号分隔）或数组格式的多个值，返回对应的标签文本组合
 *
 * @param {Array<Object>} datas - 数据字典数组，每个对象包含 value 和 label 属性
 * @param {string|Array<string|number>} value - 要查找的值，可以是逗号分隔的字符串或数组
 * @param {string} separator - 分隔符，默认为逗号 ','
 * @returns {string} 对应的标签文本组合，用分隔符连接
 *
 * @example
 * // 字符串格式（逗号分隔）
 * const typeDict = [
 *   { value: '1', label: '类型A' },
 *   { value: '2', label: '类型B' },
 *   { value: '3', label: '类型C' }
 * ]
 * selectDictLabels(typeDict, '1,2')  // "类型A,类型B"
 *
 * @example
 * // 数组格式
 * selectDictLabels(typeDict, ['1', '2', '3'])  // "类型A,类型B,类型C"
 *
 * @example
 * // 自定义分隔符
 * selectDictLabels(typeDict, '1,2', ' | ')  // "类型A | 类型B"
 *
 * @example
 * // 在表格中使用（多选场景）
 * <el-table-column label="类型" prop="types">
 *   <template #default="{ row }">
 *     {{ selectDictLabels(typeOptions, row.types) }}
 *   </template>
 * </el-table-column>
 *
 * @example
 * // 处理空值
 * selectDictLabels(typeDict, '')  // "" (空字符串)
 * selectDictLabels(typeDict, [])  // "" (空数组)
 */
export function selectDictLabels(datas, value, separator) {
  if (value === undefined || value.length ===0) {
    return ""
  }
  if (Array.isArray(value)) {
    value = value.join(",")
  }
  var actions = []
  var currentSeparator = undefined === separator ? "," : separator
  var temp = value.split(currentSeparator)
  Object.keys(value.split(currentSeparator)).some((val) => {
    var match = false
    Object.keys(datas).some((key) => {
      if (datas[key].value == ('' + temp[val])) {
        actions.push(datas[key].label + currentSeparator)
        match = true
      }
    })
    if (!match) {
      actions.push(temp[val] + currentSeparator)
    }
  })
  return actions.join('').substring(0, actions.join('').length - 1)
}

/**
 * 字符串格式化函数（类似 C 语言的 sprintf）
 * 使用 %s 占位符替换字符串中的内容
 *
 * @param {string} str - 包含 %s 占位符的模板字符串
 * @param {...any} args - 要替换的参数，按顺序替换 %s
 * @returns {string} 格式化后的字符串，如果参数不足则返回空字符串
 *
 * @example
 * // 基本用法
 * sprintf('Hello %s', 'World')  // "Hello World"
 *
 * @example
 * // 多个占位符
 * sprintf('姓名：%s，年龄：%s', '张三', 25)  // "姓名：张三，年龄：25"
 *
 * @example
 * // 实际使用场景
 * const message = sprintf('用户 %s 在 %s 登录了系统', username, parseTime(new Date()))
 *
 * @example
 * // 参数不足的情况
 * sprintf('Hello %s %s', 'World')  // "" (返回空字符串，因为第二个参数缺失)
 */
export function sprintf(str) {
  var args = arguments, flag = true, i = 1
  str = str.replace(/%s/g, function () {
    var arg = args[i++]
    if (typeof arg === 'undefined') {
      flag = false
      return ''
    }
    return arg
  })
  return flag ? str : ''
}

/**
 * 转换字符串，将 undefined、null、"undefined"、"null" 等值转换为空字符串
 * 用于处理可能为空的字符串值，避免在显示时出现 "undefined" 或 "null" 文本
 *
 * @param {string|undefined|null} str - 要转换的字符串
 * @returns {string} 转换后的字符串，无效值返回空字符串 ""
 *
 * @example
 * // 基本用法
 * parseStrEmpty('hello')  // "hello"
 * parseStrEmpty(undefined)  // ""
 * parseStrEmpty(null)  // ""
 * parseStrEmpty('undefined')  // ""
 * parseStrEmpty('null')  // ""
 *
 * @example
 * // 在模板中使用
 * <template>
 *   <span>{{ parseStrEmpty(user.name) }}</span>
 * </template>
 *
 * @example
 * // 处理 API 返回的数据
 * const userInfo = {
 *   name: parseStrEmpty(response.name),
 *   email: parseStrEmpty(response.email)
 * }
 */
export function parseStrEmpty(str) {
  if (!str || str == "undefined" || str == "null") {
    return ""
  }
  return str
}

/**
 * 递归合并对象数据
 * 深度合并两个对象，将 target 的属性合并到 source 中
 * 如果属性是对象，则递归合并；否则直接覆盖
 *
 * @param {Object} source - 源对象（会被修改）
 * @param {Object} target - 目标对象（要合并的对象）
 * @returns {Object} 合并后的源对象
 *
 * @example
 * // 基本用法
 * const source = { a: 1, b: { c: 2 } }
 * const target = { b: { d: 3 }, e: 4 }
 * mergeRecursive(source, target)
 * // 结果: { a: 1, b: { c: 2, d: 3 }, e: 4 }
 *
 * @example
 * // 合并配置对象
 * const defaultConfig = {
 *   api: { baseURL: 'http://localhost', timeout: 5000 },
 *   theme: 'light'
 * }
 * const userConfig = {
 *   api: { timeout: 10000 },
 *   theme: 'dark'
 * }
 * const finalConfig = mergeRecursive(defaultConfig, userConfig)
 * // 结果: { api: { baseURL: 'http://localhost', timeout: 10000 }, theme: 'dark' }
 *
 * @example
 * // 合并表单数据
 * const formData = { name: '', age: 0, address: { city: '', street: '' } }
 * const updateData = { name: '张三', address: { city: '北京' } }
 * mergeRecursive(formData, updateData)
 * // 结果: { name: '张三', age: 0, address: { city: '北京', street: '' } }
 */
export function mergeRecursive(source, target) {
  for (var p in target) {
    try {
      if (target[p].constructor == Object) {
        source[p] = mergeRecursive(source[p], target[p])
      } else {
        source[p] = target[p]
      }
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // 如果合并失败（如属性不可写），直接覆盖
      source[p] = target[p]
    }
  }
  return source
}

/**
 * 构造树型结构数据
 * 将扁平化的数组数据转换为树形结构，常用于菜单、分类等层级数据的处理
 *
 * @param {Array<Object>} data - 扁平化的数据源数组
 * @param {string} id - id字段名称，默认为 'id'
 * @param {string} parentId - 父节点id字段名称，默认为 'parentId'
 * @param {string} children - 子节点数组字段名称，默认为 'children'
 * @returns {Array<Object>} 转换后的树形结构数组
 *
 * @example
 * // 基本用法
 * const flatData = [
 *   { id: 1, name: '菜单1', parentId: null },
 *   { id: 2, name: '菜单2', parentId: null },
 *   { id: 3, name: '子菜单1', parentId: 1 },
 *   { id: 4, name: '子菜单2', parentId: 1 }
 * ]
 * const treeData = handleTree(flatData)
 * // 结果: [
 * //   { id: 1, name: '菜单1', parentId: null, children: [
 * //     { id: 3, name: '子菜单1', parentId: 1, children: [] },
 * //     { id: 4, name: '子菜单2', parentId: 1, children: [] }
 * //   ]},
 * //   { id: 2, name: '菜单2', parentId: null, children: [] }
 * // ]
 *
 * @example
 * // 自定义字段名
 * const data = [
 *   { menuId: 1, menuName: '菜单1', pid: null },
 *   { menuId: 2, menuName: '子菜单', pid: 1 }
 * ]
 * const tree = handleTree(data, 'menuId', 'pid', 'childList')
 * // 结果: [{ menuId: 1, menuName: '菜单1', pid: null, childList: [...] }]
 *
 * @example
 * // 在菜单组件中使用
 * <el-menu>
 *   <template v-for="item in menuTree">
 *     <el-sub-menu v-if="item.children.length > 0" :key="item.id">
 *       <template #title>{{ item.name }}</template>
 *       <el-menu-item v-for="child in item.children" :key="child.id">
 *         {{ child.name }}
 *       </el-menu-item>
 *     </el-sub-menu>
 *     <el-menu-item v-else :key="item.id">{{ item.name }}</el-menu-item>
 *   </template>
 * </el-menu>
 */
export function handleTree(data, id, parentId, children) {
  let config = {
    id: id || 'id',
    parentId: parentId || 'parentId',
    childrenList: children || 'children'
  }

  var childrenListMap = {}
  var tree = []
  for (let d of data) {
    let id = d[config.id]
    childrenListMap[id] = d
    if (!d[config.childrenList]) {
      d[config.childrenList] = []
    }
  }

  for (let d of data) {
    let parentId = d[config.parentId]
    let parentObj = childrenListMap[parentId]
    if (!parentObj) {
      tree.push(d)
    } else {
      parentObj[config.childrenList].push(d)
    }
  }
  return tree
}

/**
 * 参数处理函数
 * 将对象参数转换为 URL 查询字符串格式，支持嵌套对象
 * 常用于将请求参数转换为表单数据或 URL 参数
 *
 * @param {Object} params - 要转换的参数对象
 * @returns {string} URL 编码后的查询字符串（末尾带 & 符号）
 *
 * @example
 * // 基本用法
 * const params = { name: '张三', age: 25 }
 * tansParams(params)  // "name=%E5%BC%A0%E4%B8%89&age=25&"
 *
 * @example
 * // 嵌套对象
 * const params = {
 *   user: { name: '张三', age: 25 },
 *   status: 'active'
 * }
 * tansParams(params)
 * // 结果: "user[name]=%E5%BC%A0%E4%B8%89&user[age]=25&status=active&"
 *
 * @example
 * // 过滤空值
 * const params = { name: '张三', age: '', email: null }
 * tansParams(params)  // "name=%E5%BC%A0%E4%B8%89&" (空值会被过滤)
 *
 * @example
 * // 在请求中使用
 * const queryParams = { pageNum: 1, pageSize: 10, filters: { status: 'active' } }
 * const queryString = tansParams(queryParams)
 * // 发送请求: fetch(`/api/users?${queryString}`)
 *
 * @example
 * // 转换为 FormData（去掉末尾的 &）
 * const params = { name: '张三', age: 25 }
 * const queryString = tansParams(params).slice(0, -1)  // 去掉末尾的 &
 * const formData = new URLSearchParams(queryString)
 */
export function tansParams(params) {
  let result = ''
  for (const propName of Object.keys(params)) {
    const value = params[propName]
    var part = encodeURIComponent(propName) + "="
    if (value !== null && value !== "" && typeof (value) !== "undefined") {
      if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
          if (value[key] !== null && value[key] !== "" && typeof (value[key]) !== 'undefined') {
            let params = propName + '[' + key + ']'
            var subPart = encodeURIComponent(params) + "="
            result += subPart + encodeURIComponent(value[key]) + "&"
          }
        }
      } else {
        result += part + encodeURIComponent(value) + "&"
      }
    }
  }
  return result
}

/**
 * 规范化路径字符串
 * 处理路径中的双斜杠和末尾斜杠，确保路径格式正确
 *
 * @param {string} p - 要规范化的路径字符串
 * @returns {string} 规范化后的路径
 *
 * @example
 * // 处理双斜杠
 * getNormalPath('/api//users')  // "/api/users"
 *
 * @example
 * // 移除末尾斜杠
 * getNormalPath('/api/users/')  // "/api/users"
 *
 * @example
 * // 组合情况
 * getNormalPath('/api//users/')  // "/api/users"
 *
 * @example
 * // 空值处理
 * getNormalPath('')  // ""
 * getNormalPath('undefined')  // "undefined"
 *
 * @example
 * // 在路由中使用
 * const routePath = getNormalPath(`/${basePath}/users`)
 * router.push(routePath)
 */
export function getNormalPath(p) {
  if (p.length === 0 || !p || p == 'undefined') {
    return p
  }
  let res = p.replace('//', '/')
  if (res[res.length - 1] === '/') {
    return res.slice(0, res.length - 1)
  }
  return res
}

/**
 * 验证数据是否为 Blob 格式（非 JSON）
 * 用于判断文件下载响应是否为二进制数据（如 Excel、PDF、图片等）
 * 如果响应是 JSON 格式，说明可能是错误信息，不是文件数据
 *
 * @param {Blob|Response} data - 要验证的数据对象，通常包含 type 属性
 * @returns {boolean} true 表示是 Blob 格式（非 JSON），false 表示是 JSON 格式
 *
 * @example
 * // 在文件下载中使用
 * async function downloadFile(url) {
 *   const response = await fetch(url)
 *   const blob = await response.blob()
 *
 *   if (blobValidate(blob)) {
 *     // 是文件数据，创建下载链接
 *     const url = window.URL.createObjectURL(blob)
 *     const a = document.createElement('a')
 *     a.href = url
 *     a.download = 'file.xlsx'
 *     a.click()
 *   } else {
 *     // 是 JSON 错误信息，需要解析错误
 *     const error = await blob.text()
 *     console.error('下载失败:', error)
 *   }
 * }
 *
 * @example
 * // 在 axios 响应拦截器中使用
 * axios.interceptors.response.use(response => {
 *   const contentType = response.headers['content-type']
 *   if (contentType && blobValidate({ type: contentType })) {
 *     // 处理文件下载
 *     return response
 *   }
 *   // 处理普通 JSON 响应
 *   return response.data
 * })
 *
 * @example
 * // 判断响应类型
 * const response = await fetch('/api/export')
 * const blob = await response.blob()
 *
 * if (blobValidate(blob)) {
 *   // 是文件：Excel、PDF、图片等
 *   saveAs(blob, 'report.xlsx')
 * } else {
 *   // 是 JSON：可能是错误信息
 *   const error = JSON.parse(await blob.text())
 *   ElMessage.error(error.message)
 * }
 */
export function blobValidate(data) {
  return data.type !== 'application/json'
}
