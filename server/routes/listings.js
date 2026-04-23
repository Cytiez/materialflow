const express = require('express');
const pool = require('../db/pool');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { upload, handleUploadError } = require('../middleware/upload');
const { validateListingInput, isValidVolume, isValidJabodetabekCoords } = require('../utils/validators');
const { matchWasteListing } = require('../utils/matching');

const router = express.Router();

// GET /api/listings — semua listing aktif (authenticated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category_id, is_custom, status, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = ['wl.deleted_at IS NULL'];

    if (category_id) {
      params.push(parseInt(category_id));
      conditions.push(`wl.category_id = $${params.length}`);
    }
    if (is_custom !== undefined) {
      params.push(is_custom === 'true');
      conditions.push(`wl.is_custom = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`wl.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(wl.title ILIKE $${params.length} OR wl.description ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM waste_listings wl ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Fetch data dengan pagination
    params.push(parseInt(limit));
    params.push(offset);
    const result = await pool.query(
      `SELECT wl.*, wc.name as category_name, wc.icon as category_icon,
              p.company_name, p.city as company_city
       FROM waste_listings wl
       LEFT JOIN waste_categories wc ON wl.category_id = wc.id
       JOIN profiles p ON wl.user_id = p.user_id
       ${whereClause}
       ORDER BY wl.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      success: true,
      data: {
        listings: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        }
      }
    });
  } catch (err) {
    console.error('Get listings error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// GET /api/listings/my — listing milik sender yang login
router.get('/my', authenticateToken, requireRole('sender'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT wl.*, wc.name as category_name, wc.icon as category_icon,
              (SELECT COUNT(*) FROM matches m WHERE m.listing_id = wl.id) AS match_count,
              (SELECT COUNT(*) FROM matches m WHERE m.listing_id = wl.id AND m.status = 'pending') AS pending_match_count,
              (SELECT COUNT(*) FROM matches m WHERE m.listing_id = wl.id AND m.status = 'accepted') AS accepted_match_count
       FROM waste_listings wl
       LEFT JOIN waste_categories wc ON wl.category_id = wc.id
       WHERE wl.user_id = $1 AND wl.deleted_at IS NULL
       ORDER BY wl.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: { listings: result.rows }
    });
  } catch (err) {
    console.error('Get my listings error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// GET /api/listings/:id — detail satu listing
router.get('/:id', optionalAuth, async (req, res) => {
  const listingId = parseInt(req.params.id);
  if (isNaN(listingId) || listingId <= 0) {
    return res.status(400).json({ success: false, message: 'ID listing tidak valid.' });
  }
  try {
    const result = await pool.query(
      `SELECT wl.*, wc.name as category_name, wc.icon as category_icon,
              wc.price_per_kg, wc.emission_factor,
              p.company_name, p.phone, p.address, p.city as company_city,
              p.latitude as company_lat, p.longitude as company_lng,
              u.email as company_email
       FROM waste_listings wl
       LEFT JOIN waste_categories wc ON wl.category_id = wc.id
       JOIN users u ON wl.user_id = u.id
       JOIN profiles p ON wl.user_id = p.user_id
       WHERE wl.id = $1 AND wl.deleted_at IS NULL`,
      [listingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing tidak ditemukan.' });
    }

    const listing = result.rows[0];

    // FIX 7: Sembunyikan kontak jika tidak ada JWT
    if (!req.user) {
      delete listing.phone;
      delete listing.company_email;
    }

    res.json({
      success: true,
      data: { listing }
    });
  } catch (err) {
    console.error('Get listing detail error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// POST /api/listings — buat listing baru (sender only)
router.post('/', authenticateToken, requireRole('sender'), upload.single('photo'), handleUploadError, async (req, res) => {
  try {
    const { title, description, volume_kg, category_id, is_custom, custom_category } = req.body;
    const isCustom = is_custom === 'true' || is_custom === true;

    // Validasi input
    const errors = validateListingInput({ title, volume_kg, is_custom: isCustom, category_id, custom_category });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    // FIX 8: Cek batas maksimum 10 listing aktif per user
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM waste_listings WHERE user_id = $1 AND deleted_at IS NULL AND status != 'expired'",
      [req.user.id]
    );
    if (parseInt(countResult.rows[0].count) >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maksimum 10 listing aktif. Nonaktifkan listing lama sebelum membuat yang baru.'
      });
    }

    // Ambil koordinat dari profil user
    const profileResult = await pool.query(
      'SELECT latitude, longitude FROM profiles WHERE user_id = $1',
      [req.user.id]
    );
    // FIX F: Pastikan profil sudah lengkap sebelum membuat listing
    if (!profileResult.rows[0] || !profileResult.rows[0].latitude || !profileResult.rows[0].longitude) {
      return res.status(400).json({
        success: false,
        message: 'Lengkapi profil Anda (koordinat lokasi) sebelum membuat listing. Pergi ke halaman Profil.'
      });
    }
    const { latitude, longitude } = profileResult.rows[0];

    // Photo URL jika ada upload
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Tentukan title — tambah prefix untuk limbah khusus
    const finalTitle = isCustom && !title.startsWith('[LIMBAH KHUSUS]')
      ? `[LIMBAH KHUSUS] ${title}`
      : title;

    const result = await pool.query(
      `INSERT INTO waste_listings (user_id, category_id, title, description, volume_kg, photo_url, is_custom, custom_category, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id,
        isCustom ? null : parseInt(category_id),
        finalTitle,
        description || null,
        parseFloat(volume_kg),
        photoUrl,
        isCustom,
        isCustom ? custom_category : null,
        latitude,
        longitude,
      ]
    );

    const newListing = result.rows[0];

    // FIX 11: Auto-trigger matching untuk listing non-custom
    let matchCount = 0;
    if (!isCustom) {
      try {
        const { matches } = await matchWasteListing(newListing.id);
        for (const match of matches) {
          await pool.query(
            `INSERT INTO matches (listing_id, request_id, score, distance_km)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (listing_id, request_id)
             DO UPDATE SET score = $3, distance_km = $4, status = 'pending', updated_at = NOW()`,
            [newListing.id, match.request_id, match.score, match.distance_km]
          );
        }
        matchCount = matches.length;
        // Catatan: listing tetap 'active'. Status 'matched' hanya setelah receiver accept match.
      } catch (matchErr) {
        console.error('Auto-match error:', matchErr.message);
        // Non-fatal — listing tetap berhasil dibuat
      }
    }

    res.status(201).json({
      success: true,
      message: 'Listing limbah berhasil dibuat.',
      data: { listing: newListing, match_count: matchCount }
    });
  } catch (err) {
    console.error('Create listing error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// PUT /api/listings/:id — update listing (owner only)
router.put('/:id', authenticateToken, upload.single('photo'), handleUploadError, async (req, res) => {
  const listingId = parseInt(req.params.id);
  if (isNaN(listingId) || listingId <= 0) {
    return res.status(400).json({ success: false, message: 'ID listing tidak valid.' });
  }
  try {
    // Cek ownership
    const checkResult = await pool.query(
      'SELECT user_id FROM waste_listings WHERE id = $1 AND deleted_at IS NULL',
      [listingId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing tidak ditemukan.' });
    }
    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk mengubah listing ini.' });
    }

    const { title, description, volume_kg, category_id, status } = req.body;
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
    if (volume_kg) {
      const volCheck = isValidVolume(volume_kg);
      if (!volCheck.valid) {
        return res.status(400).json({ success: false, message: volCheck.message });
      }
      params.push(parseFloat(volume_kg));
      updates.push(`volume_kg = $${params.length}`);
    }
    if (category_id) {
      params.push(parseInt(category_id));
      updates.push(`category_id = $${params.length}`);
    }
    if (status) {
      // FIX 3: Hanya 'active' dan 'expired' yang bisa di-set manual via PUT.
      // 'matched' dan 'completed' hanya bisa via endpoint khusus (PATCH /complete, PATCH /matches/:id/status)
      const allowedStatuses = ['active', 'expired'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status tidak valid. Gunakan endpoint khusus untuk mengubah status matched/completed.' });
      }
      params.push(status);
      updates.push(`status = $${params.length}`);
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
    params.push(listingId);

    const result = await pool.query(
      `UPDATE waste_listings SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    res.json({
      success: true,
      message: 'Listing berhasil diperbarui.',
      data: { listing: result.rows[0] }
    });
  } catch (err) {
    console.error('Update listing error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// PATCH /api/listings/:id/complete — tandai listing sebagai selesai (deal done, owner only)
router.patch('/:id/complete', authenticateToken, async (req, res) => {
  const listingId = parseInt(req.params.id);
  if (isNaN(listingId) || listingId <= 0) {
    return res.status(400).json({ success: false, message: 'ID listing tidak valid.' });
  }
  try {
    const checkResult = await pool.query(
      'SELECT user_id, status FROM waste_listings WHERE id = $1 AND deleted_at IS NULL',
      [listingId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing tidak ditemukan.' });
    }
    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk menandai listing ini.' });
    }
    if (checkResult.rows[0].status !== 'matched') {
      return res.status(400).json({
        success: false,
        message: 'Listing hanya bisa ditandai selesai setelah ada match yang diterima.'
      });
    }

    const result = await pool.query(
      "UPDATE waste_listings SET status = 'completed', updated_at = NOW() WHERE id = $1 RETURNING *",
      [listingId]
    );

    res.json({
      success: true,
      message: 'Listing berhasil ditandai selesai. Terima kasih telah menuntaskan transaksi.',
      data: { listing: result.rows[0] }
    });
  } catch (err) {
    console.error('Complete listing error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// DELETE /api/listings/:id — soft delete (owner only)
router.delete('/:id', authenticateToken, async (req, res) => {
  const listingId = parseInt(req.params.id);
  if (isNaN(listingId) || listingId <= 0) {
    return res.status(400).json({ success: false, message: 'ID listing tidak valid.' });
  }
  try {
    const checkResult = await pool.query(
      'SELECT user_id FROM waste_listings WHERE id = $1 AND deleted_at IS NULL',
      [listingId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing tidak ditemukan.' });
    }
    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk menghapus listing ini.' });
    }

    await pool.query(
      'UPDATE waste_listings SET deleted_at = NOW() WHERE id = $1',
      [listingId]
    );

    res.json({ success: true, message: 'Listing berhasil dihapus.' });
  } catch (err) {
    console.error('Delete listing error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
