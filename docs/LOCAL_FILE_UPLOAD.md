# 本地文件上传配置说明

## 概述

由于 OSS 跨域配置复杂，项目已改为使用本地文件上传方式。头像文件将直接上传到后端服务器，存储在服务器的本地文件系统中。

## 前端配置

### 1. API 接口配置

**文件位置：** `src/api/system/user.js`

```javascript
// 用户头像上传（本地文件上传）
export function uploadAvatar(data) {
  return request({
    url: '/system/user/profile/avatar',
    method: 'post',
    // FormData 上传时，不设置 Content-Type，让浏览器自动设置为 multipart/form-data
    // 如果手动设置，可能会导致边界（boundary）丢失
    data: data,
  })
}
```

**关键点：**

- 不手动设置 `Content-Type`，让浏览器自动处理 FormData
- 使用 `multipart/form-data` 格式上传文件

### 2. 上传组件配置

**文件位置：** `src/views/system/user/profile/userAvatar.vue`

```javascript
/** 上传图片 */
function uploadImg() {
  proxy.$refs.cropper.getCropBlob((data) => {
    let formData = new FormData()
    formData.append('avatarfile', data, options.filename)
    uploadAvatar(formData).then((response) => {
      // 本地文件上传：后端返回的 imgUrl 应该是相对路径
      // 需要拼接后端 API 地址来访问本地存储的图片
      let newAvatarUrl = response.imgUrl

      // 如果返回的是完整 URL（http/https），直接使用（兼容处理）
      // 否则拼接后端 API 地址（本地文件上传的标准情况）
      if (
        !newAvatarUrl.startsWith('http://') &&
        !newAvatarUrl.startsWith('https://')
      ) {
        // 确保路径以 / 开头
        if (!newAvatarUrl.startsWith('/')) {
          newAvatarUrl = '/' + newAvatarUrl
        }
        newAvatarUrl = import.meta.env.VITE_APP_BASE_API + newAvatarUrl
      }

      // 更新 store 中的头像
      userStore.avatar = newAvatarUrl
      options.img = newAvatarUrl
      avatarKey.value = Date.now()

      open.value = false
      visible.value = false
      proxy.$modal.msgSuccess('修改成功')
    })
  })
}
```

**关键点：**

- 使用 `FormData` 封装文件数据
- 字段名：`avatarfile`
- 后端返回的 `imgUrl` 应为相对路径（如：`/profile/avatar/xxx.jpg`）
- 前端自动拼接 `VITE_APP_BASE_API` 生成完整访问 URL

## 后端要求

### 1. 接口规范

**接口地址：** `POST /system/user/profile/avatar`

**请求格式：**

- Content-Type: `multipart/form-data`
- 字段名：`avatarfile`
- 文件类型：图片文件（JPG、PNG 等）

**响应格式：**

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "imgUrl": "/profile/avatar/2025/12/20/avatar_xxx.jpg"
  }
}
```

**关键要求：**

- `imgUrl` 返回相对路径，不要返回完整 URL
- 路径应以 `/` 开头（如：`/profile/avatar/xxx.jpg`）
- 文件应存储在服务器可访问的目录中

### 2. 文件存储建议

**存储路径示例：**

```
项目根目录/
  └── upload/
      └── profile/
          └── avatar/
              └── 2025/
                  └── 12/
                      └── 20/
                          └── avatar_xxx.jpg
```

**文件命名建议：**

- 使用时间戳 + 随机字符串，避免文件名冲突
- 例如：`avatar_20251220_123456_abc123.jpg`

### 3. 静态资源访问配置

后端需要配置静态资源访问路径，使前端可以通过 HTTP 请求访问上传的文件。

**Spring Boot 示例：**

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 配置头像访问路径
        registry.addResourceHandler("/profile/avatar/**")
                .addResourceLocations("file:" + uploadPath + "/profile/avatar/");
    }
}
```

**Nginx 示例：**

```nginx
location /profile/avatar/ {
    alias /path/to/upload/profile/avatar/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

## 与 OSS 上传的区别

| 特性     | OSS 上传      | 本地文件上传        |
| -------- | ------------- | ------------------- |
| 存储位置 | 阿里云 OSS    | 服务器本地磁盘      |
| 跨域配置 | 需要配置 CORS | 无需配置（同源）    |
| URL 格式 | 完整 OSS URL  | 相对路径 + API 地址 |
| 文件访问 | 直接访问 OSS  | 通过后端服务器访问  |
| 存储成本 | OSS 存储费用  | 服务器磁盘空间      |
| 扩展性   | 易于扩展      | 受服务器磁盘限制    |

## 优势

1. **无需跨域配置**：文件存储在本地服务器，与前端同源，无需配置 CORS
2. **简单直接**：不需要配置 OSS 密钥、Bucket 等
3. **成本低**：不需要支付 OSS 存储费用（小规模应用）

## 注意事项

1. **磁盘空间**：需要监控服务器磁盘使用情况，避免磁盘满
2. **备份策略**：建议定期备份上传的文件
3. **访问权限**：确保上传目录有正确的读写权限
4. **文件大小限制**：后端需要设置合理的文件大小限制
5. **文件类型验证**：后端需要验证文件类型，防止上传恶意文件
6. **路径安全**：确保文件路径不会导致路径遍历攻击

## 迁移检查清单

- [x] 前端 API 接口已修改（移除错误的 Content-Type）
- [x] 前端上传组件已更新（URL 处理逻辑）
- [x] 后端接口返回相对路径
- [x] 后端配置静态资源访问
- [x] 后端文件存储目录已创建
- [x] 后端文件大小限制已配置
- [x] 后端文件类型验证已实现
- [ ] 旧 OSS 文件的迁移（如需要）
- [ ] 备份策略已制定

## 测试验证

1. **上传测试**：
   - 选择图片文件
   - 裁剪并提交
   - 检查是否上传成功

2. **显示测试**：
   - 上传后立即检查头像是否更新
   - 刷新页面后检查头像是否正常显示
   - 检查不同页面（个人中心、顶部导航）的头像显示

3. **URL 验证**：
   - 在浏览器开发者工具中检查图片 URL
   - 确认 URL 格式正确（`http://api.example.com/profile/avatar/xxx.jpg`）
   - 直接访问 URL 确认可以正常加载图片
