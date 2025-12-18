/**
 * 自动按需导入插件配置
 *
 * 使用 unplugin-auto-import 自动导入以下包的常用 API：
 * - vue：ref、computed、onMounted 等
 * - vue-router：useRouter、useRoute 等
 * - pinia：defineStore、storeToRefs 等
 *
 * 有了这个插件后，在组件中可以直接使用这些函数，而不需要手动写 import 语句，
 * 可以减少样板代码、提高开发效率。
 */

import autoImport from 'unplugin-auto-import/vite'

export default function createAutoImport() {
  return autoImport({
    // 需要自动导入的模块
    imports: [
      'vue',
      'vue-router',
      'pinia'
    ],
    // 不生成 d.ts 文件（如需要 TS 智能提示可改为 true 并指定路径）
    dts: false
  })
}
