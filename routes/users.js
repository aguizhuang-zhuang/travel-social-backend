/**
 * routes/users.js — 用户路由
 * 
 * 功能：
 * - GET  /api/users/nearby        附近用户（地图模式）
 * - GET  /api/users/:id           用户详情
 * - PUT  /api/users/profile       编辑个人资料（需登录）
 * - POST /api/users/:id/follow    关注用户
 * - GET  /api/users/me/matches    匹配列表
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// ==================== GET /api/users/nearby ====================

/**
 * 附近用户接口（地图模式核心API）
 * 
 * 请求参数（Query String）：
 * - lat: 当前纬度（必填），例如 13.7563（曼谷）
 * - lng: 当前经度（必填），例如 100.5018
 * - radius: 搜索半径（公里），默认 10
 * - limit: 返回数量，默认 20
 * 
 * 使用场景：前端地图组件根据用户位置展示附近的 ThaiGo 用户
 */
router.get('/nearby', (req, res) => {
  const { lat, lng, radius = 10, limit = 20 } = req.query;

  // 参数校验
  if (!lat || !lng) {
    return res.status(400).json({
      code: 400,
      message: '请提供经纬度参数：lat（纬度）、lng（经度）'
    });
  }

  // ===== 模拟数据：曼谷及周边用户 =====
  const nearbyUsers = [
    {
      id: 101,
      username: 'Somchai',
      avatar: '',
      location: '曼谷·素坤逸',
      distance_km: 0.3,
      bio: '本地导游，带你探索曼谷隐藏美食',
      interests: ['美食', '寺庙', '夜市'],
      is_online: true,
      credit_score: 98
    },
    {
      id: 102,
      username: 'Nattaya',
      avatar: '',
      location: '曼谷·暹罗广场',
      distance_km: 1.2,
      bio: '喜欢逛街和拍照，周末常去乍都乍市场',
      interests: ['购物', '摄影', '咖啡'],
      is_online: true,
      credit_score: 95
    },
    {
      id: 103,
      username: 'Pairote',
      avatar: '',
      location: '曼谷·是隆',
      distance_km: 2.5,
      bio: '泰拳爱好者，每周三次训练',
      interests: ['泰拳', '健身', '潜水'],
      is_online: false,
      credit_score: 92
    },
    {
      id: 104,
      username: 'Arisa',
      avatar: '',
      location: '曼谷·通罗',
      distance_km: 3.1,
      bio: '自由插画师，在清迈和曼谷两边跑',
      interests: ['艺术', '咖啡', '瑜伽'],
      is_online: true,
      credit_score: 97
    },
    {
      id: 105,
      username: 'Chatchai',
      avatar: '',
      location: '曼谷·考山路',
      distance_km: 4.8,
      bio: '背包客，刚从拜县回来，下一站普吉',
      interests: ['背包旅行', '潜水', '音乐'],
      is_online: true,
      credit_score: 88
    },
    {
      id: 106,
      username: 'Malinee',
      avatar: '',
      location: '暖武里',
      distance_km: 7.2,
      bio: '泰国传统舞蹈老师，也会做泰式料理',
      interests: ['舞蹈', '料理', '传统文化'],
      is_online: false,
      credit_score: 99
    }
  ];

  // 按距离排序（实际项目用 PostgreSQL earthdistance）
  const sorted = nearbyUsers
    .filter(u => u.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit);

  res.json({
    code: 200,
    message: '查询成功',
    data: {
      users: sorted,
      total: sorted.length,
      center: { lat: parseFloat(lat), lng: parseFloat(lng) }
    }
  });
});

// ==================== GET /api/users/:id ====================

/**
 * 用户详情接口
 * 路径参数：:id — 用户ID
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const userDetail = {
    id: parseInt(id),
    username: 'Somchai',
    email: 'somchai@example.com',
    avatar: '',
    location: '曼谷·素坤逸',
    bio: '本地导游，带你探索曼谷隐藏美食。会说泰语、英语和一点中文。',
    interests: ['美食', '寺庙', '夜市', '潜水'],
    role: 'user',
    credit_score: 98,
    stats: {
      events_hosted: 12,    // 发起的活动数
      events_joined: 35,    // 参加的活动数
      followers: 128,       // 粉丝数
      following: 56         // 关注数
    },
    created_at: '2024-06-15T08:00:00Z'
  };

  res.json({
    code: 200,
    data: userDetail
  });
});

// ==================== PUT /api/users/profile ====================

/**
 * 编辑个人资料（需要登录）
 * 请求体：{ bio, location, interests, avatar }
 */
router.put('/profile', authenticate, (req, res) => {
  const { bio, location, interests, avatar } = req.body;

  res.json({
    code: 200,
    message: '个人资料更新成功',
    data: {
      userId: req.user.userId,
      bio: bio || '热爱泰国旅行~',
      location: location || '曼谷',
      interests: interests || [],
      avatar: avatar || ''
    }
  });
});

// ==================== GET /api/users/me/matches ====================

/**
 * 匹配列表（需要登录）
 * 返回与当前用户兴趣匹配的其他用户
 */
router.get('/me/matches', authenticate, (req, res) => {
  const matches = [
    { id: 201, username: 'Ploy', match_score: 95, common_interests: ['潜水', '美食'], location: '普吉岛' },
    { id: 202, username: 'Tanawat', match_score: 88, common_interests: ['泰拳', '健身'], location: '清迈' },
    { id: 203, username: 'Siriporn', match_score: 82, common_interests: ['咖啡', '摄影'], location: '曼谷' }
  ];

  res.json({
    code: 200,
    data: { matches, total: matches.length }
  });
});

module.exports = router;
