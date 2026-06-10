# 泰国社交活动平台 - 部署指南

## 后端部署到 Railway

### 1. 准备代码
```bash
cd travel-social-backend
git init
git add .
git commit -m "Initial commit"
```

### 2. 部署到 Railway
1. 访问 [Railway.app](https://railway.app)
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的仓库
4. Railway 会自动检测 Node.js 项目并部署
5. 添加 PostgreSQL 数据库插件

### 3. 环境变量配置
在 Railway Dashboard → Project → Variables 中添加：

```
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=production
```

**注意**：`DATABASE_URL` 会自动由 Railway 注入，无需手动设置。

### 4. 验证部署
部署完成后，访问：
```
https://your-project-name.up.railway.app/
```
应返回：
```json
{"message":"欢迎来到泰国社交活动平台 API 🎉","version":"1.0.0","docs":"请查看各 /api/* 路由"}
```

## 前端部署到 GitHub Pages

### 1. 准备代码
```bash
cd travel-social
git init
git add .
git commit -m "Initial commit"
```

### 2. 推送到 GitHub
1. 在 GitHub 创建新仓库
2. 添加远程仓库并推送：
```bash
git remote add origin https://github.com/你的用户名/travel-social.git
git push -u origin main
```

### 3. 启用 GitHub Pages
1. 进入仓库 Settings → Pages
2. Source 选择 "Deploy from a branch"
3. Branch 选择 "main" 或 "master"，文件夹选择 "/ (root)"
4. 点击 Save

### 4. 更新后端地址
如果后端地址变化，修改所有 HTML 文件中的 `API_BASE`：
```javascript
const API_BASE = 'https://your-backend-url.up.railway.app';
```

## 测试线上部署

### 前端地址
```
https://你的用户名.github.io/travel-social/
```

### 测试账号
- 邮箱: `somchai@example.com`
- 密码: `123456`

### 测试 API
```
GET https://your-backend-url.up.railway.app/api/events
POST https://your-backend-url.up.railway.app/api/auth/login
```

## 故障排除

### 1. CORS 错误
确保后端 CORS 配置允许前端域名：
```javascript
allowedOrigins: ['https://你的用户名.github.io']
```

### 2. 数据库连接失败
检查 Railway 的 PostgreSQL 插件是否正常运行，`DATABASE_URL` 是否正确注入。

### 3. API 返回 404
确认路由前缀为 `/api/`，如 `/api/events` 而不是 `/events`。

### 4. 前端无法加载
检查 GitHub Pages 是否成功构建，控制台是否有 404 错误。

## 后续优化建议

1. **自定义域名**：为前后端配置自定义域名
2. **CDN 加速**：使用 Cloudflare 加速静态资源
3. **监控告警**：设置 Railway 监控和告警
4. **自动部署**：配置 GitHub Actions 实现 CI/CD
5. **数据库备份**：定期备份 PostgreSQL 数据

## 技术支持
如有问题，请参考：
- [Railway 文档](https://docs.railway.app/)
- [GitHub Pages 文档](https://docs.github.com/pages)
- [项目 README](../README.md)