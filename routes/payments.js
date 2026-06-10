/**
 * routes/payments.js - Airwallex 支付路由
 *
 * 提供接口：
 *   POST /api/payments/create-airwallex  — 创建 Airwallex 支付意向
 *   POST /api/payments/airwallex-webhook — Airwallex Webhook 回调
 *   GET  /api/payments/orders           — 查询用户订单列表（需登录）
 *
 * 说明：对接 Airwallex（空中云汇）支付网关，支持泰国本地支付方式
 *       包括 PromptPay、TrueMoney、信用卡（Visa/Mastercard）、
 *       支付宝、微信支付等。
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');

// ==================== 配置 ====================
// Airwallex API 配置
const AIRWALLEX_API_KEY = process.env.AIRWALLEX_API_KEY || '';
const AIRWALLEX_CLIENT_ID = process.env.AIRWALLEX_CLIENT_ID || '';
const AIRWALLEX_WEBHOOK_SECRET = process.env.AIRWALLEX_WEBHOOK_SECRET || '';
// env: 'demo' 为测试环境，'prod' 为生产环境
const AIRWALLEX_ENV = process.env.AIRWALLEX_ENV || 'demo';

// Airwallex API 基础 URL
const AIRWALLEX_BASE_URL = AIRWALLEX_ENV === 'prod'
  ? 'https://api.airwallex.com'
  : 'https://demo-api.airwallex.com';

// ==================== 模拟订单数据库（内存） ====================
// 后续替换为 PostgreSQL 查询（payment_orders 表）
const mockOrders = [
  {
    id: 1,
    order_no: 'PAY20260701001',
    user_id: 1,
    event_id: 1,
    event_title: '曼谷水上市场一日游',
    amount: 1200.00,
    currency: 'THB',
    status: 'paid',
    payment_method: 'PromptPay',
    airwallex_payment_intent_id: null,
    paid_at: '2026-07-01T10:30:00+07:00',
    created_at: '2026-07-01T10:25:00+07:00',
  },
];

// ==================== 工具函数 ====================

/**
 * 生成 Airwallex API 访问令牌
 * 使用 API Key + Client ID 获取 Bearer Token
 */
async function getAirwallexToken() {
  try {
    const response = await axios.post(
      `${AIRWALLEX_BASE_URL}/api/v1/authentication/login`,
      {},
      {
        headers: {
          'x-api-key': AIRWALLEX_API_KEY,
          'x-client-id': AIRWALLEX_CLIENT_ID,
        },
      }
    );
    return response.data.token;
  } catch (err) {
    console.error('❌ 获取 Airwallex Token 失败:', err.response?.data || err.message);
    throw new Error('Airwallex 认证失败');
  }
}

/**
 * 生成唯一订单号
 * 格式：PAY + 日期(YYYYMMDD) + 4位随机数
 */
function generateOrderNo() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = String(Math.floor(Math.random() * 9000) + 1000);
  return `PAY${dateStr}${random}`;
}

// ==================== POST /api/payments/create-airwallex ====================
/**
 * 创建 Airwallex 支付意向接口（需登录）
 *
 * Request Body:
 *   - event_id: 活动ID
 *   - amount: 支付金额（泰铢）
 *   - payment_method: 支付方式（可选）
 *     'promptpay' | 'truemoney' | 'card' | 'alipay' | 'wechatpay'
 *
 * Response:
 *   - client_secret: 用于前端 Airwallex Elements SDK 确认支付
 *   - payment_intent_id: Airwallex 支付意向 ID
 *   - order_no: 内部订单号
 *   - amount: 支付金额
 *   - currency: 货币代码（THB）
 */
router.post('/create-airwallex', auth, async (req, res) => {
  try {
    const { event_id, amount, payment_method } = req.body;

    // --- 参数校验 ---
    if (!event_id || !amount) {
      return res.status(400).json({ error: '活动ID和金额为必填项' });
    }
    if (amount <= 0) {
      return res.status(400).json({ error: '支付金额必须大于 0' });
    }

    // --- 生成内部订单号 ---
    const orderNo = generateOrderNo();

    // --- 获取 Airwallex 访问令牌 ---
    const token = await getAirwallexToken();

    // --- 创建 Airwallex 支付意向 (Payment Intent) ---
    // Payment Intent 是 Airwallex 支付流程的核心对象
    const paymentIntentData = {
      amount: parseFloat(amount),
      currency: 'THB', // 泰国泰铢
      merchant_order_id: orderNo, // 关联内部订单号
      descriptor: `ThaiGo 活动报名 #${event_id}`,
      metadata: {
        event_id: String(event_id),
        user_id: String(req.user.id),
      },
    };

    // 如果指定了支付方式，添加到请求中
    // 注意：Airwallex 支持在创建 Payment Intent 时指定 preferred_payment_method
    if (payment_method) {
      // 映射前端支付方式到 Airwallex 支付方式代码
      const methodMap = {
        'promptpay': 'promptpay',
        'truemoney': 'truemoney',
        'card': 'card',
        'alipay': 'alipay',
        'wechatpay': 'wechatpay',
      };
      const airwallexMethod = methodMap[payment_method];
      if (airwallexMethod) {
        paymentIntentData.preferred_payment_method = airwallexMethod;
      }
    }

    const createIntentResponse = await axios.post(
      `${AIRWALLEX_BASE_URL}/api/v1/pa/payment_intents/create`,
      paymentIntentData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const paymentIntent = createIntentResponse.data;

    // --- 保存订单到内存数据库 ---
    const newOrder = {
      id: mockOrders.length + 1,
      order_no: orderNo,
      user_id: req.user.id,
      event_id,
      event_title: `活动 #${event_id}`,
      amount: parseFloat(amount),
      currency: 'THB',
      status: 'pending',
      payment_method: payment_method || 'auto',
      airwallex_payment_intent_id: paymentIntent.id,
      paid_at: null,
      created_at: new Date().toISOString(),
    };
    mockOrders.push(newOrder);

    console.log(`✅ Airwallex 支付意向已创建 — 订单号: ${orderNo}, 意向ID: ${paymentIntent.id}`);

    // --- 返回给前端 ---
    // client_secret 是前端 Airwallex Elements SDK 确认支付所需的关键凭证
    res.status(201).json({
      success: true,
      message: '支付意向已创建',
      data: {
        order_no: orderNo,
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: parseFloat(amount),
        currency: 'THB',
        // 订单过期时间（1小时后）
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (err) {
    console.error('❌ 创建 Airwallex 支付意向失败:', err.response?.data || err.message);
    res.status(500).json({
      error: '创建支付意向失败',
      details: err.response?.data || err.message,
    });
  }
});

// ==================== POST /api/payments/airwallex-webhook ====================
/**
 * Airwallex Webhook 回调接口
 *
 * Airwallex 会在支付状态变更时（如支付成功、失败、过期等）
 * 异步调用此接口通知后端更新订单状态。
 *
 * 支持的 Webhook 事件：
 *   - payment_intent.status_changed — 支付意向状态变更
 *   - payment_attempt.status_changed — 支付尝试状态变更
 *
 * Request Headers:
 *   - x-signature: Webhook 签名（用于验证请求真实性）
 *
 * Request Body:
 *   - event_type: 事件类型
 *   - data: 事件数据（包含 payment_intent 信息）
 */
router.post('/airwallex-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // --- 验证 Webhook 签名 ---
    // 生产环境必须验证签名，确保请求来自 Airwallex
    const signature = req.headers['x-signature'];
    if (AIRWALLEX_WEBHOOK_SECRET && signature) {
      // TODO: 实现签名验证逻辑
      // 参考 Airwallex 文档：https://www.airwallex.com/docs/api/webhooks
      console.log('🔔 Webhook 签名验证（待实现）');
    } else {
      console.log('⚠️  未配置 Webhook Secret 或请求无签名（测试模式）');
    }

    // --- 解析 Webhook 数据 ---
    const webhookData = JSON.parse(req.body.toString());
    const eventType = webhookData.event_type;
    const eventData = webhookData.data;

    console.log(`🔔 收到 Airwallex Webhook: ${eventType}`);

    // --- 处理支付意向状态变更 ---
    if (eventType === 'payment_intent.status_changed') {
      const paymentIntent = eventData.payment_intent || eventData;
      const paymentIntentId = paymentIntent.id;
      const newStatus = paymentIntent.status;

      // 查找关联的订单（通过 airwallex_payment_intent_id）
      const order = mockOrders.find(o => o.airwallex_payment_intent_id === paymentIntentId);

      if (!order) {
        console.warn(`⚠️  未找到关联的订单 — PaymentIntent ID: ${paymentIntentId}`);
        return res.json({ success: true, message: '订单未找到，已记录' });
      }

      // 更新订单状态
      if (newStatus === 'SUCCEEDED') {
        order.status = 'paid';
        order.paid_at = new Date().toISOString();
        console.log(`✅ 支付成功 — 订单号: ${order.order_no}, PaymentIntent: ${paymentIntentId}`);
      } else if (newStatus === 'FAILED') {
        order.status = 'failed';
        console.log(`❌ 支付失败 — 订单号: ${order.order_no}`);
      } else if (newStatus === 'CANCELLED') {
        order.status = 'cancelled';
        console.log(`🚫 支付已取消 — 订单号: ${order.order_no}`);
      } else if (newStatus === 'REQUIRES_PAYMENT_METHOD') {
        order.status = 'pending';
        console.log(`⏳ 等待支付方式 — 订单号: ${order.order_no}`);
      }
    }

    // --- 返回 200 OK 给 Airwallex ---
    // 必须在 5 秒内返回 200，否则 Airwallex 会重试
    res.json({ success: true, message: 'Webhook 处理成功' });
  } catch (err) {
    console.error('❌ 处理 Airwallex Webhook 失败:', err.message);
    // 返回 200 避免 Airwallex 无限重试，但记录错误
    res.json({ success: false, message: 'Webhook 处理失败，但已记录' });
  }
});

// ==================== GET /api/payments/orders ====================
/**
 * 查询用户订单列表（需登录）
 *
 * Query 参数（可选）:
 *   - status: 按状态筛选（pending/paid/failed/cancelled）
 *   - page: 页码（默认 1）
 *   - limit: 每页数量（默认 10）
 */
router.get('/orders', auth, (req, res) => {
  try {
    let { status, page = 1, limit = 10 } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    // 筛选当前用户的订单
    let filtered = mockOrders.filter(o => o.user_id === req.user.id);

    if (status) {
      filtered = filtered.filter(o => o.status === status);
    }

    // 按时间倒序
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

module.exports = router;
