const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Konfigurasi pool untuk production
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log koneksi berhasil saat pertama kali
pool.on('connect', () => {
  console.log('Terhubung ke PostgreSQL');
});

// Log error koneksi tanpa expose detail ke client
// JANGAN process.exit — pool pg akan retry otomatis, exit = server mati saat demo
pool.on('error', (err) => {
  console.error('PostgreSQL pool error (non-fatal):', err.message);
});

module.exports = pool;
