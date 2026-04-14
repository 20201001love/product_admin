# 甘特图条块显示优化方案

## 当前显示效果

### 基础显示
- **条块文本**: `批次ID - 工序代码` (如：B001 - INJECT)
- **颜色**: 根据任务状态自动着色
- **尺寸**: 高度28px，宽度根据时长自动计算
- **样式**: 圆角4px，白色文字

## 优化方案

### 方案1: 添加进度显示

显示任务完成百分比：

```javascript
// 在 initGantt 函数中修改
gantt.config.show_progress = true

// 配置进度条
gantt.templates.progress_text = function (start, end, task) {
  return Math.round(task.progress * 100) + '%'
}

// 在数据中添加 progress 字段
{
  taskId: 'T001',
  batchId: 'B001',
  opCode: 'INJECT',
  status: 'RUNNING',
  progress: 0.6, // 60% 完成
  start: '2026-01-13 08:00:00',
  end: '2026-01-13 10:30:00'
}
```

### 方案2: 多行文本显示

显示更多信息：

```javascript
gantt.templates.task_text = function (start, end, task) {
  if (task.type === gantt.config.types.task) {
    // 显示批次ID、工序、时长
    const duration = ((end - start) / (1000 * 60 * 60)).toFixed(1)
    return `
      <div style="line-height: 14px;">
        <div style="font-weight: bold;">${task.batchId}</div>
        <div style="font-size: 11px;">${task.opCode} · ${duration}h</div>
      </div>
    `
  }
  return ''
}

// 同时增加条块高度
gantt.config.bar_height = 36
gantt.config.row_height = 48
```

### 方案3: 图标显示

添加状态图标：

```javascript
gantt.templates.task_text = function (start, end, task) {
  if (task.type === gantt.config.types.task) {
    let icon = ''
    switch (task.status) {
      case 'RUNNING':
        icon = '▶️'
        break
      case 'PAUSED':
        icon = '⏸️'
        break
      case 'COMPLETED':
        icon = '✅'
        break
      case 'CANCELLED':
        icon = '❌'
        break
      default:
        icon = '📋'
    }
    return `${icon} ${task.batchId} - ${task.opCode}`
  }
  return ''
}
```

### 方案4: 渐变色背景

让条块更有层次感：

```scss
// 在 <style lang="scss"> 中添加
.gantt-task-scheduled {
  background: linear-gradient(to bottom, #66b3ff, #409eff);
  border: 1px solid #3a8ee6;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

.gantt-task-running {
  background: linear-gradient(to bottom, #85ce61, #67c23a);
  border: 1px solid #5daf34;
  box-shadow: 0 2px 4px rgba(103, 194, 58, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}
```

### 方案5: 紧凑显示模式

适合大量任务的场景：

```javascript
gantt.config.bar_height = 20
gantt.config.row_height = 28

gantt.templates.task_text = function (start, end, task) {
  if (task.type === gantt.config.types.task) {
    // 只显示批次ID
    return task.batchId
  }
  return ''
}
```

### 方案6: 条块右侧显示额外信息

```javascript
gantt.templates.rightside_text = function (start, end, task) {
  if (task.type === gantt.config.types.task) {
    const duration = ((end - start) / (1000 * 60 * 60)).toFixed(1)
    return `<span style="color: #606266;">${duration}h</span>`
  }
  return ''
}
```

### 方案7: 条块左侧显示优先级

```javascript
gantt.templates.leftside_text = function (start, end, task) {
  if (task.type === gantt.config.types.task && task.priority) {
    const priorityIcons = {
      HIGH: '🔴',
      MEDIUM: '🟡',
      LOW: '🟢'
    }
    return priorityIcons[task.priority] || ''
  }
  return ''
}
```

## 推荐配置

### 生产环境推荐配置

结合实际需求，推荐以下配置：

```javascript
// src/views/pps/gantt/index.vue

// 1. 条块高度
gantt.config.bar_height = 32
gantt.config.row_height = 44

// 2. 显示内容
gantt.templates.task_text = function (start, end, task) {
  if (task.type === gantt.config.types.task) {
    const duration = ((end - start) / (1000 * 60 * 60)).toFixed(1)
    return `
      <div style="padding: 2px 8px;">
        <strong>${task.batchId}</strong>
        <span style="opacity: 0.9; margin-left: 8px;">${task.opCode}</span>
        <span style="opacity: 0.8; font-size: 11px; margin-left: 8px;">(${duration}h)</span>
      </div>
    `
  }
  return ''
}

// 3. 增强的 Tooltip
gantt.templates.tooltip_text = function (start, end, task) {
  if (task.type === gantt.config.types.task) {
    const duration = ((end - start) / (1000 * 60 * 60)).toFixed(1)
    const startTime = gantt.date.date_to_str('%Y-%m-%d %H:%i')(start)
    const endTime = gantt.date.date_to_str('%Y-%m-%d %H:%i')(end)
    
    return `
      <div style="padding: 4px;">
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">
          ${task.batchId}
        </div>
        <table style="font-size: 12px;">
          <tr><td><b>工序:</b></td><td>${task.opCode}</td></tr>
          <tr><td><b>状态:</b></td><td>${getStatusLabel(task.status)}</td></tr>
          <tr><td><b>开始:</b></td><td>${startTime}</td></tr>
          <tr><td><b>结束:</b></td><td>${endTime}</td></tr>
          <tr><td><b>时长:</b></td><td>${duration}小时</td></tr>
        </table>
      </div>
    `
  }
  return ''
}

// 4. 渐变色样式
```

```scss
// 在 <style lang="scss"> 中添加

.gantt-task-scheduled {
  background: linear-gradient(135deg, #5fa8ff 0%, #409eff 100%);
  border: 1px solid #3a8ee6;
  box-shadow: 0 1px 3px rgba(64, 158, 255, 0.2);
}

.gantt-task-running {
  background: linear-gradient(135deg, #7cd355 0%, #67c23a 100%);
  border: 1px solid #5daf34;
  box-shadow: 0 1px 3px rgba(103, 194, 58, 0.2);
  position: relative;
  overflow: hidden;
}

.gantt-task-running::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

.gantt-task-completed {
  background: linear-gradient(135deg, #a0a4a8 0%, #909399 100%);
  border: 1px solid #82848a;
  opacity: 0.85;
}

.gantt-task-paused {
  background: linear-gradient(135deg, #ebb563 0%, #e6a23c 100%);
  border: 1px solid #cf9236;
  box-shadow: 0 1px 3px rgba(230, 162, 60, 0.2);
}

.gantt-task-cancelled {
  background: linear-gradient(135deg, #f78989 0%, #f56c6c 100%);
  border: 1px solid #dd6161;
  opacity: 0.75;
  text-decoration: line-through;
}
```

## 实施步骤

1. **备份原文件**: 复制 `src/views/pps/gantt/index.vue`
2. **选择方案**: 根据实际需求选择上述方案
3. **修改代码**: 在 `initGantt` 函数中添加配置
4. **测试效果**: 刷新页面查看效果
5. **调整细节**: 根据视觉效果微调

## 注意事项

1. **文字长度**: 如果批次ID或工序代码很长，需要考虑文字溢出问题
2. **条块宽度**: 短时间任务条块可能太窄，文字显示不全
3. **颜色对比**: 确保文字颜色与背景色有足够对比度
4. **性能影响**: 复杂的样式可能影响大量任务时的渲染性能

## 效果预览

应用推荐配置后的效果：

```
┌─────────────────────────────────────────────────────────────┐
│ 注塑机#1 (车间1)                                              │
├─────────────────────────────────────────────────────────────┤
│   [  B001  INJECT (2.5h)  ]  ← 蓝色渐变，圆角               │
│                  [  B002  INJECT (3.5h)  ]  ← 绿色渐变+光效  │
├─────────────────────────────────────────────────────────────┤
│ 注塑机#2 (车间1)                                              │
├─────────────────────────────────────────────────────────────┤
│      [  B004  INJECT (3.0h)  ]  ← 灰色（已完成）            │
└─────────────────────────────────────────────────────────────┘
```

鼠标悬停任一条块时，显示详细信息卡片。
