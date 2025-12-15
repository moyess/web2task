# 滴答清单协作任务提交系统

这是一个基于 Node.js + Express 的 Web 应用，让同事可以方便地通过网页表单向您的滴答清单（dida365）提交工作任务。

## 功能特点

- 简洁美观的 Web 界面
- OAuth 2.0 安全授权
- 支持设置任务名称、优先级、排期和描述
- 自动将任务添加到您的滴答清单
- 响应式设计，支持移动端访问

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置滴答清单应用

1. 访问 [滴答清单开发者平台](https://developer.dida365.com/)
2. 创建一个新的应用
3. 记录下 `Client ID` 和 `Client Secret`
4. 在 OAuth redirect URL 中添加：`http://localhost:8080/callback`（开发环境）

### 3. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入您的配置：

```env
CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
PORT=8080
REDIRECT_URI=http://localhost:8080/callback
APP_URL=http://localhost:8080
```

### 4. 启动应用

```bash
npm start
```

或使用开发模式（自动重启）：

```bash
npm run dev
```

### 5. 访问应用

在浏览器中打开 `http://localhost:8080`

## 使用流程

### 首次使用（授权）

1. 访问应用首页
2. 点击"开始授权"按钮
3. 在滴答清单页面登录并同意授权
4. 授权成功后自动跳转到任务提交页面

### 提交任务

授权成功后，您和您的同事可以：

1. 填写任务名称（必填）
2. 选择优先级：
   - 无优先级
   - 低
   - 中
   - 高
3. 设置排期日期（可选）
4. 填写任务描述（可选）
5. 点击"提交任务"按钮

任务将自动添加到您的滴答清单中！

## API 接口

### GET /
首页，检查授权状态并重定向

### GET /auth
开始 OAuth 授权流程

### GET /callback
OAuth 回调地址，处理授权结果

### GET /api/auth-status
检查当前授权状态

```json
{
  "authorized": true
}
```

### POST /api/create-task
创建任务

请求体：
```json
{
  "title": "任务名称",
  "priority": 5,
  "dueDate": "2025-12-16",
  "content": "任务描述"
}
```

响应：
```json
{
  "success": true,
  "message": "任务创建成功",
  "data": { ... }
}
```

### POST /api/reauth
清除当前授权，需要重新授权

## 优先级说明

滴答清单的优先级值：
- `0` - 无优先级
- `1` - 低优先级
- `3` - 中优先级
- `5` - 高优先级

## 部署到生产环境

### 1. 更新环境变量

将 `.env` 中的 URL 更新为您的生产域名：

```env
REDIRECT_URI=https://your-domain.com/callback
APP_URL=https://your-domain.com
```

### 2. 更新滴答清单应用配置

在滴答清单开发者平台中，将 OAuth redirect URL 更新为：
`https://your-domain.com/callback`

### 3. 使用 PM2 部署（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name dida365-collaboration

# 设置开机自启
pm2 startup
pm2 save
```

### 4. 使用 Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 目录结构

```
.
├── server.js           # 后端服务器
├── package.json        # 项目配置
├── .env                # 环境变量（需自行创建）
├── .env.example        # 环境变量示例
├── token.json          # Token 存储（自动生成）
├── public/             # 前端静态文件
│   ├── index.html      # 授权页面
│   ├── form.html       # 任务提交表单
│   ├── style.css       # 样式文件
│   └── script.js       # 前端逻辑
└── README.md           # 说明文档
```

## 常见问题

### Q: 授权后显示 401 错误？
A: Token 可能已过期，点击右上角的刷新按钮重新授权。

### Q: 如何重新授权？
A: 在任务提交页面点击右上角的刷新图标，或删除 `token.json` 文件后重新访问首页。

### Q: 任务创建成功但在滴答清单中看不到？
A: 检查滴答清单应用中的作用域（scope）是否包含 `tasks:write`。

### Q: 如何让同事访问这个系统？
A: 将应用部署到公网服务器，并配置好域名。您需要先完成授权，之后同事就可以通过表单提交任务到您的滴答清单。

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 HTML + CSS + JavaScript
- **API**: 滴答清单 OpenAPI
- **授权**: OAuth 2.0

## 安全建议

1. 不要将 `.env` 文件提交到 Git 仓库
2. 在生产环境中使用 HTTPS
3. 定期更新依赖包
4. 妥善保管 Client Secret
5. Token 存储建议改用数据库（当前使用文件存储）

## License

MIT

## 参考资料

- [滴答清单开发者文档](https://developer.dida365.com/docs)
- [OAuth 2.0 授权框架](https://oauth.net/2/)
