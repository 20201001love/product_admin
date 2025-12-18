/**
 * <script setup> 扩展插件配置
 *
 * 使用 unplugin-vue-setup-extend-plus，为 `<script setup>` 语法糖增加额外能力，
 * 主要用于在 setup 写法中设置组件的 name 等选项，便于：
 * - 配合 keep-alive 使用（依赖组件 name）
 * - 在调试工具中更好地展示组件名称
 */

import setupExtend from 'unplugin-vue-setup-extend-plus/vite'

export default function createSetupExtend() {
  // 目前使用默认配置，如需扩展可在此处传入选项
  return setupExtend({})
}
