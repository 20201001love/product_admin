# 项目变更记录

## 功能变更

### 2025-01-XX - 日历管理页面滚动查询功能

- **操作**: 为日历管理页面实现无限滚动加载功能，使用 IntersectionObserver API 替代传统滚动事件监听
- **原因**: 提升用户体验，避免一次性加载大量数据，同时解决卡片网格布局下滚动事件监听不可靠的问题
- **变更文件**: `src/views/master/calendar/index.vue`
- **实现原理**:
  1. **IntersectionObserver API**:
     - 在卡片网格底部添加一个"哨兵"元素（`load-more-sentinel`，高度1px）
     - 使用 `IntersectionObserver` 监听哨兵元素是否进入视口
     - 当哨兵元素可见时，自动触发加载下一页数据
     - 优势：即使没有滚动条（内容未超出容器）也能正常工作，性能更好
  2. **数据加载逻辑**:
     - `getList(reset)`: 支持重置模式和追加模式
     - 优先使用后端返回的 `total` 判断是否还有更多数据
     - 降级方案：当后端不返回 `total` 时，使用 `rows.length === pageSize` 判断
     - 错误处理：加载失败时重置 `hasMore`，避免无法继续加载
  3. **布局优化**:
     - 使用 CSS Grid 布局 (`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`)
     - 固定卡片高度 `320px`，使用 `grid-auto-rows: 320px` 确保网格行高一致
     - 修复高度传递链：`el-card` → `el-card__body` → `app-container` → `calendar-page` → `calendar-scroll`
     - 每一层使用 `flex: 1` 和 `min-height: 0` 确保滚动容器能正确计算高度

- **关键代码**:

  ```javascript
  // 1. 添加哨兵元素引用
  const loadMoreSentinel = ref(null)
  let observer = null

  // 2. 设置 IntersectionObserver
  const setupObserver = () => {
    if (!loadMoreSentinel.value) return
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (
          entry.isIntersecting &&
          hasMore.value &&
          !loadingMore.value &&
          !loading.value
        ) {
          queryParams.value.pageNum += 1
          getList()
        }
      },
      {
        root: scrollWrapper.value,
        rootMargin: '100px', // 提前100px触发
        threshold: 0,
      },
    )
    observer.observe(loadMoreSentinel.value)
  }

  // 3. 在组件挂载时设置观察器
  onMounted(() => {
    getList(true)
    nextTick(() => {
      setTimeout(() => setupObserver(), 500)
    })
  })

  // 4. 组件卸载时清理观察器
  onUnmounted(() => {
    if (observer) observer.disconnect()
  })
  ```

- **模板结构**:

  ```vue
  <div class="calendar-scroll" ref="scrollWrapper">
    <div class="calendar-grid">
      <!-- 日历卡片 -->
    </div>
    <!-- 哨兵元素 -->
    <div ref="loadMoreSentinel" class="load-more-sentinel"></div>
    <!-- 加载提示 -->
    <div class="load-more-tip" v-if="loadingMore">加载中...</div>
  </div>
  ```

- **后端联动要求**:
  - 接口返回格式应包含 `total` 字段（总记录数），用于精确判断是否还有更多数据
  - 分页参数：`pageNum`（页码，从1开始）、`pageSize`（每页大小，默认10）
  - 响应格式示例：
    ```javascript
    {
      code: 200,
      msg: "操作成功",
      rows: [...],  // 当前页数据
      total: 100    // 总记录数（必需）
    }
    ```
  - 如果后端不返回 `total`，前端会使用降级方案（`rows.length === pageSize`）判断，但不够精确

- **CSS 样式要点**:

  ```scss
  // 哨兵元素（隐藏但用于检测）
  .load-more-sentinel {
    height: 1px;
    width: 100%;
  }

  // 滚动容器
  .calendar-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 8px;
  }

  // 网格布局
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    grid-auto-rows: 320px; // 固定行高
    gap: 24px;
  }
  ```

- **优势**:
  - 性能更好：IntersectionObserver 是原生 API，比滚动事件更高效
  - 兼容性强：即使内容未超出容器（没有滚动条）也能正常工作
  - 用户体验好：自动加载，无需手动点击"加载更多"按钮
  - 代码简洁：无需手动计算滚动距离和容器高度

- **注意事项**:
  - 必须在组件卸载时调用 `observer.disconnect()` 清理观察器
  - 需要在数据加载完成后再设置观察器（使用 `setTimeout` 延迟）
  - 搜索或重置时应重新设置观察器（当前实现会在 `getList(true)` 后重置）

### 2024-12-31 - 字典只读字段支持

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
