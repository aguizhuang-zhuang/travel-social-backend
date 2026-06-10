/**
 * routes/events.js - 社交活动路由
 *
 * 提供接口：
 *   GET  /api/events          — 活动列表（支持分页、城市筛选）
 *   GET  /api/events/:id      — 活动详情
 *   POST /api/events          — 发布活动（需登录）
 *   POST /api/events/:id/join — 报名参加活动（需登录）
 *
 * 当前阶段返回泰国的模拟活动数据。
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// ==================== 模拟活动数据库（内存） ====================
// 后续替换为 PostgreSQL 查询（events 表）
const mockEvents = [
  {
    id: 1,
    title: '曼谷水上市场一日游',
    description: '探索曼谷最著名的丹嫩沙多水上市场，体验泰国传统水上交易文化，品尝地道船面和各种热带水果。上午乘船游览，下午自由拍照。',
    category: '观光',
    city: '曼谷',
    location: '丹嫩沙多水上市场（Damnoen Saduak Floating Market）',
    start_time: '2026-07-10T08:00:00+07:00',
    end_time: '2026-07-10T17:00:00+07:00',
    max_participants: 20,
    current_participants: 12,
    price: 1200.00,
    currency: 'THB',
    organizer_id: 1,
    organizer_name: 'traveler_somchai',
    cover_image: 'https://example.com/images/damnoen-saduak.jpg',
    tags: ['水上市场', '美食', '文化', '拍照'],
    status: 'published',
    created_at: '2026-06-01T10:00:00+07:00',
  },
  {
    id: 2,
    title: '清迈素贴山徒步 & 双龙寺祈福',
    description: '从清迈古城出发，徒步攀登素贴山，俯瞰清迈全景。终点为著名的双龙寺（Wat Phra That Doi Suthep），可参与祈福仪式，感受兰纳佛教文化。',
    category: '户外',
    city: '清迈',
    location: '素贴山-双龙寺（Doi Suthep）',
    start_time: '2026-07-15T06:30:00+07:00',
    end_time: '2026-07-15T14:00:00+07:00',
    max_participants: 15,
    current_participants: 8,
    price: 500.00,
    currency: 'THB',
    organizer_id: 2,
    organizer_name: 'bangkok_plam',
    cover_image: 'https://example.com/images/doi-suthep.jpg',
    tags: ['徒步', '寺庙', '山景', '文化'],
    status: 'published',
    created_at: '2026-06-03T14:00:00+07:00',
  },
  {
    id: 3,
    title: '普吉岛日落海滩瑜伽 & BBQ派对',
    description: '在卡塔海滩享受日落瑜伽课程（适合所有水平），随后在海滩边举办BBQ烧烤派对，结交来自世界各地的旅行者。',
    category: '运动',
    city: '普吉岛',
    location: '卡塔海滩（Kata Beach）',
    start_time: '2026-07-20T16:00:00+07:00',
    end_time: '2026-07-20T22:00:00+07:00',
    max_participants: 30,
    current_participants: 21,
    price: 800.00,
    currency: 'THB',
    organizer_id: 1,
    organizer_name: 'traveler_somchai',
    cover_image: 'https://example.com/images/kata-beach.jpg',
    tags: ['瑜伽', '海滩', 'BBQ', '社交'],
    status: 'published',
    created_at: '2026-06-05T09:00:00+07:00',
  },
  {
    id: 4,
    title: '芭提雅珊瑚岛浮潜探险',
    description: '乘快艇前往珊瑚岛（Koh Larn），在清澈见底的海水中浮潜，观赏五彩斑斓的珊瑚礁和热带鱼群。包含午餐和浮潜装备。',
    category: '水上运动',
    city: '芭提雅',
    location: '珊瑚岛（Koh Larn）',
    start_time: '2026-07-25T07:00:00+07:00',
    end_time: '2026-07-25T16:00:00+07:00',
    max_participants: 25,
    current_participants: 25,
    price: 1500.00,
    currency: 'THB',
    organizer_id: 2,
    organizer_name: 'bangkok_plam',
    cover_image: 'https://example.com/images/koh-larn.jpg',
    tags: ['浮潜', '海岛', '水上运动'],
    status: 'published',
    created_at: '2026-06-08T11:00:00+07:00',
  },
  {
    id: 5,
    title: '大城府世界遗产骑行之旅',
    description: '骑自行车穿越被联合国教科文组织列为世界遗产的大城府历史公园，探访玛哈泰寺的树抱佛头、拉嘉布拉纳寺等古迹。',
    category: '文化',
    city: '大城府',
    location: '大城历史公园（Ayutthaya Historical Park）',
    start_time: '2026-08-01T09:00:00+07:00',
    end_time: '2026-08-01T17:00:00+07:00',
    max_participants: 12,
    current_participants: 5,
    price: 900.00,
    currency: 'THB',
    organizer_id: 1,
    organizer_name: 'traveler_somchai',
    cover_image: 'https://example.com/images/ayutthaya.jpg',
    tags: ['骑行', '世界遗产', '古迹', '文化'],
    status: 'published',
    created_at: '2026-06-10T13:00:00+07:00',
  },
];

// ==================== GET /api/events ====================
/**
 * 活动列表接口
 * Query 参数（可选）:
 *   city   — 按城市筛选（曼谷、清迈、普吉岛、芭提雅、大城府）
 *   page   — 页码，默认 1
 *   limit  — 每页数量，默认 10
 * 返回: 分页后的活动列表
 */
router.get('/', (req, res) => {
  try {
    let { city, page = 1, limit = 10 } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    // 按城市筛选
    let filtered = mockEvents;
    if (city) {
      filtered = mockEvents.filter(
        e => e.city.toLowerCase() === city.toLowerCase()
      );
    }

    // 按创建时间倒序排列（最新的在前）
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 分页计算
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (err) {
    res.status(500).json({ error: '获取活动列表失败' });
  }
});

// ==================== GET /api/events/:id ====================
/**
 * 活动详情接口
 * 返回: 单个活动的完整信息
 */
router.get('/:id', (req, res) => {
  try {
    const event = mockEvents.find(e => e.id === parseInt(req.params.id, 10));
    if (!event) {
      return res.status(404).json({ error: '活动不存在或已下架' });
    }
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ error: '获取活动详情失败' });
  }
});

// ==================== POST /api/events ====================
/**
 * 发布活动接口（需登录）
 * Body: { title, description, category, city, location, start_time, end_time, max_participants, price, tags }
 * 返回: 新创建的活动
 */
router.post('/', auth, (req, res) => {
  try {
    const {
      title,
      description,
      category = '其他',
      city,
      location,
      start_time,
      end_time,
      max_participants = 20,
      price = 0,
      tags = [],
    } = req.body;

    // --- 必填校验 ---
    if (!title || !description || !city || !location || !start_time || !end_time) {
      return res.status(400).json({
        error: '标题、描述、城市、地点、开始时间和结束时间为必填项',
      });
    }

    // --- 模拟保存（后续替换为 INSERT INTO events...） ---
    const newEvent = {
      id: mockEvents.length + 1,
      title,
      description,
      category,
      city,
      location,
      start_time,
      end_time,
      max_participants,
      current_participants: 0,
      price,
      currency: 'THB',
      organizer_id: req.user.id,
      organizer_name: req.user.username,
      cover_image: req.body.cover_image || null,
      tags,
      status: 'published',
      created_at: new Date().toISOString(),
    };
    mockEvents.push(newEvent);

    res.status(201).json({
      success: true,
      message: '活动发布成功！',
      data: newEvent,
    });
  } catch (err) {
    res.status(500).json({ error: '发布活动失败' });
  }
});

// ==================== POST /api/events/:id/join ====================
/**
 * 报名参加活动接口（需登录）
 * 返回: 报名确认信息
 */
router.post('/:id/join', auth, (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const event = mockEvents.find(e => e.id === eventId);

    if (!event) {
      return res.status(404).json({ error: '活动不存在' });
    }

    // 检查是否已满员
    if (event.current_participants >= event.max_participants) {
      return res.status(400).json({ error: '该活动已满员，无法报名' });
    }

    // 模拟报名：增加当前参与人数
    event.current_participants += 1;

    res.json({
      success: true,
      message: `报名成功！您已加入「${event.title}」`,
      data: {
        event_id: event.id,
        event_title: event.title,
        user_id: req.user.id,
        user_name: req.user.username,
        joined_at: new Date().toISOString(),
        remaining_spots: event.max_participants - event.current_participants,
      },
    });
  } catch (err) {
    res.status(500).json({ error: '报名失败' });
  }
});

module.exports = router;
