<template>
  <div class="app-container">
    <!-- 顶部搜索 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="批次" prop="batchId">
        <el-input v-model="queryParams.batchId" placeholder="请输入批次" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="工序" prop="opCode">
        <el-input v-model="queryParams.opCode" placeholder="请输入工序" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="预计时长" prop="stdDurationMin">
        <el-input v-model="queryParams.stdDurationMin" placeholder="请输入预计时长" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table @row-click="clickRow" ref="table" highlight-current-row border v-loading="loading" :data="taskList">
      <el-table-column label="任务" align="center" prop="taskId">
        <template #default="scope">
          <router-link :to="'/execute/event/detail/' + scope.row.taskId" class="link-type">
            <span>{{ scope.row.taskId }}</span>
          </router-link>
        </template>
      </el-table-column>
      <el-table-column label="批次" align="center" prop="batchId" />
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
          <dict-tag :options="operation_task_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button v-if="scope.row.status === 'SCHEDULED'" type="primary" plain icon="SwitchButton"
            @click="handleStart(scope.row)">开工</el-button>
          <el-button v-if="scope.row.status === 'RUNNING'" type="danger" plain icon="SwitchButton"
            @click="handlePause(scope.row)">暂停</el-button>
          <el-button v-if="scope.row.status === 'PAUSED'" type="warning" plain icon="Refresh"
            @click="handleResume(scope.row)">恢复</el-button>
          <el-button v-if="scope.row.status === 'RUNNING'" type="success" plain icon="Check"
            @click="handleComplete(scope.row)">完工</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 暂停对话框 -->
    <el-dialog title="暂停任务" v-model="pauseDialogVisible" width="400px" append-to-body>
      <el-form ref="pauseFormRef" :model="pauseForm" :rules="pauseFormRules" label-width="100px">
        <el-form-item label="暂停时长（分钟）" prop="pauseDuration">
          <el-input-number v-model="pauseForm.pauseDuration" :min="1" :max="9999" placeholder="请输入暂停时长"
            style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="confirmPause">确 定</el-button>
          <el-button @click="cancelPause">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Task">
import { nextTick } from 'vue'
import { listTask } from "@/api/pps/task"
import { startTask, pauseTask, resumeTask, completeTask } from "@/api/execute/event"

const { proxy } = getCurrentInstance()
const { op_code } = proxy.useDict("op_code")
const { operation_task_status } = proxy.useDict("operation_task_status")
const taskList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const selectedRow = ref(null)
const pauseDialogVisible = ref(false)
const currentTask = ref(null)
const pauseForm = reactive({
  pauseDuration: 30
})
const pauseFormRules = {
  pauseDuration: [
    { required: true, message: "暂停时长不能为空", trigger: "blur" },
    { type: 'number', min: 1, message: "暂停时长必须大于0", trigger: "blur" }
  ]
}

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    batchId: null,
    opCode: null,
    stdDurationMin: null,
    earliestStart: null,
    statusList: ['SCHEDULED', 'RUNNING', 'PAUSED', 'DONE'],
  },
  rules: {
    batchId: [
      { required: true, message: "批次不能为空", trigger: "blur" }
    ],
    opCode: [
      { required: true, message: "工序不能为空", trigger: "blur" }
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

const { queryParams } = toRefs(data)

//点击行 获取行
const clickRow = (row) => {
  selectedRow.value = row; // 更新选中的行
  const table = proxy.$refs.table;
  // 清除所有已选中的行
  table.clearSelection();
  // 选中当前点击的行
  table.toggleRowSelection(row, true);
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

/** 开工操作 */
const handleStart = (row) => {
  proxy.$modal.confirm('确认要开工该任务吗？', '开工确认', {
    confirmButtonText: '确认开工',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    return startTask(row.taskId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("任务已开工")
  }).catch(() => { })
}

/** 暂停操作 */
const handlePause = (row) => {
  currentTask.value = row
  pauseForm.pauseDuration = 30
  pauseDialogVisible.value = true
  nextTick(() => {
    if (proxy.$refs.pauseFormRef) {
      proxy.$refs.pauseFormRef.clearValidate()
    }
  })
}

/** 确认暂停 */
const confirmPause = () => {
  if (!proxy.$refs.pauseFormRef) return
  proxy.$refs.pauseFormRef.validate(valid => {
    if (valid && currentTask.value) {
      pauseTask(currentTask.value.taskId, pauseForm.pauseDuration).then(() => {
        pauseDialogVisible.value = false
        getList()
        proxy.$modal.msgSuccess("任务已暂停")
      }).catch(error => {
        console.error('暂停失败:', error)
      })
    }
  })
}

/** 取消暂停 */
const cancelPause = () => {
  pauseDialogVisible.value = false
  currentTask.value = null
  pauseForm.pauseDuration = 30
  if (proxy.$refs.pauseFormRef) {
    proxy.$refs.pauseFormRef.clearValidate()
  }
}

/** 恢复操作 */
const handleResume = (row) => {
  proxy.$modal.confirm('确认要恢复该任务吗？', '恢复确认', {
    confirmButtonText: '确认恢复',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return resumeTask(row.taskId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("任务已恢复")
  }).catch(() => { })
}

/** 完工操作 */
const handleComplete = (row) => {
  proxy.$modal.confirm('确认要完工该任务吗？', '完工确认', {
    confirmButtonText: '确认完工',
    cancelButtonText: '取消',
    type: 'success'
  }).then(() => {
    return completeTask(row.taskId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("任务已完工")
  }).catch(() => { })
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
