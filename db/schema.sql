-- ============================================================
-- 泰国社交活动平台 - 数据库建表脚本
-- 数据库: PostgreSQL 14+
-- 创建方式: psql -U postgres -d travel_social -f db/schema.sql
-- ============================================================

-- 先将可能存在的旧表删除（开发阶段方便重建）
DROP TABLE IF EXISTS payment_orders CASCADE;
DROP TABLE IF EXISTS event_participants CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- ============================================================
-- 1. 用户表 (users)
-- 存储平台注册用户的基本信息
-- ============================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,                          -- 用户唯一ID，自增主键
    username        VARCHAR(50)  NOT NULL UNIQUE,                -- 用户名（登录用），最长50字符
    email           VARCHAR(255) NOT NULL UNIQUE,                -- 邮箱（登录用），唯一
    password_hash   VARCHAR(255) NOT NULL,                       -- bcrypt 加密后的密码哈希值
    avatar          VARCHAR(500),                                -- 头像图片URL，可为空
    full_name       VARCHAR(100),                                -- 真实姓名，可为空
    nationality     VARCHAR(50)  DEFAULT '泰国',                 -- 国籍，默认泰国
    city            VARCHAR(50),                                 -- 所在城市（曼谷、清迈、普吉岛等）
    bio             TEXT,                                        -- 个人简介
    phone           VARCHAR(20),                                 -- 手机号码
    language        VARCHAR(10)  DEFAULT 'th',                   -- 首选语言：th=泰语、en=英语、zh=中文
    role            VARCHAR(20)  DEFAULT 'user',                 -- 角色：user（普通用户）、organizer（组织者）、admin（管理员）
    is_active       BOOLEAN      DEFAULT TRUE,                   -- 账户是否激活
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),      -- 注册时间
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()       -- 最后更新时间
);

-- 为常用查询字段创建索引
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_city     ON users(city);
CREATE INDEX idx_users_role     ON users(role);


-- ============================================================
-- 2. 活动场地表 (venues)
-- 存储可用于举办活动的场地信息
-- ============================================================
CREATE TABLE venues (
    id              SERIAL PRIMARY KEY,                          -- 场地唯一ID
    name            VARCHAR(200) NOT NULL,                       -- 场地名称
    description     TEXT,                                        -- 场地详细描述
    type            VARCHAR(50)  NOT NULL,                       -- 场地类型：室内、户外、度假村、俱乐部、咖啡馆等
    city            VARCHAR(50)  NOT NULL,                       -- 所在城市
    address         TEXT         NOT NULL,                       -- 详细地址
    latitude        DECIMAL(10, 7),                              -- 纬度坐标
    longitude       DECIMAL(10, 7),                              -- 经度坐标
    capacity        INTEGER      NOT NULL DEFAULT 10,            -- 最大容纳人数
    price_per_hour  DECIMAL(10, 2),                              -- 每小时租金（泰铢）
    price_per_day   DECIMAL(10, 2),                              -- 每天租金（泰铢）
    currency        VARCHAR(3)   DEFAULT 'THB',                  -- 货币代码，默认泰铢
    amenities       TEXT[],                                      -- 设施列表（PostgreSQL 数组）：{WiFi,投影仪,停车场,...}
    images          TEXT[],                                      -- 场地图片URL数组
    rating          DECIMAL(2, 1) DEFAULT 0.0,                   -- 平均评分（1.0 ~ 5.0）
    review_count    INTEGER      DEFAULT 0,                      -- 评价总数
    status          VARCHAR(20)  DEFAULT 'active',               -- 状态：active（可用）、inactive（停用）、maintenance（维护中）
    owner_id        INTEGER      REFERENCES users(id),           -- 场地所有者用户ID
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),      -- 创建时间
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()       -- 更新时间
);

CREATE INDEX idx_venues_city   ON venues(city);
CREATE INDEX idx_venues_type   ON venues(type);
CREATE INDEX idx_venues_status ON venues(status);


-- ============================================================
-- 3. 活动表 (events)
-- 存储平台上发布的所有社交活动信息
-- ============================================================
CREATE TABLE events (
    id                  SERIAL PRIMARY KEY,                      -- 活动唯一ID
    title               VARCHAR(300) NOT NULL,                   -- 活动标题
    description         TEXT,                                     -- 活动详细描述
    category            VARCHAR(50)  NOT NULL,                    -- 活动分类：观光、户外、运动、文化、水上运动、美食、音乐等
    city                VARCHAR(50)  NOT NULL,                    -- 活动所在城市
    location            TEXT         NOT NULL,                    -- 具体活动地点描述
    venue_id            INTEGER      REFERENCES venues(id),       -- 关联场地ID（可为空，部分活动不需要场地）
    start_time          TIMESTAMP WITH TIME ZONE NOT NULL,        -- 活动开始时间
    end_time            TIMESTAMP WITH TIME ZONE NOT NULL,        -- 活动结束时间
    registration_deadline TIMESTAMP WITH TIME ZONE,               -- 报名截止时间
    max_participants    INTEGER      NOT NULL DEFAULT 20,         -- 最大参与人数上限
    current_participants INTEGER     NOT NULL DEFAULT 0,          -- 当前已报名人数
    price               DECIMAL(10, 2) NOT NULL DEFAULT 0.00,     -- 活动费用（泰铢），0 表示免费
    currency            VARCHAR(3)    DEFAULT 'THB',              -- 货币代码
    organizer_id        INTEGER      NOT NULL REFERENCES users(id), -- 活动组织者用户ID
    cover_image         VARCHAR(500),                              -- 封面图URL
    images              TEXT[],                                    -- 活动相册图片URL数组
    tags                TEXT[],                                    -- 标签数组：{水上市场,美食,文化}
    status              VARCHAR(20)  DEFAULT 'draft',             -- 状态：draft（草稿）、published（已发布）、cancelled（取消）、completed（已结束）
    is_featured         BOOLEAN      DEFAULT FALSE,               -- 是否为精选/推荐活动
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),   -- 创建时间
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()    -- 更新时间
);

CREATE INDEX idx_events_city       ON events(city);
CREATE INDEX idx_events_category   ON events(category);
CREATE INDEX idx_events_status     ON events(status);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_organizer  ON events(organizer_id);


-- ============================================================
-- 4. 活动报名表 (event_participants)
-- 记录用户报名参加活动的关联关系
-- ============================================================
CREATE TABLE event_participants (
    id              SERIAL PRIMARY KEY,                          -- 报名记录唯一ID
    event_id        INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE, -- 活动ID（级联删除）
    user_id         INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE, -- 用户ID（级联删除）
    status          VARCHAR(20) DEFAULT 'confirmed',             -- 状态：confirmed（已确认）、cancelled（已取消）、waitlisted（候补）
    ticket_count    INTEGER     DEFAULT 1,                       -- 报名票数，默认1张
    total_amount    DECIMAL(10, 2) DEFAULT 0.00,                 -- 支付总金额（泰铢）
    payment_status  VARCHAR(20) DEFAULT 'pending',               -- 支付状态：pending（待付）、paid（已付）、refunded（已退款）
    joined_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),      -- 报名时间
    UNIQUE(event_id, user_id)                                    -- 同一用户不能重复报名同一活动
);

CREATE INDEX idx_participants_event ON event_participants(event_id);
CREATE INDEX idx_participants_user  ON event_participants(user_id);


-- ============================================================
-- 5. 支付订单表 (payment_orders)
-- 存储所有支付订单，支持泰国本地支付渠道
-- ============================================================
CREATE TABLE payment_orders (
    id              SERIAL PRIMARY KEY,                          -- 订单唯一ID
    order_no        VARCHAR(50)  NOT NULL UNIQUE,                -- 订单号（业务流水号，如 PAY20260701001）
    user_id         INTEGER      NOT NULL REFERENCES users(id),  -- 下单用户ID
    event_id        INTEGER      REFERENCES events(id),          -- 关联活动ID
    participant_id  INTEGER      REFERENCES event_participants(id), -- 关联报名记录ID
    amount          DECIMAL(10, 2) NOT NULL,                     -- 支付金额（泰铢）
    currency        VARCHAR(3)    DEFAULT 'THB',                 -- 货币代码
    status          VARCHAR(20)   DEFAULT 'pending',             -- 订单状态：pending（待支付）、paid（已支付）、failed（失败）、expired（过期）、refunded（退款）
    payment_method  VARCHAR(50)   NOT NULL,                      -- 支付方式：PromptPay（扫码支付）、TrueMoney（电子钱包）、Rabbit LINE Pay、CreditCard
    transaction_id  VARCHAR(100),                                -- 第三方支付返回的交易流水号
    paid_at         TIMESTAMP WITH TIME ZONE,                    -- 支付完成时间
    expires_at      TIMESTAMP WITH TIME ZONE,                    -- 订单过期时间（通常创建后15分钟）
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),      -- 订单创建时间
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()       -- 订单更新时间
);

CREATE INDEX idx_orders_user    ON payment_orders(user_id);
CREATE INDEX idx_orders_event   ON payment_orders(event_id);
CREATE INDEX idx_orders_status  ON payment_orders(status);
CREATE INDEX idx_orders_order_no ON payment_orders(order_no);


-- ============================================================
-- 6. 评价表 (reviews)
-- 存储用户对活动和场地的评价
-- ============================================================
CREATE TABLE reviews (
    id              SERIAL PRIMARY KEY,                          -- 评价唯一ID
    user_id         INTEGER NOT NULL REFERENCES users(id),       -- 评价用户ID
    event_id        INTEGER REFERENCES events(id),               -- 被评价的活动ID（可为空）
    venue_id        INTEGER REFERENCES venues(id),               -- 被评价的场地ID（可为空）
    rating          INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), -- 评分：1~5星
    content         TEXT,                                        -- 评价文字内容
    images          TEXT[],                                      -- 评价附图URL数组
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),      -- 评价时间
    -- 确保每次评价至少关联活动或场地之一
    CONSTRAINT chk_review_target CHECK (
        (event_id IS NOT NULL) OR (venue_id IS NOT NULL)
    )
);

CREATE INDEX idx_reviews_event  ON reviews(event_id);
CREATE INDEX idx_reviews_venue  ON reviews(venue_id);
CREATE INDEX idx_reviews_user   ON reviews(user_id);


-- ============================================================
-- 插入模拟种子数据（方便开发调试，可直接运行测试）
-- ============================================================

-- 模拟用户（密码哈希对应明文 "123456"，由 bcryptjs 生成）
INSERT INTO users (username, email, password_hash, full_name, city, role)
VALUES
    ('traveler_somchai', 'somchai@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Somchai Jaidee', '曼谷', 'organizer'),
    ('bangkok_plam',     'plam@example.com',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Plam Srisai',    '清迈', 'user'),
    ('phuket_nat',       'nat@example.com',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nat Thongdee',   '普吉岛', 'organizer');

-- 模拟场地
INSERT INTO venues (name, type, city, address, capacity, price_per_day, amenities, rating, review_count)
VALUES
    ('曼谷素坤逸共享空间 The Hive',      '室内',   '曼谷',   'Sukhumvit Soi 49, Watthana, Bangkok',      30,  3500.00,  '{WiFi,投影仪,白板,空调,茶水间}',       4.5, 128),
    ('清迈古城兰纳庄园',                 '户外',   '清迈',   '123 Ratchadamnoen Rd, Chiang Mai',           50,  5000.00,  '{花园,停车场,厨房,音响设备,户外座椅}', 4.8,  95),
    ('普吉岛卡塔海滩度假村',             '度假村', '普吉岛', '456 Kata Rd, Karon, Phuket',                 80, 12000.00,  '{海景,游泳池,音响系统,自助餐区,舞台}',  4.7, 213),
    ('芭提雅海滩俱乐部',                 '俱乐部', '芭提雅', '789 Jomtien Beach Rd, Chon Buri',              150, 20000.00, '{DJ台,泳池,酒吧,舞池,停车场}',          4.3,  67),
    ('大城府河畔咖啡馆',                 '咖啡馆', '大城府', '55 U Thong Rd, Ayutthaya',                   20,  2000.00,  '{WiFi,投影仪,咖啡吧,河景观景台,空调}', 4.6,  43);

-- 模拟活动
INSERT INTO events (title, category, city, location, start_time, end_time, max_participants, current_participants, price, organizer_id, tags, status)
VALUES
    ('曼谷水上市场一日游',           '观光',     '曼谷',   '丹嫩沙多水上市场',                        '2026-07-10 08:00:00+07', '2026-07-10 17:00:00+07', 20, 12, 1200.00, 1, '{水上市场,美食,文化,拍照}',    'published'),
    ('清迈素贴山徒步 & 双龙寺祈福',   '户外',     '清迈',   '素贴山-双龙寺',                            '2026-07-15 06:30:00+07', '2026-07-15 14:00:00+07', 15,  8,  500.00, 2, '{徒步,寺庙,山景,文化}',        'published'),
    ('普吉岛日落海滩瑜伽 & BBQ派对',  '运动',     '普吉岛', '卡塔海滩',                                '2026-07-20 16:00:00+07', '2026-07-20 22:00:00+07', 30, 21,  800.00, 1, '{瑜伽,海滩,BBQ,社交}',          'published'),
    ('芭提雅珊瑚岛浮潜探险',          '水上运动', '芭提雅', '珊瑚岛（Koh Larn）',                       '2026-07-25 07:00:00+07', '2026-07-25 16:00:00+07', 25, 25, 1500.00, 2, '{浮潜,海岛,水上运动}',           'published'),
    ('大城府世界遗产骑行之旅',        '文化',     '大城府', '大城历史公园',                            '2026-08-01 09:00:00+07', '2026-08-01 17:00:00+07', 12,  5,  900.00, 1, '{骑行,世界遗产,古迹,文化}',      'published');
