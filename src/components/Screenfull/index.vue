<template>
  <div>
    <!-- 采用@vueuse/core库中的useFullscreen函数，全屏按钮的图标使用svg-icon组件 -->
    <svg-icon :icon-class="isFullscreen ? 'exit-fullscreen' : 'fullscreen'" @click="toggle" />
  </div>
</template>

<script setup>
import { useFullscreen } from '@vueuse/core'
// 使用useFullscreen函数，获取全屏状态、进入全屏、退出全屏、切换全屏状态
const { isFullscreen, enter, exit, toggle } = useFullscreen()
</script>

<style lang='scss' scoped>
.screenfull-svg {
  display: inline-block;
  cursor: pointer;
  fill: #5a5e66;
  width: 20px;
  height: 20px;
  vertical-align: 10px;
}
</style>
