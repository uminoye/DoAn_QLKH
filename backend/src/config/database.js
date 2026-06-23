const { Sequelize } = require('sequelize');
const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Parse DATABASE_URL (format: postgresql://user:pass@host:port/db?params)
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
    console.error('[DB] Failed to parse DATABASE_URL:', err.message);
  }
} else {
  // Fallback cho local development
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'wms_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  };
}

const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: 'postgres',
  logging: isProduction ? false : (msg) => console.log('[DB]', msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  },
  timezone: '+07:00',
});

const rawPool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 10,
});

const query = async (text, params) => {
  const client = await rawPool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

const transaction = async () => {
  const client = await rawPool.connect();
  try {
    await client.query('BEGIN');
    const t = {
      query: (...args) => client.query(...args),
      commit: async () => { await client.query('COMMIT'); client.release(); },
      rollback: async () => { await client.query('ROLLBACK'); client.release(); },
    };
    return t;
  } catch (err) {
    client.release();
    throw err;
  }
};

module.exports = { sequelize, query, transaction, rawPool };
