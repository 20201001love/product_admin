# 阿里云 OSS 跨域配置指南

## 问题说明

在开发环境下，前端运行在 `localhost:5173`，需要访问 OSS 上的图片资源时，如果 OSS 未配置跨域，浏览器会阻止跨域请求。

## 配置方法

### 方式一：在阿里云控制台配置（推荐）

1. **登录阿里云控制台**
   - 进入 [OSS 控制台](https://oss.console.aliyun.com/)
   - 选择对应的 Bucket

2. **配置跨域规则**
   - 进入 Bucket → **权限管理** → **跨域设置（CORS）**
   - 点击 **创建规则**

3. **填写跨域规则**

   **开发环境配置：**

   ```
   来源（Allowed Origins）：
   - http://localhost:5173
   - http://127.0.0.1:5173
   - http://localhost:*
   - http://127.0.0.1:*

   允许 Methods（Allowed Methods）：
   - GET
   - HEAD
   - POST
   - PUT
   - DELETE

   允许 Headers（Allowed Headers）：
   - *

   暴露 Headers（Exposed Headers）：
   - ETag
   - x-oss-request-id

   缓存时间（Max Age Seconds）：
   - 3600
   ```

   **生产环境配置（示例）：**

   ```
   来源（Allowed Origins）：
   - https://yourdomain.com
   - https://www.yourdomain.com

   允许 Methods（Allowed Methods）：
   - GET
   - HEAD

   允许 Headers（Allowed Headers）：
   - *

   暴露 Headers（Exposed Headers）：
   - ETag
   - x-oss-request-id

   缓存时间（Max Age Seconds）：
   - 3600
   ```

4. **注意事项**
   - 可以使用通配符 `*` 允许所有来源（**仅限开发环境，生产环境不推荐**）
   - 多个来源用换行分隔
   - 开发环境可以配置 `http://localhost:*` 允许所有端口
   - 生产环境应该明确指定域名，不要使用通配符

### 方式二：使用 OSS API 配置

如果需要通过代码配置，可以使用阿里云 SDK：

```javascript
const OSS = require('ali-oss')

const client = new OSS({
  region: 'oss-cn-beijing',
  accessKeyId: 'your-access-key-id',
  accessKeySecret: 'your-access-key-secret',
  bucket: 'your-bucket-name',
})

// 设置跨域规则
await client.putBucketCORS('your-bucket-name', {
  CORSRules: [
    {
      AllowedOrigins: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://yourdomain.com', // 生产环境域名
      ],
      AllowedMethods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
      AllowedHeaders: ['*'],
      ExposeHeaders: ['ETag', 'x-oss-request-id'],
      MaxAgeSeconds: 3600,
    },
  ],
})
```

### 方式三：使用 Vite 代理（开发环境临时方案）

如果暂时无法配置 OSS 跨域，可以在开发环境使用 Vite 代理：

在 `vite.config.js` 中添加：

```javascript
server: {
  port: 5173,
  host: true,
  open: true,
  proxy: {
    '/dev-api': {
      target: baseUrl,
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/dev-api/, ''),
    },
    // OSS 图片代理
    '/oss-proxy': {
      target: 'https://lc-web-javalearn.oss-cn-beijing.aliyuncs.com',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/oss-proxy/, ''),
      // 设置 CORS 响应头
      configure: (proxy, options) => {
        proxy.on('proxyRes', (proxyRes, req, res) => {
          proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS';
        });
      }
    },
  },
}
```

然后在代码中使用代理路径：

```javascript
// 将 OSS URL 转换为代理 URL
const ossUrl =
  'https://lc-web-javalearn.oss-cn-beijing.aliyuncs.com/avatar/xxx.jpg'
const proxyUrl = ossUrl.replace(
  'https://lc-web-javalearn.oss-cn-beijing.aliyuncs.com',
  '/oss-proxy',
)
```

## 推荐配置方案

### 开发环境

- 配置 `http://localhost:*` 和 `http://127.0.0.1:*` 允许所有本地端口
- 或者明确配置 `http://localhost:5173`

### 生产环境

- 明确配置生产域名，不要使用通配符
- 只允许必要的 HTTP 方法（通常只需要 GET 和 HEAD）

## 验证配置

配置完成后，可以在浏览器控制台测试：

```javascript
fetch('https://lc-web-javalearn.oss-cn-beijing.aliyuncs.com/your-image.jpg', {
  method: 'HEAD',
  mode: 'cors',
})
  .then((response) => {
    console.log('CORS 配置成功', response)
  })
  .catch((error) => {
    console.error('CORS 配置失败', error)
  })
```

## 常见问题

1. **配置后仍然报跨域错误**
   - 检查浏览器缓存，清除缓存后重试
   - 确认配置已保存并生效
   - 检查请求的 URL 是否与配置的来源匹配

2. **开发环境使用通配符是否安全**
   - 开发环境可以使用通配符，但生产环境必须明确指定域名
   - 建议为开发和生产环境分别配置不同的规则

3. **是否需要配置多个规则**
   - 可以配置多个规则，每个规则针对不同的环境
   - 或者在一个规则中配置多个来源（用换行分隔）
