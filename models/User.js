/**
 * models/User.js — 用户数据模型
 * 
 * 定义用户表的数据结构（ORM 风格），提供数据库操作方法。
 * 虽然当前路由返回模拟数据，但这些方法已写好真实 SQL，
 * 连上数据库后即可直接使用。
 */

const { query } = require('../config/db');

/**
 * 用户模型 - 数据操作层
 * 每个方法对应一个数据库操作
 */
const User = {
  /**
   * 创建新用户（注册）
   * @param {Object} userData - { username, email, password_hash, avatar, location }
   * @returns {Object} 新创建的用户记录
   */
  async create(userData) {
    const sql = `
      INSERT INTO users (username, email, password_hash, avatar, location, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, username, email, avatar, location, created_at
    `;
    const { rows } = await query(sql, [
      userData.username,
      userData.email,
      userData.password_hash,
      userData.avatar || '',
      userData.location || '曼谷'
    ]);
    return rows[0];
  },

  /**
   * 根据邮箱查找用户（登录用）
   * @param {string} email
   * @returns {Object|null} 用户记录或 null
   */
  async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await query(sql, [email]);
    return rows[0] || null;
  },

  /**
   * 根据 ID 查找用户
   * @param {number} id
   * @returns {Object|null}
   */
  async findById(id) {
    const sql = 'SELECT id, username, email, avatar, location, bio, interests, created_at FROM users WHERE id = $1';
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * 查找附近用户（按地理位置排序）
   * 使用 PostgreSQL 的 earthdistance 扩展做地理距离计算
   * @param {number} lat - 当前用户纬度
   * @param {number} lng - 当前用户经度
   * @param {number} radius - 搜索半径（公里）
   * @param {number} limit - 最多返回数量
   * @returns {Array} 附近用户列表
   */
  async findNearby(lat, lng, radius = 10, limit = 20) {
    const sql = `
      SELECT id, username, avatar, location,
        earth_distance(
          ll_to_earth($1, $2),
          ll_to_earth(latitude, longitude)
        ) / 1000 AS distance_km
      FROM users
      WHERE earth_box(ll_to_earth($1, $2), $3 * 1000) @> ll_to_earth(latitude, longitude)
      ORDER BY distance_km
      LIMIT $4
    `;
    const { rows } = await query(sql, [lat, lng, radius, limit]);
    return rows;
  },

  /**
   * 更新用户资料
   * @param {number} id
   * @param {Object} updates
   * @returns {Object} 更新后的用户
   */
  async update(id, updates) {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }

    values.push(id);
    const sql = `
      UPDATE users SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id, username, email, avatar, location, bio
    `;
    const { rows } = await query(sql, values);
    return rows[0];
  }
};

module.exports = User;
