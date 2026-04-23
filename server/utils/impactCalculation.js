const pool = require('../db/pool');

/**
 * Query impact dari listings yang memiliki minimal 1 match record (non-custom only).
 * Dipakai oleh GET /api/impact/global dan GET /api/impact/personal.
 * @param {number|null} userId - filter by user_id (null = global)
 */
async function queryImpact(userId) {
  const params = [];
  let userCondition = '';

  if (userId) {
    params.push(userId);
    userCondition = `AND (wl.user_id = $${params.length} OR mr.user_id = $${params.length})`;
  }

  const result = await pool.query(
    `SELECT
       COALESCE(SUM(DISTINCT wl.volume_kg), 0) as total_waste_kg,
       COALESCE(SUM(DISTINCT wl.volume_kg * wc.price_per_kg), 0) as total_economic_value,
       COALESCE(SUM(DISTINCT wl.volume_kg * wc.emission_factor / 1000), 0) as total_co2_saved_ton,
       COUNT(m.id) as total_matches,
       COUNT(DISTINCT wl.user_id) as total_senders,
       COUNT(DISTINCT mr.user_id) as total_receivers
     FROM matches m
     JOIN waste_listings wl ON m.listing_id = wl.id
     JOIN material_requests mr ON m.request_id = mr.id
     JOIN waste_categories wc ON wl.category_id = wc.id
     WHERE wl.is_custom = false
       AND m.status = 'accepted'
       ${userCondition}`,
    params
  );

  const row = result.rows[0];
  const totalWasteKg = parseFloat(row.total_waste_kg);
  const co2SavedTon = parseFloat(row.total_co2_saved_ton);

  return {
    total_waste_kg: totalWasteKg,
    economic_value: Math.round(parseFloat(row.total_economic_value)),
    co2_saved_ton: parseFloat(co2SavedTon.toFixed(4)),
    pohon_equivalent: Math.round(co2SavedTon / 0.022),
    bensin_liter: Math.round(co2SavedTon / 0.00233),
    total_matches: parseInt(row.total_matches),
    total_senders: parseInt(row.total_senders),
    total_receivers: parseInt(row.total_receivers),
    last_updated: new Date().toISOString(),
  };
}

module.exports = { queryImpact };
