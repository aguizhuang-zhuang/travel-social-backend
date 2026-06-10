---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 7d395b20cdca3f2cd2553a20e274d224_24d0e77d63dc11f18383525400d9a7a1
    ReservedCode1: LS+Fuvt4Pz9MBkmg4S4mPiipBgSTYj6lfmRW2CKTrE3yGnBV8Ig5mN31gu3a/pGpAc/sXYAskSMsA+0klfUukoRLhPMR4II+JbQynENxmOznaml8Ms94LEiez5ecQZ6xIA6+eAZ7DEbVAuZxP96GCahN9gHa1WOTu9Fe4ZlHRtOmudV3YmTpvhOKru8=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 7d395b20cdca3f2cd2553a20e274d224_24d0e77d63dc11f18383525400d9a7a1
    ReservedCode2: LS+Fuvt4Pz9MBkmg4S4mPiipBgSTYj6lfmRW2CKTrE3yGnBV8Ig5mN31gu3a/pGpAc/sXYAskSMsA+0klfUukoRLhPMR4II+JbQynENxmOznaml8Ms94LEiez5ecQZ6xIA6+eAZ7DEbVAuZxP96GCahN9gHa1WOTu9Fe4ZlHRtOmudV3YmTpvhOKru8=
---

# 泰国社交活动平台 - 后端核心骨架

## 技术栈
- **运行时**: Node.js v22.14.0
- **Web 框架**: Express 4.x
- **数据库**: PostgreSQL（schema 已就绪，连接池已配置）
- **认证**: JWT (jsonwebtoken) + bcryptjs 密码加密
- **跨域**: cors 中间件

---

## 项目结构

```
travel-social-backend/
├── package.json            # 依赖与脚本
├── .env.example           # 环境变量模板（需复制为 .env 并填写）
├── server.js              # 入口文件
├── config/
│   └── db.js             # PostgreSQL 连接池
├── middleware/
│   └── auth.js           # JWT 认证中间件
├── routes/
│   ├── auth.js           # POST /api/auth/register|login
│   ├── events.js         # GET/POST /api/events, POST /api/events/:id/join
│   ├── venues.js         # GET /api/venues
│   └── payments.js       # POST /api/payments/create|callback, GET /api/payments/orders
└── db/
    └── schema.sql        # 完整建表 SQL（6 张表 + 种子数据）
```

---

## 快速启动

```bash
cd /Users/aguizhuang/Desktop/临时文件/marvis/travel-social-backend

# 1. 复制环境变量模板
cp .env.example .env
# 编辑 .env，填写数据库连接信息和 JWT 密钥

# 2. 安装依赖
npm install

# 3. 初始化数据库（需先创建 travel_social 数据库）
psql -U postgres -d travel_social -f db/schema.sql

# 4. 启动服务
npm start        # 生产：node server.js
npm run dev      # 开发：node --watch server.js（Node 18+ 支持）
```

---

## API 接口清单

| 方法 | 路径 | 说明 | 需登录 |
|------|------|------|--------|
| GET | `/` | 健康检查 | ❌ |
| POST | `/api/auth/register` | 用户注册 | ❌ |
| POST | `/api/auth/login` | 用户登录 | ❌ |
| GET | `/api/events` | 活动列表（支持 `?city=&page=&limit=`） | ❌ |
| GET | `/api/events/:id` | 活动详情 | ❌ |
| POST | `/api/events` | 发布活动 | ✅ |
| POST | `/api/events/:id/join` | 报名参加活动 | ✅ |
| GET | `/api/venues` | 场地列表（支持 `?city=&type=`） | ❌ |
| GET | `/api/venues/:id` | 场地详情 | ❌ |
| POST | `/api/payments/create` | 创建支付订单 | ✅ |
| POST | `/api/payments/callback` | 支付回调（模拟） | ❌ |
| GET | `/api/payments/orders` | 查询我的订单 | ✅ |

---

## 数据库表结构

| 表名 | 说明 |
|------|------|
| `users` | 用户表（用户名、邮箱、密码哈希、城市等） |
| `venues` | 场地表（名称、类型、容量、价格、设施数组等） |
| `events` | 活动表（标题、分类、时间、价格、标签数组等） |
| `event_participants` | 活动报名表（用户-活动关联，含支付状态） |
| `payment_orders` | 支付订单表（订单号、金额、支付方式、状态等） |
| `reviews` | 评价表（关联活动或场地，1~5 星评分） |

所有字段均含中文注释，可直接执行 `db/schema.sql` 建表并插入泰国场景种子数据。

---

## 模拟数据说明

当前阶段所有路由返回**内存模拟数据**，方便前端联调：
- 用户：`traveler_somchai`（曼谷）、`bangkok_plam`（清迈）
- 活动：曼谷水上市场、清迈素贴山、普吉岛瑜伽 BBQ、芭提雅浮潜、大城府骑行
- 场地：曼谷共享空间、清迈兰纳庄园、普吉岛度假村、芭提雅海滩俱乐部、大城府河畔咖啡馆
- 支付：支持 PromptPay / TrueMoney / Rabbit LINE Pay / CreditCard（均为模拟）

后续接入 PostgreSQL 时，只需将各路由中的内存数组替换为 `config/db.js` 的 `query()` 调用即可。
*（内容由AI生成，仅供参考）*
