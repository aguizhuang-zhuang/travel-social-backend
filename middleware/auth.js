/**
 * middleware/auth.js - JWT 认证中间件
 *
 * 职责：
 *   1. 从请求头 Authorization 字段提取 Bearer Token
 *   2. 验证 JWT 签名和有效期
 *   3. 将解码后的用户信息注入 req.user，供下游路由使用
 *
 * 使用方式：
 *   const auth = require('../middleware/auth');
 *   router.get('/profile', auth, (req, res) => { ... });
 */

const jwt = require('jsonwebtoken');

/**
 * JWT 认证中间件
 * @param {Request}  req  - Express 请求对象
 * @param {Response} res  - Express 响应对象
 * @param {Function} next - 下一个中间件
 */
function auth(req, res, next) {
  try {
    // 1. 从请求头中获取 Authorization 字段
    const authHeader = req.headers.authorization;

    // 2. 检查是否携带 Token
    if (!authHeader) {
      return res.status(401).json({ error: '未提供认证令牌，请先登录' });
    }

    // 3. 格式必须为 "Bearer <token>"，按空格拆分为两部分
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: '令牌格式错误，应为 Bearer <token>' });
    }

    const token = parts[1];

    // 4. 验证 JWT 并解码
    const secret = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';
    const decoded = jwt.verify(token, secret);

    // 5. 将用户信息挂载到 req 上，下游路由通过 req.user 获取
    //    decoded 结构：{ id, username, email, iat, exp }
    req.user = decoded;

    // 6. 放行到下一个处理函数
    next();

  } catch (err) {
    // 区分不同类型的 JWT 错误
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的认证令牌' });
    }
    return res.status(500).json({ error: '认证服务异常' });
  }
}

module.exports = auth;
