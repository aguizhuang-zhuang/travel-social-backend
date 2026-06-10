/**
 * config/db.js - PostgreSQL 连接池配置
 *
 * 使用 pg 模块的 Pool 管理数据库连接，自动从 .env 读取配置。
 * 连接池优势：
 *   - 复用连接，避免反复握手开销
 *   - 限制最大连接数，防止数据库过载
 *   - 空闲连接自动回收
 */

const { Pool } = require('pg');

// 从环境变量读取数据库配置，支持 Railway 的 DATABASE_URL
const commonConfig = {
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

let pool;

if (process.env.DATABASE_URL) {
  // Railway：使用 connectionString，内部网络无需 SSL
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ...commonConfig,
  });
} else {
  // 本地开发配置
  pool = new Pool({
    ...commonConfig,
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME     || 'travel_social',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });
}

// 连接池启动时不立即自检，避免健康检查失败
setTimeout(() => {
  pool.query('SELECT NOW()')
    .then(result => {
      console.log('✅ 数据库连接成功 — 服务器时间:', result.rows[0].now);
    })
    .catch(err => {
      console.warn('⚠️  数据库连接失败（服务仍会启动）:', err.message);
    });
}, 5000); // 延迟 5 秒执行

/**
 * 执行参数化 SQL 查询（推荐方式，防 SQL 注入）
 * @param {string} text  - SQL 语句，占位符用 $1, $2, ...
 * @param {Array}  params - 参数数组，按顺序替换占位符
 * @returns {Promise<QueryResult>} 查询结果对象
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  // 开发环境下打印慢查询日志（超过 1 秒）
  if (duration > 1000) {
    console.warn(`⚠️  慢查询 [${duration}ms]:`, text.substring(0, 100));
  }
  return result;
}

/**
 * 获取一个客户端连接，用于事务操作
 * 使用方式：
 *   const client = await getClient();
 *   try {
 *     await client.query('BEGIN');
 *     // ... 执行多条 SQL ...
 *     await client.query('COMMIT');
 *   } catch (e) {
 *     await client.query('ROLLBACK');
 *   } finally {
 *     client.release();
 *   }
 * @returns {Promise<PoolClient>}
 */
async function getClient() {
  return pool.connect();
}

module.exports = { query, getClient, pool };
