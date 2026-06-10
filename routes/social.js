/**
 * routes/social.js — 社交动态路由
 * 
 * 功能：
 * - POST /api/social/feed        发布动态
 * - GET  /api/social/feed        动态流（时间线）
 * - POST /api/social/feed/:id/like   点赞
 * - POST /api/social/feed/:id/comment 评论
 */

const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');

// ==================== 模拟动态数据 ====================

const mockFeeds = [
  {
    id: 1,
    user_id: 101,
    username: 'Somchai',
    avatar: '',
    content: '昨天满月派对太疯狂了！🔥 认识了好多来自世界各地的朋友。帕岸岛的日出永远不会让人失望。',
    images: [],
    location: '帕岸岛·哈林海滩',
    tags: ['满月派对', '帕岸岛', '电音'],
    like_count: 128,
    comment_count: 23,
    is_liked: false,
    created_at: '2026-06-08T06:30:00+07:00',
    comments: [
      { id: 1, username: 'Nattaya', content: '好羡慕！下次一定要去~', created_at: '2026-06-08T07:00:00+07:00' },
      { id: 2, username: 'Chatchai', content: '我下周也去！有什么注意事项吗？', created_at: '2026-06-08T08:15:00+07:00' }
    ]
  },
  {
    id: 2,
    user_id: 102,
    username: 'Nattaya',
    avatar: '',
    content: '清迈水灯节倒计时！🏮 已经开始准备水灯了。今年打算用香蕉叶和鲜花做传统兰纳风格的水灯。有人想一起吗？',
    images: [],
    location: '清迈·古城',
    tags: ['水灯节', '清迈', '兰纳文化'],
    like_count: 256,
    comment_count: 45,
    is_liked: true,
    created_at: '2026-06-08T20:00:00+07:00',
    comments: [
      { id: 3, username: 'Malinee', content: '可以教我做吗？我手残党…', created_at: '2026-06-08T20:30:00+07:00' }
    ]
  },
  {
    id: 3,
    user_id: 103,
    username: 'Pairote',
    avatar: '',
    content: '今日泰拳训练打卡 💪🥊 教练说我进步很快，再过两个月就可以参加业余比赛了！喜欢泰拳的朋友约起来~',
    images: [],
    location: '曼谷·Fairtex 拳馆',
    tags: ['泰拳', '健身', '曼谷'],
    like_count: 89,
    comment_count: 12,
    is_liked: false,
    created_at: '2026-06-09T07:00:00+07:00',
    comments: []
  },
  {
    id: 4,
    user_id: 104,
    username: 'Arisa',
    avatar: '',
    content: '在拜县找到了这家隐藏在山谷里的咖啡馆，View 无敌。咖啡豆是本地种植的阿拉比卡，手冲只要 60 铢。这才是清迈慢生活该有的样子。☕️⛰️',
    images: [],
    location: '清迈·拜县',
    tags: ['咖啡', '拜县', '慢生活'],
    like_count: 342,
    comment_count: 56,
    is_liked: false,
    created_at: '2026-06-09T10:00:00+07:00',
    comments: [
      { id: 4, username: 'Somchai', content: '求地址！下周正好去拜县', created_at: '2026-06-09T10:30:00+07:00' }
    ]
  },
  {
    id: 5,
    user_id: 105,
    username: 'Chatchai',
    avatar: '',
    content: '普吉潜水第三天，终于看到了鲸鲨！！🦈 体长大概 5 米，就在身边游过的那一刻，感觉整个人都被治愈了。潜水真的是会上瘾的。',
    images: [],
    location: '普吉·斯米兰群岛',
    tags: ['潜水', '普吉', '鲸鲨'],
    like_count: 567,
    comment_count: 89,
    is_liked: true,
    created_at: '2026-06-09T15:00:00+07:00',
    comments: [
      { id: 5, username: 'Pairote', content: '太酷了！斯米兰果然名不虚传', created_at: '2026-06-09T15:10:00+07:00' },
      { id: 6, username: 'Arisa', content: '鲸鲨！！好幸运！', created_at: '2026-06-09T15:20:00+07:00' }
    ]
  }
];

// ==================== GET /api/social/feed ====================

/**
 * 动态流接口
 * 
 * 查询参数：
 * - sort: 排序方式
 *   - 'latest'（默认）= 最新
 *   - 'hot' = 最热（按点赞数排序）
 * - page, limit: 分页
 * 
 * 返回时间线动态，包含评论预览和点赞状态
 */
router.get('/feed', optionalAuth, (req, res) => {
  const { sort = 'latest', page = 1, limit = 10 } = req.query;

  let sorted = [...mockFeeds];

  // 排序
  if (sort === 'hot') {
    sorted.sort((a, b) => b.like_count - a.like_count);
  } else {
    // 默认按时间降序
    sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // 分页
  const start = (page - 1) * limit;
  const paged = sorted.slice(start, start + parseInt(limit));

  res.json({
    code: 200,
    message: '查询成功',
    data: {
      feeds: paged,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sorted.length,
        total_pages: Math.ceil(sorted.length / limit)
      }
    }
  });
});

// ==================== POST /api/social/feed ====================

/**
 * 发布动态（需要登录）
 * 
 * 请求体：
 * {
 *   "content": "动态文字内容",
 *   "images": ["图片URL1", "图片URL2"],  // 可选
 *   "location": "曼谷",                  // 可选
 *   "tags": ["标签1", "标签2"]           // 可选
 * }
 */
router.post('/feed', authenticate, (req, res) => {
  const { content, images = [], location = '', tags = [] } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      code: 400,
      message: '请输入动态内容'
    });
  }

  const newFeed = {
    id: mockFeeds.length + 1,
    user_id: req.user.userId,
    username: req.user.username,
    avatar: '',
    content,
    images,
    location,
    tags,
    like_count: 0,
    comment_count: 0,
    is_liked: false,
    created_at: new Date().toISOString(),
    comments: []
  };

  mockFeeds.unshift(newFeed);

  res.status(201).json({
    code: 200,
    message: '发布成功！',
    data: newFeed
  });
});

// ==================== POST /api/social/feed/:id/like ====================

/**
 * 点赞/取消点赞（需要登录）
 * 同一个用户对同一条动态只能点赞一次，再次请求则取消点赞
 */
router.post('/feed/:id/like', authenticate, (req, res) => {
  const { id } = req.params;
  const feed = mockFeeds.find(f => f.id === parseInt(id));

  if (!feed) {
    return res.status(404).json({ code: 404, message: '动态不存在' });
  }

  // 切换点赞状态
  feed.is_liked = !feed.is_liked;
  feed.like_count += feed.is_liked ? 1 : -1;

  res.json({
    code: 200,
    message: feed.is_liked ? '已点赞' : '已取消点赞',
    data: {
      feed_id: feed.id,
      is_liked: feed.is_liked,
      like_count: feed.like_count
    }
  });
});

// ==================== POST /api/social/feed/:id/comment ====================

/**
 * 发表评论（需要登录）
 * 
 * 请求体：{ "content": "评论内容" }
 */
router.post('/feed/:id/comment', authenticate, (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const feed = mockFeeds.find(f => f.id === parseInt(id));

  if (!feed) {
    return res.status(404).json({ code: 404, message: '动态不存在' });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ code: 400, message: '请输入评论内容' });
  }

  const newComment = {
    id: Date.now(),
    username: req.user.username,
    content,
    created_at: new Date().toISOString()
  };

  feed.comments.push(newComment);
  feed.comment_count += 1;

  res.status(201).json({
    code: 200,
    message: '评论成功',
    data: newComment
  });
});

module.exports = router;
