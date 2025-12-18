/**
 * Vite 插件统一注册入口
 *
 * 职责：
 * - 集中管理项目中用到的所有 Vite 插件
 * - 根据当前环境（开发 / 构建）决定启用哪些插件
 * - 供 `vite.config.js` 调用：plugins: createVitePlugins(env, isBuild)
 */

import vue from '@vitejs/plugin-vue'

// 自动按需导入（ref、computed、router、pinia 等）
import createAutoImport from './auto-import'
// 支持在 `<script setup>` 中扩展组件选项（如 name）
import createSetupExtend from './setup-extend'
// SVG 图标插件（自动加载 src/assets/icons/svg 下的图标）
import createSvgIcon from './svg-icon'
// 生产环境资源压缩（gzip / brotli）
import createCompression from './compression'
import createVueDevTools from './vue-devtools'
/**
 * 创建 Vite 插件列表
 *
 * @param viteEnv  当前环境变量（通过 loadEnv 传入）
 * @param isBuild  是否为打包构建模式
 */
export default function createVitePlugins(viteEnv, isBuild = false) {
  // 基础插件：Vue 单文件组件支持
  const vitePlugins = [vue()]

  // 自动导入 Vue / Router / Pinia 等 API
  vitePlugins.push(createAutoImport())

  // 扩展 <script setup> 的能力（如组件 name）
  vitePlugins.push(createSetupExtend())

  // 注册 SVG 图标插件
  vitePlugins.push(createSvgIcon(isBuild))
  vitePlugins.push(createVueDevTools())
  // 仅在打包构建时开启压缩插件
  if (isBuild) {
    vitePlugins.push(...createCompression(viteEnv))
  }

  return vitePlugins
}
