const express = require('express');
const pool = require('../db/pool');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { validateRequestInput } = require('../utils/validators');

const router = express.Router();

// GET /api/requests — semua request aktif (authenticated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const { category_id, status, search } = req.query;
    const params = [];
    const conditions = ['mr.deleted_at IS NULL'];

    if (category_id) {
      params.push(parseInt(category_id));
      conditions.push(`mr.category_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`mr.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(mr.title ILIKE $${params.length} OR mr.description ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM material_requests mr ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Fetch dengan pagination
    params.push(parseInt(limit));
    params.push(offset);
    const result = await pool.query(
      `SELECT mr.*, wc.name as category_name, wc.icon as category_icon,
              p.company_name, p.city as company_city
       FROM material_requests mr
       JOIN waste_categories wc ON mr.category_id = wc.id
       JOIN profiles p ON mr.user_id = p.user_id
       ${whereClause}
       ORDER BY mr.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      success: true,
      data: {
        requests: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        }
      }
    });
  } catch (err) {
    console.error('Get requests error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// GET /api/requests/my — request milik receiver yang login
router.get('/my', authenticateToken, requireRole('receiver'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mr.*, wc.name as category_name, wc.icon as category_icon
       FROM material_requests mr
       JOIN waste_categories wc ON mr.category_id = wc.id
       WHERE mr.user_id = $1 AND mr.deleted_at IS NULL
       ORDER BY mr.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: { requests: result.rows }
    });
  } catch (err) {
    console.error('Get my requests error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// GET /api/requests/:id — detail satu request
router.get('/:id', optionalAuth, async (req, res) => {
  const requestId = parseInt(req.params.id);
  if (isNaN(requestId) || requestId <= 0) {
    return res.status(400).json({ success: false, message: 'ID permintaan tidak valid.' });
  }
  try {
    const result = await pool.query(
      `SELECT mr.*, wc.name as category_name, wc.icon as category_icon,
              wc.price_per_kg, wc.emission_factor,
              p.company_name, p.phone, p.address, p.city as company_city,
              p.latitude as company_lat, p.longitude as company_lng,
              u.email as company_email
       FROM material_requests mr
       JOIN waste_categories wc ON mr.category_id = wc.id
       JOIN users u ON mr.user_id = u.id
       JOIN profiles p ON mr.user_id = p.user_id
       WHERE mr.id = $1 AND mr.deleted_at IS NULL`,
      [requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan.' });
    }

    const request = result.rows[0];

    // FIX 7: Sembunyikan kontak jika tidak ada JWT
    if (!req.user) {
      delete request.phone;
      delete request.company_email;
    }

    res.json({
      success: true,
      data: { request }
    });
  } catch (err) {
    console.error('Get request detail error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// POST /api/requests — buat request baru (receiver only)
router.post('/', authenticateToken, requireRole('receiver'), async (req, res) => {
  try {
    const { title, description, quantity_kg, category_id } = req.body;

    const errors = validateRequestInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    // Ambil koordinat dari profil
    const profileResult = await pool.query(
      'SELECT latitude, longitude FROM profiles WHERE user_id = $1',
      [req.user.id]
    );
    // FIX F: Pastikan profil sudah lengkap sebelum membuat request
    if (!profileResult.rows[0] || !profileResult.rows[0].latitude || !profileResult.rows[0].longitude) {
      return res.status(400).json({
        success: false,
        message: 'Lengkapi profil Anda (koordinat lokasi) sebelum membuat permintaan. Pergi ke halaman Profil.'
      });
    }
    const { latitude, longitude } = profileResult.rows[0];

    const result = await pool.query(
      `INSERT INTO material_requests (user_id, category_id, title, description, quantity_kg, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, parseInt(category_id), title, description || null, parseFloat(quantity_kg), latitude, longitude]
    );

    res.status(201).json({
      success: true,
      message: 'Permintaan material berhasil dibuat.',
      data: { request: result.rows[0] }
    });
  } catch (err) {
    console.error('Create request error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// PUT /api/requests/:id — update request (owner only)
router.put('/:id', authenticateToken, async (req, res) => {
  const requestId = parseInt(req.params.id);
  if (isNaN(requestId) || requestId <= 0) {
    return res.status(400).json({ success: false, message: 'ID permintaan tidak valid.' });
  }
  try {
    const checkResult = await pool.query(
      'SELECT user_id FROM material_requests WHERE id = $1 AND deleted_at IS NULL',
      [requestId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan.' });
    }
    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk mengubah permintaan ini.' });
    }

    const { title, description, quantity_kg, category_id, status } = req.body;
    const updates = [];
    const params = [];

    if (title) {
      params.push(title);
      updates.push(`title = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description);
      updates.push(`description = $${params.length}`);
    }
    if (quantity_kg) {
      // FIX 4: Validasi quantity_kg (sama seperti di POST)
      const { isValidVolume } = require('../utils/validators');
      const volCheck = isValidVolume(quantity_kg);
      if (!volCheck.valid) {
        return res.status(400).json({ success: false, message: volCheck.message });
      }
      params.push(parseFloat(quantity_kg));
      updates.push(`quantity_kg = $${params.length}`);
    }
    if (category_id) {
      params.push(parseInt(category_id));
      updates.push(`category_id = $${params.length}`);
    }
    if (status) {
      // Hanya 'active' dan 'expired' yang bisa di-set manual
      const allowedStatuses = ['active', 'expired'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status tidak valid.' });
      }
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data yang diubah.' });
    }

    params.push(new Date());
    updates.push(`updated_at = $${params.length}`);
    params.push(requestId);

    const result = await pool.query(
      `UPDATE material_requests SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    res.json({
      success: true,
      message: 'Permintaan berhasil diperbarui.',
      data: { request: result.rows[0] }
    });
  } catch (err) {
    console.error('Update request error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// DELETE /api/requests/:id — soft delete (owner only)
router.delete('/:id', authenticateToken, async (req, res) => {
  const requestId = parseInt(req.params.id);
  if (isNaN(requestId) || requestId <= 0) {
    return res.status(400).json({ success: false, message: 'ID permintaan tidak valid.' });
  }
  try {
    const checkResult = await pool.query(
      'SELECT user_id FROM material_requests WHERE id = $1 AND deleted_at IS NULL',
      [requestId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan.' });
    }
    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk menghapus permintaan ini.' });
    }

    await pool.query(
      'UPDATE material_requests SET deleted_at = NOW() WHERE id = $1',
      [requestId]
    );

    res.json({ success: true, message: 'Permintaan berhasil dihapus.' });
  } catch (err) {
    console.error('Delete request error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
