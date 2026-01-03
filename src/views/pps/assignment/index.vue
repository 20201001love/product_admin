<template>
  <div class="app-container assignment-container">
    <!-- 任务列表 -->
    <el-card>
      <!-- 顶部搜索 -->
      <el-form :model="taskQueryParams" ref="taskQueryRef" :inline="true" v-show="showSearch" label-width="68px">
        <el-form-item label="批次" prop="batchId">
          <el-input v-model="taskQueryParams.batchId" placeholder="请输入批次ID" clearable @keyup.enter="handleTaskQuery"
            style="width: 150px;" />
        </el-form-item>
        <el-form-item label="工序" prop="opCode">
          <el-input v-model="taskQueryParams.opCode" placeholder="请输入工序" clearable @keyup.enter="handleTaskQuery"
            style="width: 150px;" />
        </el-form-item>
        <el-form-item class="search-btn">
          <el-button type="primary" icon="Search" @click="handleTaskQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetTaskQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-button type="primary" plain icon="Sort" @click="handleScheduleAll">全部排程</el-button>
      <!-- 表格 -->
      <el-table border v-loading="taskLoading" :data="taskList">
        <el-table-column label="任务" align="center" prop="taskId" />
        <el-table-column label="批次" align="center" prop="batchId" />
        <el-table-column label="工序" align="center">
          <template #default="scope">
            <dict-tag :options="op_code" :value="scope.row.opCode" />
          </template>
        </el-table-column>
        <el-table-column label="任务状态" align="center" width="150">
          <template #default="scope">
            <dict-tag :options="operation_task_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button v-if="scope.row.status === 'READY'" type="primary" plain icon="Sort"
              @click="handleSchedule(scope.row)">一键排程</el-button>
            <el-button v-if="scope.row.status === 'SCHEDULED'" type="danger" plain icon="Close"
              @click="handleRevokeSchedule(scope.row)">撤销排程</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 添加或修改工序任务对话框 -->
      <vxe-modal :title="isScheduleAll ? '全部排程' : '一键排程'" v-model="assignmentOpen" width="500px" show-maximize
        showFooter resize>
        <el-form ref="scheduleRef" :model="assignmentForm" :rules="assignmentForm.rules" label-width="80px">
          <el-form-item v-if="!isScheduleAll" label="任务ID" prop="taskId">
            <el-input v-model="assignmentForm.taskId" disabled />
          </el-form-item>
          <el-form-item label="排程起点" prop="assignmentStart">
            <el-date-picker clearable v-model="assignmentForm.assignmentStart" type="date" value-format="YYYY-MM-DD"
              placeholder="请选择排程起点" style="width: 100%;">
            </el-date-picker>
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button type="primary" @click="handleAssignment">确 定</el-button>
            <el-button @click="handleAssignmentCancel">取 消</el-button>
          </div>
        </template>
      </vxe-modal>

      <!-- 分页组件 -->
      <pagination v-show="taskTotal > 0" :total="taskTotal" v-model:page="taskQueryParams.pageNum"
        v-model:limit="taskQueryParams.pageSize" @pagination="getTaskList" />
    </el-card>
    <!-- 派工/排程结果 -->
    <el-card>
      <!-- 顶部搜索 -->
      <el-form :model="assignmentQueryParams" ref="assignmentQueryRef" :inline="true" v-show="showSearch"
        label-width="68px">
        <el-form-item label="任务" prop="taskId">
          <el-input v-model="assignmentQueryParams.taskId" placeholder="请输入任务ID" clearable
            @keyup.enter="handleAssignmentQuery" />
        </el-form-item>
        <el-form-item label="批次" prop="machineId">
          <el-input v-model="assignmentQueryParams.machineId" placeholder="请输入批次ID" clearable
            @keyup.enter="handleAssignmentQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleAssignmentQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetAssignmentQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 顶部按钮 -->
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate">修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">删除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="warning" plain icon="Download" @click="handleExport">导出</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getAssignmentList"></right-toolbar>
      </el-row>

      <!-- 表格 -->
      <el-table @row-click="clickRow" ref="table" highlight-current-row border v-loading="assignmentLoading"
        :data="assignmentList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="序号" align="center" type="index" :index="indexMethod" />
        <el-table-column label="任务" align="center" prop="taskId" />
        <el-table-column label="批次" align="center" prop="batchId" />
        <el-table-column label="工序" align="center">
          <template #default="scope">
            <dict-tag :options="op_code" :value="scope.row.opCode" />
          </template>
        </el-table-column>
        <el-table-column label="机台" align="center" prop="machineId" />
        <el-table-column label="计划开始" align="center" prop="plannedStart" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.plannedStart, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="计划结束" align="center" prop="plannedEnd" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.plannedEnd, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <pagination v-show="assignmentTotal > 0" :total="assignmentTotal" v-model:page="assignmentQueryParams.pageNum"
        v-model:limit="assignmentQueryParams.pageSize" @pagination="getAssignmentList" />

      <!-- 添加或修改派工/排程结果对话框 -->
      <vxe-modal :title="title" v-model="open" width="500px" show-maximize showFooter resize>
        <el-form ref="assignmentRef" :model="form" :rules="rules" label-width="80px">
          <el-form-item label="任务ID" prop="taskId">
            <el-input v-model="form.taskId" placeholder="请输入任务ID" />
          </el-form-item>
          <el-form-item label="注塑机ID" prop="machineId">
            <el-input v-model="form.machineId" placeholder="请输入注塑机ID" />
          </el-form-item>
          <el-form-item label="计划开始" prop="plannedStart">
            <el-date-picker clearable v-model="form.plannedStart" type="date" value-format="YYYY-MM-DD"
              placeholder="请选择计划开始">
            </el-date-picker>
          </el-form-item>
          <el-form-item label="计划结束" prop="plannedEnd">
            <el-date-picker clearable v-model="form.plannedEnd" type="date" value-format="YYYY-MM-DD"
              placeholder="请选择计划结束">
            </el-date-picker>
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="cancel">取 消</el-button>
          </div>
        </template>
      </vxe-modal>
    </el-card>
  </div>
</template>

<script setup name="Assignment">
import { onMounted, onUnmounted, nextTick } from 'vue'
import { listAssignment, getAssignment, delAssignment, addAssignment, updateAssignment, scheduleTask } from "@/api/pps/assignment"
import { listTask, revokeSchedule } from "@/api/pps/task"
import { getToken } from "@/utils/auth.js";
const baseURL = import.meta.env.VITE_APP_BASE_API

const { proxy } = getCurrentInstance()

// 任务列表相关（第一张卡片）
const taskList = ref([])
const taskLoading = ref(true)
const taskLoadingMore = ref(false)
const taskHasMore = ref(true)
const taskQueryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  batchId: null,
  opCode: null,
  statusList: ['READY', 'SCHEDULED'] // 只查询 READY 和 SCHEDULED 状态
})

// 派工/排程结果相关（第二张卡片）
const assignmentList = ref([])
const assignmentLoading = ref(true)
const assignmentTotal = ref(0)
const assignmentQueryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  taskId: null,
  machineId: null,
  plannedStart: null,
  plannedEnd: null,
})

const isScheduleAll = ref(false) // 是否为全部排程模式
const assignmentForm = reactive({
  taskId: null,
  assignmentStart: null,
  rules: {
    assignmentStart: [
      { required: true, message: "排程起点不能为空", trigger: "blur" }
    ],
  }
})

const open = ref(false)
const assignmentOpen = ref(false)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const title = ref("")
const selectedRow = ref(null)
const { op_code } = proxy.useDict("op_code")
const { operation_task_status } = proxy.useDict("operation_task_status")
const data = reactive({
  form: {},
  rules: {
    taskId: [
      { required: true, message: "任务ID不能为空", trigger: "blur" }
    ],
    plannedStart: [
      { required: true, message: "计划开始不能为空", trigger: "blur" }
    ],
    plannedEnd: [
      { required: true, message: "计划结束不能为空", trigger: "blur" }
    ],
  }
})

const { form, rules } = toRefs(data)

//点击行 获取行
const clickRow = (row) => {
  selectedRow.value = row; // 更新选中的行
  const table = proxy.$refs.table;
  // 清除所有已选中的行
  table.clearSelection();
  // 选中当前点击的行
  table.toggleRowSelection(row, true);
}

/** 自定义序号 */
const indexMethod = (index) => {
  let pageNum = assignmentQueryParams.pageNum - 1;
  if ((pageNum !== -1 && pageNum !== 0)) {
    return (index + 1) + (pageNum * assignmentQueryParams.pageSize);
  } else {
    return (index + 1)
  }
}

/** 查询任务列表（只查询 READY 和 SCHEDULED 状态，支持滚动加载） */
const getTaskList = (reset = false) => {
  if (reset) {
    taskList.value = []
    taskHasMore.value = true
    taskQueryParams.pageNum = 1
    taskLoading.value = true
  } else {
    taskLoadingMore.value = true
  }
  // 构建查询参数，过滤空值并确保只查询 READY 和 SCHEDULED 状态
  const params = {
    pageNum: taskQueryParams.pageNum,
    pageSize: taskQueryParams.pageSize,
    statusList: taskQueryParams.statusList // 数组形式，axios 会自动转换为 statusList[]=READY&statusList[]=SCHEDULED
  }
  // 添加非空查询条件
  if (taskQueryParams.batchId) {
    params.batchId = taskQueryParams.batchId
  }
  if (taskQueryParams.opCode) {
    params.opCode = taskQueryParams.opCode
  }
  return listTask(params).then(response => {
    const rows = response.rows || []
    if (reset) {
      taskList.value = rows
    } else {
      taskList.value.push(...rows)
    }
    // 判断是否还有更多数据
    if (response.total !== undefined) {
      taskHasMore.value = taskList.value.length < response.total
    } else {
      // 降级方案：如果返回的数据量等于页面大小，认为可能还有更多数据
      taskHasMore.value = rows.length === taskQueryParams.pageSize
    }
  }).catch(error => {
    console.error('加载任务列表失败:', error)
    taskHasMore.value = false
  }).finally(() => {
    taskLoading.value = false
    taskLoadingMore.value = false
  })
}

/** 任务列表滚动监听 */
const handleTaskScroll = () => {
  // 获取表格容器（el-table 的父容器）
  const tableContainer = document.querySelector('.assignment-container .el-card:first-child .el-card__body')
  if (!tableContainer) return

  const remaining = tableContainer.scrollHeight - tableContainer.scrollTop - tableContainer.clientHeight

  if (taskLoadingMore.value || !taskHasMore.value) return

  const threshold = 100 // 提前100px触发加载
  if (remaining <= threshold) {
    taskQueryParams.pageNum += 1
    getTaskList()
  }
}

/** 任务搜索按钮操作 */
const handleTaskQuery = () => {
  taskQueryParams.pageNum = 1
  getTaskList(true)
}

/** 任务重置按钮操作 */
const resetTaskQuery = () => {
  proxy.resetForm("taskQueryRef")
  taskQueryParams.batchId = null
  taskQueryParams.opCode = null
  handleTaskQuery()
}

/** 一键排程 */
const handleSchedule = (row) => {
  isScheduleAll.value = false
  assignmentForm.taskId = row.taskId
  assignmentForm.assignmentStart = null
  assignmentOpen.value = true
  // 重置表单验证状态
  nextTick(() => {
    if (proxy.$refs.scheduleRef) {
      proxy.$refs.scheduleRef.clearValidate()
    }
  })
}

/** 全部排程 */
const handleScheduleAll = () => {
  isScheduleAll.value = true
  assignmentForm.taskId = null
  assignmentForm.assignmentStart = null
  assignmentOpen.value = true
  // 重置表单验证状态
  nextTick(() => {
    if (proxy.$refs.scheduleRef) {
      proxy.$refs.scheduleRef.clearValidate()
    }
  })
}

/** 撤销排程 */
const handleRevokeSchedule = (row) => {
  proxy.$modal.confirm('确认要撤销该任务的排程吗？派工记录也将被删除。', '撤销排程', {
    confirmButtonText: '确认撤销',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(function () {
    return revokeSchedule(row.taskId)
  }).then(() => {
    getTaskList(true)
    getAssignmentList()
    proxy.$modal.msgSuccess("排程已撤销，派工记录已删除")
  }).catch(() => { })
}

/** 查询派工/排程结果列表 */
const getAssignmentList = () => {
  assignmentLoading.value = true
  listAssignment(assignmentQueryParams).then(response => {
    assignmentList.value = response.rows
    assignmentTotal.value = response.total
    assignmentLoading.value = false
  })
}

// 取消按钮
const cancel = () => {
  open.value = false
  reset()
}

// 表单重置
const reset = () => {
  form.value = {
    assignmentId: null,
    taskId: null,
    machineId: null,
    plannedStart: null,
    plannedEnd: null,
    createTime: null,
    updateTime: null
  }
  proxy.resetForm("assignmentRef")
}

/** 派工搜索按钮操作 */
const handleAssignmentQuery = () => {
  assignmentQueryParams.pageNum = 1
  getAssignmentList()
}

/** 派工重置按钮操作 */
const resetAssignmentQuery = () => {
  proxy.resetForm("assignmentQueryRef")
  handleAssignmentQuery()
}

// 多选框选中数据
const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.assignmentId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset()
  open.value = true
  title.value = "添加派工/排程结果"
}

/** 修改按钮操作 */
const handleUpdate = (row) => {
  reset()
  const _assignmentId = row.assignmentId || ids.value
  getAssignment(_assignmentId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改派工/排程结果"
  })
}

/** 提交按钮 */
const submitForm = () => {
  proxy.$refs["assignmentRef"].validate(valid => {
    if (valid) {
      if (form.value.assignmentId != null) {
        updateAssignment(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getAssignmentList()
        })
      } else {
        addAssignment(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getAssignmentList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
const handleDelete = (row) => {
  const _assignmentIds = row.assignmentId || ids.value
  proxy.$modal.confirm('是否确认删除该项数据？').then(function () {
    return delAssignment(_assignmentIds)
  }).then(() => {
    getAssignmentList()
    getTaskList(true)
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy.download('pps/assignment/export', {
    ...assignmentQueryParams
  }, `assignment_${new Date().getTime()}.xlsx`)
}

/** 一键排程确定按钮 */
const handleAssignment = () => {
  if (!proxy.$refs.scheduleRef) return
  proxy.$refs.scheduleRef.validate(valid => {
    if (valid) {
      const params = {
        assignmentStart: assignmentForm.assignmentStart
      }
      // 只有单个排程时才携带任务ID
      if (!isScheduleAll.value) {
        params.taskId = assignmentForm.taskId
      }
      scheduleTask(params).then(response => {
        proxy.$modal.msgSuccess(isScheduleAll.value ? "全部排程成功" : "排程成功")
        assignmentOpen.value = false
        // 刷新任务列表和派工列表
        getTaskList(true)
        getAssignmentList()
      }).catch(error => {
        console.error('排程失败:', error)
      })
    }
  })
}

/** 一键排程取消按钮 */
const handleAssignmentCancel = () => {
  assignmentOpen.value = false
  isScheduleAll.value = false
  assignmentForm.taskId = null
  assignmentForm.assignmentStart = null
  if (proxy.$refs.scheduleRef) {
    proxy.$refs.scheduleRef.clearValidate()
  }
}

// 初始化：同时加载任务列表和派工列表
getTaskList(true)
getAssignmentList()

// 监听任务列表表格容器的滚动
onMounted(() => {
  const tableContainer = document.querySelector('.assignment-container .el-card:first-child .el-card__body')
  if (tableContainer) {
    tableContainer.addEventListener('scroll', handleTaskScroll, { passive: true })
  }
})

onUnmounted(() => {
  const tableContainer = document.querySelector('.assignment-container .el-card:first-child .el-card__body')
  if (tableContainer) {
    tableContainer.removeEventListener('scroll', handleTaskScroll)
  }
})
</script>

<style lang="scss" scoped>
.assignment-container {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.search-btn {
  float: right;
}
</style>
