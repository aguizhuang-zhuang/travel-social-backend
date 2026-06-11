/**
 * server.js - 泰国社交活动平台后端入口（抗崩溃版）
 */

// 阻止进程在未捕获异常后退出
process.on('uncaughtException', (err) => {
  console.error('[致命错误]', err.message);
  // 不退出，让 Express 错误处理兜底
});
process.on('unhandledRejection', (reason) => {
  console.error('[未捕获拒绝]', reason?.stack || reason?.message || reason);
});

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://aguizhuang-zhuang.github.io', 'file://', 'null']
    : '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 根路径
app.get('/', (_req, res) => {
  res.json({ message: 'API OK', version: '1.0.0' });
});

// 健康检查（必须在路由之前定义）
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// 安全加载路由 — 某个路由崩溃不影响其他
const routes = {
  auth:     { path: '/api/auth',     file: './routes/auth' },
  events:   { path: '/api/events',   file: './routes/events' },
  venues:   { path: '/api/venues',   file: './routes/venues' },
  payments: { path: '/api/payments', file: './routes/payments' },
};

Object.entries(routes).forEach(([name, { path, file }]) => {
  try {
    const router = require(file);
    app.use(path, router);
    console.log(`[路由] ${name} 已挂载`);
  } catch (err) {
    console.error(`[路由] ${name} 加载失败:`, err.message);
  }
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 全局错误处理
app.use((err, _req, res, _next) => {
  console.error('[HTTP错误]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Error' });
});

// 启动
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Env:', process.env.NODE_ENV || 'development');
});

// 延迟数据库初始化
if (process.env.NODE_ENV === 'production') {
  setTimeout(() => {
    try {
      const initDatabase = require('./init-db');
      console.log('Initializing database...');
      initDatabase().catch(err => {
        console.warn('DB init failed:', err.message);
      });
    } catch (err) {
      console.warn('DB init load failed:', err.message);
    }
  }, 5000);
}

module.exports = app;
