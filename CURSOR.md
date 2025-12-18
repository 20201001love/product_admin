# 项目变更记录

## 依赖变更

### 2024 - jsencrypt 依赖添加

- **操作**: 添加 `jsencrypt` 依赖包
- **版本**: ^3.3.2
- **原因**: 修复 `src/utils/jsencrypt.js` 中缺少依赖的错误
- **变更文件**:
  - `package.json`: 在 dependencies 中添加 `jsencrypt: ^3.3.2`
  - `src/utils/jsencrypt.js`: 修复导入路径从 `jsencrypt/bin/jsencrypt.min` 改为 `jsencrypt`

