/**
 * routes/messages.js — 消息路由
 * 
 * 功能：
 * - GET  /api/messages/conversations  会话列表
 * - GET  /api/messages/:conversationId 历史消息
 * - POST /api/messages/send           发送消息
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// ==================== 模拟会话数据 ====================

// 存储消息的简易内存数组（生产环境应存数据库）
const mockMessages = {};

// 会话列表（每个用户看到的会话）
const mockConversations = [
  {
    id: 1,
    other_user_id: 102,
    other_username: 'Nattaya',
    other_avatar: '',
    last_message: '明天一起去考山路吗？有个很棒的街头派对！',
    last_message_time: '2026-06-09T15:30:00+07:00',
    unread_count: 3
  },
  {
    id: 2,
    other_user_id: 103,
    other_username: 'Pairote',
    other_avatar: '',
    last_message: '周六泰拳体验课还有一个名额，要不要一起？',
    last_message_time: '2026-06-09T10:15:00+07:00',
    unread_count: 0
  },
  {
    id: 3,
    other_user_id: 104,
    other_username: 'Arisa',
    other_avatar: '',
    last_message: '推荐清迈那家咖啡店真的很棒！感谢❤️',
    last_message_time: '2026-06-08T22:00:00+07:00',
    unread_count: 0
  },
  {
    id: 4,
    other_user_id: 105,
    other_username: 'Chatchai',
    other_avatar: '',
    last_message: '普吉岛的潜水点我整理好了，发你看看',
    last_message_time: '2026-06-07T19:45:00+07:00',
    unread_count: 1
  },
  {
    id: 5,
    // 群聊：满月派对活动群
    other_user_id: 0,
    other_username: '满月派对活动群',
    other_avatar: '',
    last_message: 'Chatchai：有人从曼谷一起拼车去帕岸岛吗？',
    last_message_time: '2026-06-09T16:00:00+07:00',
    unread_count: 12,
    is_group: true,
    member_count: 28
  }
];

// ==================== GET /api/messages/conversations ====================

/**
 * 会话列表（需要登录）
 * 
 * 返回当前用户的所有聊天会话，按最后消息时间降序排列。
 * 每个会话包含：对方信息、最后一条消息预览、未读数量。
 */
router.get('/conversations', authenticate, (req, res) => {
  // 按最后消息时间降序排列（最新的在上面）
  const sorted = [...mockConversations].sort(
    (a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)
  );

  res.json({
    code: 200,
    message: '查询成功',
    data: {
      conversations: sorted,
      total: sorted.length,
      total_unread: sorted.reduce((sum, c) => sum + c.unread_count, 0)
    }
  });
});

// ==================== GET /api/messages/:conversationId ====================

/**
 * 获取某个会话的历史消息（需要登录）
 * 
 * 路径参数：:conversationId — 会话 ID
 * 查询参数：page, limit
 */
router.get('/:conversationId', authenticate, (req, res) => {
  const { conversationId } = req.params;

  // 模拟历史消息
  const historyMessages = [
    {
      id: 101,
      conversation_id: parseInt(conversationId),
      sender_id: 102,
      sender_name: 'Nattaya',
      sender_avatar: '',
      content: '嗨！我看到你也报名了周六的美食之旅~',
      message_type: 'text',
      is_read: true,
      created_at: '2026-06-09T14:00:00+07:00'
    },
    {
      id: 102,
      conversation_id: parseInt(conversationId),
      sender_id: 1,
      sender_name: '我',
      sender_avatar: '',
      content: '是的！终于找到了一起逛夜市的小伙伴！',
      message_type: 'text',
      is_read: true,
      created_at: '2026-06-09T14:05:00+07:00'
    },
    {
      id: 103,
      conversation_id: parseInt(conversationId),
      sender_id: 102,
      sender_name: 'Nattaya',
      sender_avatar: '',
      content: '明天一起去考山路吗？有个很棒的街头派对！',
      message_type: 'text',
      is_read: true,
      created_at: '2026-06-09T15:30:00+07:00'
    }
  ];

  res.json({
    code: 200,
    data: {
      messages: historyMessages,
      pagination: { page: 1, limit: 50, total: historyMessages.length }
    }
  });
});

// ==================== POST /api/messages/send ====================

/**
 * 发送消息（需要登录）
 * 
 * 请求体（JSON）：
 * {
 *   "conversation_id": 1,          // 会话 ID
 *   "content": "消息内容",           // 消息文本
 *   "message_type": "text",        // 消息类型：text / image / location
 *   "receiver_id": 102             // 接收者用户 ID
 * }
 * 
 * 如果 conversation_id 不存在，会自动创建新会话
 */
router.post('/send', authenticate, (req, res) => {
  const { conversation_id, content, message_type = 'text', receiver_id } = req.body;

  // 参数校验
  if (!content || (!conversation_id && !receiver_id)) {
    return res.status(400).json({
      code: 400,
      message: '请提供消息内容和会话ID（或接收者ID）'
    });
  }

  const newMessage = {
    id: Math.floor(Math.random() * 100000),
    conversation_id: conversation_id || Math.floor(Math.random() * 1000),
    sender_id: req.user.userId,
    sender_name: req.user.username,
    content,
    message_type,
    is_read: false,
    created_at: new Date().toISOString()
  };

  console.log(`[消息] ${req.user.username} → 会话${newMessage.conversation_id}: ${content}`);

  res.status(201).json({
    code: 200,
    message: '发送成功',
    data: newMessage
  });
});

module.exports = router;
