const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/contact/log — log view kontak dan return data kontak target
router.post('/log', authenticateToken, async (req, res) => {
  try {
    const { target_user_id, listing_id, request_id } = req.body;

    if (!target_user_id) {
      return res.status(400).json({ success: false, message: 'Target user ID wajib diisi.' });
    }

    // Jangan bisa lihat kontak sendiri
    if (parseInt(target_user_id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Tidak bisa melihat kontak sendiri.' });
    }

    // Log ke contact_views
    await pool.query(
      `INSERT INTO contact_views (viewer_user_id, target_user_id, listing_id, request_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, parseInt(target_user_id), listing_id || null, request_id || null]
    );

    // Ambil data kontak target
    const result = await pool.query(
      `SELECT u.email, p.company_name, p.phone, p.address, p.city
       FROM users u
       JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [parseInt(target_user_id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    res.json({
      success: true,
      data: { contact: result.rows[0] }
    });
  } catch (err) {
    console.error('Contact log error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
