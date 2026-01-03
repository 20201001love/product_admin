# Product Admin - 产品生产管理系统

一个基于 Vue 3 + Vite 构建的现代化产品生产管理系统前端应用。

## 📋 项目简介

Product Admin 是一个企业级产品生产管理系统，提供从需求管理、生产计划、资源调度到执行跟踪的全流程管理功能。系统采用前后端分离架构，提供直观的用户界面和流畅的交互体验。

## ✨ 核心功能

### 需求管理 (Demand)

- **订单管理**: 客户订单的创建、编辑、确认和取消
- **订单行管理**: 订单明细管理，支持产品选择和数量配置
- **客户管理**: 客户信息维护
- **产品管理**: 产品信息维护，支持图片上传

### 生产计划 (PPS)

- **批次管理**: 生产批次创建、查询和批量任务生成
- **任务管理**: 生产任务的状态管理和交互式操作（开工、暂停、恢复、完工）
- **排程/派工**: 任务排程和派工结果管理，支持一键排程和全部排程

### 执行管理 (Execute)

- **事件管理**: 生产事件日志记录和全流程追溯
- **事件详情**: 基于任务ID的事件详情查看

### 主数据 (Master)

- **日历管理**: 工作日历配置，支持工作日模式、班次设置和休息时段
- **资源管理**: 机器资源管理，支持状态变更（可用、故障、保养）

### 系统管理 (System)

- **用户管理**: 用户账号和权限管理
- **菜单管理**: 动态菜单配置
- **字典管理**: 系统字典维护，支持只读/读写权限控制
- **角色权限**: 基于角色的权限控制（RBAC）

## 🛠️ 技术栈

### 核心框架

- **Vue 3.5+** - 渐进式 JavaScript 框架
- **Vite 7.2+** - 下一代前端构建工具
- **Vue Router 4.6+** - 官方路由管理器
- **Pinia 3.0+** - 新一代状态管理库

### UI 组件库

- **Element Plus 2.12+** - 基于 Vue 3 的组件库
- **VXE Table 4.17+** - 高性能表格组件
- **@element-plus/icons-vue** - Element Plus 图标库

### 工具库

- **Axios 1.13+** - HTTP 客户端
- **@vueuse/core** - Vue Composition API 工具集
- **js-cookie** - Cookie 操作工具
- **jsencrypt** - RSA 加密工具
- **file-saver** - 文件保存工具
- **nprogress** - 进度条组件
- **fuse.js** - 模糊搜索库

### 开发工具

- **ESLint** - 代码检查工具
- **Prettier** - 代码格式化工具
- **Oxlint** - 快速代码检查工具
- **Husky** - Git hooks 工具
- **Sass** - CSS 预处理器

## 📦 环境要求

- **Node.js**: ^20.19.0 || >=22.12.0
- **包管理器**: pnpm (推荐) 或 npm/yarn

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发环境运行

```bash
pnpm dev
```

应用将在 `http://localhost:5173` 启动，并自动打开浏览器。

### 生产环境构建

```bash
# 测试环境构建
pnpm build:test

# 生产环境构建
pnpm build:pro
```

构建产物将输出到 `dist` 目录。

### 预览构建结果

```bash
pnpm preview
```

### 代码检查与格式化

```bash
# 运行 ESLint 和 Oxlint
pnpm lint

# 格式化代码
pnpm format
```

## 📁 项目结构

```
product-admin/
├── public/                 # 静态资源目录
├── src/
│   ├── api/               # API 接口定义
│   │   ├── demand/        # 需求管理相关接口
│   │   ├── pps/           # 生产计划相关接口
│   │   ├── execute/       # 执行管理相关接口
│   │   ├── master/        # 主数据相关接口
│   │   └── system/        # 系统管理相关接口
│   ├── assets/            # 资源文件（图片、样式等）
│   ├── components/        # 全局组件
│   ├── directive/         # 自定义指令
│   ├── layout/            # 布局组件
│   ├── plugins/           # 插件配置
│   ├── router/            # 路由配置
│   ├── stores/            # Pinia 状态管理
│   │   └── modules/       # 状态模块
│   │       ├── user.js    # 用户状态
│   │       ├── app.js     # 应用状态
│   │       ├── dict.js    # 字典状态
│   │       ├── product.js # 产品状态
│   │       └── calendar.js # 日历状态
│   ├── utils/             # 工具函数
│   │   ├── request.js     # Axios 封装
│   │   ├── dict.js        # 字典工具
│   │   └── auth.js        # 认证工具
│   ├── views/             # 页面组件
│   │   ├── demand/        # 需求管理页面
│   │   ├── pps/           # 生产计划页面
│   │   ├── execute/       # 执行管理页面
│   │   ├── master/        # 主数据页面
│   │   └── system/        # 系统管理页面
│   ├── App.vue            # 根组件
│   ├── main.js            # 入口文件
│   └── permission.js      # 权限控制
├── vite/                  # Vite 配置目录
│   └── plugins/           # Vite 插件配置
├── scripts/               # 脚本文件
├── .env                   # 环境变量配置
├── vite.config.js         # Vite 配置文件
├── package.json           # 项目配置
└── README.md             # 项目说明
```

## 🔧 配置说明

### 环境变量

项目支持多环境配置，通过 `.env` 文件管理：

- `.env` - 默认配置
- `.env.development` - 开发环境
- `.env.test` - 测试环境
- `.env.production` - 生产环境

主要环境变量：

- `VITE_APP_BASE_API` - API 基础路径
- `VITE_APP_ENV` - 环境标识

### API 代理配置

开发环境下的 API 代理配置在 `vite.config.js` 中：

```javascript
proxy: {
  '/dev-api': {
    target: 'http://localhost:8081',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/dev-api/, ''),
  },
}
```

### 后端接口

默认后端服务地址：`http://localhost:8081`

## 🎨 功能特性

### 1. 交互式状态管理

- 任务状态支持交互式操作（取消/恢复、撤销排程）
- 机器资源状态支持快速切换（故障、保养、恢复）
- 使用 Tooltip 实现轻量级交互，提升性能

### 2. 无限滚动加载

- 日历管理采用卡片式布局，支持无限滚动
- 使用 IntersectionObserver API 实现高性能滚动加载
- 任务列表支持滚动加载，优化大数据量场景

### 3. 字典权限控制

- 支持字典项的只读/读写权限控制
- 表单编辑时自动过滤只读选项
- 提供 `useDict` 和 `useEditableDict` 两种工具函数

### 4. 批量操作

- 支持批量选择、删除、生成任务
- 批量操作错误提示，支持单个重试
- 选择状态可视化反馈

### 5. 路由参数联动

- 支持通过路由参数传递查询条件
- 订单行页面自动关联订单ID
- 事件详情页面自动关联任务ID

## 📝 开发规范

### 代码风格

- 使用 ESLint + Prettier 保证代码一致性
- 遵循 Vue 3 Composition API 最佳实践
- 组件命名采用 PascalCase
- 文件命名采用 kebab-case

### 提交规范

- 使用 Husky 进行 Git hooks 检查
- 提交前自动运行 lint 检查

### 组件开发

- 优先使用 Composition API
- 使用 `<script setup>` 语法
- 合理使用 `ref`、`reactive`、`computed`、`watch`
- 组件样式使用 Scoped CSS

## 🔐 权限控制

系统采用基于角色的权限控制（RBAC）：

- **权限标识**: 格式为 `模块:功能:操作`，如 `system:user:add`
- **超级权限**: `*:*:*` 拥有所有权限
- **角色验证**: 支持角色级别的权限验证
- **路由权限**: 动态路由根据用户权限生成
- **按钮权限**: 使用 `v-hasPermi` 指令控制按钮显示

## 📚 相关文档

- [Vue 3 文档](https://cn.vuejs.org/)
- [Vite 文档](https://cn.vitejs.dev/)
- [Element Plus 文档](https://element-plus.org/zh-CN/)
- [Pinia 文档](https://pinia.vuejs.org/zh/)
- [Vue Router 文档](https://router.vuejs.org/zh/)

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目为私有项目，未经授权不得使用。

## 👥 开发团队

- 项目维护者：开发团队

## 📞 联系方式

如有问题或建议，请联系开发团队。

---

**注意**: 本项目为生产环境项目，请勿在生产环境外使用或分发。
