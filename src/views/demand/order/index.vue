<template>
  <div class="app-container">
    <!-- 顶部搜索 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="交期" prop="dueDate" style="width: 308px;">
        <el-date-picker clearable v-model="dataRange" type="daterange" value-format="YYYY-MM-DD" placeholder="请选择交期"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-input v-model="queryParams.priority" placeholder="请输入优先级" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="订单状态" prop="status" style="width: 250px;">
        <el-select v-model="queryParams.status" placeholder="请选择订单状态" clearable>
          <el-option v-for="dict in customer_order_status" :key="dict.value" :label="dict.label" :value="dict.value" />
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
      <el-table-column label="订单ID" align="center" prop="orderId" width="350">
        <template #default="scope">
          <router-link :to="'/demand/order/orderLine/' + scope.row.orderId" class="link-type">
            <span>{{ scope.row.orderId }}</span>
          </router-link>
        </template>
      </el-table-column>
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
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleView(scope.row)">查看</el-button>
          <el-button v-if="scope.row.status === 'NEW'" link type="primary" icon="Check" @click="handleCheck(scope.row)"
            v-hasPermi="['demand:order:edit']">确认</el-button>
          <el-button v-if="scope.row.status === 'CONFIRMED'" link type="primary" icon="Close"
            @click="handleCancelCheck(scope.row)" v-hasPermi="['demand:order:edit']">取消</el-button>
          <el-button v-if="scope.row.status === 'NEW' || scope.row.status === 'CONFIRMED'" link type="primary"
            icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改订单对话框 -->
    <vxe-modal :title="title" v-model="open" width="600px" show-maximize showFooter resize>
      <el-form ref="orderRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="客户" prop="customerId">
          <el-select v-model="form.customerId" placeholder="请选择客户">
            <el-option v-for="item in customerList" :key="item.customerId" :label="item.customerName"
              :value="item.customerId"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="交期" prop="dueDate">
          <el-date-picker clearable v-model="form.dueDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择交期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input v-model="form.priority" placeholder="请输入优先级" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </vxe-modal>

    <vxe-modal :title="title" v-model="viewOpen" width="850px" show-maximize showFooter resize>
      <el-table :data="orderLineList" border>
        <el-table-column label="序号" align="center" type="index" width="50" />
        <el-table-column label="订单行ID" align="center" prop="orderLineId" width="350" />
        <el-table-column label="产品/SKU" align="center" prop="productId" width="150">
          <template #default="scope">
            {{ getProductName(scope.row.productId) }}
          </template>
        </el-table-column>
        <el-table-column label="需求数量" align="center" prop="qty" width="150" />
        <el-table-column label="订单行状态" align="center" prop="status" width="150">
          <template #default="scope">
            <dict-tag :options="order_line_status" :value="scope.row.status" />
          </template>
        </el-table-column>
      </el-table>
    </vxe-modal>
  </div>
</template>

<script setup name="Order">
import { listOrder, getOrder, delOrder, addOrder, updateOrder, checkOrder, cancelCheckOrder } from "@/api/demand/order"
import { getToken } from "@/utils/auth.js";
import { listCustomer } from "@/api/demand/customer"
import useProductStore from '@/stores/modules/product'

const baseURL = import.meta.env.VITE_APP_BASE_API
const productStore = useProductStore()

const { proxy } = getCurrentInstance()
// 用于搜索筛选和显示（包含所有状态，含只读）
const { customer_order_status } = proxy.useDict('customer_order_status')
const { order_line_status } = proxy.useDict('order_line_status')
// 用于表单编辑（只包含可编辑状态，过滤只读）
const { customer_order_status: customer_order_status_editable } = proxy.useEditableDict('customer_order_status')
const { order_line_status: order_line_status_editable } = proxy.useEditableDict('order_line_status')
const orderList = ref([])
const orderLineList = ref([])
const open = ref(false)
const viewOpen = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const checkedOrderLine = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const selectedRow = ref(null)
const dataRange = ref([])
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
  },
  rules: {
    customerId: [
      { required: true, message: "客户不能为空", trigger: "change" }
    ],
    dueDate: [
      { required: true, message: "交期不能为空", trigger: "blur" }
    ],
    status: [
      { required: true, message: "订单状态", trigger: "change" }
    ],
  }
})

const { queryParams, form, rules, customerList } = toRefs(data)
// 使用产品仓库中的产品列表
const productList = computed(() => productStore.productList)

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
  listOrder(proxy.addDateRange(queryParams.value, dataRange.value)).then(response => {
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
  }
  orderLineList.value = []
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
  dataRange.value = []
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
    if (form.value.customerId !== null && form.value.customerId !== undefined && customerList.value.length > 0) {
      const firstCustomerId = customerList.value[0].customerId
      if (typeof firstCustomerId === 'number') {
        form.value.customerId = Number(form.value.customerId)
      } else if (typeof firstCustomerId === 'string') {
        form.value.customerId = String(form.value.customerId)
      }
    }
    orderLineList.value = response.data.orderLineList
    orderLineList.value.forEach(item => {
      if (item.productId !== null && item.productId !== undefined && productList.value.length > 0) {
        const firstProductId = productList.value[0].productId
        if (typeof firstProductId === 'number') {
          item.productId = Number(item.productId)
        } else if (typeof firstProductId === 'string') {
          item.productId = String(item.productId)
        }
      }
    })
    open.value = true
    title.value = "修改订单"
  })
}

/** 确认按钮操作 */
const handleCheck = (row) => {
  const _orderId = row.orderId || ids.value
  checkOrder(_orderId).then(response => {
    proxy.$modal.msgSuccess("确认成功")
    getList()
  })
}

/** 取消确认按钮操作 */
const handleCancelCheck = (row) => {
  const _orderId = row.orderId || ids.value
  cancelCheckOrder(_orderId).then(response => {
    proxy.$modal.msgSuccess("取消确认成功")
    getList()
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

/** 订单明细序号 */
const rowOrderLineIndex = ({ row, rowIndex }) => {
  row.index = rowIndex + 1
}

/** 订单明细添加按钮操作 */
const handleAddOrderLine = () => {
  let obj = {}
  obj.orderId = form.value.orderId
  obj.productId = ""
  obj.qty = ""
  obj.status = ""
  orderLineList.value.push(obj)
}

/** 订单明细删除按钮操作 */
const handleDeleteOrderLine = () => {
  if (checkedOrderLine.value.length == 0) {
    proxy.$modal.msgError("请先选择要删除的订单明细数据")
  } else {
    const orderLines = orderLineList.value
    const checkedOrderLines = checkedOrderLine.value
    orderLineList.value = orderLines.filter(function (item) {
      return checkedOrderLines.indexOf(item.index) == -1
    })
  }
}

/** 复选框选中数据 */
const handleOrderLineSelectionChange = (selection) => {
  checkedOrderLine.value = selection.map(item => item.index)
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy.download('demand/order/export', {
    ...proxy.addDateRange(queryParams.value, dataRange.value)
  }, `order_${new Date().getTime()}.xlsx`)
}

/** 查看按钮操作 */
const handleView = (row) => {
  getOrder(row.orderId).then(response => {
    orderLineList.value = response.data.orderLineList
    orderLineList.value.forEach(item => {
      if (item.productId !== null && item.productId !== undefined && productList.value.length > 0) {
        const firstProductId = productList.value[0].productId
        if (typeof firstProductId === 'number') {
          item.productId = Number(item.productId)
        } else if (typeof firstProductId === 'string') {
          item.productId = String(item.productId)
        }
      }
    })
    viewOpen.value = true
    title.value = "订单明细"
  })
}

// 根据产品ID获取产品名称
const getProductName = (productId) => {
  if (!productId || !productList.value || productList.value.length === 0) {
    return productId || '-'
  }
  const product = productList.value.find(item => {
    // 处理类型不匹配的情况
    return item.productId == productId || String(item.productId) === String(productId) || Number(item.productId) === Number(productId)
  })
  return product ? product.productName : productId
}

// 获取客户列表
const getCustomerList = () => {
  listCustomer().then(response => {
    customerList.value = response.rows
  })
}

getList()
getCustomerList()
</script>
