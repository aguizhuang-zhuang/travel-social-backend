/**
 * routes/rooms.js — 房间路由
 * 
 * 功能：
 * - GET   /api/rooms           房间列表（支持 booking/swap 两个 Tab）
 * - GET   /api/rooms/:id       房间详情
 * - POST  /api/rooms           发布房源（需登录）
 * - POST  /api/rooms/:id/swap  发起房间交换
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// ==================== 模拟房间数据 ====================

const mockRooms = [
  {
    id: 1,
    title: '曼谷素坤逸高层公寓',
    description: 'BTS Phrom Phong 站步行 3 分钟，高层视野好，带泳池和健身房。周边有 EM 商圈，购物吃饭超方便。',
    city: '曼谷',
    address: '素坤逸路 24 巷',
    price_per_night: 1200,
    currency: 'THB',
    image_url: '',
    owner_id: 101,
    owner_name: 'Somchai',
    owner_avatar: '',
    is_booking: true,     // 可预订
    is_swap: true,         // 可交换
    amenities: ['Wi-Fi', '泳池', '健身房', '厨房', '洗衣机'],
    max_guests: 2,
    rating: 4.7,
    review_count: 89,
    created_at: '2026-01-10T08:00:00Z'
  },
  {
    id: 2,
    title: '清迈古城传统木屋',
    description: '兰纳风格独栋木屋，带小院和花园。步行到周日夜市 5 分钟。含免费自行车和早餐。',
    city: '清迈',
    address: '古城·叻差当能路',
    price_per_night: 600,
    currency: 'THB',
    image_url: '',
    owner_id: 102,
    owner_name: 'Nattaya',
    owner_avatar: '',
    is_booking: true,
    is_swap: false,
    amenities: ['Wi-Fi', '花园', '自行车', '早餐', '空调'],
    max_guests: 4,
    rating: 4.9,
    review_count: 156,
    created_at: '2025-11-20T12:00:00Z'
  },
  {
    id: 3,
    title: '普吉岛海景别墅',
    description: '卡塔海滩附近三层别墅，私人泳池，无敌海景。可住 6 人，适合家庭或朋友组团。',
    city: '普吉',
    address: '卡塔海滩·半山别墅区',
    price_per_night: 4500,
    currency: 'THB',
    image_url: '',
    owner_id: 103,
    owner_name: 'Pairote',
    owner_avatar: '',
    is_booking: true,
    is_swap: true,
    amenities: ['Wi-Fi', '私人泳池', '海景', '厨房', '停车位', 'BBQ'],
    max_guests: 6,
    rating: 4.8,
    review_count: 234,
    created_at: '2025-08-15T10:00:00Z'
  },
  {
    id: 4,
    title: '拜县河边小木屋',
    description: '拜河边的竹子小屋，躺在床上就能听到流水声。远离喧嚣，适合放空自己。',
    city: '夜丰颂',
    address: '拜县·拜河河畔',
    price_per_night: 350,
    currency: 'THB',
    image_url: '',
    owner_id: 104,
    owner_name: 'Arisa',
    owner_avatar: '',
    is_booking: false,
    is_swap: true,       // 仅交换
    amenities: ['Wi-Fi', '吊床', '花园', '篝火', '自行车'],
    max_guests: 2,
    rating: 4.6,
    review_count: 78,
    created_at: '2026-02-28T09:00:00Z'
  },
  {
    id: 5,
    title: '苏梅岛沙滩平房',
    description: '查汶海滩边的沙滩平房，开门就是大海。每天听着海浪声醒来。',
    city: '苏梅岛',
    address: '查汶海滩',
    price_per_night: 1800,
    currency: 'THB',
    image_url: '',
    owner_id: 105,
    owner_name: 'Chatchai',
    owner_avatar: '',
    is_booking: true,
    is_swap: true,
    amenities: ['Wi-Fi', '海景', '空调', '早餐'],
    max_guests: 2,
    rating: 4.5,
    review_count: 112,
    created_at: '2026-03-12T14:00:00Z'
  }
];

// ==================== GET /api/rooms ====================

/**
 * 房间列表接口
 * 
 * 查询参数：
 * - type: 列表类型
 *   - 'booking'（默认）= 预订 Tab：显示可直接付费预订的房间
 *   - 'swap' = 交换 Tab：显示房主愿意交换的房间
 * - city: 城市筛选
 * - page, limit: 分页
 */
router.get('/', (req, res) => {
  const { type = 'booking', city, page = 1, limit = 20 } = req.query;

  let filtered = [...mockRooms];

  // 按 Tab 类型筛选
  if (type === 'booking') {
    filtered = filtered.filter(r => r.is_booking);
  } else if (type === 'swap') {
    filtered = filtered.filter(r => r.is_swap);
  }

  // 按城市筛选
  if (city) {
    filtered = filtered.filter(r => r.city === city);
  }

  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + parseInt(limit));

  res.json({
    code: 200,
    message: '查询成功',
    data: {
      rooms: paged,
      current_tab: type,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filtered.length,
        total_pages: Math.ceil(filtered.length / limit)
      },
      cities: ['曼谷', '清迈', '普吉', '苏梅岛', '夜丰颂', '芭提雅', '甲米']
    }
  });
});

// ==================== GET /api/rooms/:id ====================

/**
 * 房间详情接口
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const room = mockRooms.find(r => r.id === parseInt(id));

  if (!room) {
    return res.status(404).json({ code: 404, message: '房间不存在' });
  }

  res.json({
    code: 200,
    data: {
      ...room,
      // 详情页额外信息
      house_rules: ['禁止吸烟', '晚上 10 点后请保持安静', '离开时请关空调'],
      cancellation_policy: '入住前 48 小时免费取消',
      check_in: '14:00',
      check_out: '12:00',
      reviews: [
        { user: '小李', rating: 5, comment: '超棒的体验！房东人很好，还推荐了附近的美食。', date: '2026-05-20' },
        { user: 'Emma', rating: 4, comment: '位置很好，交通方便，房间干净整洁。', date: '2026-04-15' }
      ]
    }
  });
});

// ==================== POST /api/rooms ====================

/**
 * 发布房源（需登录）
 * 
 * 请求体：
 * {
 *   "title": "房源标题",
 *   "description": "描述",
 *   "city": "城市",
 *   "address": "地址",
 *   "price_per_night": 1000,
 *   "is_booking": true,
 *   "is_swap": false,
 *   "amenities": ["Wi-Fi", "空调"]
 * }
 */
router.post('/', authenticate, (req, res) => {
  const { title, description, city, address, price_per_night, is_booking, is_swap, amenities } = req.body;

  if (!title || !city || !price_per_night) {
    return res.status(400).json({
      code: 400,
      message: '请填写必填字段：标题、城市、每晚价格'
    });
  }

  const newRoom = {
    id: mockRooms.length + 1,
    title,
    description: description || '',
    city,
    address: address || '',
    price_per_night,
    currency: 'THB',
    image_url: '',
    owner_id: req.user.userId,
    owner_name: req.user.username,
    owner_avatar: '',
    is_booking: is_booking !== false,
    is_swap: is_swap !== false,
    amenities: amenities || [],
    max_guests: 2,
    rating: 0,
    review_count: 0,
    created_at: new Date().toISOString()
  };

  mockRooms.push(newRoom);

  res.status(201).json({
    code: 200,
    message: '房源发布成功！',
    data: newRoom
  });
});

// ==================== POST /api/rooms/:id/swap ====================

/**
 * 发起房间交换（需登录）
 * 
 * 路径参数：:id — 目标房间 ID（你想换到的房间）
 * 
 * 请求体（可选）：
 * { "message": "你好，我在曼谷有一套公寓，想和你交换清迈的小木屋住一周" }
 * 
 * 交换流程：
 * 1. 用户 A 看到用户 B 的房间，发起交换请求
 * 2. 系统通知用户 B："有人想和你交换房间"
 * 3. 用户 B 查看请求，选择同意或拒绝
 * 4. 双方同意后，系统交换预订权
 */
router.post('/:id/swap', authenticate, (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const room = mockRooms.find(r => r.id === parseInt(id));

  if (!room) {
    return res.status(404).json({ code: 404, message: '房间不存在' });
  }

  if (room.owner_id === req.user.userId) {
    return res.status(400).json({ code: 400, message: '不能和自己交换房间哦~' });
  }

  if (!room.is_swap) {
    return res.status(400).json({ code: 400, message: '该房源不支持交换，请选择带交换标签的房间' });
  }

  // 模拟创建交换请求
  res.json({
    code: 200,
    message: `已向 ${room.owner_name} 发起房间交换请求！请等待对方确认。`,
    data: {
      swap_id: Math.floor(Math.random() * 10000),
      target_room: {
        id: room.id,
        title: room.title,
        city: room.city,
        owner_name: room.owner_name
      },
      from_user_id: req.user.userId,
      from_username: req.user.username,
      to_user_id: room.owner_id,
      to_username: room.owner_name,
      message: message || '你好，我想和你交换房间~',
      status: 'pending',
      created_at: new Date().toISOString()
    }
  });
});

module.exports = router;
