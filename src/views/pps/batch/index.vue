<template>
  <div class="app-container">
    <!-- 现代浏览器样式搜索框 -->
    <div class="modern-search-bar" v-show="showSearch">
      <div class="search-input-wrapper">
        <!-- <el-icon class="search-icon">
          <Search />
        </el-icon> -->
        <el-input v-model="queryParams.orderId" placeholder="搜索订单ID..." clearable @keyup.enter="handleQuery"
          @clear="handleQuery" class="modern-search-input" size="large">
          <template #suffix>
            <el-button type="primary" @click="handleQuery" class="search-button" circle>
              <el-icon>
                <Search />
              </el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 顶部搜索 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px"
      class="filter-form">
      <el-form-item label="订单行ID" prop="orderLineId" style="width: 280px">
        <el-input v-model="queryParams.orderLineId" placeholder="请输入订单行ID" clearable @keyup.enter="handleQuery"
          @clear="handleQuery">
          <template #append>
            <el-button :icon="Search" @click="openOrderLineSelector" />
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="批次状态" prop="status" style="width: 220px">
        <el-select v-model="queryParams.status" placeholder="请选择批次状态" clearable>
          <el-option v-for="dict in order_line_status" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="计划开工" style="width: 308px">
        <el-date-picker v-model="daterangePlannedStart" value-format="YYYY-MM-DD" type="daterange" range-separator="-"
          start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
      </el-form-item>
      <el-form-item label="计划完工" style="width: 308px">
        <el-date-picker v-model="daterangePlannedEnd" value-format="YYYY-MM-DD" type="daterange" range-separator="-"
          start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Filter" @click="handleQuery">筛选</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 现代分隔线 -->
    <div class="modern-divider">
      <div class="divider-line"></div>
      <div class="divider-decoration">
        <svg class="divider-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="url(#gradient)" />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div class="divider-line"></div>
    </div>

    <!-- 内容区域 -->
    <div class="content-section">
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
      <el-table @row-click="clickRow" ref="table" highlight-current-row border v-loading="loading" :data="batchList"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="序号" align="center" type="index" :index="indexMethod" />
        <el-table-column label="订单ID" align="center" prop="orderId" />
        <el-table-column label="订单行ID" align="center" prop="orderLineId" />
        <el-table-column label="产品" align="center" prop="productName" />
        <el-table-column label="批次数量" align="center" prop="batchQty" />
        <el-table-column label="交期" align="center" prop="dueDate">
          <template #default="scope">
            <span>{{ parseTime(scope.row.dueDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批次状态" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="order_line_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="计划开工" align="center" prop="plannedStart" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.plannedStart, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="计划完工" align="center" prop="plannedEnd" width="180">
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
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize" @pagination="getList" />

      <!-- 添加或修改生产批次（订单行拆批）对话框 -->
      <vxe-modal :title="title" v-model="open" width="500px" show-maximize showFooter resize>
        <el-form ref="batchRef" :model="form" :rules="rules" label-width="80px">
          <el-form-item label="订单行ID" prop="orderLineId">
            <el-input v-model="form.orderLineId" placeholder="请输入订单行ID" :disabled="form.orderLineId !== null" />
          </el-form-item>
          <el-form-item label="批次数量" prop="batchQty">
            <el-input v-model="form.batchQty" placeholder="请输入批次数量" />
          </el-form-item>
          <el-form-item label="批次状态" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio v-for="dict in order_line_status" :key="dict.value" :label="dict.value">{{ dict.label
              }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="计划开工" prop="plannedStart">
            <el-date-picker clearable v-model="form.plannedStart" type="date" value-format="YYYY-MM-DD"
              placeholder="请选择计划开工">
            </el-date-picker>
          </el-form-item>
          <el-form-item label="计划完工" prop="plannedEnd">
            <el-date-picker clearable v-model="form.plannedEnd" type="date" value-format="YYYY-MM-DD"
              placeholder="请选择计划完工">
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

      <!-- 订单行选择弹窗 -->
      <el-dialog v-model="orderLineSelectOpen" title="选择订单行" width="900px" append-to-body>
        <el-form :model="orderLineQuery" ref="orderLineQueryRef" :inline="true" label-width="80px">
          <el-form-item label="订单ID" prop="orderId">
            <el-input v-model="orderLineQuery.orderId" placeholder="请输入订单ID" clearable
              @keyup.enter="getOrderLineList" />
          </el-form-item>
          <el-form-item label="订单行ID" prop="orderLineId">
            <el-input v-model="orderLineQuery.orderLineId" placeholder="请输入订单行ID" clearable
              @keyup.enter="getOrderLineList" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="getOrderLineList">搜索</el-button>
            <el-button icon="Refresh" @click="resetOrderLineQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="orderLineLoading" :data="orderLineList" border highlight-current-row
          @row-click="selectOrderLine" style="cursor: pointer;">
          <el-table-column label="订单ID" align="center" prop="orderId" />
          <el-table-column label="订单行ID" align="center" prop="orderLineId" width="120" />
          <el-table-column label="产品" align="center" width="200">
            <template #default="scope">
              {{ getProductName(scope.row.productId) }}
            </template>
          </el-table-column>
          <el-table-column label="需求数量" align="center" prop="qty" width="120" />
          <el-table-column label="订单行状态" align="center" prop="status" width="120">
            <template #default="scope">
              <dict-tag :options="order_line_status" :value="scope.row.status" />
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="orderLineTotal > 0" :total="orderLineTotal" v-model:page="orderLineQuery.pageNum"
          v-model:limit="orderLineQuery.pageSize" @pagination="getOrderLineList" />
      </el-dialog>
    </div> <!-- 关闭 content-section -->
  </div>
</template>

<script setup name="Batch">
import { Search } from '@element-plus/icons-vue'
import { listBatch, getBatch, delBatch, addBatch, updateBatch } from "@/api/pps/batch"
import { listOrderLine } from "@/api/demand/orderLine"
import { getToken } from "@/utils/auth.js";
import useCustomerStore from '@/stores/modules/customer'
import useProductStore from '@/stores/modules/product'
const customerStore = useCustomerStore()
const productStore = useProductStore()
const baseURL = import.meta.env.VITE_APP_BASE_API

const { proxy } = getCurrentInstance()
const { order_line_status } = proxy.useDict('order_line_status')
const productList = computed(() => productStore.productList)
const batchList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const selectedRow = ref(null)
const daterangePlannedStart = ref([])
const daterangePlannedEnd = ref([])
const customerList = computed(() => customerStore.customerList)

// 订单行选择器相关
const orderLineSelectOpen = ref(false)
const orderLineLoading = ref(false)
const orderLineList = ref([])
const orderLineTotal = ref(0)
const orderLineQuery = reactive({
  pageNum: 1,
  pageSize: 10,
  orderId: null,
  orderLineId: null
})
const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    orderLineId: null,
    batchQty: null,
    status: null,
    plannedStart: null,
    plannedEnd: null,
  },
  rules: {
    orderLineId: [
      { required: true, message: "订单行ID不能为空", trigger: "blur" }
    ],
    batchQty: [
      { required: true, message: "批次数量不能为空", trigger: "blur" }
    ],
    status: [
      { required: true, message: "批次状态不能为空", trigger: "change" }
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

/** 查询生产批次（订单行拆批）列表 */
const getList = () => {
  loading.value = true
  queryParams.value.params = {}
  if (null != daterangePlannedStart && '' != daterangePlannedStart) {
    queryParams.value.params["beginPlannedStart"] = daterangePlannedStart.value[0]
    queryParams.value.params["endPlannedStart"] = daterangePlannedStart.value[1]
  }
  if (null != daterangePlannedEnd && '' != daterangePlannedEnd) {
    queryParams.value.params["beginPlannedEnd"] = daterangePlannedEnd.value[0]
    queryParams.value.params["endPlannedEnd"] = daterangePlannedEnd.value[1]
  }
  listBatch(queryParams.value).then(response => {
    batchList.value = response.rows
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
    batchId: null,
    orderLineId: null,
    batchQty: null,
    status: null,
    plannedStart: null,
    plannedEnd: null,
    createTime: null,
    updateTime: null
  }
  proxy.resetForm("batchRef")
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  daterangePlannedStart.value = []
  daterangePlannedEnd.value = []
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 获取产品名称 */
const getProductName = (productId) => {
  const product = productList.value.find(p => p.productId == productId)
  return product ? product.productName : productId
}

/** 打开订单行选择器 */
const openOrderLineSelector = () => {
  orderLineSelectOpen.value = true
  getOrderLineList()
}

/** 获取订单行列表 */
const getOrderLineList = () => {
  orderLineLoading.value = true
  listOrderLine(orderLineQuery).then(response => {
    orderLineList.value = response.rows
    orderLineTotal.value = response.total
    orderLineLoading.value = false
  })
}

/** 重置订单行查询 */
const resetOrderLineQuery = () => {
  orderLineQuery.orderId = null
  orderLineQuery.orderLineId = null
  orderLineQuery.pageNum = 1
  getOrderLineList()
}

/** 选择订单行 */
const selectOrderLine = (row) => {
  queryParams.value.orderLineId = row.orderLineId
  orderLineSelectOpen.value = false
  handleQuery()
}

// 多选框选中数据
const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.batchId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset()
  form.value.orderLineId = queryParams.value.orderLineId || null
  open.value = true
  title.value = "添加生产批次（订单行拆批）"
}

/** 修改按钮操作 */
const handleUpdate = (row) => {
  reset()
  const _batchId = row.batchId || ids.value
  getBatch(_batchId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改生产批次（订单行拆批）"
  })
}

/** 提交按钮 */
const submitForm = () => {
  proxy.$refs["batchRef"].validate(valid => {
    if (valid) {
      if (form.value.batchId != null) {
        updateBatch(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addBatch(form.value).then(response => {
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
  const _batchIds = row.batchId || ids.value
  proxy.$modal.confirm('是否确认删除该项数据？').then(function () {
    return delBatch(_batchIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy.download('pps/batch/export', {
    ...queryParams.value
  }, `batch_${new Date().getTime()}.xlsx`)
}

getList()
</script>

<style scoped>
/* 现代浏览器样式搜索框 */
.modern-search-bar {
  padding: 20px;
  padding-top: 0px;
  /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
  /* border-radius: 12px; */
  /* box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15); */
}

.search-input-wrapper {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* .search-icon {
  color: white;
  font-size: 24px;
  flex-shrink: 0;
} */

.modern-search-input {
  flex: 1;
}

.modern-search-input :deep(.el-input__wrapper) {
  background: white;
  border-radius: 50px;
  padding: 4px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px solid #aebaef;
  transition: all 0.3s ease;
}

.modern-search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.3);
}

.modern-search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.25);
  border-color: #667eea;
}

.modern-search-input :deep(.el-input__inner) {
  font-size: 16px;
  color: #333;
}

.modern-search-input :deep(.el-input__inner::placeholder) {
  color: #999;
  font-weight: 300;
}

.search-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  width: 40px;
  height: 40px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.search-button :deep(.el-icon) {
  color: white;
  font-size: 18px;
}

.search-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.search-button:active {
  transform: scale(0.95);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-input-wrapper {
    max-width: 100%;
  }

  .modern-search-bar {
    padding: 15px;
  }
}

/* 链接样式 */
.link-type {
  color: #337ab7;
  text-decoration: none;
}

.link-type:hover {
  color: #23527c;
  text-decoration: underline;
}

.filter-form {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin: 20px auto;
}

/* 现代分隔线 */
.modern-divider {
  display: flex;
  align-items: center;
  margin: 10px 0;
  position: relative;
}

.divider-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(to right, transparent 0%, #e0e6f7 30%, #70799e 100%);
  position: relative;
}

.divider-line:last-child {
  background: linear-gradient(to left, transparent 0%, #e0e6f7 30%, #70799e 100%);
}

.divider-decoration {
  display: flex;
  align-items: center;
  padding: 0 8px;
  background: white;
  z-index: 1;
}

.divider-icon {
  width: 24px;
  height: 24px;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.modern-divider:hover .divider-icon {
  opacity: 1;
}

/* 内容区域 */
.content-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s ease;
}

.content-section:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
</style>
