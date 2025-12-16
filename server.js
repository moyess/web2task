const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Token存储文件路径
const TOKEN_FILE = path.join(__dirname, 'token.json');

// 读取存储的token
function getStoredToken() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const data = fs.readFileSync(TOKEN_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('读取token失败:', error);
  }
  return null;
}

// 保存token
function saveToken(tokenData) {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData, null, 2));
    console.log('Token已保存');
  } catch (error) {
    console.error('保存token失败:', error);
  }
}

// 路由：首页 - 授权入口
app.get('/', (req, res) => {
  const token = getStoredToken();
  if (token && token.access_token) {
    // 已授权，重定向到任务表单页面
    res.redirect('/form.html');
  } else {
    // 未授权，显示授权页面
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// 路由：开始OAuth授权
app.get('/auth', (req, res) => {
  const authURL = `https://dida365.com/oauth/authorize?scope=tasks:write tasks:read&client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&state=state`;
  res.redirect(authURL);
});

// 路由：OAuth回调
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('授权失败：未获取到code');
  }

  try {
    // 用code换取access_token
    const params = new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: process.env.REDIRECT_URI,
      grant_type: 'authorization_code',
      scope: 'tasks:write tasks:read',
      code: code
    });

    const response = await axios.post('https://dida365.com/oauth/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const tokenData = response.data;

    if (tokenData.access_token) {
      // 保存token
      saveToken(tokenData);

      // 重定向到任务表单页面
      res.redirect('/form.html?authorized=true');
    } else {
      res.status(500).send('授权失败：未获取到access_token');
    }
  } catch (error) {
    console.error('获取token失败:', error.response?.data || error.message);
    res.status(500).send('授权失败：' + (error.response?.data?.error_description || error.message));
  }
});

// 路由：检查授权状态
app.get('/api/auth-status', (req, res) => {
  const token = getStoredToken();
  res.json({
    authorized: !!(token && token.access_token)
  });
});

// 路由：创建任务
app.post('/api/create-task', async (req, res) => {
  const token = getStoredToken();

  if (!token || !token.access_token) {
    return res.status(401).json({
      success: false,
      message: '未授权，请先完成授权'
    });
  }

  const { title, priority, dueDate, content } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: '任务名称不能为空'
    });
  }

  try {
    // 构建任务数据
    const taskData = {
      title: title,
      content: content || '',
      priority: parseInt(priority) || 0, // 优先级：0=无，1=低，3=中，5=高
    };

    // 如果有排期，添加到任务数据
    if (dueDate) {
      // 将日期格式转换为滴答清单需要的格式
      // 滴答清单需要使用 "YYYY-MM-DD" 格式的字符串
      taskData.dueDate = dueDate; // 直接使用前端传来的日期格式
    }

    console.log('创建任务数据:', JSON.stringify(taskData, null, 2));

    // 调用滴答清单API创建任务
    const response = await axios.post('https://api.dida365.com/open/v1/task', taskData, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('API响应:', JSON.stringify(response.data, null, 2));

    if (response.data.id) {
      res.json({
        success: true,
        message: '任务创建成功',
        data: response.data
      });
    } else {
      throw new Error('任务创建失败');
    }
  } catch (error) {
    console.error('创建任务失败:', error.response?.data || error.message);

    // 如果token过期，清除存储的token
    if (error.response?.status === 401) {
      fs.unlinkSync(TOKEN_FILE);
    }

    res.status(500).json({
      success: false,
      message: '创建任务失败',
      error: error.response?.data || error.message
    });
  }
});

// 路由：重新授权（清除token）
app.post('/api/reauth', (req, res) => {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      fs.unlinkSync(TOKEN_FILE);
    }
    res.json({
      success: true,
      message: 'Token已清除，请重新授权'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '清除token失败'
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('请确保已在.env文件中配置CLIENT_ID和CLIENT_SECRET');
});
