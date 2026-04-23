const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { isValidJabodetabekCoords } = require('../utils/validators');

const router = express.Router();

// PUT /api/profile — update profil user yang login
router.put('/', authenticateToken, upload.single('photo'), handleUploadError, async (req, res) => {
  try {
    const { company_name, phone, address, city, latitude, longitude } = req.body;
    const updates = [];
    const params = [];

    if (company_name) {
      params.push(company_name);
      updates.push(`company_name = $${params.length}`);
    }
    if (phone) {
      params.push(phone);
      updates.push(`phone = $${params.length}`);
    }
    if (address) {
      params.push(address);
      updates.push(`address = $${params.length}`);
    }
    if (city) {
      params.push(city);
      updates.push(`city = $${params.length}`);
    }
    if (latitude && longitude) {
      if (!isValidJabodetabekCoords(latitude, longitude)) {
        return res.status(400).json({ success: false, message: 'Koordinat harus berada di area Jabodetabek.' });
      }
      params.push(parseFloat(latitude));
      updates.push(`latitude = $${params.length}`);
      params.push(parseFloat(longitude));
      updates.push(`longitude = $${params.length}`);
    }
    if (req.file) {
      params.push(`/uploads/${req.file.filename}`);
      updates.push(`photo_url = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data yang diubah.' });
    }

    params.push(new Date());
    updates.push(`updated_at = $${params.length}`);
    params.push(req.user.id);

    const result = await pool.query(
      `UPDATE profiles SET ${updates.join(', ')} WHERE user_id = $${params.length} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profil tidak ditemukan.' });
    }

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: { profile: result.rows[0] }
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
