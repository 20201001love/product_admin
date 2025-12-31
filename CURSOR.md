# 项目变更记录

## 功能变更

### 2024-12-31 - 字典只读字段支持

- **操作**: 为字典系统添加只读字段支持，在表单编辑时自动过滤只读选项
- **原因**: 后端新增 `isReadonly` 字段（'0'=只读，'1'=读写），需要在表单编辑时只显示可编辑的字典项
- **变更内容**:
  1. **工具函数增强** (`src/utils/dict.js`):
     - `useDict()`: 保持原有功能，返回所有字典项（包括只读），用于搜索筛选和显示
     - `useEditableDict()`: 新增函数，自动过滤只读项（`isReadonly !== '0'`），用于表单编辑
  2. **全局注册** (`src/main.js`):
     - 导入 `useEditableDict` 函数
     - 注册为全局属性 `app.config.globalProperties.useEditableDict`
  3. **业务页面更新**:
     - `src/views/demand/order/index.vue`: 订单管理页面
     - `src/views/demand/order/orderLine.vue`: 订单行管理页面
     - `src/views/system/menu/index.vue`: 菜单管理页面
     - `src/views/system/dict/index.vue`: 字典类型管理页面
     - `src/views/system/dict/data.vue`: 字典数据管理页面
- **使用模式**:
  ```javascript
  // 用于搜索筛选和显示（包含所有状态，含只读）
  const { customer_order_status } = proxy.useDict('customer_order_status')
  // 用于表单编辑（只包含可编辑状态，过滤只读）
  const { customer_order_status: customer_order_status_editable } =
    proxy.useEditableDict('customer_order_status')
  ```
- **影响范围**: 所有使用字典选择的表单（`el-select`, `el-radio-group` 等）

## 依赖变更

### 2024 - jsencrypt 依赖添加

- **操作**: 添加 `jsencrypt` 依赖包
- **版本**: ^3.3.2
- **原因**: 修复 `src/utils/jsencrypt.js` 中缺少依赖的错误
- **变更文件**:
  - `package.json`: 在 dependencies 中添加 `jsencrypt: ^3.3.2`
  - `src/utils/jsencrypt.js`: 修复导入路径从 `jsencrypt/bin/jsencrypt.min` 改为 `jsencrypt`

### 2024 - fuse.js 依赖添加及依赖恢复

- **操作**:
  1. 添加 `fuse.js` 依赖包（模糊搜索功能）
  2. 恢复被意外移除的依赖包
- **版本**:
  - `fuse.js`: ^7.1.0
  - `@vueuse/core`: ^14.1.0（恢复）
  - `file-saver`: ^2.0.5（恢复）
  - `fast-glob`: ^3.3.3（恢复，vite-plugin-svg-icons 的依赖）
  - `vite-plugin-compression`: ^0.5.1（恢复）
  - `vite-plugin-svg-icons`: ^2.0.1（恢复）
- **原因**:
  - 添加 fuse.js 用于模糊搜索功能
  - 恢复被 pnpm 意外移除的必需依赖包
- **使用位置**:
  - `@vueuse/core`: `src/stores/modules/settings.js`, `src/layout/index.vue` 等
  - `file-saver`: `src/utils/request.js`（文件下载功能）
  - `vite-plugin-svg-icons`: `vite/plugins/svg-icon.js`
  - `vite-plugin-compression`: `vite/plugins/compression.js`
- **变更文件**:
  - `package.json`: 恢复所有必需的依赖包
