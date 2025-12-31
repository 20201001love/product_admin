<template>
  <div class="app-container">
    <!-- 顶部搜索 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="锁模力" prop="tonnage">
        <el-input v-model="queryParams.tonnage" placeholder="请输入锁模力" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="换模基准时间" prop="defaultSetupTimeMin">
        <el-input v-model="queryParams.defaultSetupTimeMin" placeholder="请输入换模基准时间" clearable
          @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="日历" prop="calendarId">
        <el-select v-model="queryParams.calendarId" placeholder="请选择日历">
          <el-option v-for="item in calendarList" :key="item.calendarId" :label="item.calendarName"
            :value="item.calendarId" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态">
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
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="resource_status" :value="scope.row.status" />
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
        <el-form-item label="换模基准时间" prop="defaultSetupTimeMin">
          <el-input v-model="form.defaultSetupTimeMin" placeholder="请输入换模基准时间" />
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
import { listMachine, getMachine, delMachine, addMachine, updateMachine } from "@/api/master/resource/machine"
import { getToken } from "@/utils/auth.js";
import useCalendarStore from '@/stores/modules/calendar'
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

// 初始化日历列表
calendarStore.getCalendarList()
getList()
</script>
