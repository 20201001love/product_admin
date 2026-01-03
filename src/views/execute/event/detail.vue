<template>
  <div class="app-container">
    <!-- 顶部搜索 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="任务ID" prop="taskId" v-if="queryParams.taskId">
        <el-input v-model="queryParams.taskId" placeholder="任务ID" disabled />
      </el-form-item>
      <el-form-item v-else label="任务ID" prop="taskId">
        <el-input v-model="queryParams.taskId" placeholder="请输入任务ID" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="事件时间" prop="eventTime">
        <el-date-picker clearable v-model="queryParams.eventTime" type="date" value-format="YYYY-MM-DD"
          placeholder="请选择事件时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="事件资源" prop="resourceId">
        <el-input v-model="queryParams.resourceId" placeholder="请输入事件资源" clearable @keyup.enter="handleQuery" />
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
      <el-col :span="1.5">
        <el-button type="danger" icon="Close" @click="handleClose">关闭</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 表格 -->
    <el-table @row-click="clickRow" ref="table" highlight-current-row border v-loading="loading" :data="eventList"
      @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" type="index" :index="indexMethod" />
      <el-table-column label="任务ID" align="center" prop="taskId" />
      <el-table-column label="事件类型" align="center" prop="eventType" />
      <el-table-column label="事件时间" align="center" prop="eventTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.eventTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="事件资源" align="center" prop="resourceId" />
      <el-table-column label="备注" align="center" prop="remark" />
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

    <!-- 添加或修改任务事件日志（全流程追溯核心）对话框 -->
    <vxe-modal :title="title" v-model="open" width="500px" show-maximize showFooter resize>
      <el-form ref="eventRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="任务ID" prop="taskId">
          <el-input v-model="form.taskId" placeholder="请输入任务ID" />
        </el-form-item>
        <el-form-item label="事件时间" prop="eventTime">
          <el-date-picker clearable v-model="form.eventTime" type="date" value-format="YYYY-MM-DD"
            placeholder="请选择事件时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="事件资源" prop="resourceId">
          <el-input v-model="form.resourceId" placeholder="请输入事件资源" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
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

<script setup name="Event">
import { listEvent, getEvent, delEvent, addEvent, updateEvent } from "@/api/execute/event"
import { getToken } from "@/utils/auth.js";
const baseURL = import.meta.env.VITE_APP_BASE_API

const { proxy } = getCurrentInstance()
const route = useRoute()

const eventList = ref([])
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
    taskId: route.params.taskId || null, // 从路由参数获取任务ID
    eventType: null,
    eventTime: null,
    resourceId: null,
    remark: null,
  },
  rules: {
    taskId: [
      { required: true, message: "任务ID不能为空", trigger: "blur" }
    ],
    eventType: [
      { required: true, message: "事件类型不能为空", trigger: "change" }
    ],
    eventTime: [
      { required: true, message: "事件时间不能为空", trigger: "blur" }
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

/** 查询任务事件日志（全流程追溯核心）列表 */
const getList = () => {
  loading.value = true
  listEvent(queryParams.value).then(response => {
    eventList.value = response.rows
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
    eventId: null,
    taskId: null,
    eventType: null,
    eventTime: null,
    operatorId: null,
    resourceId: null,
    qtyGood: null,
    qtyBad: null,
    reasonCode: null,
    remark: null,
    createTime: null,
    updateTime: null
  }
  proxy.resetForm("eventRef")
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  proxy.resetForm("queryRef")
  // 如果是从路由参数获取的 taskId，重置后应该保留
  if (route.params.taskId) {
    queryParams.value.taskId = route.params.taskId
  }
  handleQuery()
}

// 多选框选中数据
const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.eventId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset()
  open.value = true
  title.value = "添加任务事件日志（全流程追溯核心）"
  // 如果是从事件列表页面跳转过来，自动填充任务ID
  if (queryParams.value.taskId) {
    form.value.taskId = queryParams.value.taskId
  }
}

/** 修改按钮操作 */
const handleUpdate = (row) => {
  reset()
  const _eventId = row.eventId || ids.value
  getEvent(_eventId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改任务事件日志（全流程追溯核心）"
  })
}

/** 提交按钮 */
const submitForm = () => {
  proxy.$refs["eventRef"].validate(valid => {
    if (valid) {
      if (form.value.eventId != null) {
        updateEvent(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addEvent(form.value).then(response => {
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
  const _eventIds = row.eventId || ids.value
  proxy.$modal.confirm('是否确认删除该项数据？').then(function () {
    return delEvent(_eventIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy.download('execute/event/export', {
    ...queryParams.value
  }, `event_${new Date().getTime()}.xlsx`)
}

/** 关闭按钮操作 */
const handleClose = () => {
  const obj = { path: "/execute/event" }
  proxy.$tab.closeOpenPage(obj)
}

getList()
</script>
