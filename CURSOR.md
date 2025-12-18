# 项目变更记录

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

