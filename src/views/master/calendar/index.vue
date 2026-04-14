<template>
  <div class="app-container calendar-page">
    <!-- 顶部搜索 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="日历名称" prop="calendarName">
        <el-input v-model="queryParams.calendarName" placeholder="请输入日历名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="工作日模式" prop="workdayPattern" label-width="100px">
        <el-select v-model="queryParams.workdayPattern" placeholder="请选择工作日模式" clearable @keyup.enter="handleQuery"
          style="width: 200px;">
          <el-option label="周一至周六" value="Mon-Sat" />
          <el-option label="周一至周五" value="Mon-Fri" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 顶部按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd"
          v-hasPermi="['master:calendar:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="selectedCount !== 1" @click="handleUpdate"
          v-hasPermi="['master:calendar:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="selectedCount === 0" @click="handleDelete"
          v-hasPermi="['master:calendar:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport"
          v-hasPermi="['master:calendar:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="handleQuery"></right-toolbar>
    </el-row>

    <div class="selection-summary" v-if="selectedCount > 0">
      <span>已选择 {{ selectedCount }} 个日历</span>
      <el-button type="text" size="mini" @click="clearSelection">清空</el-button>
    </div>
    <div class="calendar-scroll" ref="scrollWrapper" @scroll.passive="handleScroll" v-loading="loading">
      <div v-if="calendarList.length" class="calendar-grid">
        <div v-for="item in calendarList" :key="item.calendarId" class="calendar-card"
          :class="[{ 'is-selected': isSelected(item.calendarId) }, item.workdayPattern === 'Mon-Fri' ? 'theme-blue' : 'theme-orange']">
          
          <!-- 仿真装订环 -->
          <div class="calendar-binder">
            <div class="binder-hole" v-for="i in 4" :key="i"></div>
          </div>

          <!-- 选择状态徽标 -->
          <div class="select-badge" @click.stop="toggleSelect(item.calendarId)">
            <el-icon class="check-icon">
              <Check />
            </el-icon>
          </div>

          <!-- 日历纸页 -->
          <div class="calendar-inner">
            <div class="calendar-header-bar">
              <span class="pattern-text">{{ item.workdayPattern === 'Mon-Fri' ? '五天工作制' : '六天工作制' }}</span>
            </div>
            
            <div class="calendar-body">
              <div class="calendar-title-large">{{ item.calendarName }}</div>
              
              <div class="calendar-schedule">
                <div class="schedule-item main-shift">
                  <el-icon><Timer /></el-icon>
                  <span class="time-range">{{ item.shiftStart }} - {{ item.shiftEnd }}</span>
                </div>
                
                <div class="schedule-item work-hours">
                  <span class="hour-num">{{ calculateWorkHours(item) }}</span>
                  <span class="hour-unit">Hours/day</span>
                </div>

                <div v-if="item.breaks?.length" class="calendar-breaks">
                  <div class="break-tag" v-for="(breakItem, index) in item.breaks" :key="index">
                    休息: {{ breakItem.start }}-{{ breakItem.end }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <el-button type="primary" link @click="handleUpdate(item)">
              <el-icon><EditPen /></el-icon>编辑
            </el-button>
            <el-button type="danger" link @click="handleDelete(item)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </div>
        </div>
      </div>
      <div v-else-if="!loading" class="empty-placeholder">
        <el-empty description="暂无符合条件的日历" />
      </div>
      <!-- 底部哨兵元素，用于触发加载更多 -->
      <div ref="loadMoreSentinel" class="load-more-sentinel"></div>
      <div class="load-more-tip" v-if="loadingMore">
        <el-spinner />
        <span>加载中...</span>
      </div>
      <div class="load-more-tip" v-else-if="!hasMore && calendarList.length">
        已加载全部
      </div>
    </div>

    <!-- 添加或修改班次日历对话框 -->
    <el-dialog :title="title" v-model="open" width="700px" append-to-body>
      <el-form ref="calendarRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="日历名称" prop="calendarName">
              <el-input v-model="form.calendarName" placeholder="请输入日历名称" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工作日模式" prop="workdayPattern">
              <el-select v-model="form.workdayPattern" placeholder="请选择工作日模式" style="width: 100%;">
                <el-option label="周一至周六" value="Mon-Sat" />
                <el-option label="周一至周五" value="Mon-Fri" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="班次开始" prop="shiftStart">
              <el-time-select v-model="form.shiftStart" start="00:00" step="00:30" end="23:30" placeholder="选择开始时间"
                style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="班次结束" prop="shiftEnd">
              <el-time-select v-model="form.shiftEnd" start="00:00" step="00:30" end="23:30" placeholder="选择结束时间"
                style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="休息时段" prop="breaks">
          <div class="breaks-editor">
            <div v-for="(breakItem, index) in form.breaks" :key="index" class="break-item">
              <el-time-select v-model="breakItem.start" start="00:00" step="00:30" end="23:30" placeholder="开始时间"
                style="width: 120px;" />
              <span style="margin: 0 8px;">至</span>
              <el-time-select v-model="breakItem.end" start="00:00" step="00:30" end="23:30" placeholder="结束时间"
                style="width: 120px;" />
              <el-button type="danger" icon="Delete" circle @click="removeBreak(index)"
                style="margin-left: 8px;"></el-button>
            </div>
            <el-button type="primary" icon="Plus" @click="addBreak" plain style="margin-top: 8px;">添加休息时段</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Calendar">
import { ref, reactive, toRefs, computed, nextTick, onMounted, onUnmounted, watch, getCurrentInstance } from 'vue'
import { Check, Timer, EditPen, Delete } from '@element-plus/icons-vue'
import { listCalendar, getCalendar, delCalendar, addCalendar, updateCalendar } from "@/api/master/calendar"
import useCalendarStore from '@/stores/modules/calendar'

const { proxy } = getCurrentInstance()
const calendarStore = useCalendarStore()

const calendarList = ref([])
const open = ref(false)
const loading = ref(true)
const loadingMore = ref(false)
const showSearch = ref(true)
const ids = ref([])
const title = ref("")
const scrollWrapper = ref(null)
const loadMoreSentinel = ref(null)
const hasMore = ref(true)
let observer = null

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    calendarName: null,
    workdayPattern: null,
  },
  rules: {
    calendarName: [
      { required: true, message: "日历名称不能为空", trigger: "blur" }
    ],
    workdayPattern: [
      { required: true, message: "工作日模式不能为空", trigger: "change" }
    ],
    shiftStart: [
      { required: true, message: "班次开始时间不能为空", trigger: "change" }
    ],
    shiftEnd: [
      { required: true, message: "班次结束时间不能为空", trigger: "change" }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)

const normalizeBreaks = (value) => {
  if (!value) return []
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }
  return Array.isArray(value) ? value : []
}

const formatRows = (rows = []) => rows.map(item => ({
  ...item,
  breaks: normalizeBreaks(item.breaks)
}))

const calculateWorkHours = (row) => {
  if (!row.shiftStart || !row.shiftEnd) return 0
  const start = new Date(`2000-01-01 ${row.shiftStart}`)
  const end = new Date(`2000-01-01 ${row.shiftEnd}`)
  let totalMinutes = (end - start) / 1000 / 60
  if (row.breaks && Array.isArray(row.breaks)) {
    row.breaks.forEach(breakItem => {
      const breakStart = new Date(`2000-01-01 ${breakItem.start}`)
      const breakEnd = new Date(`2000-01-01 ${breakItem.end}`)
      totalMinutes -= (breakEnd - breakStart) / 1000 / 60
    })
  }
  return (totalMinutes / 60).toFixed(1)
}

const getList = (reset = false) => {
  if (reset) {
    calendarList.value = []
    ids.value = []
    hasMore.value = true
    queryParams.value.pageNum = 1
    loading.value = true
  } else {
    loadingMore.value = true
  }
  return listCalendar(queryParams.value).then(response => {
    const rows = formatRows(response.rows || [])
    if (reset) {
      calendarList.value = rows
    } else {
      calendarList.value.push(...rows)
    }
    // 判断是否还有更多数据：
    // 1. 优先使用 total（如果后端返回总数）
    // 2. 如果没有 total，使用 rows.length === pageSize 来判断（当返回数据等于页面大小时，认为可能还有更多）
    if (response.total !== undefined) {
      hasMore.value = calendarList.value.length < response.total
    } else {
      // 降级方案：如果返回的数据量等于页面大小，认为可能还有更多数据
      hasMore.value = rows.length === queryParams.value.pageSize
    }
  }).catch(error => {
    // 请求失败时，重置 hasMore，避免无法继续加载
    console.error('加载日历列表失败:', error)
    hasMore.value = false
  }).finally(() => {
    loading.value = false
    loadingMore.value = false
  })
}

const handleScroll = () => {
  const el = scrollWrapper.value
  if (!el) return

  // 调试信息（可在确认功能正常后删除）
  const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
  console.log(`[滚动调试] 剩余: ${remaining.toFixed(0)}px, hasMore: ${hasMore.value}, loadingMore: ${loadingMore.value}`)

  if (loadingMore.value || !hasMore.value) return

  const threshold = 100  // 提前100px触发加载
  if (remaining <= threshold) {
    console.log('[滚动调试] 触发加载更多, pageNum:', queryParams.value.pageNum + 1)
    queryParams.value.pageNum += 1
    getList()
  }
}

const handleQuery = () => {
  nextTick(() => {
    if (scrollWrapper.value) scrollWrapper.value.scrollTop = 0
  })
  getList(true)
}

const resetQuery = () => {
  proxy.resetForm("queryRef")
  handleQuery()
}

const addBreak = () => {
  if (!form.value.breaks) {
    form.value.breaks = []
  }
  form.value.breaks.push({ start: "", end: "" })
}

const removeBreak = (index) => {
  form.value.breaks.splice(index, 1)
}

const resetForm = () => {
  form.value = {
    calendarId: null,
    calendarName: null,
    workdayPattern: null,
    shiftStart: null,
    shiftEnd: null,
    breaks: [],
  }
  proxy.resetForm("calendarRef")
}

const handleAdd = () => {
  resetForm()
  open.value = true
  title.value = "添加班次日历"
}

const handleUpdate = (row) => {
  resetForm()
  const targetId = row?.calendarId || ids.value[0]
  if (!targetId) return
  getCalendar(targetId).then(response => {
    form.value = {
      ...response.data,
      breaks: normalizeBreaks(response.data.breaks)
    }
    open.value = true
    title.value = "修改班次日历"
  })
}

const submitForm = () => {
  proxy.$refs["calendarRef"].validate(valid => {
    if (valid) {
      if (form.value.breaks && form.value.breaks.length > 0) {
        for (let breakItem of form.value.breaks) {
          if (!breakItem.start || !breakItem.end) {
            proxy.$modal.msgError("请完善休息时段信息")
            return
          }
        }
      }
      if (form.value.calendarId != null) {
        updateCalendar(form.value).then((response) => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList(true)
          // 同步更新日历仓库
          if (response.data) {
            calendarStore.updateCalendar(response.data)
          } else {
            calendarStore.updateCalendar(form.value)
          }
        })
      } else {
        addCalendar(form.value).then((response) => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList(true)
          // 同步添加到日历仓库
          if (response.data) {
            calendarStore.addCalendar(response.data)
          } else {
            // 如果后端未返回完整数据，重新获取日历列表
            calendarStore.getCalendarList()
          }
        })
      }
    }
  })
}

const cancel = () => {
  open.value = false
  resetForm()
  getList(true)
}

const toggleSelect = (calendarId) => {
  const index = ids.value.indexOf(calendarId)
  if (index === -1) {
    ids.value.push(calendarId)
  } else {
    ids.value.splice(index, 1)
  }
}

const isSelected = (calendarId) => ids.value.includes(calendarId)
const selectedCount = computed(() => ids.value.length)
const clearSelection = () => {
  ids.value = []
}

const handleDelete = (row) => {
  const target = row?.calendarId ? row.calendarId : ids.value
  proxy.$modal.confirm('是否确认删除该班次日历？').then(() => {
    return delCalendar(target)
  }).then(() => {
    getList(true)
    proxy.$modal.msgSuccess("删除成功")
    // 同步从日历仓库删除
    calendarStore.deleteCalendar(target)
  }).catch(() => { })
}

const handleExport = () => {
  proxy.download('master/calendar/export', {
    ...queryParams.value
  }, `calendar_${new Date().getTime()}.xlsx`)
}

// 设置 IntersectionObserver 来检测底部哨兵元素
const setupObserver = () => {
  if (observer) {
    observer.disconnect()
  }

  if (!loadMoreSentinel.value) return

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore.value && !loadingMore.value && !loading.value) {
        console.log('[IntersectionObserver] 底部可见，触发加载更多')
        queryParams.value.pageNum += 1
        getList()
      }
    },
    {
      root: scrollWrapper.value,
      rootMargin: '100px',  // 提前100px触发
      threshold: 0
    }
  )

  observer.observe(loadMoreSentinel.value)
}

onMounted(() => {
  getList(true)

  // 数据加载后设置观察器
  nextTick(() => {
    setTimeout(() => {
      setupObserver()
      console.log('[Observer] IntersectionObserver 已设置')
    }, 500)
  })
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style lang="scss">
/* 覆盖外层 el-card 的 padding 和高度（需要非 scoped 样式） */
.app-content-card:has(.calendar-page) {
  display: flex;
  flex-direction: column;
}

.app-content-card:has(.calendar-page)>.el-card__body {
  padding: 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>

<style lang="scss" scoped>
.app-container {
  padding-top: 10px !important;
  padding-bottom: 0px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 页面容器：flex 布局，让卡片区域填满剩余高度 */
.calendar-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 休息时段容器 */
.breaks-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

/* 休息时段编辑器 */
.breaks-editor {
  width: 100%;
}

.break-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.calendar-card {
  --theme-color: #3b82f6;
  --theme-bg-soft: rgba(59, 130, 246, 0.05);
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  padding: 0;
  height: 340px;
  min-height: 340px;
}

.calendar-card.theme-blue {
  --theme-color: #3b82f6;
  --theme-bg-soft: rgba(59, 130, 246, 0.05);
}

.calendar-card.theme-orange {
  --theme-color: #f59e0b;
  --theme-bg-soft: rgba(245, 158, 11, 0.05);
}

.calendar-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
}

/* 顶部装订区 */
.calendar-binder {
  height: 24px;
  background: #f3f4f6;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-bottom: 2px solid #e5e7eb;
  z-index: 2;
}

.binder-hole {
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

/* 内页容器 */
.calendar-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 页眉条 */
.calendar-header-bar {
  background: var(--theme-color);
  padding: 8px 16px;
  color: white;
  text-align: center;
}

.pattern-text {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.05em;
  opacity: 0.9;
}

/* 主体内容 */
.calendar-body {
  padding: 24px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%);
  position: relative;
}

/* 装饰性网格线 */
.calendar-body::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: 
    linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.calendar-title-large {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 20px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.calendar-schedule {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1;
}

.schedule-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.main-shift {
  background: var(--theme-bg-soft);
  padding: 8px 16px;
  border-radius: 999px;
  color: var(--theme-color);
  font-weight: 600;
  border: 1px dashed var(--theme-color);
}

.work-hours {
  color: #6b7280;
  font-size: 14px;
}

.hour-num {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-right: 4px;
}

.calendar-breaks {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 8px;
}

.break-tag {
  font-size: 11px;
  background: #f3f4f6;
  color: #4b5563;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

/* 底部操作 */
.card-actions {
  padding: 12px 16px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-around;
  background: #fff;
}

.card-actions .el-button {
  font-weight: 600;
}

/* 选择徽标 */
.select-badge {
  position: absolute;
  top: 36px;
  right: 12px;
  width: 32px;
  height: 32px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.calendar-card.is-selected {
  border: 2px solid var(--theme-color);
  box-shadow: 0 8px 30px rgba(59, 130, 246, 0.2);
}

.calendar-card.is-selected .select-badge {
  background: var(--theme-color);
  border-color: #fff;
}

.calendar-card.is-selected .check-icon {
  color: #fff;
}

.check-icon {
  font-size: 18px;
  color: #d1d5db;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-auto-rows: 340px;
  gap: 32px;
  padding: 16px;
}

.load-more-sentinel {
  height: 1px;
  width: 100%;
}
</style>
