const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/receivers/:id — profil publik receiver (tanpa kontak)
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const userResult = await pool.query(
      `SELECT u.id, u.role, u.created_at as joined_date,
              p.company_name, p.address, p.city
       FROM users u
       JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1 AND u.role = 'receiver'`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Receiver tidak ditemukan.' });
    }

    const receiver = userResult.rows[0];

    // Ambil active material requests
    const requestsResult = await pool.query(
      `SELECT mr.id, mr.title, mr.description, mr.quantity_kg, mr.status, mr.created_at,
              wc.name as category_name
       FROM material_requests mr
       JOIN waste_categories wc ON mr.category_id = wc.id
       WHERE mr.user_id = $1 AND mr.deleted_at IS NULL AND mr.status = 'active'
       ORDER BY mr.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        receiver: {
          id: receiver.id,
          company_name: receiver.company_name,
          address: receiver.address,
          city: receiver.city,
          joined_date: receiver.joined_date,
          active_requests: requestsResult.rows,
        }
      }
    });
  } catch (err) {
    console.error('Get receiver profile error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
