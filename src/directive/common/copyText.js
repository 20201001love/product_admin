/**
 * v-copyText 文本复制指令
 *
 * 功能说明：
 * 点击绑定该指令的元素时，将指定的文本内容复制到剪贴板
 * 支持复制成功后的回调函数
 *
 * 使用方式：
 * 1. 基础用法（直接复制值）：
 *    <el-button v-copyText="'要复制的文本'">复制</el-button>
 *
 * 2. 使用回调函数：
 *    <el-button v-copyText:callback="handleCopy">复制</el-button>
 *
 * 3. 组合使用（先设置值，再设置回调）：
 *    <el-button v-copyText="text" v-copyText:callback="handleCopy">复制</el-button>
 *
 * 指令参数：
 * - 无参数：直接复制指令值到剪贴板
 * - callback：将指令值作为回调函数存储，在复制成功后调用
 *
 * 实现原理：
 * 使用 document.execCommand('copy') API 实现复制功能
 * 兼容移动端和桌面端，处理了 iOS 等特殊场景
 */

export default {
  /**
   * 指令挂载前执行初始化
   * @param {HTMLElement} el - 绑定指令的 DOM 元素
   * @param {Object} binding - 指令绑定对象
   * @param {String|Function} binding.value - 要复制的文本内容或回调函数
   * @param {String} binding.arg - 指令参数（'callback' 表示设置回调函数）
   */
  beforeMount(el, { value, arg }) {
    // 如果参数是 'callback'，则将值作为回调函数存储
    if (arg === 'callback') {
      el.$copyCallback = value
    } else {
      // 否则，将值作为要复制的文本存储
      el.$copyValue = value

      // 创建点击事件处理函数
      const handler = () => {
        // 执行复制操作
        copyTextToClipboard(el.$copyValue)

        // 如果设置了回调函数，在复制后调用
        if (el.$copyCallback) {
          el.$copyCallback(el.$copyValue)
        }
      }

      // 绑定点击事件
      el.addEventListener('click', handler)

      // 保存清理函数，用于在指令卸载时移除事件监听
      el.$destroyCopy = () => el.removeEventListener('click', handler)
    }
  },

  /**
   * 指令卸载时清理事件监听
   * @param {HTMLElement} el - 绑定指令的 DOM 元素
   */
  unmounted(el) {
    // 如果存在清理函数，执行清理
    if (el.$destroyCopy) {
      el.$destroyCopy()
    }
  },
}

/**
 * 复制文本到剪贴板
 *
 * 实现原理：
 * 1. 创建一个隐藏的 textarea 元素
 * 2. 将要复制的文本设置到 textarea 的 value
 * 3. 将 textarea 添加到 DOM 并选中文本
 * 4. 使用 document.execCommand('copy') 执行复制
 * 5. 清理临时元素并恢复焦点
 *
 * 兼容性处理：
 * - 移动端：设置 readonly 防止键盘弹出
 * - iOS：设置 fontSize 防止缩放，显式设置 selectionStart/End
 * - 焦点恢复：复制后恢复之前的焦点元素
 *
 * @param {String} input - 要复制的文本内容
 * @param {Object} options - 配置选项
 * @param {HTMLElement} options.target - 临时元素的父容器，默认为 document.body
 * @returns {Boolean} 是否复制成功
 */
function copyTextToClipboard(input, { target = document.body } = {}) {
  // 创建临时的 textarea 元素用于复制
  const element = document.createElement('textarea')
  // 保存当前焦点元素，用于复制后恢复焦点
  const previouslyFocusedElement = document.activeElement

  // 设置要复制的文本内容
  element.value = input

  // 设置为只读，防止移动端键盘弹出
  element.setAttribute('readonly', '')

  // 设置样式，使元素不可见但可选中
  element.style.contain = 'strict' // CSS containment，优化渲染性能
  element.style.position = 'absolute'
  element.style.left = '-9999px' // 移出视口
  element.style.fontSize = '12pt' // 防止 iOS 上自动缩放

  // 保存当前文本选择状态，用于复制后恢复
  const selection = document.getSelection()
  const originalRange = selection.rangeCount > 0 && selection.getRangeAt(0)

  // 将元素添加到 DOM 中
  target.append(element)
  // 选中文本内容
  element.select()

  // iOS 特殊处理：显式设置选择范围
  element.selectionStart = 0
  element.selectionEnd = input.length

  // 执行复制命令
  let isSuccess = false
  try {
    // 使用 execCommand 执行复制（兼容性 API，现代浏览器推荐使用 Clipboard API）
    isSuccess = document.execCommand('copy')
  } catch {
    // 复制失败时静默处理
  }

  // 移除临时元素
  element.remove()

  // 恢复之前的文本选择状态
  if (originalRange) {
    selection.removeAllRanges()
    selection.addRange(originalRange)
  }

  // 恢复之前的焦点元素
  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus()
  }

  return isSuccess
}
