/**
 * models/Event.js — 活动数据模型
 * 
 * 管理泰国社交活动：满月派对、水灯节、泰拳体验、夜市美食之旅等。
 * 支持活动发布、分类筛选、报名管理、费用结算。
 */

const { query } = require('../config/db');

const Event = {
  /**
   * 创建新活动
   * @param {Object} data - 活动信息
   */
  async create(data) {
    const sql = `
      INSERT INTO events (
        title, description, category, cover_image, location,
        latitude, longitude, start_time, end_time, max_participants,
        price, currency, organizer_id, venue_id, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'upcoming')
      RETURNING *
    `;
    const { rows } = await query(sql, [
      data.title, data.description, data.category, data.cover_image,
      data.location, data.latitude, data.longitude,
      data.start_time, data.end_time, data.max_participants,
      data.price, data.currency || 'THB', data.organizer_id, data.venue_id
    ]);
    return rows[0];
  },

  /**
   * 获取活动列表（支持分类和时间筛选）
   * @param {Object} filters - { category, status, page, limit }
   */
  async findAll(filters = {}) {
    let sql = 'SELECT e.*, u.username AS organizer_name FROM events e JOIN users u ON e.organizer_id = u.id WHERE 1=1';
    const values = [];
    let idx = 1;

    if (filters.category) {
      sql += ` AND e.category = $${idx++}`;
      values.push(filters.category);
    }
    if (filters.status) {
      sql += ` AND e.status = $${idx++}`;
      values.push(filters.status);
    } else {
      sql += ` AND e.status != 'cancelled'`;
    }

    sql += ' ORDER BY e.start_time ASC';
    sql += ` LIMIT $${idx++} OFFSET $${idx}`;
    
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    values.push(limit, (page - 1) * limit);

    const { rows } = await query(sql, values);
    return rows;
  },

  /**
   * 根据 ID 获取活动详情
   */
  async findById(id) {
    const sql = `
      SELECT e.*, u.username AS organizer_name, u.avatar AS organizer_avatar,
        COUNT(ep.id) AS participant_count
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      LEFT JOIN event_participants ep ON e.id = ep.event_id
      WHERE e.id = $1
      GROUP BY e.id, u.username, u.avatar
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * 用户报名活动
   * @param {number} eventId
   * @param {number} userId
   */
  async join(eventId, userId) {
    // 先检查是否已报名，避免重复
    const checkSql = 'SELECT id FROM event_participants WHERE event_id = $1 AND user_id = $2';
    const existing = await query(checkSql, [eventId, userId]);
    if (existing.rows.length > 0) {
      throw new Error('您已报名此活动');
    }

    const sql = `
      INSERT INTO event_participants (event_id, user_id, status, joined_at)
      VALUES ($1, $2, 'confirmed', NOW())
      RETURNING *
    `;
    const { rows } = await query(sql, [eventId, userId]);
    return rows[0];
  }
};

module.exports = Event;
