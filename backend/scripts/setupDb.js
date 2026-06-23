require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Parse DATABASE_URL tu Neon
const databaseUrl = process.env.DATABASE_URL;
let dbConfig = {};

if (databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    dbConfig = {
      host: url.hostname,
      port: parseInt(url.port, 10) || 5432,
      database: url.pathname.replace('/', ''),
      user: url.username,
      password: url.password,
    };
  } catch (err) {
    console.error('[SETUP] Failed to parse DATABASE_URL:', err.message);
    process.exit(1);
  }
} else {
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'wms_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  };
}

const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  ssl: { rejectUnauthorized: false },
});

async function setupDatabase() {
  console.log('[SETUP] Connecting to:', dbConfig.host + '/' + dbConfig.database);

  const client = await pool.connect();

  try {
    // Kiem tra ket noi
    await client.query('SELECT 1');
    console.log('[SETUP] Connected successfully!');

    const sql = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');

    const statements = sql
      .split(/;[\r\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let success = 0, failed = 0;
    for (const stmt of statements) {
      try {
        await client.query(stmt + ';');
        success++;
      } catch (err) {
        failed++;
        // Chi log loi nghiep vu, bo qua loi thuong gap (da ton tai, constraint, ...)
        const code = err.code || '';
        if (!['23505', '23503', '42P07', '42710'].includes(code)) {
          console.log(`[WARN] ${err.message.substring(0, 100)}`);
        }
      }
    }

    console.log(`[SETUP] SQL: ${success} success, ${failed} warnings`);

    // Cap nhat password cho user seed
    const passwordHash = await bcrypt.hash('123456', 10);
    try {
      await client.query(
        `UPDATE users SET password_hash = $1 WHERE username IN ('admin','manager','kho','sales')`,
        [passwordHash]
      );
      console.log('[SETUP] Password updated for demo users (123456)');
    } catch (err) {
      console.log('[WARN] Could not update seed passwords:', err.message);
    }

    console.log('[SETUP] Database setup completed!');
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase().catch(err => {
  console.error('[SETUP] Setup failed:', err.message);
  process.exit(1);
});
