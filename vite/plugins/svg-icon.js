/**
 * SVG 图标插件配置
 *
 * 使用 vite-plugin-svg-icons，将指定目录下的所有 svg 文件打包成 symbol 图标：
 * - 图标目录：src/assets/icons/svg
 * - 使用方式：<svg-icon icon-class="目录名-文件名" />
 *   例如：src/assets/icons/svg/system/user.svg → icon-system-user
 *
 * @param isBuild 是否为打包构建阶段（用于决定是否启用 svgo 压缩）
 */

import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import path from 'path'

export default function createSvgIcon(isBuild) {
  return createSvgIconsPlugin({
    // 扫描的 SVG 图标目录
    iconDirs: [path.resolve(process.cwd(), 'src/assets/icons/svg')],
    // 生成的 symbolId 格式（用于 <use xlink:href>）
    symbolId: 'icon-[dir]-[name]',
    // 是否开启 svgo 压缩（一般只在构建时开启）
    svgoOptions: isBuild
  })
}
