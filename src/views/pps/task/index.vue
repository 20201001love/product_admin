<template>
  <div class="app-container">
    <!-- 顶部搜索 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="批次ID" prop="batchId">
        <el-input v-model="queryParams.batchId" placeholder="请输入批次ID" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="工序" prop="opCode">
        <el-input v-model="queryParams.opCode" placeholder="请输入工序" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="工序顺序" prop="sequence">
        <el-input v-model="queryParams.sequence" placeholder="请输入工序顺序" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="预计时长" prop="stdDurationMin">
        <el-input v-model="queryParams.stdDurationMin" placeholder="请输入预计时长" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 顶部按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 表格 -->
    <el-table @row-click="clickRow" ref="table" highlight-current-row border v-loading="loading" :data="taskList"
      @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" type="index" :index="indexMethod" />
      <el-table-column label="任务ID" align="center" prop="taskId" />
      <el-table-column label="所属批次ID" align="center" prop="batchId" />
      <el-table-column label="工序" align="center">
        <template #default="scope">
          <dict-tag :options="op_code" :value="scope.row.opCode" />
        </template>
      </el-table-column>
      <el-table-column label="工序顺序" align="center" prop="sequence" />
      <el-table-column label="预计时长" align="center" prop="stdDurationMin" />
      <el-table-column label="最早时间" align="center" prop="earliestStart" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.earliestStart, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="任务状态" align="center" width="150">
        <template #default="scope">
          <!-- READY 状态：可取消 -->
          <el-popover v-if="scope.row.status === 'READY'" placement="top" :width="150" trigger="hover">
            <template #reference>
              <span class="interactive-status-tag status-ready">
                <el-icon class="status-icon">
                  <Edit />
                </el-icon>
                <dict-tag :options="operation_task_status" :value="scope.row.status" />
              </span>
            </template>
            <div class="status-popover-content">
              <div class="popover-title">状态操作</div>
              <el-button type="danger" plain size="small" @click="handleCancelTask(scope.row)" style="width: 100%;">
                <el-icon>
                  <Close />
                </el-icon>
                取消任务
              </el-button>
            </div>
          </el-popover>

          <!-- CANCELLED 状态：可恢复 -->
          <el-popover v-else-if="scope.row.status === 'CANCELLED'" placement="top" :width="120" trigger="hover">
            <template #reference>
              <span class="interactive-status-tag status-cancelled">
                <el-icon class="status-icon">
                  <Edit />
                </el-icon>
                <dict-tag :options="operation_task_status" :value="scope.row.status" />
              </span>
            </template>
            <div class="status-popover-content">
              <div class="popover-title">状态操作</div>
              <el-button type="success" plain size="small" @click="handleRestoreTask(scope.row)" style="width: 100%;">
                <el-icon>
                  <RefreshRight />
                </el-icon>
                恢复任务
              </el-button>
            </div>
          </el-popover>

          <!-- SCHEDULED 状态：可撤销排程 -->
          <el-popover v-else-if="scope.row.status === 'SCHEDULED'" placement="top" :width="120" trigger="hover">
            <template #reference>
              <span class="interactive-status-tag status-scheduled">
                <el-icon class="status-icon">
                  <Edit />
                </el-icon>
                <dict-tag :options="operation_task_status" :value="scope.row.status" />
              </span>
            </template>
            <div class="status-popover-content">
              <div class="popover-title">状态操作</div>
              <div class="popover-warning">⚠️ 派工记录将被删除</div>
              <el-button type="warning" plain size="small" @click="handleRevokeSchedule(scope.row)"
                style="width: 100%;">
                <el-icon>
                  <RefreshLeft />
                </el-icon>
                撤销排程
              </el-button>
            </div>
          </el-popover>

          <!-- 其他状态：仅显示 -->
          <dict-tag v-else :options="operation_task_status" :value="scope.row.status" />
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
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改工序任务对话框 -->
    <vxe-modal :title="title" v-model="open" width="500px" show-maximize showFooter resize>
      <el-form ref="taskRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="批次ID" prop="batchId">
          <el-input v-model="form.batchId" placeholder="请输入批次ID" />
        </el-form-item>
        <el-form-item label="预计时长" prop="stdDurationMin">
          <el-input v-model="form.stdDurationMin" placeholder="请输入预计时长" />
        </el-form-item>
        <el-form-item label="最早时间" prop="earliestStart">
          <el-date-picker clearable v-model="form.earliestStart" type="date" value-format="YYYY-MM-DD"
            placeholder="请选择最早时间">
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
  </div>
</template>

<script setup name="Task">
import { Close, RefreshRight, RefreshLeft, Edit } from '@element-plus/icons-vue'
import { listTask, getTask, delTask, addTask, updateTask, cancelTask, restoreTask, revokeSchedule } from "@/api/pps/task"
import { getToken } from "@/utils/auth.js";
const baseURL = import.meta.env.VITE_APP_BASE_API

const { proxy } = getCurrentInstance()
const { op_code } = proxy.useDict("op_code")
const { operation_task_status } = proxy.useDict("operation_task_status")
const taskList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const selectedRow = ref(null)

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    batchId: null,
    opCode: null,
    sequence: null,
    stdDurationMin: null,
    earliestStart: null,
    status: null,
  },
  rules: {
    batchId: [
      { required: true, message: "批次ID不能为空", trigger: "blur" }
    ],
    opCode: [
      { required: true, message: "工序不能为空", trigger: "blur" }
    ],
    sequence: [
      { required: true, message: "工序顺序不能为空", trigger: "blur" }
    ],
    stdDurationMin: [
      { required: true, message: "预计时长不能为空", trigger: "blur" }
    ],
    earliestStart: [
      { required: true, message: "最早时间不能为空", trigger: "blur" }
    ],
    status: [
      { required: true, message: "任务状态不能为空", trigger: "change" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

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
  let pageNum = queryParams.value.pageNum - 1;
  if ((pageNum !== -1 && pageNum !== 0)) {
    return (index + 1) + (pageNum * queryParams.value.pageSize);
  } else {
    return (index + 1)
  }
}

/** 查询工序任务列表 */
const getList = () => {
  loading.value = true
  listTask(queryParams.value).then(response => {
    taskList.value = response.rows
    total.value = response.total
    loading.value = false
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
    taskId: null,
    batchId: null,
    opCode: null,
    sequence: null,
    stdDurationMin: null,
    earliestStart: null,
    status: null,
    createTime: null,
    updateTime: null
  }
  proxy.resetForm("taskRef")
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  proxy.resetForm("queryRef")
  handleQuery()
}

// 多选框选中数据
const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.taskId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset()
  open.value = true
  title.value = "添加工序任务"
}

/** 修改按钮操作 */
const handleUpdate = (row) => {
  reset()
  const _taskId = row.taskId || ids.value
  getTask(_taskId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改工序任务"
  })
}

/** 提交按钮 */
const submitForm = () => {
  proxy.$refs["taskRef"].validate(valid => {
    if (valid) {
      updateTask(form.value).then(response => {
        proxy.$modal.msgSuccess("修改成功")
        open.value = false
        getList()
      })
    }
  })
}

/** 删除按钮操作 */
const handleDelete = (row) => {
  const _taskIds = row.taskId || ids.value
  proxy.$modal.confirm('是否确认删除该项数据？').then(function () {
    return delTask(_taskIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}

/** 取消任务操作 (READY → CANCELLED) */
const handleCancelTask = (row) => {
  proxy.$modal.confirm('确认要取消该任务吗？').then(function () {
    return cancelTask(row.taskId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("任务已取消")
  }).catch(() => { })
}

/** 恢复任务操作 (CANCELLED → READY) */
const handleRestoreTask = (row) => {
  proxy.$modal.confirm('确认要恢复该任务吗？').then(function () {
    return restoreTask(row.taskId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("任务已恢复")
  }).catch(() => { })
}

/** 撤销排程操作 (SCHEDULED → READY，同时删除派工记录) */
const handleRevokeSchedule = (row) => {
  proxy.$modal.confirm('确认要撤销该任务的排程吗？派工记录也将被删除。', '撤销排程', {
    confirmButtonText: '确认撤销',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(function () {
    return revokeSchedule(row.taskId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("排程已撤销，派工记录已删除")
  }).catch(() => { })
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy.download('pps/task/export', {
    ...queryParams.value
  }, `task_${new Date().getTime()}.xlsx`)
}

getList()
</script>

<style lang="scss" scoped>
/* 可交互的状态标签（参照订单行ID样式） */
.interactive-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 流光效果 */
.interactive-status-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.interactive-status-tag:hover::before {
  left: 100%;
}

/* READY 状态样式（蓝色） */
.status-ready {
  color: #409eff;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8f4ff 100%);
  border-color: #d0e5ff;
}

.status-ready:hover {
  color: #66b1ff;
  background: linear-gradient(135deg, #e8f4ff 0%, #d0e5ff 100%);
  border-color: #a0cfff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

/* CANCELLED 状态样式（红色） */
.status-cancelled {
  color: #f56c6c;
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  border-color: #fbc4c4;
}

.status-cancelled:hover {
  color: #f78989;
  background: linear-gradient(135deg, #fde2e2 0%, #fbc4c4 100%);
  border-color: #f9a7a7;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
}

/* SCHEDULED 状态样式（橙色） */
.status-scheduled {
  color: #e6a23c;
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border-color: #f5dab1;
}

.status-scheduled:hover {
  color: #ebb563;
  background: linear-gradient(135deg, #faecd8 0%, #f5dab1 100%);
  border-color: #efc78e;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.3);
}

/* 状态图标 */
.status-icon {
  font-size: 14px;
  transition: transform 0.3s ease;
}

.interactive-status-tag:hover .status-icon {
  transform: scale(1.2) rotate(10deg);
}

/* 气泡内容样式 */
.status-popover-content {
  padding: 8px;
}

.popover-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  text-align: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.popover-warning {
  font-size: 12px;
  color: #e6a23c;
  text-align: center;
  margin-bottom: 8px;
  padding: 4px 8px;
  background: #fdf6ec;
  border-radius: 4px;
  border: 1px solid #f5dab1;
}

/* 气泡中的按钮 */
.status-popover-content .el-button {
  margin-top: 4px;
  transition: all 0.3s ease;
}

.status-popover-content .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
