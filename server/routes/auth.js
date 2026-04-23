const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/authLimiter');
const { validateRegisterInput } = require('../utils/validators');

const router = express.Router();

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, role, company_name, phone, address, city, latitude, longitude } = req.body;

    // Validasi input
    const errors = validateRegisterInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    // Cek email sudah terdaftar
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Transaction: insert user + profile
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
        [email, passwordHash, role]
      );
      const user = userResult.rows[0];

      const profileResult = await client.query(
        `INSERT INTO profiles (user_id, company_name, phone, address, city, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [user.id, company_name, phone, address, city, latitude, longitude]
      );

      await client.query('COMMIT');

      // Sign JWT — expiry 7 hari
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil.',
        data: {
          token,
          user: { ...user, profile: profileResult.rows[0] }
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    // Cari user berdasarkan email
    const result = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.created_at,
              p.company_name, p.phone, p.address, p.city, p.latitude, p.longitude, p.photo_url
       FROM users u
       JOIN profiles p ON u.id = p.user_id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    const user = result.rows[0];

    // Bandingkan password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Jangan pernah return password_hash
    const { password_hash, ...userData } = user;
    const profile = {
      company_name: userData.company_name,
      phone: userData.phone,
      address: userData.address,
      city: userData.city,
      latitude: userData.latitude,
      longitude: userData.longitude,
      photo_url: userData.photo_url,
    };

    res.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        token,
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          created_at: userData.created_at,
          profile,
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.role, u.created_at,
              p.company_name, p.phone, p.address, p.city, p.latitude, p.longitude, p.photo_url
       FROM users u
       JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    const user = result.rows[0];
    const profile = {
      company_name: user.company_name,
      phone: user.phone,
      address: user.address,
      city: user.city,
      latitude: user.latitude,
      longitude: user.longitude,
      photo_url: user.photo_url,
    };

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          profile,
        }
      }
    });
  } catch (err) {
    console.error('Me error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
