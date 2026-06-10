/**
 * models/Room.js — 房间数据模型
 * 
 * 住宿房间管理：曼谷公寓、清迈民宿、普吉别墅、拜县小木屋等。
 * 核心功能：房间列表（支持预订/交换两个Tab）、发起房间交换。
 * 
 * 房间交换逻辑：
 * - 用户 A 拥有房间 R1，想换到房间 R2
 * - 发起交换请求后，通知 R2 的房主 B
 * - B 可以选择同意/拒绝
 * - 双方同意后，系统交换两个房间的预订权
 */

const { query } = require('../config/db');

const Room = {
  /**
   * 获取房间列表
   * @param {Object} filters - { type: 'booking'|'swap', city, page, limit }
   * 
   * type='booking'：普通预订Tab，显示可直接预订的房间
   * type='swap'：交换Tab，显示房主愿意交换的房间
   */
  async findAll(filters = {}) {
    let sql = 'SELECT r.*, u.username AS owner_name, u.avatar AS owner_avatar FROM rooms r JOIN users u ON r.owner_id = u.id WHERE 1=1';
    const values = [];
    let idx = 1;

    if (filters.type === 'booking') {
      sql += ` AND r.is_booking = true`;
    } else if (filters.type === 'swap') {
      sql += ` AND r.is_swap = true`;
    }

    if (filters.city) {
      sql += ` AND r.city = $${idx++}`;
      values.push(filters.city);
    }

    sql += ' ORDER BY r.created_at DESC';
    sql += ` LIMIT $${idx++} OFFSET $${idx}`;
    
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    values.push(limit, (page - 1) * limit);

    const { rows } = await query(sql, values);
    return rows;
  },

  /**
   * 根据 ID 获取房间详情
   */
  async findById(id) {
    const sql = `
      SELECT r.*, u.username AS owner_name, u.avatar AS owner_avatar
      FROM rooms r JOIN users u ON r.owner_id = u.id
      WHERE r.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * 创建新房间（发布房源）
   */
  async create(data) {
    const sql = `
      INSERT INTO rooms (
        title, description, city, address, price_per_night, currency,
        image_url, owner_id, is_booking, is_swap
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `;
    const { rows } = await query(sql, [
      data.title, data.description, data.city, data.address,
      data.price_per_night, data.currency || 'THB', data.image_url,
      data.owner_id, data.is_booking !== false, data.is_swap !== false
    ]);
    return rows[0];
  },

  /**
   * 发起房间交换请求
   * @param {number} roomId - 目标房间 ID（你想换到的房间）
   * @param {number} userId - 发起交换的用户 ID
   * 
   * 工作流程：
   * 1. 查找目标房间的房主
   * 2. 创建交换请求记录，状态为 pending
   * 3. 通知目标房主（后续接入推送服务）
   */
  async swapRequest(roomId, userId) {
    // 获取目标房间信息
    const roomSql = 'SELECT * FROM rooms WHERE id = $1';
    const { rows: rooms } = await query(roomSql, [roomId]);
    if (rooms.length === 0) throw new Error('房间不存在');
    
    const targetRoom = rooms[0];
    if (targetRoom.owner_id === userId) {
      throw new Error('不能和自己交换房间');
    }

    // 创建交换请求
    const sql = `
      INSERT INTO room_swaps (from_room_id, to_room_id, from_user_id, to_user_id, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `;
    const { rows: swaps } = await query(sql, [
      null, // from_room_id 稍后由发起方指定
      roomId,
      userId,
      targetRoom.owner_id
    ]);
    return swaps[0];
  }
};

module.exports = Room;
