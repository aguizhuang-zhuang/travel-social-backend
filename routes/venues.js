/**
 * routes/venues.js - 活动场地路由
 *
 * 提供接口：
 *   GET /api/venues     — 场地列表（支持城市筛选、类型筛选）
 *   GET /api/venues/:id — 场地详情
 *
 * 模拟泰国热门活动场地数据。
 */

const express = require('express');
const router = express.Router();

// ==================== 模拟场地数据库（内存） ====================
// 后续替换为 PostgreSQL 查询（venues 表）
const mockVenues = [
  {
    id: 1,
    name: '曼谷素坤逸共享空间 The Hive',
    description: '位于曼谷通罗区的潮流共享空间，适合举办工作坊、分享会和社交聚会。配备投影仪、白板、高速WiFi，可容纳30人。',
    type: '室内',
    city: '曼谷',
    address: 'Sukhumvit Soi 49, Khlong Tan Nuea, Watthana, Bangkok 10110',
    capacity: 30,
    price_per_hour: 500.00,
    price_per_day: 3500.00,
    currency: 'THB',
    amenities: ['WiFi', '投影仪', '白板', '空调', '茶水间'],
    images: [
      'https://example.com/images/hive-bangkok-1.jpg',
      'https://example.com/images/hive-bangkok-2.jpg',
    ],
    rating: 4.5,
    review_count: 128,
    status: 'active',
  },
  {
    id: 2,
    name: '清迈古城兰纳庄园',
    description: '传统兰纳风格庄园，被热带花园环绕，有一个开阔的庭院。非常适合举办泰式烹饪课、瑜伽静修和户外晚餐派对。',
    type: '户外',
    city: '清迈',
    address: '123 Ratchadamnoen Rd, Si Phum, Mueang Chiang Mai, Chiang Mai 50200',
    capacity: 50,
    price_per_hour: 800.00,
    price_per_day: 5000.00,
    currency: 'THB',
    amenities: ['花园', '停车场', '厨房', '音响设备', '户外座椅'],
    images: [
      'https://example.com/images/lanna-estate-1.jpg',
      'https://example.com/images/lanna-estate-2.jpg',
    ],
    rating: 4.8,
    review_count: 95,
    status: 'active',
  },
  {
    id: 3,
    title: '普吉岛卡塔海滩度假村',
    description: '面朝安达曼海的度假村多功能厅，拥有私人沙滩通道。适合举办日落派对、团队建设活动和婚礼庆典。',
    type: '度假村',
    city: '普吉岛',
    address: '456 Kata Rd, Karon, Mueang Phuket, Phuket 83100',
    capacity: 80,
    price_per_hour: 2000.00,
    price_per_day: 12000.00,
    currency: 'THB',
    amenities: ['海景', '游泳池', '音响系统', '自助餐区', '停车位', '舞台'],
    images: [
      'https://example.com/images/kata-resort-1.jpg',
      'https://example.com/images/kata-resort-2.jpg',
    ],
    rating: 4.7,
    review_count: 213,
    status: 'active',
  },
  {
    id: 4,
    name: '芭提雅海滩俱乐部',
    description: '坐落在中天海滩的现代化海滩俱乐部，设有露天泳池和DJ台。是举办泳池派对、电音活动和社交晚会的理想场所。',
    type: '俱乐部',
    city: '芭提雅',
    address: '789 Jomtien Beach Rd, Na Jomtien, Sattahip, Chon Buri 20250',
    capacity: 150,
    price_per_hour: 3000.00,
    price_per_day: 20000.00,
    currency: 'THB',
    amenities: ['DJ台', '泳池', '酒吧', '舞池', 'VIP区', '停车场'],
    images: [
      'https://example.com/images/beach-club-1.jpg',
      'https://example.com/images/beach-club-2.jpg',
    ],
    rating: 4.3,
    review_count: 67,
    status: 'active',
  },
  {
    id: 5,
    name: '大城府河畔咖啡馆',
    description: '位于湄南河畔的文艺咖啡馆，二楼有一个独立活动空间。适合举办小型读书会、摄影展和文化交流活动，可眺望古寺佛塔。',
    type: '咖啡馆',
    city: '大城府',
    address: '55 U Thong Rd, Ho Rattanachai, Phra Nakhon Si Ayutthaya 13000',
    capacity: 20,
    price_per_hour: 300.00,
    price_per_day: 2000.00,
    currency: 'THB',
    amenities: ['WiFi', '投影仪', '咖啡吧', '河景观景台', '空调'],
    images: [
      'https://example.com/images/riverside-cafe-1.jpg',
      'https://example.com/images/riverside-cafe-2.jpg',
    ],
    rating: 4.6,
    review_count: 43,
    status: 'active',
  },
];

// ==================== GET /api/venues ====================
/**
 * 场地列表接口
 * Query 参数（可选）:
 *   city — 按城市筛选
 *   type — 按类型筛选（室内、户外、度假村、俱乐部、咖啡馆）
 *   page — 页码，默认 1
 *   limit — 每页数量，默认 10
 */
router.get('/', (req, res) => {
  try {
    let { city, type, page = 1, limit = 10 } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    let filtered = mockVenues;

    // 按城市筛选
    if (city) {
      filtered = filtered.filter(
        v => v.city.toLowerCase() === city.toLowerCase()
      );
    }

    // 按类型筛选
    if (type) {
      filtered = filtered.filter(
        v => v.type.toLowerCase() === type.toLowerCase()
      );
    }

    // 按评分降序排列
    filtered.sort((a, b) => b.rating - a.rating);

    // 分页计算
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
    });
  } catch (err) {
    res.status(500).json({ error: '获取场地列表失败' });
  }
});

// ==================== GET /api/venues/:id ====================
/**
 * 场地详情接口
 */
router.get('/:id', (req, res) => {
  try {
    const venue = mockVenues.find(v => v.id === parseInt(req.params.id, 10));
    if (!venue) {
      return res.status(404).json({ error: '场地不存在' });
    }
    res.json({ success: true, data: venue });
  } catch (err) {
    res.status(500).json({ error: '获取场地详情失败' });
  }
});

module.exports = router;
