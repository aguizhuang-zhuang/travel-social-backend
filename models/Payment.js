/**
 * models/Payment.js — 支付记录数据模型
 * 
 * 支付系统：对接 Stripe（国际支付）/ PromptPay（泰国本地支付）。
 * 当前阶段使用模拟数据，预留 Stripe SDK 接口。
 * 
 * 支付流程：
 * 1. 前端调用 POST /api/payments/create 创建支付订单
 * 2. 服务端调用 Stripe API 生成 PaymentIntent
 * 3. 返回 client_secret 给前端
 * 4. 前端用 Stripe.js 完成支付
 * 5. Stripe 回调 Webhook 通知服务端支付结果
 */

const { query } = require('../config/db');

const Payment = {
  /**
   * 创建支付记录
   * @param {Object} data - { user_id, amount, currency, order_type, order_id, payment_method }
   */
  async create(data) {
    const sql = `
      INSERT INTO payments (
        user_id, amount, currency, order_type, order_id,
        payment_method, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
      RETURNING *
    `;
    const { rows } = await query(sql, [
      data.user_id,
      data.amount,
      data.currency || 'THB',
      data.order_type,    // event / room / venue
      data.order_id,
      data.payment_method || 'stripe'
    ]);
    return rows[0];
  },

  /**
   * 更新支付状态（Webhook 回调时使用）
   */
  async updateStatus(paymentId, status, transactionId) {
    const sql = `
      UPDATE payments 
      SET status = $1, transaction_id = $2, paid_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const { rows } = await query(sql, [status, transactionId, paymentId]);
    return rows[0];
  },

  /**
   * 查询用户的支付记录
   */
  async findByUser(userId, limit = 20) {
    const sql = `
      SELECT * FROM payments 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const { rows } = await query(sql, [userId, limit]);
    return rows;
  }
};

module.exports = Payment;
