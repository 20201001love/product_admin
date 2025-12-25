<template>
  <div class="app-container">
    <!-- 顶部搜索 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="交期" prop="dueDate">
        <el-date-picker clearable v-model="queryParams.dueDate" type="date" value-format="YYYY-MM-DD"
          placeholder="请选择交期">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="订单状态" prop="status" label-width="100px">
        <el-select v-model="queryParams.status" placeholder="请选择订单状态" style="width: 180px;" clearable>
          <el-option v-for="dict in customer_order_status" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createdTime">
        <el-date-picker clearable v-model="queryParams.createdTime" type="date" value-format="YYYY-MM-DD"
          placeholder="请选择创建时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="更新时间" prop="updatedTime">
        <el-date-picker clearable v-model="queryParams.updatedTime" type="date" value-format="YYYY-MM-DD"
          placeholder="请选择更新时间">
        </el-date-picker>
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
    <el-table @row-click="clickRow" ref="table" highlight-current-row border v-loading="loading" :data="orderList"
      @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" type="index" :index="indexMethod" />
      <el-table-column label="订单ID" align="center" prop="orderId" />
      <el-table-column label="客户" align="center" prop="customerName" />
      <el-table-column label="交期" align="center" prop="dueDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.dueDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="优先级" align="center" prop="priority" />
      <el-table-column label="订单状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="customer_order_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="450">
        <template #default="scope">
          <el-button type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          <el-button type="info" icon="View" @click="handleView(scope.row)">查看</el-button>
          <el-button type="success" icon="Check" @click="handleComplete(scope.row)">完成</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改订单对话框 -->
    <vxe-modal :title="title" v-model="open" width="500px" show-maximize showFooter resize>
      <el-form ref="orderRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="交期" prop="dueDate">
          <el-date-picker clearable v-model="form.dueDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择交期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="客户" prop="customerId">
          <el-select v-model="form.customerId" placeholder="请选择客户">
            <el-option v-for="item in customerList" :key="item.customerId" :label="item.customerName"
              :value="item.customerId"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input v-model="form.priority" placeholder="请输入优先级" />
        </el-form-item>
        <el-form-item label="订单状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择订单状态">
            <el-option v-for="dict in customer_order_status" :key="dict.value" :label="dict.label"
              :value="dict.value"></el-option>
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

<script setup name="Order">
import { listOrder, getOrder, delOrder, addOrder, updateOrder } from "@/api/demand/order"
import { listCustomer } from "@/api/demand/customer"
import { getToken } from "@/utils/auth.js";
const baseURL = import.meta.env.VITE_APP_BASE_API

const { proxy } = getCurrentInstance()
const { customer_order_status } = proxy.useDict('customer_order_status')

const orderList = ref([])
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
  customerList: [],
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    customerId: null,
    dueDate: null,
    priority: null,
    status: null,
    createdTime: null,
    updatedTime: null
  },
  rules: {
    customerId: [
      { required: true, message: "客户ID不能为空", trigger: "change" }
    ],
    dueDate: [
      { required: true, message: "交期不能为空", trigger: "blur" }
    ],
    status: [
      { required: true, message: "订单状态不能为空", trigger: "change" }
    ],
  }
})

const { queryParams, form, rules, customerList } = toRefs(data)

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

/** 查询订单列表 */
const getList = () => {
  loading.value = true
  listOrder(queryParams.value).then(response => {
    orderList.value = response.rows
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
    orderId: null,
    customerId: null,
    dueDate: null,
    priority: null,
    status: null,
    createdTime: null,
    updatedTime: null
  }
  proxy.resetForm("orderRef")
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
  ids.value = selection.map(item => item.orderId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset()
  open.value = true
  title.value = "添加订单"
}

/** 修改按钮操作 */
const handleUpdate = (row) => {
  reset()
  const _orderId = row.orderId || ids.value
  getOrder(_orderId).then(response => {
    form.value = response.data
    // 确保 customerId 的类型与 customerList 中的类型一致
    // Element Plus 的 el-select 使用严格相等比较，类型不匹配会导致显示 value 而不是 label
    if (form.value.customerId !== null && form.value.customerId !== undefined && customerList.value.length > 0) {
      // 根据 customerList 中第一个元素的 customerId 类型来转换
      const firstCustomerId = customerList.value[0].customerId
      if (typeof firstCustomerId === 'number') {
        form.value.customerId = Number(form.value.customerId)
      } else if (typeof firstCustomerId === 'string') {
        form.value.customerId = String(form.value.customerId)
      }
    }
    open.value = true
    title.value = "修改订单"
  })
}

/** 提交按钮 */
const submitForm = () => {
  proxy.$refs["orderRef"].validate(valid => {
    if (valid) {
      if (form.value.orderId != null) {
        updateOrder(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addOrder(form.value).then(response => {
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
  const _orderIds = row.orderId || ids.value
  proxy.$modal.confirm('是否确认删除该项数据？').then(function () {
    return delOrder(_orderIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy.download('demand/order/export', {
    ...queryParams.value
  }, `order_${new Date().getTime()}.xlsx`)
}

const getCustomerList = () => {
  listCustomer().then(response => {
    customerList.value = response.rows
  })
}

const handleComplete = (row) => {
  proxy.$modal.confirm('是否确认完成该订单？').then(function () {
    return completeOrder(row.orderId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("订单已经完成")
  }).catch(() => {
    proxy.$modal.msgError("请查看订单状态是否已经完成")
  })
}

const completeOrder = (orderId) => {
  return updateOrder({ orderId: orderId, status: 'DONE' }).then(() => {
  }).then(() => {
    getList()
  }).catch(() => {
  })
}


getList()
getCustomerList()
</script>
