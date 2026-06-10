/**
 * models/Venue.js — 场地数据模型
 * 
 * 泰国活动场地管理：海滩、酒吧、寺庙广场、夜市摊位等。
 * 支持场地列表查询、详情查看、预约时段。
 */

const { query } = require('../config/db');

const Venue = {
  /**
   * 获取场地列表（支持类型和城市筛选）
   */
  async findAll(filters = {}) {
    let sql = 'SELECT * FROM venues WHERE status = $1';
    const values = ['active'];
    let idx = 2;

    if (filters.type) {
      sql += ` AND type = $${idx++}`;
      values.push(filters.type);
    }
    if (filters.city) {
      sql += ` AND city = $${idx++}`;
      values.push(filters.city);
    }

    sql += ' ORDER BY rating DESC';
    sql += ` LIMIT $${idx++} OFFSET $${idx}`;
    
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    values.push(limit, (page - 1) * limit);

    const { rows } = await query(sql, values);
    return rows;
  },

  /**
   * 根据 ID 获取场地详情
   */
  async findById(id) {
    const sql = 'SELECT * FROM venues WHERE id = $1';
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * 创建场地预约
   */
  async book(data) {
    const sql = `
      INSERT INTO venue_bookings (venue_id, user_id, booking_date, time_slot, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `;
    const { rows } = await query(sql, [
      data.venue_id, data.user_id, data.booking_date, data.time_slot
    ]);
    return rows[0];
  }
};

module.exports = Venue;
