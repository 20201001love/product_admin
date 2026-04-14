# 任务甘特图使用指南

## 功能概述

任务甘特图提供了一个可视化的方式来查看和分析机台派工情况，帮助生产管理人员更直观地了解任务排程状态。

## 主要功能

### 1. 机台分组显示

- 以机台为单位进行分组
- 树形结构展示，可展开/收起
- 显示机台名称和所属车间

### 2. 时间视图切换

- **日视图**: 以天为单位，每6小时一个刻度
- **时视图**: 以天为单位，每1小时一个刻度
- 可根据查看粒度需求切换

### 3. 多维度筛选

- **车间筛选**: 按车间1/2/3筛选
- **机台筛选**: 选择特定机台
- **任务状态筛选**:
  - SCHEDULED（已调度）- 蓝色
  - RUNNING（运行中）- 绿色
  - COMPLETED（已完成）- 灰色
  - PAUSED（暂停）- 橙色
  - CANCELLED（已取消）- 红色
- **日期范围**: 选择查看时间段

### 4. 任务详情

点击任务条块可查看详细信息：

- 任务ID
- 批次ID
- 工序
- 任务状态
- 计划开始时间
- 计划结束时间
- 预计时长
- 分配机台

### 5. 可视化信息

- **任务条块**: 显示批次ID和工序代码
- **颜色标识**: 根据任务状态显示不同颜色
- **时长显示**: 在左侧列表显示任务时长（小时）
- **Tooltip**: 鼠标悬停显示任务摘要信息

## 使用步骤

### 访问甘特图页面

1. 在路由配置中添加甘特图路由（如果还未添加）：

```javascript
// src/router/index.js 或后端返回的动态路由中
{
  path: '/pps/gantt',
  component: Layout,
  hidden: false,
  children: [
    {
      path: 'index',
      component: () => import('@/views/pps/gantt/index.vue'),
      name: 'GanttChart',
      meta: { title: '任务甘特图', icon: 'chart' }
    }
  ]
}
```

2. 访问路径：`/pps/gantt/index`

### 基本操作

1. **查看全部任务**
   - 进入页面后自动加载当前所有任务
   - 默认显示日视图

2. **筛选任务**
   - 选择车间、机台、状态或日期范围
   - 点击"搜索"按钮应用筛选
   - 点击"重置"按钮清除所有筛选条件

3. **切换视图**
   - 点击"日视图"或"时视图"单选按钮
   - 甘特图会自动调整时间刻度

4. **查看任务详情**
   - 点击任何一个任务条块
   - 弹出详情对话框显示完整信息

5. **刷新数据**
   - 点击右上角的刷新按钮
   - 重新加载最新数据

## 后端接口对接

### 开发阶段

当前使用模拟数据（`getMockGanttData`），包含：

- 5台注塑机（M1-M5）
- 3个车间
- 10个任务示例
- 覆盖所有任务状态

### 生产环境

后端接口完成后，需要修改 `src/views/pps/gantt/index.vue`：

```javascript
// 修改前（使用模拟数据）
import { getMockGanttData } from '@/api/pps/gantt'

const loadData = async () => {
  const response = await getMockGanttData(params)
  // ...
}

// 修改后（使用真实接口）
import { getGanttData } from '@/api/pps/gantt'

const loadData = async () => {
  const response = await getGanttData(params)
  // ...
}
```

### 接口规范

**请求地址**: `/pps/gantt/data`  
**请求方法**: GET  
**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orgUnit | string | 否 | 车间 |
| machineId | string | 否 | 机台ID |
| status | string | 否 | 任务状态 |
| startDate | string | 否 | 开始日期(YYYY-MM-DD) |
| endDate | string | 否 | 结束日期(YYYY-MM-DD) |

**响应格式**:

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "resourceId": "M1",
      "name": "注塑机#1",
      "orgUnit": "车间1",
      "items": [
        {
          "taskId": "T001",
          "batchId": "B001",
          "opCode": "INJECT",
          "status": "SCHEDULED",
          "start": "2026-01-13 08:00:00",
          "end": "2026-01-13 10:30:00"
        }
      ]
    }
  ]
}
```

## 常见问题

### Q1: 甘特图显示不完整？

**A**: 检查容器高度设置，确保 `.gantt-chart` 有足够的高度（当前为600px）

### Q2: 时间刻度显示不正确？

**A**: 确保后端返回的时间格式为 `YYYY-MM-DD HH:mm:ss`

### Q3: 任务颜色不显示？

**A**: 检查任务状态值是否与字典配置一致

### Q4: 筛选不生效？

**A**: 确保后端接口支持相应的筛选参数

## 扩展开发

### 添加更多视图

可在 `setZoomLevel` 函数中添加更多时间尺度：

- 周视图
- 月视图
- 年视图

### 自定义任务模板

修改 `gantt.templates.task_text` 来自定义任务条块显示内容

### 添加拖拽功能

设置 `gantt.config.readonly = false` 并实现拖拽事件处理

### 添加任务链接

使用 `data.links` 数组定义任务之间的依赖关系

## 技术支持

如有问题，请联系开发团队或参考：

- [DHTMLX Gantt 官方文档](https://docs.dhtmlx.com/gantt/)
- 项目 CURSOR.md 变更记录
