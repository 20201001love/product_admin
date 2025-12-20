<template>
  <!-- 滚动容器 -->
  <el-scrollbar ref="scrollContainer" :vertical="false" class="scroll-container" @wheel.prevent="handleScroll">
    <!-- 插槽 -->
    <slot />
  </el-scrollbar>
</template>

<script setup>
import useTagsViewStore from '@/stores/modules/tagsView'

// 标签页间距
const tagAndTagSpacing = ref(4)
// 获取当前实例
const { proxy } = getCurrentInstance()

// 获取滚动容器
const scrollWrapper = computed(() => proxy.$refs.scrollContainer.$refs.wrapRef)

// 挂载
onMounted(() => {
  // 监听滚动事件
  scrollWrapper.value.addEventListener('scroll', emitScroll, true)
})

// 卸载
onBeforeUnmount(() => {
  // 移除滚动事件
  scrollWrapper.value.removeEventListener('scroll', emitScroll)
})

// 处理滚动事件
// 这里标签页是横向的，所以需要处理滚动事件
function handleScroll(e) {
  // 获取滚动事件的增量
  const eventDelta = e.wheelDelta || -e.deltaY * 40
  // 获取滚动容器
  const $scrollWrapper = scrollWrapper.value
  // 设置滚动容器的滚动位置
  $scrollWrapper.scrollLeft = $scrollWrapper.scrollLeft + eventDelta / 4
}

// 定义 emits
const emits = defineEmits()
// 触发滚动事件
const emitScroll = () => {
  emits('scroll')
}

// 获取标签页视图状态管理 Store
const tagsViewStore = useTagsViewStore()
// 获取已访问的视图列表
const visitedViews = computed(() => tagsViewStore.visitedViews)

// 处理滚动条在标签页之间移动
// 移动到目标标签页
function moveToTarget(currentTag) {
  // 获取滚动容器
  const $container = proxy.$refs.scrollContainer.$el
  // 获取滚动容器的宽度
  const $containerWidth = $container.offsetWidth
  // 获取滚动容器
  const $scrollWrapper = scrollWrapper.value

  // 获取第一个标签页
  let firstTag = null
  // 获取最后一个标签页
  let lastTag = null

  // 如果已访问的视图列表不为空
  if (visitedViews.value.length > 0) {
    firstTag = visitedViews.value[0]
    lastTag = visitedViews.value[visitedViews.value.length - 1]
  }

  // 如果第一个标签页等于当前标签页
  if (firstTag === currentTag) {
    $scrollWrapper.scrollLeft = 0
  } else if (lastTag === currentTag) {
    // 如果最后一个标签页等于当前标签页
    $scrollWrapper.scrollLeft = $scrollWrapper.scrollWidth - $containerWidth
  } else {
    // 获取标签页列表
    const tagListDom = document.getElementsByClassName('tags-view-item')
    // 获取当前标签页的索引
    const currentIndex = visitedViews.value.findIndex(item => item === currentTag)
    // 获取前一个标签页
    let prevTag = null
    // 获取下一个标签页
    let nextTag = null
    for (const k in tagListDom) {
      if (k !== 'length' && Object.hasOwnProperty.call(tagListDom, k)) {
        // 如果前一个标签页的 path 等于当前标签页的 path
        if (tagListDom[k].dataset.path === visitedViews.value[currentIndex - 1].path) {
          prevTag = tagListDom[k]
        }
        // 如果下一个标签页的 path 等于当前标签页的 path
        if (tagListDom[k].dataset.path === visitedViews.value[currentIndex + 1].path) {
          nextTag = tagListDom[k]
        }
      }
    }

    // 获取下一个标签页的偏移量
    const afterNextTagOffsetLeft = nextTag.offsetLeft + nextTag.offsetWidth + tagAndTagSpacing.value

    // 获取前一个标签页的偏移量
    const beforePrevTagOffsetLeft = prevTag.offsetLeft - tagAndTagSpacing.value
    // 如果下一个标签页的偏移量大于容器宽度
    if (afterNextTagOffsetLeft > $scrollWrapper.scrollLeft + $containerWidth) {
      $scrollWrapper.scrollLeft = afterNextTagOffsetLeft - $containerWidth
    } else if (beforePrevTagOffsetLeft < $scrollWrapper.scrollLeft) {
      $scrollWrapper.scrollLeft = beforePrevTagOffsetLeft
    }
  }
}

defineExpose({
  moveToTarget,
})
</script>

<style lang='scss' scoped>
.scroll-container {
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  width: 100%;

  :deep(.el-scrollbar__bar) {
    bottom: 0px;
  }

  :deep(.el-scrollbar__wrap) {
    height: 39px;
  }
}
</style>
