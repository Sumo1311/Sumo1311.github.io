const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

// 配置常量
const CONFIG = {
  PORT: 3000,
  MESSAGE_FILE: 'messages.json',
  PUBLIC_DIR: 'public'
};

// 初始化 Express 应用
const app = express();

// 中间件配置
app.use(bodyParser.json());
app.use(express.static(CONFIG.PUBLIC_DIR));

// 初始化消息文件
(() => {
  try {
    if (!fs.existsSync(CONFIG.MESSAGE_FILE)) {
      fs.writeFileSync(CONFIG.MESSAGE_FILE, '[]', 'utf8');
      console.log(`已创建初始消息文件: ${CONFIG.MESSAGE_FILE}`);
    }
  } catch (initError) {
    console.error('初始化失败:', initError);
    process.exit(1);
  }
})();

// SSE 客户端管理
const clients = new Map();

// 工具函数
const fileOperations = {
  /**
   * 安全读取消息文件
   */
  async readMessages() {
    try {
      const data = await fs.promises.readFile(CONFIG.MESSAGE_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw new Error(`文件读取失败: ${error.message}`);
    }
  },

  /**
   * 原子写入消息文件
   */
  async writeMessages(messages) {
    const tempFile = `${CONFIG.MESSAGE_FILE}.tmp`;
    try {
      await fs.promises.writeFile(tempFile, JSON.stringify(messages));
      await fs.promises.rename(tempFile, CONFIG.MESSAGE_FILE);
    } catch (error) {
      await fs.promises.unlink(tempFile).catch(() => {});
      throw new Error(`文件写入失败: ${error.message}`);
    }
  }
};

// 路由处理
const routes = {
  // 主页面
  homePage: (req, res) => res.sendFile(path.join(__dirname, CONFIG.PUBLIC_DIR, 'index.html')),

  // 实时显示页面
  displayPage: (req, res) => res.sendFile(path.join(__dirname, CONFIG.PUBLIC_DIR, 'display.html')),

  // 获取历史消息
  async getMessages(req, res) {
    try {
      const messages = await fileOperations.readMessages();
      res.json(messages);
    } catch (error) {
      console.error('消息获取失败:', error);
      res.status(500).send('服务器内部错误');
    }
  },

  // 提交新消息
  async postMessage(req, res) {
    const content = req.body.message?.trim();
    if (!content) return res.status(400).json({ error: '消息内容不能为空' });

    const newMessage = {
      id: Date.now(),
      content,
      timestamp: new Date().toLocaleString('zh-CN')
    };

    try {
      const messages = await fileOperations.readMessages();
      messages.push(newMessage);
      
      await fileOperations.writeMessages(messages);
      
      // 广播新消息
      clients.forEach(client => {
        client.res.write(`event: message\n`);
        client.res.write(`data: ${JSON.stringify(newMessage)}\n\n`);
      });
      
      res.sendStatus(200);
    } catch (error) {
      console.error('消息保存失败:', error);
      res.status(500).json({ error: '消息保存失败' });
    }
  }
};

// 路由配置
app.get('/', routes.homePage);
app.get('/display', routes.displayPage);
app.get('/messages', routes.getMessages);
app.post('/send', routes.postMessage);

// SSE 端点
app.get('/updates', (req, res) => {
  res.header({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  }).flushHeaders();

  const clientId = Date.now();
  clients.set(clientId, { res });

  req.on('close', () => clients.delete(clientId));
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] 错误:`, err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(CONFIG.PORT, () => {
  console.log(`服务已启动于 http://localhost:${CONFIG.PORT}`);
  console.log('功能端点:');
  console.log(` 提交页面: http://localhost:${CONFIG.PORT}`);
  console.log(` 展示页面: http://localhost:${CONFIG.PORT}/display`);
  console.log(` 消息接口: http://localhost:${CONFIG.PORT}/messages`);
});
