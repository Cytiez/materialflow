const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { queryImpact } = require('../utils/impactCalculation');

const router = express.Router();

// GET /api/impact/global — impact keseluruhan platform (public, no cache)
router.get('/global', async (req, res) => {
  try {
    const impact = await queryImpact(null);
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: { impact } });
  } catch (err) {
    console.error('Global impact error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// GET /api/impact/personal — impact user yang login
router.get('/personal', authenticateToken, async (req, res) => {
  try {
    const impact = await queryImpact(req.user.id);
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: { impact } });
  } catch (err) {
    console.error('Personal impact error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
