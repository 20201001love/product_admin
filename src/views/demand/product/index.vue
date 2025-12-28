<template>
  <div class="app-container">
    <!-- 顶部搜索 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="产品名称" prop="productName">
        <el-input v-model="queryParams.productName" placeholder="请输入产品名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime" style="width: 308px;">
        <el-date-picker clearable v-model="dataRange" type="daterange" value-format="YYYY-MM-DD" placeholder="请选择创建时间"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期">
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
    <el-table @row-click="clickRow" ref="table" highlight-current-row border v-loading="loading" :data="productList"
      @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" type="index" :index="indexMethod" />
      <el-table-column label="产品名称" align="center" prop="productName" />
      <el-table-column label="图片" align="center" prop="image" width="200">
        <template #default="scope">
          <image-preview :src="scope.row.image" :width="50" :height="50" />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime, '{y}-{m}-{d}') }}</span>
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

    <!-- 添加或修改产品对话框 -->
    <vxe-modal :title="title" v-model="open" width="500px" show-maximize showFooter resize>
      <el-form ref="productRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="产品名称" prop="productName">
          <el-input v-model="form.productName" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="图片" prop="image">
          <image-upload v-model="form.image" />
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

<script setup name="Product">
import { listProduct, getProduct, delProduct, addProduct, updateProduct } from "@/api/demand/product"
import { getToken } from "@/utils/auth.js";
import useProductStore from '@/stores/modules/product'

const baseURL = import.meta.env.VITE_APP_BASE_API
const productStore = useProductStore()

const { proxy } = getCurrentInstance()

const productList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const selectedRow = ref(null)
const dataRange = ref([])
const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    productName: null,
    image: null
  },
  rules: {
    productName: [
      { required: true, message: "产品名称不能为空", trigger: "blur" }
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

/** 查询产品列表 */
const getList = () => {
  loading.value = true
  listProduct(proxy.addDateRange(queryParams.value, dataRange.value)).then(response => {
    productList.value = response.rows
    total.value = response.total
    loading.value = false
    // 同时更新产品仓库（不带分页和筛选条件的完整列表）
    productStore.getProductList()
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
    productId: null,
    productName: null,
    image: null,
  }
  proxy.resetForm("productRef")
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
  ids.value = selection.map(item => item.productId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset()
  open.value = true
  title.value = "添加产品"
}

/** 修改按钮操作 */
const handleUpdate = (row) => {
  reset()
  const _productId = row.productId || ids.value
  getProduct(_productId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改产品"
  })
}

/** 提交按钮 */
const submitForm = () => {
  proxy.$refs["productRef"].validate(valid => {
    if (valid) {
      if (form.value.productId != null) {
        updateProduct(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
          // 同步更新产品仓库
          productStore.updateProduct(form.value)
        })
      } else {
        addProduct(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
          // 同步添加到产品仓库
          if (response.data) {
            productStore.addProduct(response.data)
          } else {
            // 如果后端未返回完整数据，重新获取产品列表
            productStore.getProductList()
          }
        })
      }
    }
  })
}

/** 删除按钮操作 */
const handleDelete = (row) => {
  const _productIds = row.productId || ids.value
  proxy.$modal.confirm('是否确认删除该项数据？').then(function () {
    return delProduct(_productIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
    // 同步从产品仓库删除
    productStore.deleteProduct(_productIds)
  }).catch(() => { })
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy.download('product/product/export', {
    ...proxy.addDateRange(queryParams.value, dataRange.value)
  }, `product_${new Date().getTime()}.xlsx`)
}

getList()
</script>
