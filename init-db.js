/**
 * init-db.js - 数据库初始化脚本
 * Railway 部署时自动运行，创建表结构和种子数据
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query } = require('./config/db');

async function initDatabase() {
  console.log('🚀 开始初始化数据库...');
  
  try {
    // 读取 schema.sql
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // 按分号分割 SQL 语句
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // 逐条执行
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await query(stmt + ';');
        console.log(`✅ 执行 SQL 语句 ${i + 1}/${statements.length}`);
      } catch (err) {
        // 忽略表已存在的错误（Railway 可能已创建）
        if (err.message.includes('already exists')) {
          console.log(`⚠️  表已存在，跳过: ${stmt.substring(0, 50)}...`);
        } else {
          console.error(`❌ SQL 语句执行失败:`, err.message);
          console.error(`语句: ${stmt.substring(0, 100)}...`);
        }
      }
    }
    
    console.log('🎉 数据库初始化完成！');
    
    // 验证数据库
    const users = await query('SELECT COUNT(*) FROM users');
    const events = await query('SELECT COUNT(*) FROM events');
    console.log(`📊 当前数据: ${users.rows[0].count} 用户, ${events.rows[0].count} 活动`);
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  }
}

// 如果是直接运行此脚本
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;