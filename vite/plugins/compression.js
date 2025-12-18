/**
 * 构建产物压缩插件配置
 *
 * 使用 vite-plugin-compression 在打包时生成压缩文件，以减小静态资源体积：
 * - 支持 gzip（.gz）和 brotli（.br）
 * - 通过环境变量 VITE_BUILD_COMPRESS 控制启用方式，例如：
 *   - VITE_BUILD_COMPRESS=gzip
 *   - VITE_BUILD_COMPRESS=gzip,brotli
 *
 * 后端 / 部署服务器可根据情况开启对相应压缩格式的支持。
 */

import compression from 'vite-plugin-compression'

export default function createCompression(env) {
  const { VITE_BUILD_COMPRESS } = env
  const plugin = []

  if (VITE_BUILD_COMPRESS) {
    const compressList = VITE_BUILD_COMPRESS.split(',')

    // gzip 压缩配置
    if (compressList.includes('gzip')) {
      // 参考文档：http://doc.huacai.vip/huacai-vue/other/faq.html#使用gzip解压缩静态文件
      plugin.push(
        compression({
          ext: '.gz',
          deleteOriginFile: false // 保留原始文件，方便回退/对比
        })
      )
    }

    // brotli 压缩配置
    if (compressList.includes('brotli')) {
      plugin.push(
        compression({
          ext: '.br',
          algorithm: 'brotliCompress',
          deleteOriginFile: false
        })
      )
    }
  }

  return plugin
}
