const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/categories — public
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price_per_kg, emission_factor, icon FROM waste_categories ORDER BY id'
    );

    res.json({
      success: true,
      data: { categories: result.rows }
    });
  } catch (err) {
    console.error('Categories error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
