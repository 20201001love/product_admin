<template>
  <div class="app-container">
    <!-- 顶部搜索 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入名称" clearable @keyup.enter="handleQuery"
          style="width: 130px;" />
      </el-form-item>
      <el-form-item label="锁模力" prop="tonnage">
        <el-input v-model="queryParams.tonnage" placeholder="请输入锁模力" clearable @keyup.enter="handleQuery"
          style="width: 130px;" />
      </el-form-item>
      <el-form-item label="换模时间" prop="defaultSetupTimeMin">
        <el-input v-model="queryParams.defaultSetupTimeMin" placeholder="请输入换模时间" clearable @keyup.enter="handleQuery"
          style="width: 130px;" />
      </el-form-item>
      <el-form-item label="日历" prop="calendarId">
        <el-select v-model="queryParams.calendarId" placeholder="请选择日历" style="width: 130px;">
          <el-option v-for="item in calendarList" :key="item.calendarId" :label="item.calendarName"
            :value="item.calendarId" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" style="width: 130px;">
          <el-option v-for="item in resource_status" :key="item.value" :label="item.label" :value="item.value" />
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
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 表格 -->
    <el-table @row-click="clickRow" ref="table" highlight-current-row border v-loading="loading" :data="machineList"
      @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" type="index" :index="indexMethod" />
      <el-table-column label="机台名称" align="center" prop="name" />
      <el-table-column label="锁模力" align="center" prop="tonnage" />
      <el-table-column label="换模基准时间" align="center" prop="defaultSetupTimeMin" />
      <el-table-column label="日历" align="center" prop="calendarName" />
      <el-table-column label="车间" align="center" prop="orgUnit" />
      <el-table-column label="状态" align="center" prop="effectiveStatus" width="150">
        <template #default="scope">
          <!-- AVAILABLE 状态：可故障或保养 -->
          <el-tooltip v-if="scope.row.effectiveStatus === 'AVAILABLE'" placement="top" effect="light" :show-after="300"
            :offset="8">
            <template #content>
              <div class="status-popover-content">
                <div class="popover-title">状态操作</div>
                <el-button type="danger" plain size="small" @click="handleSetDown(scope.row)" class="status-action-btn">
                  <el-icon>
                    <Warning />
                  </el-icon>
                  故障
                </el-button>
                <el-button type="warning" plain size="small" @click="handleSetMaintenance(scope.row)"
                  class="status-action-btn">
                  <el-icon>
                    <Tools />
                  </el-icon>
                  保养
                </el-button>
              </div>
            </template>
            <span class="interactive-status-tag status-available">
              <el-icon class="status-icon">
                <Edit />
              </el-icon>
              <dict-tag :options="resource_status" :value="scope.row.effectiveStatus" />
            </span>
          </el-tooltip>

          <!-- DOWN 状态：可恢复 -->
          <el-tooltip v-else-if="scope.row.effectiveStatus === 'DOWN'" placement="top" effect="light" :show-after="300"
            :offset="8">
            <template #content>
              <div class="status-popover-content">
                <div class="popover-title">状态操作</div>
                <el-button type="success" plain size="small" @click="handleRestoreMachine(scope.row)"
                  class="status-action-btn">
                  <el-icon>
                    <RefreshRight />
                  </el-icon>
                  恢复
                </el-button>
              </div>
            </template>
            <span class="interactive-status-tag status-down">
              <el-icon class="status-icon">
                <Edit />
              </el-icon>
              <dict-tag :options="resource_status" :value="scope.row.effectiveStatus" />
            </span>
          </el-tooltip>

          <!-- MAINTENANCE 状态：可恢复 -->
          <el-tooltip v-else-if="scope.row.effectiveStatus === 'MAINTENANCE'" placement="top" effect="light"
            :show-after="300" :offset="8">
            <template #content>
              <div class="status-popover-content">
                <div class="popover-title">状态操作</div>
                <el-button type="success" plain size="small" @click="handleRestoreMachine(scope.row)"
                  class="status-action-btn">
                  <el-icon>
                    <RefreshRight />
                  </el-icon>
                  恢复
                </el-button>
              </div>
            </template>
            <span class="interactive-status-tag status-maintenance">
              <el-icon class="status-icon">
                <Edit />
              </el-icon>
              <dict-tag :options="resource_status" :value="scope.row.effectiveStatus" />
            </span>
          </el-tooltip>

          <!-- 其他状态：仅显示 -->
          <dict-tag v-else :options="resource_status" :value="scope.row.effectiveStatus" />
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

    <!-- 添加或修改注塑机扩展信息对话框 -->
    <vxe-modal :title="title" v-model="open" width="500px" show-maximize showFooter resize>
      <el-form ref="machineRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="锁模力" prop="tonnage">
          <el-input v-model="form.tonnage" placeholder="请输入锁模力" />
        </el-form-item>
        <el-form-item label="换模时间" prop="defaultSetupTimeMin">
          <el-input v-model="form.defaultSetupTimeMin" placeholder="请输入换模时间" />
        </el-form-item>
        <el-form-item label="车间" prop="orgUnit">
          <el-select v-model="form.orgUnit" placeholder="请选择车间">
            <el-option value="车间1" label="车间1" />
            <el-option value="车间2" label="车间2" />
            <el-option value="车间3" label="车间3" />
          </el-select>
        </el-form-item>
        <el-form-item label="日历" prop="calendarId">
          <el-select v-model="form.calendarId" placeholder="请选择日历">
            <el-option v-for="item in calendarList" :key="item.calendarId" :label="item.calendarName"
              :value="item.calendarId" />
          </el-select>
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

<script setup name="Machine">
import { listMachine, getMachine, delMachine, addMachine, updateMachine, setMachineDown, setMachineMaintenance, restoreMachine } from "@/api/master/resource/machine"
import { getToken } from "@/utils/auth.js";
import useCalendarStore from '@/stores/modules/calendar'
import { Edit, Warning, Tools, RefreshRight } from '@element-plus/icons-vue'
const { proxy } = getCurrentInstance()
const baseURL = import.meta.env.VITE_APP_BASE_API
const calendarStore = useCalendarStore()

const { resource_status } = proxy.useDict('resource_status')

// 使用日历仓库的列表
const calendarList = computed(() => calendarStore.calendarList)
const machineList = ref([])
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
    tonnage: null,
    defaultSetupTimeMin: null,
    name: null,
    calendarId: null,
    status: null
  },
  rules: {
    tonnage: [
      { required: true, message: "锁模力不能为空", trigger: "blur" }
    ],
    defaultSetupTimeMin: [
      { required: true, message: "换模基准时间不能为空", trigger: "blur" }
    ],
    name: [
      { required: true, message: "名称不能为空", trigger: "blur" }
    ]
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

/** 查询注塑机扩展信息列表 */
const getList = () => {
  loading.value = true
  listMachine(queryParams.value).then(response => {
    machineList.value = response.rows
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
    machineId: null,
    tonnage: null,
    defaultSetupTimeMin: null,
    calendarId: null
  }
  proxy.resetForm("machineRef")
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
  ids.value = selection.map(item => item.machineId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset()
  open.value = true
  title.value = "添加注塑机扩展信息"
}

/** 修改按钮操作 */
const handleUpdate = (row) => {
  reset()
  const _machineId = row.machineId || ids.value
  getMachine(_machineId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改注塑机扩展信息"
  })
}

/** 提交按钮 */
const submitForm = () => {
  proxy.$refs["machineRef"].validate(valid => {
    if (valid) {
      if (form.value.machineId != null) {
        updateMachine(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addMachine(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
const handleDelete = (row) => {
  const _machineIds = row.machineId || ids.value
  proxy.$modal.confirm('是否确认删除该项数据？').then(function () {
    return delMachine(_machineIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy.download('master/machine/export', {
    ...queryParams.value
  }, `machine_${new Date().getTime()}.xlsx`)
}

/** 设置机器为故障状态 (AVAILABLE → DOWN) */
const handleSetDown = (row) => {
  proxy.$modal.confirm('确认要将该机器设置为故障状态吗？').then(function () {
    return setMachineDown(row.machineId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("机器已设置为故障状态")
  }).catch(() => { })
}

/** 设置机器为保养状态 (AVAILABLE → MAINTENANCE) */
const handleSetMaintenance = (row) => {
  proxy.$modal.confirm('确认要将该机器设置为保养状态吗？').then(function () {
    return setMachineMaintenance(row.machineId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("机器已设置为保养状态")
  }).catch(() => { })
}

/** 恢复机器状态 (DOWN/MAINTENANCE → AVAILABLE) */
const handleRestoreMachine = (row) => {
  proxy.$modal.confirm('确认要恢复该机器为可用状态吗？').then(function () {
    return restoreMachine(row.machineId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("机器已恢复为可用状态")
  }).catch(() => { })
}

// 初始化日历列表
calendarStore.getCalendarList()
getList()
</script>

<style lang="scss" scoped>
/* 可交互的状态标签（参照任务页面样式） */
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

/* AVAILABLE 状态样式（绿色） */
.status-available {
  color: #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #e8f5e9 100%);
  border-color: #c2e7b0;
}

.status-available:hover {
  color: #85ce61;
  background: linear-gradient(135deg, #e8f5e9 0%, #c2e7b0 100%);
  border-color: #a4d689;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
}

/* DOWN 状态样式（红色） */
.status-down {
  color: #f56c6c;
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  border-color: #fbc4c4;
}

.status-down:hover {
  color: #f78989;
  background: linear-gradient(135deg, #fde2e2 0%, #fbc4c4 100%);
  border-color: #f9a7a7;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
}

/* MAINTENANCE 状态样式（橙色） */
.status-maintenance {
  color: #e6a23c;
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border-color: #f5dab1;
}

.status-maintenance:hover {
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
  display: flex;
  flex-direction: column;
  align-items: center;
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

/* 气泡中的按钮 */
.status-popover-content .el-button {
  margin-top: 4px;
  transition: all 0.3s ease;
}

.status-popover-content .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 状态操作按钮统一样式，确保对齐 */
.status-action-btn {
  width: 80% !important;
  margin-bottom: 8px !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.status-action-btn:last-child {
  margin-bottom: 0 !important;
}

/* 确保按钮内部内容对齐 */
.status-action-btn :deep(.el-button__inner) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100%;
}

.status-action-btn :deep(.el-icon) {
  margin-right: 4px !important;
  display: inline-flex !important;
  align-items: center !important;
  flex-shrink: 0;
}
</style>
