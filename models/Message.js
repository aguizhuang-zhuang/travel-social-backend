/**
 * models/Message.js — 消息数据模型
 * 
 * 即时通讯功能：会话列表、一对一私聊、群聊（活动群）。
 * 支持文本消息、图片消息、位置分享。
 */

const { query } = require('../config/db');

const Message = {
  /**
   * 获取用户的会话列表
   * @param {number} userId - 当前用户 ID
   * 
   * 返回最近联系人的列表，每个会话包含：
   * - 对方用户信息
   * - 最后一条消息内容
   * - 未读消息数
   * - 最后消息时间
   */
  async getConversations(userId) {
    const sql = `
      SELECT 
        c.id AS conversation_id,
        CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END AS other_user_id,
        u.username AS other_username,
        u.avatar AS other_avatar,
        m.content AS last_message,
        m.created_at AS last_message_time,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND is_read = false) AS unread_count
      FROM conversations c
      JOIN users u ON (CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END) = u.id
      LEFT JOIN LATERAL (
        SELECT content, created_at FROM messages 
        WHERE conversation_id = c.id 
        ORDER BY created_at DESC LIMIT 1
      ) m ON true
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY m.created_at DESC NULLS LAST
    `;
    const { rows } = await query(sql, [userId]);
    return rows;
  },

  /**
   * 发送消息
   * @param {Object} data - { conversation_id, sender_id, content, message_type }
   */
  async send(data) {
    const sql = `
      INSERT INTO messages (conversation_id, sender_id, content, message_type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await query(sql, [
      data.conversation_id,
      data.sender_id,
      data.content,
      data.message_type || 'text'
    ]);
    return rows[0];
  },

  /**
   * 获取某个会话的历史消息
   * @param {number} conversationId
   * @param {Object} pagination - { page, limit }
   */
  async getMessages(conversationId, pagination = {}) {
    const limit = pagination.limit || 50;
    const page = pagination.page || 1;
    const sql = `
      SELECT m.*, u.username AS sender_name, u.avatar AS sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const { rows } = await query(sql, [conversationId, limit, (page - 1) * limit]);
    return rows;
  }
};

module.exports = Message;
