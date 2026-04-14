<template>
  <div class="app-container gantt-container">
    <!-- 顶部筛选栏 -->
    <el-card class="filter-card">
      <el-form :model="queryParams" :inline="true" label-width="70px">
        <el-form-item label="车间">
          <el-select v-model="queryParams.orgUnit" placeholder="请选择车间" clearable style="width: 150px;"
            @change="handleQuery">
            <el-option label="车间1" value="车间1" />
            <el-option label="车间2" value="车间2" />
            <el-option label="车间3" value="车间3" />
          </el-select>
        </el-form-item>
        <el-form-item label="机台">
          <el-select v-model="queryParams.machineId" placeholder="请选择机台" clearable style="width: 150px;"
            @change="handleQuery">
            <el-option v-for="machine in machineOptions" :key="machine.value" :label="machine.label"
              :value="machine.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 150px;"
            @change="handleQuery">
            <el-option v-for="dict in operation_task_status" :key="dict.value" :label="dict.label"
              :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="-" start-placeholder="开始日期"
            end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 240px;" @change="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 视图控制 -->
      <div class="view-controls">
        <el-radio-group v-model="zoomLevel" @change="handleZoomChange">
          <el-radio-button label="day">日视图</el-radio-button>
          <el-radio-button label="hour">时视图</el-radio-button>
        </el-radio-group>
        <el-button icon="Refresh" circle @click="handleRefresh" style="margin-left: 12px;" title="刷新数据" />
      </div>
    </el-card>

    <!-- 甘特图容器 -->
    <el-card class="gantt-card" v-loading="loading">
      <div ref="ganttContainer" class="gantt-chart"></div>
    </el-card>

    <!-- 任务详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="任务详情" width="600px">
      <el-descriptions :column="2" border v-if="selectedTask">
        <el-descriptions-item label="任务ID">{{ selectedTask.taskId }}</el-descriptions-item>
        <el-descriptions-item label="批次ID">{{ selectedTask.batchId }}</el-descriptions-item>
        <el-descriptions-item label="工序">
          <dict-tag :options="op_code" :value="selectedTask.opCode" />
        </el-descriptions-item>
        <el-descriptions-item label="任务状态">
          <dict-tag :options="operation_task_status" :value="selectedTask.status" />
        </el-descriptions-item>
        <el-descriptions-item label="计划开始">{{ selectedTask.start }}</el-descriptions-item>
        <el-descriptions-item label="计划结束">{{ selectedTask.end }}</el-descriptions-item>
        <el-descriptions-item label="预计时长">{{ calculateDuration(selectedTask) }}</el-descriptions-item>
        <el-descriptions-item label="机台">{{ selectedTask.machineName }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Gantt">
import { ref, reactive, onMounted, onUnmounted, nextTick, getCurrentInstance } from 'vue'
import gantt from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
import { getMockGanttData } from '@/api/pps/gantt'

const { proxy } = getCurrentInstance()
const { operation_task_status, op_code } = proxy.useDict('operation_task_status', 'op_code')

const ganttContainer = ref(null)
const loading = ref(false)
const detailDialogVisible = ref(false)
const selectedTask = ref(null)
const zoomLevel = ref('day')
const dateRange = ref([])

const queryParams = reactive({
  orgUnit: null,
  machineId: null,
  status: null,
  startDate: null,
  endDate: null,
})

const machineOptions = ref([
  { label: '注塑机#1', value: 'M1' },
  { label: '注塑机#2', value: 'M2' },
  { label: '注塑机#3', value: 'M3' },
  { label: '注塑机#4', value: 'M4' },
  { label: '注塑机#5', value: 'M5' },
])

// 初始化甘特图配置
const initGantt = () => {
  // 配置甘特图
  gantt.config.date_format = '%Y-%m-%d %H:%i:%s'
  gantt.config.scale_height = 50
  gantt.config.row_height = 44 // 增加行高，给文字更多空间
  gantt.config.bar_height = 32 // 增加条块高度，让文字更易读
  gantt.config.readonly = true
  gantt.config.show_progress = false
  gantt.config.open_tree_initially = true

  // 启用 tooltip 插件
  gantt.plugins({
    tooltip: true
  })

  // 配置列
  gantt.config.columns = [
    {
      name: 'text',
      label: '机台',
      width: 150,
      tree: true,
      template: function (obj) {
        if (obj.type === gantt.config.types.project) {
          return `<strong>${obj.text}</strong>`
        }
        return obj.text
      },
    },
    {
      name: 'start_date',
      label: '开始时间',
      width: 100,
      align: 'center',
      template: function (obj) {
        if (obj.type === gantt.config.types.task) {
          return gantt.date.date_to_str('%H:%i')(obj.start_date)
        }
        return ''
      },
    },
    {
      name: 'duration',
      label: '时长',
      width: 60,
      align: 'center',
      template: function (obj) {
        if (obj.type === gantt.config.types.task) {
          const duration = (obj.end_date - obj.start_date) / (1000 * 60 * 60)
          return duration.toFixed(1) + 'h'
        }
        return ''
      },
    },
  ]

  // 设置默认缩放级别
  setZoomLevel('day')

  // 配置任务颜色（根据状态）
  gantt.templates.task_class = function (start, end, task) {
    if (task.status === 'COMPLETED') return 'gantt-task-completed'
    if (task.status === 'RUNNING') return 'gantt-task-running'
    if (task.status === 'PAUSED') return 'gantt-task-paused'
    if (task.status === 'CANCELLED') return 'gantt-task-cancelled'
    return 'gantt-task-scheduled'
  }

  // 配置任务文本（简化显示逻辑，确保内容完整）
  gantt.templates.task_text = function (start, end, task) {
    if (task.type === gantt.config.types.task) {
      // 计算条块的实际像素宽度
      const duration = (end - start) / (1000 * 60 * 60) // 小时
      const columnWidth = gantt.config.column_width || 150
      const pixelsPerHour = columnWidth / 24 // 日视图：一天24小时
      const taskWidth = duration * pixelsPerHour

      // 根据实际宽度决定显示内容
      if (taskWidth >= 120) {
        // 宽度足够，显示完整信息
        return `${task.batchId} - ${task.opCode}`
      } else if (taskWidth >= 60) {
        // 中等宽度，显示批次ID和工序（简化）
        return `${task.batchId} - ${task.opCode}`
      } else if (taskWidth >= 30) {
        // 较窄，只显示批次ID
        return task.batchId
      } else {
        // 太窄，不显示文字（避免重叠）
        return ''
      }
    }
    return ''
  }

  // 配置右侧文字（显示时长，作为补充信息）
  gantt.templates.rightside_text = function (start, end, task) {
    if (task.type === gantt.config.types.task) {
      const duration = ((end - start) / (1000 * 60 * 60)).toFixed(1)
      const columnWidth = gantt.config.column_width || 150
      const pixelsPerHour = columnWidth / 24
      const taskWidth = duration * pixelsPerHour

      // 如果条块足够宽，在右侧显示时长
      if (taskWidth >= 100) {
        return `<span style="color: rgba(255,255,255,0.9); font-size: 11px;">${duration}h</span>`
      }
    }
    return ''
  }

  // 配置 tooltip（增强显示效果）
  gantt.templates.tooltip_text = function (start, end, task) {
    if (task.type === gantt.config.types.task) {
      const duration = ((end - start) / (1000 * 60 * 60)).toFixed(1)
      const startTime = gantt.date.date_to_str('%H:%i')(start)
      const endTime = gantt.date.date_to_str('%H:%i')(end)
      const statusLabel = getStatusLabel(task.status)

      return `
        <div style="padding: 4px; min-width: 200px;">
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #303133;">
            ${task.batchId}
          </div>
          <table style="font-size: 12px; color: #606266; width: 100%;">
            <tr style="line-height: 24px;">
              <td style="padding-right: 12px;"><b>工序:</b></td>
              <td>${task.opCode}</td>
            </tr>
            <tr style="line-height: 24px;">
              <td style="padding-right: 12px;"><b>状态:</b></td>
              <td>${statusLabel}</td>
            </tr>
            <tr style="line-height: 24px;">
              <td style="padding-right: 12px;"><b>时间:</b></td>
              <td>${startTime} - ${endTime}</td>
            </tr>
            <tr style="line-height: 24px;">
              <td style="padding-right: 12px;"><b>时长:</b></td>
              <td>${duration} 小时</td>
            </tr>
          </table>
        </div>
      `
    }
    return ''
  }

  // 点击任务事件
  gantt.attachEvent('onTaskClick', function (id, e) {
    const task = gantt.getTask(id)
    if (task.type === gantt.config.types.task) {
      showTaskDetail(task)
      return false
    }
    return true
  })

  // 初始化甘特图
  gantt.init(ganttContainer.value)
}

// 设置缩放级别
const setZoomLevel = (level) => {
  if (level === 'day') {
    gantt.config.scale_unit = 'day'
    gantt.config.date_scale = '%Y-%m-%d'
    gantt.config.subscales = [{ unit: 'hour', step: 4, date: '%H:%i' }] // 改为4小时一步，增加列宽
    gantt.config.min_column_width = 150 // 大幅增加最小列宽
    gantt.config.column_width = 150 // 设置固定列宽
  } else if (level === 'hour') {
    gantt.config.scale_unit = 'day'
    gantt.config.date_scale = '%Y-%m-%d'
    gantt.config.subscales = [{ unit: 'hour', step: 1, date: '%H:%i' }]
    gantt.config.min_column_width = 120 // 增加最小列宽
    gantt.config.column_width = 120 // 设置固定列宽
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      ...queryParams,
      startDate: dateRange.value?.[0] || null,
      endDate: dateRange.value?.[1] || null,
    }

    const response = await getMockGanttData(params)
    const ganttData = transformData(response.data)

    gantt.clearAll()
    gantt.parse(ganttData)

    // 如果有日期范围，设置甘特图显示范围
    if (dateRange.value && dateRange.value.length === 2) {
      const start = new Date(dateRange.value[0])
      const end = new Date(dateRange.value[1])
      start.setHours(0, 0, 0) // 设置为当天的开始
      end.setHours(23, 59, 59) // 设置为当天的最后一刻
      gantt.config.start_date = start
      gantt.config.end_date = end
    } else {
      // 如果没有日期范围，自动计算数据的时间范围
      const allDates = []
      response.data.forEach(resource => {
        resource.items.forEach(item => {
          allDates.push(new Date(item.start))
          allDates.push(new Date(item.end))
        })
      })

      if (allDates.length > 0) {
        const minDate = new Date(Math.min(...allDates))
        const maxDate = new Date(Math.max(...allDates))
        // 前后各扩展1天，让条块有更多显示空间
        minDate.setHours(0, 0, 0)
        minDate.setDate(minDate.getDate() - 1)
        maxDate.setHours(23, 59, 59)
        maxDate.setDate(maxDate.getDate() + 1)

        gantt.config.start_date = minDate
        gantt.config.end_date = maxDate
      } else {
        // 如果没有数据，设置默认范围（今天前后各1天）
        const today = new Date()
        const start = new Date(today)
        start.setDate(start.getDate() - 1)
        start.setHours(0, 0, 0)
        const end = new Date(today)
        end.setDate(end.getDate() + 1)
        end.setHours(23, 59, 59)
        gantt.config.start_date = start
        gantt.config.end_date = end
      }
    }

    // 重新渲染以应用新的时间范围
    gantt.render()
  } catch (error) {
    console.error('加载甘特图数据失败:', error)
    proxy.$modal.msgError('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 转换数据格式
const transformData = (rawData) => {
  const data = { data: [], links: [] }
  let taskIdCounter = 1

  rawData.forEach((resource) => {
    // 添加机台（作为父任务）
    const machineId = `machine_${resource.resourceId}`
    data.data.push({
      id: machineId,
      text: `${resource.name} (${resource.orgUnit})`,
      type: gantt.config.types.project,
      open: true,
    })

    // 添加任务
    resource.items.forEach((task) => {
      const taskId = `task_${taskIdCounter++}`
      data.data.push({
        id: taskId,
        text: task.batchId,
        start_date: task.start,
        end_date: task.end,
        parent: machineId,
        type: gantt.config.types.task,
        // 保存原始数据用于详情显示
        taskId: task.taskId,
        batchId: task.batchId,
        opCode: task.opCode,
        status: task.status,
        machineName: resource.name,
      })
    })
  })

  return data
}

// 显示任务详情
const showTaskDetail = (task) => {
  selectedTask.value = {
    taskId: task.taskId,
    batchId: task.batchId,
    opCode: task.opCode,
    status: task.status,
    start: gantt.date.date_to_str('%Y-%m-%d %H:%i:%s')(task.start_date),
    end: gantt.date.date_to_str('%Y-%m-%d %H:%i:%s')(task.end_date),
    machineName: task.machineName,
  }
  detailDialogVisible.value = true
}

// 计算时长
const calculateDuration = (task) => {
  const start = new Date(task.start)
  const end = new Date(task.end)
  const hours = ((end - start) / (1000 * 60 * 60)).toFixed(1)
  return `${hours} 小时`
}

// 获取状态标签
const getStatusLabel = (status) => {
  const dict = operation_task_status.value.find((item) => item.value === status)
  return dict ? dict.label : status
}

// 搜索
const handleQuery = () => {
  loadData()
}

// 重置
const resetQuery = () => {
  queryParams.orgUnit = null
  queryParams.machineId = null
  queryParams.status = null
  dateRange.value = []
  loadData()
}

// 刷新
const handleRefresh = () => {
  loadData()
}

// 缩放级别变化
const handleZoomChange = (level) => {
  setZoomLevel(level)
  gantt.render()
}

onMounted(() => {
  nextTick(() => {
    initGantt()
    loadData()
  })
})

onUnmounted(() => {
  if (gantt.$destroyed === false) {
    gantt.clearAll()
  }
})
</script>

<style lang="scss" scoped>
.gantt-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-card {
  flex-shrink: 0;

  :deep(.el-card__body) {
    padding: 16px;
  }

  .el-form {
    margin-bottom: 0;
  }

  .view-controls {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
  }
}

.gantt-card {
  flex: 1;
  min-height: 0;
  overflow: hidden;

  :deep(.el-card__body) {
    height: 100%;
    padding: 0;
  }
}

.gantt-chart {
  width: 100%;
  height: 600px;

  // 优化文字显示
  :deep(.gantt_task_content) {
    overflow: visible !important; // 强制可见，让文字完整显示
    text-overflow: clip !important; // 避免省略号
    white-space: nowrap !important;
    padding: 0 8px !important; // 增加内边距
    font-size: 12px !important;
    line-height: 32px !important; // 与条块高度一致，垂直居中
    font-weight: 500 !important;
    word-break: keep-all !important; // 防止单词断行
  }

  // 确保条块有足够宽度和样式
  :deep(.gantt_task_line) {
    min-width: 80px !important; // 增加最小宽度
    box-sizing: border-box !important;
  }

  // 右侧文字样式
  :deep(.gantt_task_rightside_text) {
    padding-right: 8px !important;
    line-height: 32px !important;
  }
}
</style>

<style lang="scss">
// 甘特图任务颜色样式
.gantt-task-scheduled {
  background-color: #409eff;
  border-color: #409eff;
}

.gantt-task-running {
  background-color: #67c23a;
  border-color: #67c23a;
}

.gantt-task-completed {
  background-color: #909399;
  border-color: #909399;
}

.gantt-task-paused {
  background-color: #e6a23c;
  border-color: #e6a23c;
}

.gantt-task-cancelled {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

// 甘特图容器样式优化
.gantt_container {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.gantt_grid_scale,
.gantt_task_scale {
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.gantt_grid_head_cell,
.gantt_scale_cell {
  color: #606266;
  font-weight: 600;
}

.gantt_row.odd {
  background-color: #fafafa;
}

.gantt_row {
  border-bottom: 1px solid #ebeef5;
}

.gantt_cell {
  border-right: 1px solid #ebeef5;
}

.gantt_task_line {
  border-radius: 4px;
}

.gantt_task_content {
  color: white;
  font-weight: 500;
  font-size: 12px;
}

// Tooltip 样式
.gantt_tooltip {
  background: white !important;
  color: #303133 !important;
  border: 1px solid #dcdfe6 !important;
  border-radius: 4px !important;
  padding: 0 !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15) !important;
  max-width: 350px !important;
  z-index: 9999 !important;

  b {
    color: #606266;
  }
}
</style>
