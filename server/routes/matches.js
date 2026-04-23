const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const { matchWasteListing } = require('../utils/matching');

const router = express.Router();

// POST /api/listings/:id/match — jalankan matching engine (sender only, owner only)
router.post('/listings/:id/match', authenticateToken, async (req, res) => {
  const listingId = parseInt(req.params.id);
  if (isNaN(listingId) || listingId <= 0) {
    return res.status(400).json({ success: false, message: 'ID listing tidak valid.' });
  }
  try {
    const forceRefresh = req.query.force === 'true';

    const listingResult = await pool.query(
      'SELECT id, user_id, is_custom, status FROM waste_listings WHERE id = $1 AND deleted_at IS NULL',
      [listingId]
    );

    if (listingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing tidak ditemukan.' });
    }

    const listing = listingResult.rows[0];

    if (listing.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk menjalankan matching listing ini.' });
    }

    if (listing.is_custom) {
      return res.status(400).json({ success: false, message: 'Listing limbah khusus tidak dapat di-matching.' });
    }

    // Return existing matches jika sudah ada dan tidak force
    if (!forceRefresh) {
      const existingCount = await pool.query(
        'SELECT COUNT(*) FROM matches WHERE listing_id = $1',
        [listingId]
      );
      if (parseInt(existingCount.rows[0].count) > 0) {
        const existingMatches = await pool.query(
          `SELECT m.*, mr.user_id as receiver_user_id,
                  mr.title as request_title, mr.description as request_description,
                  mr.quantity_kg, wc.name as category_name,
                  p.company_name, p.phone, p.address, p.city,
                  p.latitude, p.longitude, u.email
           FROM matches m
           JOIN material_requests mr ON m.request_id = mr.id
           JOIN waste_categories wc ON mr.category_id = wc.id
           JOIN users u ON mr.user_id = u.id
           JOIN profiles p ON mr.user_id = p.user_id
           WHERE m.listing_id = $1
           ORDER BY m.score DESC`,
          [listingId]
        );
        return res.json({
          success: true,
          message: `${existingMatches.rows.length} kecocokan tersimpan ditemukan.`,
          data: { matches: existingMatches.rows }
        });
      }
    }

    const { matches, message } = await matchWasteListing(listingId);

    for (const match of matches) {
      await pool.query(
        `INSERT INTO matches (listing_id, request_id, score, distance_km)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (listing_id, request_id)
         DO UPDATE SET score = $3, distance_km = $4, status = 'pending', updated_at = NOW()`,
        [listingId, match.request_id, match.score, match.distance_km]
      );
    }

    res.json({ success: true, message, data: { matches } });
  } catch (err) {
    console.error('Match listing error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// GET /api/listings/:id/matches — sender lihat matches listing miliknya
router.get('/listings/:id/matches', authenticateToken, async (req, res) => {
  const listingId = parseInt(req.params.id);
  if (isNaN(listingId) || listingId <= 0) {
    return res.status(400).json({ success: false, message: 'ID listing tidak valid.' });
  }
  try {
    const listingResult = await pool.query(
      'SELECT id, user_id FROM waste_listings WHERE id = $1 AND deleted_at IS NULL',
      [listingId]
    );

    if (listingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing tidak ditemukan.' });
    }

    if (listingResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk melihat matches listing ini.' });
    }

    const result = await pool.query(
      `SELECT m.*, mr.user_id as receiver_user_id,
              mr.title as request_title, mr.description as request_description,
              mr.quantity_kg, wc.name as category_name,
              p.company_name, p.phone, p.address, p.city,
              p.latitude, p.longitude, u.email
       FROM matches m
       JOIN material_requests mr ON m.request_id = mr.id
       JOIN waste_categories wc ON mr.category_id = wc.id
       JOIN users u ON mr.user_id = u.id
       JOIN profiles p ON mr.user_id = p.user_id
       WHERE m.listing_id = $1
       ORDER BY m.score DESC`,
      [listingId]
    );

    res.json({ success: true, data: { matches: result.rows } });
  } catch (err) {
    console.error('Get matches error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// GET /api/requests/:id/matches — receiver lihat tawaran masuk untuk request miliknya
router.get('/requests/:id/matches', authenticateToken, async (req, res) => {
  const requestId = parseInt(req.params.id);
  if (isNaN(requestId) || requestId <= 0) {
    return res.status(400).json({ success: false, message: 'ID permintaan tidak valid.' });
  }
  try {
    const requestResult = await pool.query(
      'SELECT id, user_id FROM material_requests WHERE id = $1 AND deleted_at IS NULL',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan.' });
    }

    if (requestResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk melihat tawaran ini.' });
    }

    const result = await pool.query(
      `SELECT m.*, wl.user_id as sender_user_id,
              wl.title as listing_title, wl.description as listing_description,
              wl.volume_kg, wl.photo_url, wl.is_custom, wl.status as listing_status,
              wc.name as category_name,
              p.company_name, p.phone, p.address, p.city,
              p.latitude as sender_lat, p.longitude as sender_lng,
              u.email as sender_email
       FROM matches m
       JOIN waste_listings wl ON m.listing_id = wl.id
       LEFT JOIN waste_categories wc ON wl.category_id = wc.id
       JOIN users u ON wl.user_id = u.id
       JOIN profiles p ON wl.user_id = p.user_id
       WHERE m.request_id = $1 AND m.status != 'rejected'
       ORDER BY m.score DESC`,
      [requestId]
    );

    res.json({ success: true, data: { matches: result.rows } });
  } catch (err) {
    console.error('Get request matches error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// GET /api/matches/incoming — semua tawaran masuk untuk semua request milik receiver
router.get('/matches/incoming', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, mr.title as request_title, mr.id as request_id,
              wl.user_id as sender_user_id,
              wl.title as listing_title, wl.volume_kg, wl.photo_url, wl.status as listing_status,
              wc.name as category_name,
              p.company_name, p.city,
              u.email as sender_email
       FROM matches m
       JOIN material_requests mr ON m.request_id = mr.id
       JOIN waste_listings wl ON m.listing_id = wl.id
       LEFT JOIN waste_categories wc ON wl.category_id = wc.id
       JOIN users u ON wl.user_id = u.id
       JOIN profiles p ON wl.user_id = p.user_id
       WHERE mr.user_id = $1 AND m.status = 'pending'
       ORDER BY m.score DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: { matches: result.rows } });
  } catch (err) {
    console.error('Get incoming matches error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// PATCH /api/matches/:id/status — ubah status match
// Sender hanya boleh reject. Receiver boleh accept/reject.
router.patch('/matches/:id/status', authenticateToken, async (req, res) => {
  const matchId = parseInt(req.params.id);
  if (isNaN(matchId) || matchId <= 0) {
    return res.status(400).json({ success: false, message: 'ID match tidak valid.' });
  }
  try {
    const { status } = req.body;

    if (!['accepted', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    }

    const matchResult = await pool.query(
      `SELECT m.*, wl.user_id as listing_owner, mr.user_id as request_owner
       FROM matches m
       JOIN waste_listings wl ON m.listing_id = wl.id
       JOIN material_requests mr ON m.request_id = mr.id
       WHERE m.id = $1`,
      [matchId]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Match tidak ditemukan.' });
    }

    const match = matchResult.rows[0];
    const isSender = match.listing_owner === req.user.id;
    const isReceiver = match.request_owner === req.user.id;

    if (!isSender && !isReceiver) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk mengubah status match ini.' });
    }

    // Sender hanya bisa reject (pre-filter), tidak bisa accept sendiri
    if (isSender && status === 'accepted') {
      return res.status(403).json({ success: false, message: 'Hanya penerima material yang dapat menerima tawaran ini.' });
    }

    await pool.query(
      'UPDATE matches SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, matchId]
    );

    // Sinkronisasi status listing
    if (status === 'accepted') {
      await pool.query(
        "UPDATE waste_listings SET status = 'matched', updated_at = NOW() WHERE id = $1",
        [match.listing_id]
      );
    } else if (status === 'rejected' || status === 'pending') {
      const acceptedCheck = await pool.query(
        "SELECT COUNT(*) FROM matches WHERE listing_id = $1 AND status = 'accepted'",
        [match.listing_id]
      );
      if (parseInt(acceptedCheck.rows[0].count) === 0) {
        await pool.query(
          "UPDATE waste_listings SET status = 'active', updated_at = NOW() WHERE id = $1",
          [match.listing_id]
        );
      }
    }

    const statusMsg = status === 'accepted' ? 'diterima' : status === 'rejected' ? 'ditolak' : 'dipulihkan';
    res.json({ success: true, message: `Tawaran berhasil di-${statusMsg}.` });
  } catch (err) {
    console.error('Update match status error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// PATCH /api/matches/:id/done — tandai selesai dari sisi sender atau receiver
// Kedua pihak harus done → listing jadi 'completed' (atomic, no race condition)
router.patch('/matches/:id/done', authenticateToken, async (req, res) => {
  const matchId = parseInt(req.params.id);
  if (isNaN(matchId) || matchId <= 0) {
    return res.status(400).json({ success: false, message: 'ID match tidak valid.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const matchResult = await client.query(
      `SELECT m.*, wl.user_id as listing_owner, mr.user_id as request_owner
       FROM matches m
       JOIN waste_listings wl ON m.listing_id = wl.id
       JOIN material_requests mr ON m.request_id = mr.id
       WHERE m.id = $1 AND m.status = 'accepted'`,
      [matchId]
    );

    if (matchResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Match accepted tidak ditemukan.' });
    }

    const match = matchResult.rows[0];
    const isSender = match.listing_owner === req.user.id;
    const isReceiver = match.request_owner === req.user.id;

    if (!isSender && !isReceiver) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses.' });
    }

    // Set flag sesuai peran pemanggil
    const field = isSender ? 'sender_done' : 'receiver_done';
    const updated = await client.query(
      `UPDATE matches SET ${field} = TRUE, updated_at = NOW()
       WHERE id = $1
       RETURNING sender_done, receiver_done`,
      [matchId]
    );

    const { sender_done, receiver_done } = updated.rows[0];

    // Kalau keduanya sudah done → listing jadi completed
    if (sender_done && receiver_done) {
      await client.query(
        "UPDATE waste_listings SET status = 'completed', updated_at = NOW() WHERE id = $1",
        [match.listing_id]
      );
    }

    await client.query('COMMIT');

    const bothDone = sender_done && receiver_done;
    res.json({
      success: true,
      message: bothDone
        ? 'Transaksi selesai! Kedua pihak telah mengkonfirmasi.'
        : 'Konfirmasi Anda tersimpan. Menunggu konfirmasi pihak lain.',
      data: { sender_done, receiver_done, completed: bothDone }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Done match error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  } finally {
    client.release();
  }
});

module.exports = router;
