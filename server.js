/**
 * server.js - 泰国社交活动平台后端入口
 * 负责：
 *   1. 加载环境变量
 *   2. 挂载全局中间件（CORS、JSON 解析）
 *   3. 挂载业务路由
 *   4. 统一错误处理
 *   5. 启动 HTTP 服务
 */

// 在所有模块之前加载 .env 环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// ==================== 导入路由模块 ====================
const authRoutes     = require('./routes/auth');      // 用户认证（注册/登录）
const eventsRoutes   = require('./routes/events');    // 活动管理
const venuesRoutes   = require('./routes/venues');    // 场地浏览
const paymentsRoutes = require('./routes/payments');  // 支付下单与回调

// ==================== 创建 Express 实例 ====================
const app = express();

// 从环境变量读取端口，默认 3000
const PORT = process.env.PORT || 3000;

// ==================== 全局中间件 ====================

// CORS：开发环境放行所有来源，生产环境限制为前端域名
const allowedOrigins = [
  'https://aguizhuang-zhuang.github.io',
  'file://',
  'null', // file:// 协议下的 origin
];
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? allowedOrigins
    : '*',
  credentials: true,
}));

// 解析 JSON 请求体（限制 10MB，防止巨型请求攻击）
app.use(express.json({ limit: '10mb' }));

// 解析 URL-encoded 请求体
app.use(express.urlencoded({ extended: true }));

// ==================== 路由挂载 ====================

// 认证相关：POST /api/auth/register、POST /api/auth/login
app.use('/api/auth', authRoutes);

// 活动相关：GET/POST /api/events
app.use('/api/events', eventsRoutes);

// 场地相关：GET /api/venues
app.use('/api/venues', venuesRoutes);

// 支付相关：POST /api/payments
app.use('/api/payments', paymentsRoutes);

// 根路径健康检查
app.get('/', (_req, res) => {
  res.json({
    message: '欢迎来到泰国社交活动平台 API 🎉',
    version: '1.0.0',
    docs: '请查看各 /api/* 路由',
  });
});

// ==================== 404 兜底 ====================
// 所有未匹配的路由返回 404
app.use((_req, res) => {
  res.status(404).json({ error: '接口不存在，请检查路径和方法是否正确' });
});

// ==================== 全局错误处理 ====================
// Express 约定：4 个参数的中间件即为错误处理中间件
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[服务器错误]', err.message);
  // 开发环境返回详细错误栈，生产环境只返回简要信息
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({
    error: isDev ? err.message : '服务器内部错误，请稍后重试',
    ...(isDev && err.stack ? { stack: err.stack } : {}),
  });
});

// ==================== 启动服务 ====================
app.listen(PORT, () => {
  console.log(`🚀 泰国社交活动平台后端已启动 → http://localhost:${PORT}`);
  console.log('📡 环境:', process.env.NODE_ENV || 'development');
});

// 导出 app 供测试使用
module.exports = app;
