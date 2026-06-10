/**
 * routes/auth.js - 用户认证路由
 *
 * 提供接口：
 *   POST /api/auth/register — 用户注册
 *   POST /api/auth/login    — 用户登录
 *
 * 当前阶段返回模拟数据，方便前端联调。
 * 后续接入 PostgreSQL 时只需替换内部实现即可。
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ==================== 模拟用户数据库（内存） ====================
// 后续替换为 PostgreSQL 查询（users 表）
// 延迟初始化以避免模块加载时 bcrypt 崩溃
let mockUsers = null;

function getMockUsers() {
  if (mockUsers) return mockUsers;
  const hash = bcrypt.hashSync('123456', 10);
  mockUsers = [
    {
      id: 1, username: 'traveler_somchai', email: 'somchai@example.com',
      password: hash, avatar: null, nationality: '泰国', city: '曼谷',
      created_at: '2026-01-15T08:00:00Z',
    },
    {
      id: 2, username: 'bangkok_plam', email: 'plam@example.com',
      password: hash, avatar: null, nationality: '泰国', city: '清迈',
      created_at: '2026-03-20T10:30:00Z',
    },
  ];
  return mockUsers;
}

// ==================== POST /api/auth/register ====================
/**
 * 用户注册接口
 * Body: { username, email, password }
 * 返回: JWT Token + 用户信息
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // --- 参数校验 ---
    if (!username || !email || !password) {
      return res.status(400).json({ error: '用户名、邮箱和密码为必填项' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能少于6位' });
    }

    // --- 模拟：检查邮箱是否已被注册 ---
    const users = getMockUsers();
    const exists = users.find(u => u.email === email);
    if (exists) {
      return res.status(409).json({ error: '该邮箱已被注册' });
    }

    // --- 模拟：创建新用户（后续替换为 INSERT INTO users...） ---
    const newUser = {
      id: users.length + 1,
      username,
      email,
      password: bcrypt.hashSync(password, 10),
      avatar: null,
      nationality: '泰国',
      city: '曼谷',
      created_at: new Date().toISOString(),
    };
    users.push(newUser);

    // --- 生成 JWT ---
    const secret = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, email: newUser.email },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 返回成功响应（不泄露密码哈希）
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      message: '注册成功！欢迎加入泰国社交活动平台',
      token,
      user: userWithoutPassword,
    });

  } catch (err) {
    console.error('注册失败:', err.message);
    res.status(500).json({ error: '注册失败，服务器内部错误' });
  }
});

// ==================== POST /api/auth/login ====================
/**
 * 用户登录接口
 * Body: { email, password }
 * 返回: JWT Token + 用户信息
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- 参数校验 ---
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码为必填项' });
    }

    // --- 模拟：查找用户 ---
    const users = getMockUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码不正确' });
    }

    // --- 验证密码 ---
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: '邮箱或密码不正确' });
    }

    // --- 生成 JWT ---
    const secret = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 返回成功响应
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: `欢迎回来，${user.username}！`,
      token,
      user: userWithoutPassword,
    });

  } catch (err) {
    console.error('登录失败:', err.message);
    res.status(500).json({ error: '登录失败，服务器内部错误' });
  }
});

module.exports = router;
