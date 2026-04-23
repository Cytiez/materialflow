const pool = require('../db/pool');

// Kalkulasi jarak antara dua koordinat (km) — formula Haversine
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Kalkulasi impact dari volume limbah dan kategori
// Hanya untuk listing non-custom (is_custom = false)
function calculateImpact(volumeKg, category) {
  const economicValue = volumeKg * parseFloat(category.price_per_kg);
  const co2SavedTon = (volumeKg * parseFloat(category.emission_factor)) / 1000;
  const pohonEquivalent = co2SavedTon / 0.022;
  const bensinLiter = co2SavedTon / 0.00233;

  return {
    economic_value: Math.round(economicValue),
    co2_saved_ton: parseFloat(co2SavedTon.toFixed(4)),
    pohon_equivalent: Math.round(pohonEquivalent),
    bensin_liter: Math.round(bensinLiter),
  };
}

// Matching engine: cari material_requests yang cocok dengan listing
// Scoring: (category_score * 0.6) + (distance_score * 0.4)
// Threshold: score > 0.3
async function matchWasteListing(listingId) {
  // Ambil data listing
  const listingResult = await pool.query(
    `SELECT wl.*, wc.name as category_name, wc.price_per_kg, wc.emission_factor
     FROM waste_listings wl
     LEFT JOIN waste_categories wc ON wl.category_id = wc.id
     WHERE wl.id = $1 AND wl.deleted_at IS NULL`,
    [listingId]
  );

  if (listingResult.rows.length === 0) {
    return { matches: [], message: 'Listing tidak ditemukan.' };
  }

  const listing = listingResult.rows[0];

  // Listing custom tidak bisa di-matching
  if (listing.is_custom) {
    return { matches: [], message: 'Listing limbah khusus tidak dapat di-matching.' };
  }

  // Ambil semua material_requests aktif
  const requestsResult = await pool.query(
    `SELECT mr.*, p.company_name, p.phone, p.address, p.city, p.latitude as req_lat, p.longitude as req_lng,
            u.email, wc.name as category_name
     FROM material_requests mr
     JOIN users u ON mr.user_id = u.id
     JOIN profiles p ON mr.user_id = p.user_id
     JOIN waste_categories wc ON mr.category_id = wc.id
     WHERE mr.status = 'active' AND mr.deleted_at IS NULL
       AND mr.latitude IS NOT NULL AND mr.longitude IS NOT NULL`
  );

  const activeRequests = requestsResult.rows;

  if (activeRequests.length === 0) {
    return {
      matches: [],
      message: 'Belum ada receiver terdaftar untuk jenis limbah ini di Jabodetabek. Kami akan notify kamu kalau ada yang tertarik.'
    };
  }

  const results = [];

  for (const request of activeRequests) {
    // Category score: 1.0 exact match, 0.0 otherwise
    const categoryScore = listing.category_id === request.category_id ? 1.0 : 0.0;

    // Distance score: linear decay, 0 di 50km+
    const distanceKm = haversineDistance(
      parseFloat(listing.latitude), parseFloat(listing.longitude),
      parseFloat(request.req_lat), parseFloat(request.req_lng)
    );
    const distanceScore = Math.max(0, 1 - (distanceKm / 50));

    // Skor akhir
    const score = (categoryScore * 0.6) + (distanceScore * 0.4);

    // Hanya tampilkan jika di atas threshold
    if (score > 0.3) {
      results.push({
        request_id: request.id,
        receiver_user_id: request.user_id,
        company_name: request.company_name,
        email: request.email,
        phone: request.phone,
        city: request.city,
        address: request.address,
        category_name: request.category_name,
        quantity_kg: request.quantity_kg,
        title: request.title,
        description: request.description,
        latitude: parseFloat(request.req_lat),
        longitude: parseFloat(request.req_lng),
        score: parseFloat(score.toFixed(4)),
        distance_km: parseFloat(distanceKm.toFixed(2)),
      });
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  if (results.length === 0) {
    return {
      matches: [],
      message: 'Belum ada receiver terdaftar untuk jenis limbah ini di Jabodetabek. Kami akan notify kamu kalau ada yang tertarik.'
    };
  }

  return { matches: results, message: `Ditemukan ${results.length} kecocokan.` };
}

module.exports = { haversineDistance, calculateImpact, matchWasteListing };
