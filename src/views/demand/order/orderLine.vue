<template>
  <div class="app-container">
    <!-- 顶部搜索 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="订单ID" prop="orderId" v-if="queryParams.orderId">
        <el-input v-model="queryParams.orderId" placeholder="订单ID" disabled />
      </el-form-item>
      <el-form-item label="产品" prop="productId" style="width: 250px;">
        <el-select v-model="queryParams.productId" placeholder="请选择产品">
          <el-option v-for="item in productList" :key="item.productId" :label="item.productName"
            :value="item.productId"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态" prop="status" style="width: 250px;">
        <el-select v-model="queryParams.status" placeholder="请选择订单状态" clearable>
          <el-option v-for="dict in order_line_status" :key="dict.value" :label="dict.label" :value="dict.value" />
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
      <el-col :span="1.5">
        <el-button type="danger" icon="Close" @click="handleClose">关闭</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 表格 -->
    <el-table @row-click="clickRow" ref="table" highlight-current-row border v-loading="loading" :data="orderLineList"
      @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" type="index" :index="indexMethod" />
      <el-table-column label="订单行ID" align="center" prop="orderLineId" />
      <el-table-column label="产品" align="center">
        <template #default="scope">
          {{ getProductName(scope.row.productId) }}
        </template>
      </el-table-column>
      <el-table-column label="需求数量" align="center" prop="qty" />
      <el-table-column label="订单行状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="order_line_status" :value="scope.row.status" />
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

    <!-- 添加或修改订单明细对话框 -->
    <vxe-modal :title="title" v-model="open" width="500px" show-maximize showFooter resize>
      <el-form ref="orderLineRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="订单ID" prop="orderId" v-if="form.orderId">
          <el-input v-model="form.orderId" placeholder="订单ID" disabled />
        </el-form-item>
        <el-form-item label="产品" prop="productId">
          <el-select v-model="form.productId" placeholder="请选择产品">
            <el-option v-for="item in productList" :key="item.productId" :label="item.productName"
              :value="item.productId"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="需求数量" prop="qty">
          <el-input v-model="form.qty" placeholder="请输入需求数量" />
        </el-form-item>
        <el-form-item label="订单行状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择订单行状态">
            <el-option v-for="dict in order_line_status" :key="dict.value" :label="dict.label" :value="dict.value" />
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

<script setup name="OrderLine">
import { listOrderLine, getOrderLine, delOrderLine, addOrderLine, updateOrderLine } from "@/api/demand/orderLine"
import useProductStore from '@/stores/modules/product'
import { getToken } from "@/utils/auth.js";

const baseURL = import.meta.env.VITE_APP_BASE_API
const productStore = useProductStore()
const route = useRoute()

const { proxy } = getCurrentInstance()
const { order_line_status } = proxy.useDict('order_line_status')
const orderLineList = ref([])
const productionBatchList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const checkedProductionBatch = ref([])
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
    orderId: route.params.orderId || null, // 从路由参数获取订单ID
    productId: null,
    status: null
  },
  rules: {
    productId: [
      { required: true, message: "产品不能为空", trigger: "blur" }
    ],
    qty: [
      { required: true, message: "需求数量不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)
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

/** 查询订单明细列表 */
const getList = () => {
  loading.value = true
  listOrderLine(queryParams.value).then(response => {
    orderLineList.value = response.rows
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
    orderLineId: null,
    orderId: null,
    productId: null,
    qty: null,
    status: null
  }
  productionBatchList.value = []
  proxy.resetForm("orderLineRef")
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
  ids.value = selection.map(item => item.orderLineId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset()
  open.value = true
  title.value = "添加订单明细"
  // 如果是从订单页面跳转过来，自动填充订单ID
  if (queryParams.value.orderId) {
    form.value.orderId = queryParams.value.orderId
  }
}

/** 修改按钮操作 */
const handleUpdate = (row) => {
  reset()
  const _orderLineId = row.orderLineId || ids.value
  getOrderLine(_orderLineId).then(response => {
    form.value = response.data
    if (form.value.productId !== null && form.value.productId !== undefined && productList.value.length > 0) {
      const firstProductId = productList.value[0].productId
      if (typeof firstProductId === 'number') {
        form.value.productId = Number(form.value.productId)
      } else if (typeof firstProductId === 'string') {
        form.value.productId = String(form.value.productId)
      }
    }
    productionBatchList.value = response.data.productionBatchList
    open.value = true
    title.value = "修改订单明细"
  })
}

/** 提交按钮 */
const submitForm = () => {
  proxy.$refs["orderLineRef"].validate(valid => {
    if (valid) {
      form.value.productionBatchList = productionBatchList.value
      if (form.value.orderLineId != null) {
        updateOrderLine(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addOrderLine(form.value).then(response => {
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
  const _orderLineIds = row.orderLineId || ids.value
  proxy.$modal.confirm('是否确认删除该项数据？').then(function () {
    return delOrderLine(_orderLineIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}

/** 根据产品ID获取产品名称 */
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

/** 生产批次（订单行拆批）序号 */
const rowProductionBatchIndex = ({ row, rowIndex }) => {
  row.index = rowIndex + 1
}

/** 生产批次（订单行拆批）添加按钮操作 */
const handleAddProductionBatch = () => {
  let obj = {}
  obj.orderLineId = ""
  obj.batchQty = ""
  obj.status = ""
  obj.plannedStart = ""
  obj.plannedEnd = ""
  productionBatchList.value.push(obj)
}

/** 生产批次（订单行拆批）删除按钮操作 */
const handleDeleteProductionBatch = () => {
  if (checkedProductionBatch.value.length == 0) {
    proxy.$modal.msgError("请先选择要删除的生产批次（订单行拆批）数据")
  } else {
    const productionBatchs = productionBatchList.value
    const checkedProductionBatchs = checkedProductionBatch.value
    productionBatchList.value = productionBatchs.filter(function (item) {
      return checkedProductionBatchs.indexOf(item.index) == -1
    })
  }
}

/** 复选框选中数据 */
const handleProductionBatchSelectionChange = (selection) => {
  checkedProductionBatch.value = selection.map(item => item.index)
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy.download('demand/orderLine/export', {
    ...queryParams.value
  }, `orderLine_${new Date().getTime()}.xlsx`)
}

/** 关闭按钮操作 */
const handleClose = () => {
  const obj = { path: "/demand/order" }
  proxy.$tab.closeOpenPage(obj)
}

getList()
</script>
